import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import "./config.js";
import { countTokens } from "./countTokens.js";
import { fileURLToPath } from "url";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const summarizeWithOpenAI = async (prompt, transcript, limitsJSON) => {
  //const gpt3_5_turbo_context_window = limits.openai.gpt_3_5_turbo.context_window;
  const gpt4_turbo_context_window =
    limitsJSON.openai.models.gpt_4_turbo.context_window;

  const promptTokens = countTokens(prompt);
  const transcriptTokens = countTokens(transcript);
  const totalInputTokens = promptTokens + transcriptTokens;
  const maxOutputTokens = gpt4_turbo_context_window - totalInputTokens;

  if (totalInputTokens > gpt4_turbo_context_window) {
    console.error(
      `Total input tokens (${totalInputTokens}) exceed the context window limit (${gpt4_turbo_context_window})`
    );
    return "Total input tokens exceed the context window limit";
  }

  try {
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      model: "gpt-4-turbo",
      max_tokens: 4096,
      temperature: 0.5,
    });

    const summarizationText = response.choices[0].message.content;

    return summarizationText || "No summarization returned";
  } catch (error) {
    console.error("Error occurred during summarization:", error);
    return "Error occurred during summarization";
  }
};

export const summarizeWithAnthropic = async (
  prompt,
  transcript,
  limitsJSON
) => {
  const claude_3_opus_context_window =
    limitsJSON.anthropic.models.claude_3_opus.context_window;
  //const claude_3_sonnet_context_window = limits.anthropic.claude_3_sonnet.context_window;

  const promptTokens = countTokens(prompt);
  const transcriptTokens = countTokens(transcript);
  const totalInputTokens = promptTokens + transcriptTokens;

  if (totalInputTokens > claude_3_opus_context_window) {
    console.error(
      `Total input tokens (${totalInputTokens}) exceed the context window limit (${claude_3_opus_context_window})`
    );
    return "Total input tokens exceed the context window limit";
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4096,
      temperature: 0.5,
      system: prompt,
      messages: [
        {
          role: "user",
          content: transcript,
        },
      ],
    });

    const summarizationText = response.content[0].text;
    return summarizationText || "No summarization returned";
  } catch (error) {
    console.error("Error occurred during summarization:", error);
    return "Error occurred during summarization";
  }
};

const summarize = async () => {
  const file = process.argv[3];
  const fileText = fs.readFileSync(file, "utf-8");
  const limitsPath = path.join(process.cwd(), "limits.json");
  let limitsJSON;

  try {
    const limits = JSON.parse(fs.readFileSync(limitsPath, "utf-8"));
    limitsJSON = limits;
  } catch (error) {
    console.error("Error reading or parsing limits.json:", error);
    return;
  }

  const provider = process.argv[2];
  let summarizationText = "";

  switch (provider) {
    case "openai":
      summarizationText = await summarizeWithOpenAI(
        "Summarize the following transcript:",
        fileText,
        limitsJSON
      );
      break;
    case "anthropic":
      summarizationText = await summarizeWithAnthropic(
        "Summarize the following transcript:",
        fileText,
        limitsJSON
      );
      break;
    default:
      console.log(
        "Invalid provider. Please specify either 'openai' or 'anthropic'."
      );
      return;
  }

  console.log("Summarization:", summarizationText);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  summarize();
}
