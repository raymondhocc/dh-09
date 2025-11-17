// voice-bot.ts - Cantonese Conversational Bot with Configuration Panel
// Using Alibaba Cloud Qwen API

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Constants
const port = 8090;
const API_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

// Minimax TTS constants
const MINIMAX_GROUP_ID = Deno.env.get("MINIMAX_GROUP_ID") || "";
const MINIMAX_API_KEY = Deno.env.get("MINIMAX_API_KEY") || "";
// const MINIMAX_VOICE_ID = "Cantonese_GentleLady";

// Cantonese Voice 
// const MINIMAX_VOICE_ID = "Cantonese_PlayfulMan"
const MINIMAX_VOICE_ID = "Cantonese_WiselProfessor"
// const MINIMAX_VOICE_ID = "Cantonese_KindWoman"
// const MINIMAX_VOICE_ID = "Cantonese_CuteGirl"

// English Voice
// const MINIMAX_VOICE_ID = "English_GentleLady"
// const MINIMAX_VOICE_ID = "English_CalmWoman"
// const MINIMAX_VOICE_ID = "conversational_female_2_v1"
// const MINIMAX_VOICE_ID = "English_Trustworth_Man"
// const MINIMAX_VOICE_ID = "English_ManWithDeepVoice"

// Mandarin Voice
// const MINIMAX_VOICE_ID = "Mandarin_GentleLady"
// const MINIMAX_VOICE_ID = "Chinese (Mandarin)_Reliable_Executive"
// const MINIMAX_VOICE_ID = "Chinese (Mandarin)_News_Anchor"
// const MINIMAX_VOICE_ID = "Chinese (Mandarin)_Unrestrained_Young_Man"
// const MINIMAX_VOICE_ID = "hunyin_6"
// const MINIMAX_VOICE_ID = "Chinese (Mandarin)_Soft_Girl"

// Japanese Voice
// const MINIMAX_VOICE_ID = "Japanese_DecisivePrincess"
// const MINIMAX_VOICE_ID = "Japanese_KindLady" 
// const MINIMAX_VOICE_ID = "moss_audio_7f4ee608-78ea-11f0-bb73-1e2a4cfcd245n"
// const MINIMAX_VOICE_ID = "Japanese_GentleButler"

const MINIMAX_TTS_URL = `https://api.minimax.io/v1/t2a_v2?GroupId=${MINIMAX_GROUP_ID}`;

const MINIMAX_VOICE_ID_CANTONESE = Deno.env.get("MINIMAX_VOICE_ID_CANTONESE") || MINIMAX_VOICE_ID;
const MINIMAX_VOICE_ID_ENGLISH = Deno.env.get("MINIMAX_VOICE_ID_ENGLISH") || MINIMAX_VOICE_ID;
const MINIMAX_VOICE_ID_MANDARIN = Deno.env.get("MINIMAX_VOICE_ID_MANDARIN") || MINIMAX_VOICE_ID;
const MINIMAX_VOICE_ID_JAPANESE = Deno.env.get("MINIMAX_VOICE_ID_JAPANESE") || MINIMAX_VOICE_ID;

// Voice and response type options for the configuration panel
const VOICE_OPTIONS = [
  { id: "aoede-female", name: "Aoede (Female)" },
  { id: "aoede-male", name: "Aoede (Male)" },
  { id: "zh-HK-HiuGaaiNeural", name: "粵語 - 曉蓋" },
  { id: "zh-HK-HiuMaanNeural", name: "粵語 - 曉曼" },
  { id: "zh-HK-WanLungNeural", name: "粵語 - 雲龍" },
];

const RESPONSE_TYPES = [
  { id: "audio", name: "Audio" },
  { id: "text", name: "Text" },
  { id: "both", name: "Audio & Text" }
];

