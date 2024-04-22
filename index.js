
import { transcribeWithOpenAI, transcribeWithAssemblyAI } from "./scripts/transcribe.js";
import { summarizeWithOpenAI, summarizeWithAnthropic } from "./scripts/summarize.js";
import fs, { read } from 'fs';
import readline from 'readline';
import { createInterface } from 'readline';
import './scripts/config.js';

const transcriptFolder = process.env.TRANSCRIPTS_FOLDER;
const summaryFolder = process.env.SUMMARIES_FOLDER;

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

const processInputs = () => {
    console.log(process.argv)
    const audioFilePath = process.argv[2].trim();
    const promptFilePath = process.argv[3].trim();
    const transcriptionProvider = process.argv[4].trim();
    const summarizationProvider = process.argv[5].trim();

    const transcriptionService = ['openai', 'assemblyai']; 
    const summarizationService = ['openai', 'anthropic']; 

    if (!transcriptionService.includes(transcriptionProvider)) {
        console.error(`Invalid value for transcription service. Received: ${transcriptionProvider}, Expected: one of ${transcriptionService.join(', ')}`);
        rl.close();
        return;
    }
    if (!summarizationService.includes(summarizationProvider)) {
        console.error(`Invalid value for summarization service. Received: ${summarizationProvider}, Expected: one of ${summarizationService.join(', ')}`);
        rl.close();
        return;
    }

    rl.question('Do you want to proceed with transcription? (y/n) ', (answer) => {
        if (answer.toLowerCase() === 'y') {

            rl.question('Name the transcription file: ', (answer) => {
                const fileName = answer.trim();
                transcribe(audioFilePath, promptFilePath, transcriptionProvider, summarizationProvider, fileName);
            });
           
        } else {
            console.log('Transcription aborted.');
            rl.close();
        }
    });
};

const transcribe = async (audioFilePath, promptFilePath, transcriptionProvider, summarizationProvider, fileName) => {
    console.log('Starting the transcription process...');
    let transcript = '';
    if (!fs.existsSync(transcriptFolder)) {
        fs.mkdirSync(transcriptFolder);
    }
    
    switch (transcriptionProvider) {
        case 'openai':
            transcript = await transcribeWithOpenAI(audioFilePath);
            fs.writeFileSync(`${transcriptFolder}/${fileName+'-transcript-OpenAI'}.txt`, transcript);
            break;
        case 'assemblyai':
            transcript = await transcribeWithAssemblyAI(audioFilePath);
            fs.writeFileSync(`${transcriptFolder}/${fileName+'-transcript-assemblyAI'}.txt`, transcript);
            break;
        default:
            console.error('Invalid transcription service:', transcriptionProvider);
            rl.close();
            return;
    }

    rl.question('Do you want to proceed with summarization? (y/n) ', (answer) => {
        if (answer.toLowerCase() === 'y') {
            summarize(transcript, promptFilePath, summarizationProvider, fileName);
        } else {
            console.log('Summarization aborted.');
            rl.close();
        }
    });
};

const summarize = async (transcript, promptFilePath, summarizationProvider,fileName) => {
    console.log('Starting the summarization process...');

    let summary = '';
    if (!fs.existsSync(summaryFolder)) {
        fs.mkdirSync(summaryFolder);
    }
        const promptInstructions = fs.readFileSync(promptFilePath, 'utf-8');

        switch (summarizationProvider) {
            case 'openai':
                summary = await summarizeWithOpenAI(promptInstructions, transcript);
                console.log('Summary:', summary)
                
                fs.writeFileSync(`${summaryFolder}/${fileName+'-summary-OpenAI'}.txt`, summary);
                break;
            case 'anthropic':
                summary = await summarizeWithAnthropic(promptInstructions, transcript);
                console.log('Summary:', summary)
                fs.writeFileSync(`${summaryFolder}/${fileName+'-summary-Anthropic'}.txt`, summary);
                break;
            default:
                console.error('Invalid summarization service:', summarizationProvider);
                rl.close();
                return;
        }
       
        // Add actual summarization logic here


        rl.close();
    }


processInputs();
