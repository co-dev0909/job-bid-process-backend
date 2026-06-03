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

async function getClaurdResponse(prompt, fullName) {
    let browser;
    try {
        browser = await puppeteer.launch(getBrowserLaunchOptions());

        const page = await browser.newPage();
        let gptUrl;
        switch (fullName) {
            case "Akil Omari Batiste":
                gptUrl = "https://claude.ai/project/019c2500-4dee-726a-a0aa-a252e9616427";
                break;
            case "Axel G Sly":
                gptUrl = "https://claude.ai/project/019c24ff-b8c2-757d-a87f-cac4ef4e6554";
                break;
            case "Adrianna Lorena Castaneda":
                gptUrl = "https://claude.ai/project/019c2500-ae91-72c4-8e62-8e0fe0ebd050";
                break;
            case "Kevin Ojeda":
                gptUrl = "https://claude.ai/project/019c23c8-8899-7043-9f1e-e389902f1ad0"
                break;
            default:
                gptUrl = "https://claude.ai";
        }
        await page.goto(gptUrl, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
        });
        // Using Claude

        // await page.waitForSelector("div[contenteditable='true']", { timeout: 60000 });
        await page.waitForFunction(() => {
            const editableDiv = document.querySelector("div[contenteditable='true']");
            return editableDiv !== null;
        }, { timeout: 60000 })

        await page.evaluate((prompt) => {
            const editableDiv = document.querySelector("div[contenteditable='true']");
            if (!editableDiv) return;

            editableDiv.focus();
            editableDiv.innerHTML = "";
            document.execCommand("insertText", false, prompt);
        }, prompt);

        // Wait for Send button to be present and enabled, then click it
        await page.waitForSelector('button[aria-label="Send message"]', { timeout: 60000 });
        const sendButton = await page.$('button[aria-label="Send message"]');
        if (sendButton) {
            const isDisabled = await page.evaluate((btn) => btn.hasAttribute('disabled'), sendButton);
            if (!isDisabled) {
                await sendButton.click();
            } else {
                await page.waitForFunction(() => {
                    const b = document.querySelector('button[aria-label="Send message"]');
                    return b && !b.hasAttribute('disabled');
                }, { timeout: 60000 });
                await page.click('button[aria-label="Send message"]');
            }
        } else {
            throw new Error('Send button not found');
        }

        // Wait for a response (guard against empty NodeList and give generous timeout)
        await page.waitForFunction(() => {
            const responses = document.querySelector('button[aria-label="Give positive feedback"]');
            return responses !== null;
        }, { timeout: 120000 });

        // Click "Copy" button (latest response)
        const copied = await page.waitForFunction(() => {
            const copyBtns = document.querySelectorAll('button[aria-label="Copy"]');
            if (copyBtns && copyBtns.length > 0) {
                copyBtns[copyBtns.length - 1].click();
                return true;
            }
            return false;
        }, { timeout: 60000 });

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

const generateResumeJsonWithClaude = async (inputProfile, jobDescription) => {
    const { prompt, fullName } = await getPrompt(inputProfile, jobDescription);
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
    const resumeJSON = await getClaurdResponse(prompt, fullName);
    return resumeJSON;
};

module.exports = generateResumeJsonWithClaude;
