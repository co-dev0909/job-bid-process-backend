const OpenAI = require("openai");
const dotenv = require("dotenv");
const getPrompt = require("../utils/getPrompt");

dotenv.config();

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

function readNumberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function parseJsonContent(content) {
  if (!content || typeof content !== "string") {
    throw new Error("DeepSeek returned an empty response.");
  }

  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const payload = fenced ? fenced[1] : content;

  const trimmedPayload = payload.trim();

  try {
    return JSON.parse(trimmedPayload);
  } catch (error) {
    const firstBrace = trimmedPayload.indexOf("{");
    const lastBrace = trimmedPayload.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmedPayload.slice(firstBrace, lastBrace + 1));
      } catch (_) {
        // Keep the original parse error below; it points at the model response format.
      }
    }

    throw new Error(`DeepSeek returned invalid JSON: ${error.message}`);
  }
}

function validateResumeJson(resumeJSON) {
  if (!resumeJSON || typeof resumeJSON !== "object" || Array.isArray(resumeJSON)) {
    throw new Error("DeepSeek resume response must be a JSON object.");
  }

  if (!Array.isArray(resumeJSON.skills)) {
    throw new Error("DeepSeek resume response is missing a skills array.");
  }

  return resumeJSON;
}

async function getDeepSeekResponse(prompt) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY in environment.");
  }

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: DEEPSEEK_BASE_URL,
    timeout: readNumberEnv("DEEPSEEK_TIMEOUT_MS", 180000),
  });

  const maxTokens = readNumberEnv("DEEPSEEK_MAX_TOKENS", 8192);

  const completion = await client.chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You generate ATS-optimized resumes. Return only valid JSON with no markdown, explanations, or extra text.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: readNumberEnv("DEEPSEEK_TEMPERATURE", 0.3),
    max_tokens: maxTokens,
  });

  const content = completion.choices?.[0]?.message?.content;
  return validateResumeJson(parseJsonContent(content));
}

const generateResumeJsonWithDeepSeek = async (inputProfile, jobDescription) => {
  const { prompt } = await getPrompt(inputProfile, jobDescription);
  return getDeepSeekResponse(prompt);
};

module.exports = generateResumeJsonWithDeepSeek;
