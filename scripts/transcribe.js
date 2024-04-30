import { AssemblyAI } from "assemblyai";
import fs from "fs";
import { OpenAI } from "openai";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { fileURLToPath } from "url";
import "./config.js";

//using assemblyAI
const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const transcribeWithAssemblyAI = async (filePath) => {
  const transcript = await assemblyai.transcripts.transcribe({
    audio: filePath,
    speaker_labels: true,
    speakers_expected: 3,
  });

  if (transcript.status === "error") {
    console.log(transcript.error);
    return "Error in transcription";
  } else {
    let transcriptText = "";
    const utterances = transcript.utterances;

    if (!utterances) {
      return "Error: No utterances found in transcript";
    }

    for (let utterance of utterances) {
      transcriptText += `${utterance.speaker}: ${utterance.text}\n`;
    }

    return transcriptText;
  }
};

//using openAI

const getMediaDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration || 0);
      }
    });
  });
};

const splitChunk = (filePath, outputFilePath, start, duration) => {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .setStartTime(start)
      .setDuration(duration)
      .output(outputFilePath)
      .on("end", () => {
        console.log("Chunk created:", outputFilePath);
        resolve();
      })
      .on("error", (err) => {
        console.log("Error:", err);
        reject(err);
      })
      .run();
  });
};

const chunkFiles = async (filePath, chunkDuration, dirPath) => {
  const chunkFilePaths = [];
  const duration = await getMediaDuration(filePath);

  for (let start = 0; start < duration; start += chunkDuration) {
    const chunkFilePath = path.join(
      dirPath,
      `chunk_${Date.now()}_${start}.m4a`
    );
    chunkFilePaths.push(chunkFilePath);
    await splitChunk(
      filePath,
      chunkFilePath,
      start,
      Math.min(chunkDuration, duration - start)
    );
  }

  return chunkFilePaths;
};

const deleteFiles = (filePaths) => {
  filePaths.forEach((filePath) => {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  });
};

const sendFileToOpenAI = async (
  filePath,
  previous_transcript,
  retries = 3,
  backoff = 300
) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "text",
      timestamp_granularities: ["segment"],
      prompt: previous_transcript,
    });
    return transcription || "No transcription returned";
  } catch (error) {
    if (retries > 0 && error.code === "ECONNRESET") {
      console.log(
        `Retrying... ${retries} retries left. Error: ${error.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return sendFileToOpenAI(
        filePath,
        previous_transcript,
        retries - 1,
        backoff * 2
      );
    } else {
      console.error(`Error processing file ${filePath}:`, error);
      return "Error in transcription";
    }
  }
};

export const transcribeWithOpenAI = async (filePath) => {
  const transcriptions = [""];
  const maxChunkSize = 625;
  const dirPath = "./examples/audio";

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
  const chunkFilePaths = await chunkFiles(filePath, maxChunkSize, dirPath);
  console.log(chunkFilePaths);
  for (let i = 0; i < chunkFilePaths.length; i++) {
    console.log(`Processing chunk ${i + 1} of ${chunkFilePaths.length}`);
    const transcription = await sendFileToOpenAI(
      chunkFilePaths[i],
      transcriptions[i]
    );
    transcriptions.push(transcription);
    deleteFiles([chunkFilePaths[i]]);
  }

  const completeTranscription = transcriptions.join("\n\n");

  return completeTranscription;
};

const transcribe = async () => {
  const filePath = process.argv[3];
  const provider = process.argv[2];
  let transcriptionText = "";

  switch (provider) {
    case "assemblyai":
      transcriptionText = await transcribeWithAssemblyAI(filePath);
      break;
    case "openai":
      transcriptionText = await transcribeWithOpenAI(filePath);
      break;
    default:
      console.log(
        "Invalid provider. Please specify either 'assemblyai' or 'openai'."
      );
      return;
  }

  console.log("Transcription:", transcriptionText);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  transcribe();
}
