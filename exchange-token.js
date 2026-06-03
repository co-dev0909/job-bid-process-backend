const fs = require("fs");
const { google } = require("googleapis");
const credentials = require("./key/credentials.json");

const { client_id, client_secret, redirect_uris } = credentials.web;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const code = process.argv[2];

if (!code) {
  console.error("❌ Missing authorization code");
  process.exit(1);
}

async function exchangeToken() {
  const { tokens } = await oauth2Client.getToken(code);
  fs.writeFileSync("./key/token.json", JSON.stringify(tokens, null, 2));
  console.log("✅ token.json generated successfully");
}

exchangeToken();
