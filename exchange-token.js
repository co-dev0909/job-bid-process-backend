const fs = require("fs");
const { google } = require("googleapis");
const {
  getOAuthCredentials,
  getOAuthPaths,
} = require("./services/googleAuthConfig");

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

const code = process.argv[2];

if (!code) {
  console.error("Missing authorization code");
  process.exit(1);
}

async function exchangeToken() {
  const { tokens } = await oauth2Client.getToken(code);
  const { tokenPath } = getOAuthPaths();
  fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
  console.log("token.json generated successfully");
}

exchangeToken();