// Load environment variables
try {
  const env = await Deno.readTextFile(".env");
  const lines = env.split("\n");
  for (const line of lines) {
    if (line && !line.startsWith("#")) {
      const [key, value] = line.split("=");
      if (key && value) {
        Deno.env.set(key.trim(), value.trim());
      }
    }
  }
  console.log("Loaded environment variables from .env file");
} catch (err) {
  console.log("No .env file found or error reading it:", err.message);
}

// Load HTML template
let HTML: string;
try {
  HTML = await Deno.readTextFile("voice-bot.html");
  console.log("Loaded HTML template, size:", HTML.length, "characters");
} catch (err) {
  console.error("Failed to load HTML template:", err.message);
  HTML = "<html><body>Error: HTML template not found</body></html>";
}

// Log loaded credentials (masked for security)
console.log("ALICLOUD_API_KEY configured:", Deno.env.get("ALICLOUD_API_KEY") ? "Yes" : "No");
console.log("MINIMAX_GROUP_ID configured:", Deno.env.get("MINIMAX_GROUP_ID") ? "Yes" : "No");
console.log("MINIMAX_API_KEY configured:", Deno.env.get("MINIMAX_API_KEY") ? "Yes (length: " + (Deno.env.get("MINIMAX_API_KEY")?.length || 0) + ")" : "No");
console.log("MINIMAX_VOICE_ID_CANTONESE configured:", Deno.env.get("MINIMAX_VOICE_ID_CANTONESE") ? "Yes" : "No");
console.log("MINIMAX_VOICE_ID_ENGLISH configured:", Deno.env.get("MINIMAX_VOICE_ID_ENGLISH") ? "Yes" : "No");
console.log("MINIMAX_VOICE_ID_MANDARIN configured:", Deno.env.get("MINIMAX_VOICE_ID_MANDARIN") ? "Yes" : "No");
console.log("MINIMAX_VOICE_ID_JAPANESE configured:", Deno.env.get("MINIMAX_VOICE_ID_JAPANESE") ? "Yes" : "No");

// Get API key 
const ALICLOUD_API_KEY = Deno.env.get("ALICLOUD_API_KEY") || "";
console.log("API Key configured: " + (ALICLOUD_API_KEY ? "Yes" : "No"));

