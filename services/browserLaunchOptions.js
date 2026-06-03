const fs = require("fs");

function getBrowserLaunchOptions() {
  const configuredPath = process.env.PUPPETEER_EXECUTABLE_PATH;

  const options = {
    headless: false,
    userDataDir: process.env.PUPPETEER_USER_DATA_DIR || "C:/bid",
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      "--profile-directory=Default",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--start-maximized",
    ],
  };

  if (configuredPath) {
    if (!fs.existsSync(configuredPath)) {
      throw new Error(
        `PUPPETEER_EXECUTABLE_PATH does not exist: ${configuredPath}`
      );
    }
    options.executablePath = configuredPath;
  }

  return options;
}

module.exports = getBrowserLaunchOptions;
