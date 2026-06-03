const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const ROOT_DRIVE_FOLDER_ID = process.env.ROOT_DRIVE_FOLDER_ID || null;

const cachedAuthClients = {
    service_account: null,
    oauth: null,
};

function getDriveAuthMode() {
    return (process.env.GOOGLE_DRIVE_AUTH_MODE || 'auto').toLowerCase();
}

function getServiceAccountKeyPath() {
    return process.env.GOOGLE_DRIVE_KEY_FILE
        ? path.resolve(process.cwd(), process.env.GOOGLE_DRIVE_KEY_FILE)
        : path.join(process.cwd(), "key/google-drive.json");
}

function getOAuthPaths() {
    return {
        credentialsPath: path.join(process.cwd(), 'key/credentials.json'),
        tokenPath: path.join(process.cwd(), 'key/token.json'),
    };
}

function parseJsonEnv(envName) {
    const value = process.env[envName];
    if (!value) return null;

    try {
        return JSON.parse(value);
    } catch (err) {
        throw new Error(`Invalid JSON in ${envName}: ${err.message}`);
    }
}

async function authorizeServiceAccount() {
    if (cachedAuthClients.service_account) return cachedAuthClients.service_account;

    const serviceAccountKeyPath = getServiceAccountKeyPath();
    if (!fs.existsSync(serviceAccountKeyPath)) {
        throw new Error(`Service account key file not found: ${serviceAccountKeyPath}`);
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountKeyPath,
        scopes: SCOPES,
    });
    const authClient = await auth.getClient();
    cachedAuthClients.service_account = authClient;
    return authClient;
}

async function authorizeOAuth() {
    if (cachedAuthClients.oauth) return cachedAuthClients.oauth;

    const { credentialsPath, tokenPath } = getOAuthPaths();
    const envCredentials = parseJsonEnv('GOOGLE_DRIVE_CREDENTIALS_JSON');
    const envToken = parseJsonEnv('GOOGLE_DRIVE_TOKEN_JSON');

    const credentials = envCredentials || (
        fs.existsSync(credentialsPath)
            ? JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
            : null
    );

    const token = envToken || (
        fs.existsSync(tokenPath)
            ? JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
            : null
    );

    if (!credentials || !token) {
        throw new Error(
            "OAuth credentials missing. Provide GOOGLE_DRIVE_CREDENTIALS_JSON and GOOGLE_DRIVE_TOKEN_JSON, or key/credentials.json and key/token.json."
        );
    }

    const oauthConfig = credentials.installed || credentials.web;

    if (!oauthConfig) {
        throw new Error(
            "Unsupported credentials.json format. Expected either 'installed' or 'web' OAuth client config."
        );
    }

    const { client_id, client_secret, redirect_uris } = oauthConfig;

    const oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    oauth2Client.setCredentials(token);
    cachedAuthClients.oauth = oauth2Client;
    return oauth2Client;
}

function getCandidateAuthModes() {
    const mode = getDriveAuthMode();
    if (mode === 'service_account') return ['service_account'];
    if (mode === 'oauth') return ['oauth'];
    return ['service_account', 'oauth'];
}

function isServiceAccountQuotaError(err) {
    const message = err?.message || err?.cause?.message || '';
    return message.includes('Service Accounts do not have storage quota');
}

/**
 * Authorize using the configured Google Drive auth mode.
 */
async function authorize(mode = getCandidateAuthModes()[0]) {
    try {
        if (mode === 'service_account') {
            return authorizeServiceAccount();
        }
        if (mode === 'oauth') {
            return authorizeOAuth();
        }
        throw new Error(`Unsupported Google Drive auth mode: ${mode}`);
    } catch (err) {
        console.error('Authorization error:', err);
        throw err;
    }
}

/**
 * Upload a file to Google Drive
 */
