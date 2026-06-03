const fs = require("fs");
const path = require("path");

function parseJsonEnv(envName) {
  const value = process.env[envName];
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch (err) {
    throw new Error(`Invalid JSON in ${envName}: ${err.message}`);
  }
}

function loadJsonFromEnvOrFile(envName, filePath, label) {
  const envValue = parseJsonEnv(envName);
  if (envValue) return envValue;

  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  return null;
}

function getServiceAccountKeyPath() {
  return process.env.GOOGLE_DRIVE_KEY_FILE
    ? path.resolve(process.cwd(), process.env.GOOGLE_DRIVE_KEY_FILE)
    : path.join(process.cwd(), "key/google-drive.json");
}

function getOAuthPaths() {
  return {
    credentialsPath: path.join(process.cwd(), "key/credentials.json"),
    tokenPath: path.join(process.cwd(), "key/token.json"),
  };
}

function getServiceAccountCredentials() {
  const keyPath = getServiceAccountKeyPath();
  const credentials = loadJsonFromEnvOrFile(
    "GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON",
    keyPath
  );

  if (!credentials) {
    throw new Error(
      `Service account credentials missing. Provide GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON or ${keyPath}.`
    );
  }

  return credentials;
}

function getOAuthCredentials() {
  const { credentialsPath } = getOAuthPaths();
  const credentials = loadJsonFromEnvOrFile(
    "GOOGLE_DRIVE_CREDENTIALS_JSON",
    credentialsPath
  );

  if (!credentials) {
    throw new Error(
      "OAuth credentials missing. Provide GOOGLE_DRIVE_CREDENTIALS_JSON or key/credentials.json."
    );
  }

  return credentials;
}

function getOAuthToken() {
  const { tokenPath } = getOAuthPaths();
  const token = loadJsonFromEnvOrFile("GOOGLE_DRIVE_TOKEN_JSON", tokenPath);

  if (!token) {
    throw new Error(
      "OAuth token missing. Provide GOOGLE_DRIVE_TOKEN_JSON or key/token.json."
    );
  }

  return token;
}

module.exports = {
  getOAuthCredentials,
  getOAuthPaths,
  getOAuthToken,
  getServiceAccountCredentials,
  getServiceAccountKeyPath,
  parseJsonEnv,
};
