# Cantonese AI Assistant (Voice Bot)

A lightweight Deno-based web app that provides a bilingual (Cantonese/English) conversational assistant with optional speech features. The frontend is a single HTML page and the backend is a Deno HTTP server that proxies requests to external AI services.

- **Frontend**: `voice-bot.html`
- **Backend**: `voice-bot.ts` (Deno)
- **Default server**: `http://localhost:8090`

## Tech Stack
- **Deno** standard HTTP server
- **Alibaba Cloud Qwen** for text generation (`/api/chat`)
- **MiniMax** for Text-to-Speech (TTS) and Speech-to-Text (STT)
- **Web Speech API** (browser) as an alternative STT method
- **Vanilla HTML/CSS/JS** single-page UI

## Features
- **Bilingual chat**: Toggle between Cantonese and English.
- **Config panel**: In-page configuration for API keys, voice, response type, STT method, speech rate/pitch, and video FPS.
- **Text chat**: Send/receive messages via Alibaba Cloud Qwen.
- **Speech output (TTS)**: Convert bot responses to audio using MiniMax.
- **Speech input (STT)**:
  - Browser Web Speech API (Chrome recommended), or
  - MiniMax STT via the backend endpoint.
- **Local persistence**: Saves configuration in `localStorage`.
- **Simple deployment**: Single Deno server serving the HTML and API routes.

## Application Flow
1. User opens the page served by the Deno server.
2. Messages are sent to the backend `/api/chat` endpoint with the configured Alibaba Cloud API key (header: `X-License-Key`).
3. Backend calls Alibaba Cloud Qwen and returns the assistant response.
4. If response type includes audio, the frontend calls `/api/tts` with MiniMax credentials to synthesize speech and play it.
5. For voice input with MiniMax, the frontend records audio and posts it to `/api/stt`, which forwards to MiniMax STT and returns recognized text.

## Configuration
You can configure credentials either via the in-page Config panel (saved to the browser) or environment variables for local development.

### In-Page Config (recommended for quick testing)
- **Alibaba Cloud API Key** → used for `/api/chat`
- **MiniMax Group ID** and **MiniMax API Key** → used for `/api/tts` and `/api/stt`
- **Voice**, **Response Type** (audio/text/both), **STT Method** (Web Speech or MiniMax)
- **Speech Rate/Pitch**, **Video FPS**

These are stored in `localStorage` as `voiceBotConfig`.

### Environment Variables (.env supported)
The server attempts to read a local `.env` file on startup and set `Deno.env` values.

- `ALICLOUD_API_KEY` (optional for dev; frontend can send via header)
- `MINIMAX_GROUP_ID`
- `MINIMAX_API_KEY`

Example `.env`:
```
# Alibaba Cloud for chat
ALICLOUD_API_KEY=sk-...

# MiniMax for speech
MINIMAX_GROUP_ID=your_group_id
MINIMAX_API_KEY=mmx-...
```

Note: The frontend still supplies headers for `/api/tts` and `/api/stt`. Environment variables are useful for local debugging/logging.

## Running Locally
Prerequisites: Deno installed.

1. (Optional) Create a `.env` file at project root as shown above.
2. Start the server:
```
deno run --allow-net --allow-read --allow-env voice-bot.ts
```
3. Open the app in your browser:
```
http://localhost:8090
```

Permissions required:
- `--allow-net` to call Alibaba Cloud and MiniMax APIs and serve HTTP
- `--allow-read` to read `voice-bot.html` and `.env`
- `--allow-env` to read environment variables

## API Endpoints
- `POST /api/chat`
  - Headers: `Content-Type: application/json`, `X-License-Key: <AlibabaCloudAPIKey>`
  - Body: `{ "message": string, "language": "cantonese" | "english" }`
  - Response: `{ "response": string }`

- `POST /api/tts`
  - Headers: `Content-Type: application/json`, `X-License-Key`, `X-Minimax-Group-Id`, `X-Minimax-Api-Key`
  - Body: `{ "text": string, "language": "cantonese" | "english" }`
  - Response: audio bytes (`audio/mpeg`)

- `POST /api/stt`
  - Headers: `X-Minimax-Group-Id`, `X-Minimax-Api-Key`
  - Body: `FormData` with fields: `audio` (wav/blob), `language` (cantonese|english)
  - Response: `{ "text": string }`

All other routes return the main HTML page.

## Security Notes
- API keys are provided from the browser via headers in this demo. For production, consider moving key handling to server-side only, with authenticated sessions.
- Do not commit real keys. Use `.env` locally and a secure secret manager in production.

## Browser Support
- Web Speech API STT works best in Chrome. Other browsers may fall back to MiniMax STT.

## Troubleshooting
- "Browser does not support speech recognition": Use Chrome or switch STT method to MiniMax in the config panel.
- 401 from Alibaba Cloud: Check `X-License-Key` header or `ALICLOUD_API_KEY` value.
- MiniMax TTS/STT errors: Ensure `X-Minimax-Group-Id` and `X-Minimax-Api-Key` are set in the config panel.
- No audio playback: Confirm the browser’s autoplay policy and that output format is `mp3`.

## Project Structure
```
.
├── voice-bot.html   # Single-page UI with chat, mic, config panel
├── voice-bot.ts     # Deno server and API proxy (chat/tts/stt)
└── README.md        # This file
```

## License
For internal demo and evaluation. Replace with your preferred license as needed.
