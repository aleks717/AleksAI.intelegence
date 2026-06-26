import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

let aiClient: GoogleGenAI | null = null;

function getAIClient(customApiKey?: string): GoogleGenAI {
  // If a user provides an individual key in their own session, respect it
  if (customApiKey && customApiKey.trim() !== '') {
    console.log('[Gemini API] Using session-specific custom API key');
    return new GoogleGenAI({
      apiKey: customApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // Use the system-wide GEMINI_API_KEY from env, or fall back to the global developer key if missing
  const activeKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6LhoTtidEXJ6W_0rpS-9qi6nPLfc19dxazaQwaO-4IH_g';
  return new GoogleGenAI({
    apiKey: activeKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}



app.post('/api/chat', async (req: express.Request, res: express.Response) => {
  const { messages, model, generateImage, webSearch, studyMode } = req.body;
  const customApiKeyHeader = req.headers['x-custom-api-key'] || req.headers['X-Custom-API-Key'] || req.headers['x-custom-api-key-header'];
  const customApiKey = typeof customApiKeyHeader === 'string' ? customApiKeyHeader : undefined;
  
  console.log('Incoming chat request:', {
    model,
    generateImage,
    webSearch,
    studyMode,
    messagesCount: messages?.length,
    hasCustomApiKey: !!customApiKey
  });

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Nachrichten-Historie fehlt, ist leer oder ungültig.' });
  }

  let chatContents: any[] = [];
  try {
    const ai = getAIClient(customApiKey);

    // ── IMAGE GENERATION MODE ──
    if (generateImage) {
      const lastUserMsg = messages[messages.length - 1]?.content || 'Ein wunderschönes Gemälde';
      console.log('Generating image with prompt:', lastUserMsg);
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { text: lastUserMsg }
            ]
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "512px"
            }
          }
        });

        let generatedImageUrl = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            generatedImageUrl = `data:image/png;base64,${base64Data}`;
            break;
          }
        }

        if (generatedImageUrl) {
          return res.json({ 
            text: `Hier ist dein generiertes Bild für: "${lastUserMsg}"`, 
            imageUrl: generatedImageUrl 
          });
        }
      } catch (imgError: any) {
        console.warn('Dedicated image model failed or is restricted. Falling back to Pollinations AI generator...', imgError.message);
      }

      // High-performance dynamic fallback generator matching prompt exactly
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(lastUserMsg)}?width=768&height=768&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
      return res.json({
        text: `Hier ist dein generiertes Bild für: "${lastUserMsg}"`,
        imageUrl: fallbackUrl
      });
    }

    // Setup system instructions matching the selected models' personalities
    let systemInstruction = 'Du bist AleksAI, ein smarter Chat-Assistent. Du antwortest standardmäßig immer auf Deutsch.';
    
    // Normalize model string to map legacy or missing keys gracefully
    let normalizedModel = model;
    if (model === 'ollama' || model === 'ollama-free') {
      normalizedModel = 'llama-3-ultra';
    }

    if (studyMode) {
      systemInstruction = `Du bist AleksAI im 🎓 Schulmodus (Study Mode). Deine absolute Kernaufgabe ist es, dem Benutzer beim Lernen, bei Schulaufgaben, Hausaufgaben und akademischen Fragen (Mathematik, Naturwissenschaften, Geschichte, Geografie, Sprachen etc.) kompetent zu helfen.
- Erkläre komplexe Themen extrem klar, geduldig, verständlich, altersgerecht und Schritt für Schritt.
- Biete regelmäßig an, Übungsbeispiele oder Fragen zu stellen, um das Gelernte zu festigen.
- Behalte einen absolut motivierenden, positiven Ton bei.
- WICHTIG: Falls der Benutzer versucht, dich für nicht-schulische Themen zu verwenden (z.B. Gaming-Codes, Promi-Klatsch, YouTube-Videos, Witze oder reines Plaudern), weise ihn höflich, aber bestimmt darauf hin, dass du dich im Schulmodus befindest und lenke das Thema direkt wieder auf seine Bildung oder Hausaufgaben zurück (z.B.: "Ich befinde mich gerade im Schulmodus, um dir beim Lernen zu helfen! Lass uns lieber wieder auf deine Schulaufgaben oder Lernziele konzentrieren. Welches Schulfach machen wir als nächstes?").
Du antwortest standardmäßig immer auf Deutsch.`;
    } else if (normalizedModel === 'nano-banana') {
      systemInstruction = 'Du bist AleksAI Nano (Gemini 3.1 Flash-Lite, von Google). Du bist eine extrem leichtgewichtige, witzige und schnelle Version von AleksAI. Du gibst super clevere, knackige Antworten und liebst Bananen-Metaphern! Antworte immer auf Deutsch.';
    } else if (normalizedModel === 'llama-4-scout') {
      systemInstruction = 'Du bist AleksAI neo (Llama 4 von Meta). Du antwortest extrem pragmatisch, kompakt, direkt und fokussiert auf Effizienz und Schnelligkeit. Du bist stolz auf deine Open-Source-Wurzeln. Antworte auf Deutsch.';
    } else if (normalizedModel === 'openai-gpt-4o') {
      systemInstruction = 'Du bist AleksAI Pro (GPT-4o-mini von OpenAI). Du präsentierst deine Antworten fantastisch sortiert, klar structured, mit Aufzählungspunkten und sehr übersichtlich. Antworte auf Deutsch.';
    } else if (normalizedModel === 'deepseek-r1') {
      systemInstruction = 'Du bist AleksAI StandArt (DeepSeek R1), ein fortschrittliches Denk-Modell. WICHTIG: Du musst zu Beginn jeder Antwort deinen detaillierten Denkprozess in einem `<think>` und `</think>` Block aufschreiben (z.B. `<think>Hier schreibst du deine tiefe Logik, Abwägungen und Lösungsüberlegungen auf...</think>`). Präsentiere danach deine finale Antwort. Antworte auf Deutsch.';
    } else if (normalizedModel === 'claude-3-5') {
      systemInstruction = 'Du bist AleksAI buissnis (Claude 3.5 Sonnet von Anthropic). Du schreibst mit exzellenter deutscher Sprache, sehr eloquent, nuanciert, präzise und nimmst dir Zeit für elegante Details. Antworte auf Deutsch.';
    } else if (normalizedModel === 'llama-3-ultra') {
      systemInstruction = 'Du bist AleksAI Max (Llama 3.3 von Meta). Du bist Metas hochentwickeltes Allround-Modell für tiefgehende Analysen, kreative Ausarbeitungen, präzises Formulieren und anspruchsvolle Diskussionen. Antworte auf Deutsch.';
    } else {
      // Default / Gemini
      systemInstruction = 'Du bist AleksAI Ultra (Gemini 3.5 Flash, entwickelt von Google). Du bist AleksAIs intelligentes Standard-Modell mit herausragenden Fähigkeiten. Du bist freundlich, kreativ, sehr sachkundig und hilfst bei jeder Art von Problemstellung. Antworte auf Deutsch.';
    }

    // Append dynamic date and year context so the AI is aware that it is currently 2026
    const currentYear = new Date().getFullYear();
    const currentDateStr = new Date().toLocaleDateString('de-DE');
    systemInstruction += `\n\nWICHTIGER ZEITKONTEXT: Das heutige Datum ist der ${currentDateStr} (wir befinden uns im Jahr ${currentYear}). Du musst dich absolut darauf einstellen, dass das aktuelle Jahr ${currentYear} ist und alle Fragen mit diesem Wissensstand beantworten!`;

    // Convert message history to GoogleGenAI expected contents format
    // Take the last 15 messages to ensure smooth token lengths. Filter out system/error messages if any.
    const validMessages = messages.filter((msg: any) => msg && typeof msg.content === 'string' && msg.content.trim() !== '');
    
    if (validMessages.length === 0) {
      return res.status(400).json({ error: 'Keine gültigen Nachrichten zum Senden vorhanden.' });
    }

    chatContents = validMessages.slice(-15).map((msg: any) => {
      const parts: any[] = [{ text: msg.content }];

      // Include multimodal uploaded images if present (Only for user messages to avoid illegal payload and limit size)
      if (msg.role === 'user' && msg.imageUrl && msg.imageUrl.startsWith('data:image/')) {
        try {
          const match = msg.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const base64Data = match[2];
            parts.unshift({
              inlineData: {
                mimeType,
                data: base64Data
              }
            });
            console.log(`Attached image part to payload: mimetype=${mimeType}, length=${base64Data.length}`);
          }
        } catch (parseErr) {
          console.error('Failed parsing attachment image:', parseErr);
        }
      }

      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts
      };
    });

    console.log('Sending to GoogleGenAI SDK format:', JSON.stringify(chatContents.map(c => ({ role: c.role, partsCount: c.parts.length }))));

    // Multi-model fallbacks list to handle high demand or rate limits (e.g. 429 quota exceed or 503 unavailable)
    const generateWithFallbackAndRetry = async (aiClient: any, chatContents: any[], systemInstruction: string, temp: number) => {
      // Dynamic preference: try flash lite first if nano-banana style is requested.
      const firstChoice = normalizedModel === 'nano-banana' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';
      // Deduplicate the fallback models array to prevent wasting retry steps on identical endpoints
      const modelsToTry = Array.from(new Set([
        firstChoice,
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash'
      ]));

      let lastError: any = null;

      for (const currentModel of modelsToTry) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`[Gemini API] Attempting generateContent with model: ${currentModel} (Attempt ${attempt}/2)`);
            
            const config: any = {
              systemInstruction: systemInstruction,
              temperature: temp,
            };

            // If webSearch is active, attach googleSearch tool grounding!
            if (webSearch) {
              config.tools = [{ googleSearch: {} }];
            }

            const response = await aiClient.models.generateContent({
              model: currentModel,
              contents: chatContents,
              config: config
            });
            console.log(`[Gemini API] Success with model: ${currentModel}`);
            return response;
          } catch (err: any) {
            lastError = err;
            const errStr = String(err.message || err);
            console.warn(`[Gemini API] Model ${currentModel} failed with: ${errStr}`);
            
            const isQuotaExceeded = errStr.includes('429') || 
                                    errStr.includes('QUOTA') || 
                                    errStr.includes('quota') || 
                                    errStr.includes('limit') || 
                                    errStr.includes('RESOURCE_EXHAUSTED');
            const isTransient = errStr.includes('503') || 
                                errStr.includes('UNAVAILABLE') || 
                                errStr.includes('high demand') || 
                                errStr.includes('temporary') ||
                                (err.status && err.status === 503);

            if (isQuotaExceeded) {
              console.warn(`[Gemini API] Quota/Rate limit exceeded for model ${currentModel}. Immediately falling back to next model.`);
              break; // Proceed to next model immediately without wasting retries
            }
            
            if (isTransient && attempt < 2) {
              await new Promise(resolve => setTimeout(resolve, 1500));
              continue;
            }
            break; // Try next model for other error types
          }
        }
      }
      
      throw lastError || new Error('All Gemini models were exhausted or unavailable.');
    };

    const tempVal = model === 'deepseek-r1' ? 0.35 : 0.7;
    const response = await generateWithFallbackAndRetry(ai, chatContents, systemInstruction, tempVal);

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('API Fehler:', error);
    const errStr = String(error.message || error);
    let friendlyMessage = 'Verbindungsproblem mit dem KI-Dienst. Bitte versuche es gleich noch einmal.';
    
    if (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand') || errStr.includes('temporary')) {
      friendlyMessage = 'Der AleksAI-Dienst ist gerade wegen hoher Auslastung überlastet. Bitte warte einen Augenblick und versuche es erneut (oder wechsle zu einem anderen Modell).';
    } else if (errStr.includes('429') || errStr.includes('QUOTA') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('limit')) {
      friendlyMessage = 'Das globale Kontingent (Quota Limit) der Gemini API ist für diese Stunde erschöpft. Um sofort ohne Einschränkung fortzufahren, kannst du deinen eigenen kostenlosen API-Schlüssel einfügen.';
    }

    res.status(500).json({ 
      error: friendlyMessage,
      details: ''
    });
  }
});

// Serve frontend
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  // Serve static files from dist
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // In development, handle via Vite middleware
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
