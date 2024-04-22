import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import './config.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 
export const summarizeWithOpenAI = async (prompt, transcript) => {
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: transcript,
      }
    ],
    model:"gpt-3.5-turbo"
  })

  const summarizationText = response.choices[0].message.content;

  return summarizationText || "No summarization returned";
}

export const summarizeWithAnthropic = async (prompt, transcript) => {   

  const response = await anthropic.messages.create({
    model:"claude-3-opus-20240229",
    max_tokens: 4096,
    system: prompt, 
    messages: [
      {
        role: "user",
        content: transcript,
      },
    ],
  })

  const summarizationText = response.content[0].text;

  return summarizationText || "No summarization returned";
}