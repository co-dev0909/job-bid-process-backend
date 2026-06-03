const { google } = require("googleapis");
const { getOAuthCredentials } = require("./services/googleAuthConfig");

const credentials = getOAuthCredentials();
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

const SCOPES = ["https://www.googleapis.com/auth/drive"];

async function generateAuthUrl() {
  const { default: open } = await import("open");

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("Authorize this app:");
  console.log(authUrl);

  await open(authUrl);
}

generateAuthUrl();
