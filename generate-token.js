const { google } = require("googleapis");
const credentials = require("./key/credentials.json");

const { client_id, client_secret, redirect_uris } = credentials.web;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const SCOPES = ["https://www.googleapis.com/auth/drive"];

async function generateAuthUrl() {
  const { default: open } = await import("open");
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // REQUIRED
    prompt: "consent",      // REQUIRED
    scope: SCOPES,
  });

  console.log("🔗 Authorize this app:");
  console.log(authUrl);

  await open(authUrl);
}

generateAuthUrl();
