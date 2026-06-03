const OpenAI = require("openai");
const dotenv = require("dotenv");
const puppeteer = require("puppeteer-extra");
const getPrompt = require("../utils/getPrompt");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { execSync } = require("child_process");
const getBrowserLaunchOptions = require("./browserLaunchOptions");

puppeteer.use(StealthPlugin());

dotenv.config();

function extractJsonBlock(text) {
  try {
    const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
    const payload = fenced ? fenced[1] : text;
    return JSON.parse(payload);
  } catch (e) {
    console.error("[getChatGPTResponse] ❌ Invalid JSON:", e.message);
    return null;
  }
}

async function getChatGPTResponse(prompt, fullName) {
  let browser;
  try {
    browser = await puppeteer.launch(getBrowserLaunchOptions());

    const page = await browser.newPage();
    let gptUrl;
    switch (fullName) {
      case "Aaron Seth Wagman":
        gptUrl = "https://chatgpt.com/g/g-p-69606a76332081919727723856ed8ed3/project";
        break;
      case "Akil Omari Batiste":
        gptUrl = "https://chatgpt.com/g/g-p-69606b8955308191980ed1220dc847c6/project";
        break;
      case "Axel G Sly":
        gptUrl = "https://chatgpt.com/g/g-p-69606bab06d88191a7c645a332eb57ad/project";
        break;
      case "Adrianna Lorena Castaneda":
        gptUrl = "https://chatgpt.com/g/g-p-6960ad32f2348191b6c03cf3f11c333a/project";
        break;
      case "Cody Dasean Stoker":
        gptUrl = "https://chatgpt.com/g/g-p-69a1be49baa881919927b816a4445b3e/project";
        break;
      default:
        gptUrl = "https://chatgpt.com/g/g-p-694404f0c6048191af9cabc90e3b6580/project";
    }
    await page.goto(gptUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Insert the prompt text
    await page.waitForSelector("#prompt-textarea", { timeout: 30000 });
    await page.evaluate((prompt) => {
      const editableDiv = document.querySelector("#prompt-textarea");
      if (!editableDiv) return;
      const pTag = editableDiv.querySelector("p");
      if (pTag) pTag.innerText = prompt;
    }, prompt);

    // Click the submit button
    await page.evaluate(() => {
      const button = document.querySelector("#composer-submit-button");
      if (button) button.click();
    });

    // Wait for a response (pick a stable selector here)
    await page.waitForSelector(
      "[data-testid='good-response-turn-action-button']",
      { timeout: 120000 }
    );

    // Click "Copy" button
    const copied = await page.evaluate(() => {
      const copyBtns = document.querySelectorAll("[aria-label='Copy']");
      if (copyBtns && copyBtns.length > 0) {
        copyBtns[copyBtns.length - 1].click();
        return true;
      }
      return false;
    });

    if (!copied) {
      throw new Error("⚠️ No copy button found on page");
    }

    // Grab clipboard content
    const copiedText = execSync("powershell Get-Clipboard", {
      encoding: "utf-8",
    });
    const jsonData = extractJsonBlock(copiedText);

    return jsonData;
  } catch (err) {
    console.error("[getChatGPTResponse] ❌ Error:", err.message);
    return null; // always return safely
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.warn("[getChatGPTResponse] ⚠️ Browser already closed");
      }
    }
    console.log('')
  }
}

const generateResumeJsonWithGPT = async (inputProfile, jobDescription) => {
  const {prompt, fullName} = await getPrompt(inputProfile, jobDescription);
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // const completion = await openai.chat.completions.create({
  //   messages: [
  //     {
  //       role: "user",
  //       content: prompt,
  //     },
  //   ],
  //   model: "gpt-4o-mini",
  //   response_format: { type: "json_object" },
  // });
  // const resumeJSON = JSON.parse(completion.choices[0].message.content);
  const resumeJSON = await getChatGPTResponse(prompt, fullName);
  return resumeJSON;
};

module.exports = generateResumeJsonWithGPT;
