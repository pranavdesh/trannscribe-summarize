A script to test transcription and summarization for podcasts, interviews, and other dense audio content. Change summarization content by creating different prompt files.

**Usage**

- `npm install`
- `node index.js 'path_to_audio_file' 'path_to_prompt_file' 'transcription_provider' 'summarization_provider'`

- Pick between AssemblyAI or OpenAI for transcription by using 'assemblyai' or 'openai' as the transcription provider.
  - Install ffmpeg ( `brew install ffmpeg` ) if using OpenAI for transcription because it's required for splitting the audio file using `fluent-ffmpeg`.
- Pick between OpenAI or Anthropic for summarization by using 'openai' or 'anthropic' as the summarization provider.

Create a .env file and add your API keys:

- OPENAI_API_KEY=''
- ASSEMBLYAI_API_KEY=''
- ANTHROPIC_API_KEY=' '
- TRANSCRIPTS_FOLDER=' ' (where new transcripts will be stored)
- SUMMARIES_FOLDER=' ' (where final summaries will be stored)

**Limits**

Context windows and rate limits are hard coded in `limits.json`. Adjust these to match your account settings.

https://platform.openai.com/docs/guides/rate-limits/usage-tiers
https://platform.openai.com/docs/models/continuous-model-upgrades
https://docs.anthropic.com/claude/reference/rate-limits
