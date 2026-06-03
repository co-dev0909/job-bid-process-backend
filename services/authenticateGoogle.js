const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/drive'];

/**
 * Generate OAuth2 token for the first time
 * Run this once to authenticate with Google
 */
async function authenticateGoogle() {
    try {
        const credentialsPath = path.join(process.cwd(), "key/credentials.json");
        const tokenPath = path.join(process.cwd(), "key/token.json");

        // Load credentials
        const credentialsContent = fs.readFileSync(credentialsPath, "utf8");
        const credentials = JSON.parse(credentialsContent);
        const oauthConfig = credentials.installed || credentials.web;

        if (!oauthConfig) {
            throw new Error(
                "Unsupported credentials.json format. Expected either 'installed' or 'web' OAuth client config."
            );
        }

        const { client_id, client_secret, redirect_uris } = oauthConfig;

        // Create OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
        );

        // Generate auth URL
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });

        console.log('Authorize this app by visiting this url:', authUrl);

        // Get the authorization code from user
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question('Enter the code from that page here: ', async (code) => {
            rl.close();
            try {
                const { tokens } = await oauth2Client.getToken(code);
                oauth2Client.setCredentials(tokens);

                // Save the token for future use
                fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
                console.log('Token saved to', tokenPath);
                process.exit(0);
            } catch (err) {
                console.error('Error retrieving access token', err);
                process.exit(1);
            }
        });
    } catch (error) {
        console.error('Authentication error:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    authenticateGoogle();
}

module.exports = { authenticateGoogle };