async function uploadFileToDrive(filePath, fileName, folderId = null) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Upload file not found: ${filePath}`);
    }

    const parentId = folderId || ROOT_DRIVE_FOLDER_ID;
    const fileSize = fs.statSync(filePath).size;

    if (!parentId) {
        throw new Error("Google Drive parent folder is missing. Set ROOT_DRIVE_FOLDER_ID or pass a folderId.");
    }

    const fileMetadata = {
        name: fileName,
        parents: [parentId],
    };

    console.log(`Uploading DOCX to Google Drive: ${fileName} (${fileSize} bytes)`);

    const authModes = getCandidateAuthModes();
    let lastError;

    for (const mode of authModes) {
        try {
            const auth = await authorize(mode);
            const drive = google.drive({ version: 'v3', auth });
            const media = {
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                body: fs.createReadStream(filePath),
            };

            const res = await drive.files.create({
                resource: fileMetadata,
                media,
                fields: 'id,name,webViewLink,mimeType,parents',
                supportsAllDrives: true,
            });

            const fileId = res.data.id;

            // Make file public using the same auth mode used for upload.
            await setFilePermission(fileId, mode);

            const publicDownloadLink = `https://drive.google.com/uc?id=${fileId}&export=download`;

            console.log(`Uploaded via Google Drive auth mode: ${mode}`);

            return {
                fileId,
                name: res.data.name,
                mimeType: res.data.mimeType,
                parents: res.data.parents,
                webViewLink: res.data.webViewLink,
                publicDownloadLink,
            };
        } catch (err) {
            lastError = err;
            console.error(`Upload error (${mode}):`, err?.message || err);

            const shouldTryNextMode =
                mode === 'service_account' &&
                authModes.includes('oauth') &&
                isServiceAccountQuotaError(err);

            if (!shouldTryNextMode) {
                throw err;
            }
        }
    }

    throw lastError;
}

/**
 * Make file or folder public (anyone with link)
 */
async function setFilePermission(fileId, mode = getCandidateAuthModes()[0]) {
    const auth = await authorize(mode);
    const drive = google.drive({ version: 'v3', auth });

    await drive.permissions.create({
        fileId,
        requestBody: {
            type: 'anyone',
            role: 'reader',
            allowFileDiscovery: false, // REQUIRED
        },
        supportsAllDrives: true,
    });
}

/**
 * Find a folder by name
 */
async function findDriveFolder(folderName, parentFolderId = null) {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    const parentId = parentFolderId || ROOT_DRIVE_FOLDER_ID;

    let query = `
        name='${folderName.replace(/'/g, "\\'")}'
        and mimeType='application/vnd.google-apps.folder'
        and trashed=false
    `;

    if (parentId) {
        query += ` and '${parentId}' in parents`;
    }

    const res = await drive.files.list({
        q: query,
        fields: 'files(id, webViewLink)',
        pageSize: 1,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
    });

    if (res.data.files.length) {
        return {
            folderId: res.data.files[0].id,
            folderLink: res.data.files[0].webViewLink,
        };
    }

    return null;
}

/**
 * Create a folder
 */
async function createDriveFolder(folderName, parentFolderId = null) {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    const parentId = parentFolderId || ROOT_DRIVE_FOLDER_ID;

    const res = await drive.files.create({
        resource: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            ...(parentId && { parents: [parentId] }),
        },
        fields: 'id,webViewLink',
        supportsAllDrives: true,
    });

    await setFilePermission(res.data.id);

    return {
        folderId: res.data.id,
        folderLink: res.data.webViewLink,
    };
}

/**
 * Find or create folder
 */
async function findOrCreateDriveFolder(folderName, parentFolderId = null) {
    const existing = await findDriveFolder(folderName, parentFolderId);
    if (existing) return existing;
    return createDriveFolder(folderName, parentFolderId);
}

module.exports = {
    authorize,
    uploadFileToDrive,
    setFilePermission,
    findDriveFolder,
    createDriveFolder,
    findOrCreateDriveFolder,
};
