import {
  transcribeWithOpenAI,
  transcribeWithAssemblyAI,
} from "./scripts/transcribe.js";
import {
  summarizeWithOpenAI,
  summarizeWithAnthropic,
} from "./scripts/summarize.js";
import fs from "fs";
import { createInterface } from "readline";
import "./scripts/config.js";
import path from "path";

const transcriptFolder = process.env.TRANSCRIPTS_FOLDER;
const summaryFolder = process.env.SUMMARIES_FOLDER;

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const processInputs = () => {
  if (process.argv.length < 6) {
    console.error(
      "Invalid number of arguments. Expected 4 arguments: audio file path, prompt file path, transcription service, and summarization service."
    );
    rl.close();
    return;
  }

  const audioFilePath = process.argv[2].trim();
  const promptFilePath = process.argv[3].trim();
  const transcriptionProvider = process.argv[4].trim();
  const summarizationProvider = process.argv[5].trim();

  const transcriptionService = ["openai", "assemblyai"];
  const summarizationService = ["openai", "anthropic"];

  if (!transcriptionService.includes(transcriptionProvider)) {
    console.error(
      `Invalid value for transcription service. Received: ${transcriptionProvider}, Expected: one of ${transcriptionService.join(
        ", "
      )}`
    );
    rl.close();
    return;
  }
  if (!summarizationService.includes(summarizationProvider)) {
    console.error(
      `Invalid value for summarization service. Received: ${summarizationProvider}, Expected: one of ${summarizationService.join(
        ", "
      )}`
    );
    rl.close();
    return;
  }

  rl.question("Name the transcription file: ", (answer) => {
    const fileName = answer.trim();
    transcribe(
      audioFilePath,
      promptFilePath,
      transcriptionProvider,
      summarizationProvider,
      fileName
    );
  });
};

const transcribe = async (
  audioFilePath,
  promptFilePath,
  transcriptionProvider,
  summarizationProvider,
  fileName
) => {
  console.log("Starting the transcription process...");
  let transcript = "";
  if (!fs.existsSync(transcriptFolder)) {
    fs.mkdirSync(transcriptFolder);
  }

  switch (transcriptionProvider) {
    case "openai":
      transcript = await transcribeWithOpenAI(audioFilePath);
      fs.writeFileSync(
        path.join(transcriptFolder, `${fileName}-transcript-OpenAI.txt`),
        transcript
      );
      console.log(
        `Transcription complete. Transcript available at:${transcriptFolder}/${
          fileName + "-transcript-OpenAI"
        }.txt`
      );
      break;
    case "assemblyai":
      transcript = await transcribeWithAssemblyAI(audioFilePath);
      fs.writeFileSync(
        path.join(transcriptFolder, `${fileName}-transcript-assemblyAI.txt`),
        transcript
      );
      console.log(
        `Transcription complete. Transcript available at:${path.join(
          transcriptFolder,
          `${fileName}-transcript-assemblyAI.txt`
        )}`
      );
      break;

    default:
      console.error("Invalid transcription service:", transcriptionProvider);
      rl.close();
      return;
  }

  rl.question("Do you want to proceed with summarization? (y/n) ", (answer) => {
    if (answer.toLowerCase() === "y") {
      summarize(transcript, promptFilePath, summarizationProvider, fileName);
    } else {
      console.log("Summarization aborted.");
      rl.close();
    }
  });
};

const summarize = async (
  transcript,
  promptFilePath,
  summarizationProvider,
  fileName
) => {
  console.log("Starting the summarization process...");

  const limitsPath = path.join(process.cwd(), "limits.json");
  let limitsJSON;

  try {
    const limits = JSON.parse(fs.readFileSync(limitsPath, "utf-8"));
    limitsJSON = limits;
  } catch (error) {
    console.error("Error reading or parsing limits.json:", error);
    return;
  }

  let summary = "";

  if (!fs.existsSync(summaryFolder)) {
    fs.mkdirSync(summaryFolder);
  }
  const promptInstructions = fs.readFileSync(promptFilePath, "utf-8");

  switch (summarizationProvider) {
    case "openai":
      summary = await summarizeWithOpenAI(
        promptInstructions,
        transcript,
        limitsJSON
      );

      fs.writeFileSync(
        `${summaryFolder}/${fileName + "-summary-OpenAI"}.txt`,
        summary
      );
      console.log(
        `Summarization complete. Summary available at:${summaryFolder}/${
          fileName + "-summary-OpenAI"
        }.txt`
      );
      break;
    case "anthropic":
      summary = await summarizeWithAnthropic(
        promptInstructions,
        transcript,
        limitsJSON
      );
      fs.writeFileSync(
        `${summaryFolder}/${fileName + "-summary-Anthropic"}.txt`,
        summary
      );
      console.log(
        `Summarization complete. Summary available at:${summaryFolder}/${
          fileName + "-summary-Anthropic"
        }.txt`
      );
      break;
    default:
      console.error("Invalid summarization service:", summarizationProvider);
      rl.close();
      return;
  }

  rl.close();
};

processInputs();