// Process HTTP request
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // Handle API endpoints
  if (url.pathname === "/api/chat") {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    
    try {
      // Get API key from request headers
      const apiKey = req.headers.get("X-License-Key");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "API key is required" }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Parse request JSON
      const reqData = await req.json();
      const { message, language } = reqData;
      
      if (!message) {
        return new Response(JSON.stringify({ error: "Message is required" }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Prepare system prompt based on language
      let systemPrompt: string;
      if (language === "cantonese") {
        systemPrompt = "你是一個港鐵廣東話人工智能助手，只用廣東話回答問題，用字要口語化，符合香港人日常用語。全部都係港紙HK$價錢。唔係用美元。";
      } else if (language === "mandarin") {
        systemPrompt = "你是一個港鐵中文智能助手，請使用現代簡體中文回答問題，語氣自然友好。所有價格都以港幣HK$顯示，不使用美元。";
      } else if (language === "japanese") {
        systemPrompt = "あなたはMTRの日本語AIアシスタントです。丁寧で分かりやすい日本語で回答してください。料金はすべて香港ドル（HK$）で案内し、米ドルは使わないでください。";
      } else {
        // default to English
        systemPrompt = "You are MTR English-speaking AI assistant. Be helpful, concise, and friendly. All price in HK Dollar. No USD";
      }

      // Call Alibaba Cloud Qwen API
      console.time("Qwen API call");
      const qwenResponse = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({
          model: "qwen-max",
          input: {
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: message
              }
            ]
          },
          parameters: {
            temperature: 0.7,
            max_tokens: 800
          }
        })
      });
      console.timeEnd("Qwen API call");
      
      if (!qwenResponse.ok) {
        const errorText = await qwenResponse.text();
        console.error("Qwen API error:", qwenResponse.status, errorText);
        
        let errorMessage;
        if (language === "cantonese") {
          if (qwenResponse.status === 401) {
            errorMessage = "阿里雲API密鑰無效。請檢查你嘅設定。";
          } else {
            errorMessage = "阿里雲API返回錯誤：" + qwenResponse.status;
          }
        } else if (language === "mandarin") {
          if (qwenResponse.status === 401) {
            errorMessage = "阿里云 API 密钥无效。请检查你的设置。";
          } else {
            errorMessage = "阿里云 API 返回错误：" + qwenResponse.status;
          }
        } else if (language === "japanese") {
          if (qwenResponse.status === 401) {
            errorMessage = "Alibaba Cloud の API キーが無効です。設定を確認してください。";
          } else {
            errorMessage = "Alibaba Cloud API からエラーが返されました：" + qwenResponse.status;
          }
        } else {
          if (qwenResponse.status === 401) {
            errorMessage = "Invalid Alibaba Cloud API key. Please check your configuration.";
          } else {
            errorMessage = "Alibaba Cloud API returned an error: " + qwenResponse.status;
          }
        }
        
        return new Response(JSON.stringify({ error: errorMessage }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Parse API response
      const apiResponseData = await qwenResponse.json();
      const botResponse = apiResponseData.output?.text || apiResponseData.output?.content || "";
      
      // Return response
      return new Response(JSON.stringify({ response: botResponse }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error handling API request:", error);
      
      return new Response(JSON.stringify({ 
        error: error.message || "An error occurred while processing your request" 
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  } else if (url.pathname === "/api/tts") {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      // Get credentials from request headers
      const alicloudApiKey = req.headers.get("X-License-Key");
      const minimaxGroupId = req.headers.get("X-Minimax-Group-Id");
      const minimaxApiKey = req.headers.get("X-Minimax-Api-Key");

      // Log received headers for debugging
      console.log("TTS Request - Headers received:");
      console.log("X-License-Key:", alicloudApiKey ? "Present" : "Missing");
      console.log("X-Minimax-Group-Id:", minimaxGroupId ? "Present" : "Missing");
      console.log("X-Minimax-Api-Key:", minimaxApiKey ? "Present (length: " + minimaxApiKey.length + ")" : "Missing");

      if (!alicloudApiKey) {
        return new Response(JSON.stringify({ error: "Alibaba Cloud API key is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (!minimaxApiKey || !minimaxGroupId) {
        return new Response(JSON.stringify({ error: "Minimax credentials are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Parse request JSON
      const reqData = await req.json();
      const { text, language, minimaxVoiceId } = reqData;

      if (!text) {
        return new Response(JSON.stringify({ error: "Text is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Prepare Minimax TTS request
      const ttsUrl = `https://api.minimax.io/v1/t2a_v2?GroupId=${minimaxGroupId}`;
      const defaultVoiceId =
        language === "cantonese" ? MINIMAX_VOICE_ID_CANTONESE :
        language === "mandarin" ? MINIMAX_VOICE_ID_MANDARIN :
        language === "japanese" ? MINIMAX_VOICE_ID_JAPANESE :
        MINIMAX_VOICE_ID_ENGLISH;

      const voiceId = (typeof minimaxVoiceId === "string" && minimaxVoiceId.trim().length > 0)
        ? minimaxVoiceId.trim()
        : defaultVoiceId;

      const ttsPayload = {
        model: "speech-02-turbo",
        text: text,
        stream: false,
        voice_setting: {
          voice_id: voiceId,
          speed: 1,
          vol: 1,
          pitch: 0
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: "mp3",
          channel: 1
        },
        language_boost:
          language === "cantonese" ? "Chinese,Yue" :
          language === "mandarin" ? "Chinese" :
          language === "japanese" ? "Japanese" :
          "English",
        pronunciation_dict: {
          enable: true,
          language:
            language === "cantonese" ? "Cantonese" :
            language === "mandarin" ? "Chinese" :
            language === "japanese" ? "Japanese" :
            "English"
        }
      };

      // Call Minimax TTS API
      console.time("Minimax TTS API call");
      const ttsResponse = await fetch(ttsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${minimaxApiKey}`
        },
        body: JSON.stringify(ttsPayload)
      });
      console.timeEnd("Minimax TTS API call");

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error("Minimax TTS API error:", ttsResponse.status, errorText);
        return new Response(JSON.stringify({ error: "TTS API error: " + ttsResponse.status }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Parse TTS response
      console.time("TTS JSON parse");
      const ttsData = await ttsResponse.json();
      console.timeEnd("TTS JSON parse");
      console.log("Minimax TTS response:", JSON.stringify(ttsData, null, 2));
      if (!ttsData.data || !ttsData.data.audio) {
        console.error("Invalid TTS response structure:", ttsData);
        return new Response(JSON.stringify({ error: "Invalid TTS response" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Convert hex audio data to bytes
      console.time("Hex to bytes conversion");
      const hex = ttsData.data.audio;
      const audioBytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        audioBytes[i / 2] = parseInt(hex.substr(i, 2), 16);
      }
      console.timeEnd("Hex to bytes conversion");
      console.log("Audio bytes length:", audioBytes.length);

      // Return audio data
      return new Response(audioBytes, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioBytes.length.toString()
        }
      });

    } catch (error) {
      console.error("Error in TTS endpoint:", error);
      return new Response(JSON.stringify({
        error: "An error occurred during text-to-speech conversion"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  } else if (url.pathname === "/api/stt") {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      // Get credentials from request headers
      const minimaxGroupId = req.headers.get("X-Minimax-Group-Id");
      const minimaxApiKey = req.headers.get("X-Minimax-Api-Key");

      if (!minimaxApiKey || !minimaxGroupId) {
        return new Response(JSON.stringify({ error: "Minimax credentials are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Parse form data
      const formData = await req.formData();
      const audioFile = formData.get("audio") as File;
      const language = formData.get("language") as string;

      if (!audioFile) {
        return new Response(JSON.stringify({ error: "Audio file is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Prepare MiniMax STT request
      const sttUrl = `https://api.minimax.io/v1/asr?GroupId=${minimaxGroupId}`;
      const sttFormData = new FormData();
      sttFormData.append("file", audioFile);
      const sttLanguageCode =
        language === "cantonese" ? "zh-HK" :
        language === "mandarin" ? "zh-CN" :
        language === "japanese" ? "ja-JP" :
        "en-US";
      sttFormData.append("language", sttLanguageCode);

      // Call MiniMax STT API
      console.time("Minimax STT API call");
      const sttResponse = await fetch(sttUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${minimaxApiKey}`
        },
        body: sttFormData
      });
      console.timeEnd("Minimax STT API call");

      if (!sttResponse.ok) {
        const errorText = await sttResponse.text();
        console.error("Minimax STT API error:", sttResponse.status, errorText);
        return new Response(JSON.stringify({ error: "STT API error: " + sttResponse.status }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Parse STT response
      const sttData = await sttResponse.json();
      console.log("Minimax STT response:", JSON.stringify(sttData, null, 2));

      // Assuming response has text field
      const recognizedText = sttData.text || sttData.transcript || "";

      // Return recognized text
      return new Response(JSON.stringify({ text: recognizedText }), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Error in STT endpoint:", error);
      return new Response(JSON.stringify({
        error: "An error occurred during speech-to-text conversion"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Serve main HTML for all other routes
  console.log("Serving HTML page, size:", HTML.length, "characters");
  return new Response(HTML, {
    headers: { "Content-Type": "text/html" }
  });
}

// HTML template is loaded from voice-bot.html file

// Start the server
console.log("Cantonese Voice Bot server running at http://localhost:" + port);
serve(handleRequest, { port });
