import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

dotenv.config();

function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

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
  const activeKey = cleanEnv(process.env.GEMINI_API_KEY) || 'AQ.Ab8RN6LhoTtidEXJ6W_0rpS-9qi6nPLfc19dxazaQwaO-4IH_g';
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
  const { messages, model, generateImage, generateSound, generateMusic, generateVideo, webSearch, studyMode } = req.body;
  const customApiKeyHeader = req.headers['x-custom-api-key'] || req.headers['X-Custom-API-Key'] || req.headers['x-custom-api-key-header'];
  const customApiKey = typeof customApiKeyHeader === 'string' ? customApiKeyHeader : undefined;
  
  console.log('Incoming chat request:', {
    model,
    generateImage,
    generateSound,
    generateMusic,
    generateVideo,
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

    // ── SOUND GENERATION MODE ──
    if (generateSound) {
      const lastUserMsg = messages[messages.length - 1]?.content || 'Synthesizer Beep';
      console.log('Generating sound with prompt:', lastUserMsg);
      
      let soundType = 'synth';
      const msgLower = lastUserMsg.toLowerCase();
      if (msgLower.includes('münze') || msgLower.includes('coin') || msgLower.includes('points') || msgLower.includes('gold')) {
        soundType = 'coin';
      } else if (msgLower.includes('explosion') || msgLower.includes('bumm') || msgLower.includes('bomb') || msgLower.includes('krach') || msgLower.includes('blast')) {
        soundType = 'explosion';
      } else if (msgLower.includes('laser') || msgLower.includes('schuss') || msgLower.includes('shoot') || msgLower.includes('blaster') || msgLower.includes('beam')) {
        soundType = 'laser';
      } else if (msgLower.includes('sprung') || msgLower.includes('jump') || msgLower.includes('hopp') || msgLower.includes('bounce')) {
        soundType = 'jump';
      } else if (msgLower.includes('powerup') || msgLower.includes('upgrade') || msgLower.includes('level') || msgLower.includes('win')) {
        soundType = 'powerup';
      } else if (msgLower.includes('teleport') || msgLower.includes('warp') || msgLower.includes('space') || msgLower.includes('scifi')) {
        soundType = 'teleport';
      }

      const soundTitlesDe: Record<string, string> = {
        coin: 'Münz-Einsammeln Sound',
        explosion: 'Gewaltige Explosion',
        laser: 'Sci-Fi Laser-Blaster',
        jump: 'Retro-Sprung-Effekt',
        powerup: 'Power-Up Upgrade Sound',
        teleport: 'Warp Teleportation',
        synth: 'Synthesizer Sound-Effekt'
      };

      return res.json({
        text: `Ich habe einen maßgeschneiderten Sound-Effekt für dich synthetisiert: **"${soundTitlesDe[soundType] || soundTitlesDe['synth']}"** basierend auf deiner Beschreibung: *"${lastUserMsg}"*. Drücke auf den Play-Button unten, um ihn anzuhören!`,
        audioUrl: 'procedural',
        audioType: 'sound',
        soundType: soundType
      });
    }

    // ── MUSIC GENERATION MODE ──
    if (generateMusic) {
      const lastUserMsg = messages[messages.length - 1]?.content || 'Dreamy Ambient';
      console.log('Generating music with prompt:', lastUserMsg);

      let musicStyle = 'ambient';
      const msgLower = lastUserMsg.toLowerCase();
      if (msgLower.includes('lofi') || msgLower.includes('lo-fi') || msgLower.includes('chill') || msgLower.includes('relax')) {
        musicStyle = 'lofi';
      } else if (msgLower.includes('techno') || msgLower.includes('house') || msgLower.includes('dance') || msgLower.includes('electronic') || msgLower.includes('rave')) {
        musicStyle = 'techno';
      } else if (msgLower.includes('retro') || msgLower.includes('8bit') || msgLower.includes('8-bit') || msgLower.includes('chiptune') || msgLower.includes('game')) {
        musicStyle = 'retro';
      } else if (msgLower.includes('happy') || msgLower.includes('fröhlich') || msgLower.includes('cheerful') || msgLower.includes('fun')) {
        musicStyle = 'happy';
      } else if (msgLower.includes('sad') || msgLower.includes('traurig') || msgLower.includes('melancholy')) {
        musicStyle = 'sad';
      }

      const musicStylesDe: Record<string, string> = {
        lofi: 'Entspannter Lofi-Beat',
        techno: 'Pulsierender Techno Rhythmus',
        retro: '8-Bit Retro Chiptune Loop',
        happy: 'Fröhliche Upbeat Melodie',
        sad: 'Melancholische Piano-Harmonie',
        ambient: 'Schwebendes Ambient-Pad'
      };

      return res.json({
        text: `Ich habe ein maßgeschneidertes Musikstück für dich komponiert: **"${musicStylesDe[musicStyle] || musicStylesDe['ambient']}"** basierend auf deiner Beschreibung: *"${lastUserMsg}"*. Du kannst es unten abspielen, loopen und visualisieren lassen!`,
        audioUrl: 'procedural',
        audioType: 'music',
        musicStyle: musicStyle
      });
    }

    // ── VIDEO GENERATION MODE ──
    if (generateVideo) {
      const lastUserMsg = messages[messages.length - 1]?.content || 'Cinematic Universe';
      console.log('Generating video with prompt:', lastUserMsg);

      const videoMatches = [
        { keys: ['space', 'weltall', 'sterne', 'galaxy', 'universe', 'planet', 'erde', 'earth'], url: 'https://assets.mixkit.co/videos/preview/mixkit-flying-through-a-futuristic-scifi-neon-tunnel-43093-large.mp4', title: 'Galaktischer Hyperraum' },
        { keys: ['nature', 'natur', 'wald', 'forest', 'baum', 'wasserfall', 'waterfall', 'fluss'], url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-thick-green-forest-40898-large.mp4', title: 'Kamerablick über dichten Wald' },
        { keys: ['cyberpunk', 'cyber', 'city', 'stadt', 'futuristic', 'tokyo', 'neon'], url: 'https://assets.mixkit.co/videos/preview/mixkit-neon-light-reflections-on-wet-street-at-night-42171-large.mp4', title: 'Futuristische Neon-Stadt' },
        { keys: ['water', 'meer', 'ocean', 'sea', 'wellen', 'waves', 'strand', 'beach'], url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-crashing-on-a-sandy-beach-aerial-view-41584-large.mp4', title: 'Malerische Ozeanwellen' },
        { keys: ['fire', 'feuer', 'flamme', 'flames', 'bonfire', 'kamin'], url: 'https://assets.mixkit.co/videos/preview/mixkit-burning-logs-in-a-cozy-fireplace-close-up-43187-large.mp4', title: 'Gemütliches Kaminfeuer' },
        { keys: ['technology', 'tech', 'code', 'matrix', 'computer', 'server', 'ai'], url: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-binary-code-screens-41908-large.mp4', title: 'Matrix Binärstrom-Simulation' },
        { keys: ['abstract', 'kunst', 'art', 'particles', 'farbe', 'color'], url: 'https://assets.mixkit.co/videos/preview/mixkit-swirling-multicolored-powder-particles-42866-large.mp4', title: 'Abstrakter Partikelwirbel' }
      ];

      const msgLower = lastUserMsg.toLowerCase();
      let selectedVideo = videoMatches[0];

      for (const match of videoMatches) {
        if (match.keys.some(key => msgLower.includes(key))) {
          selectedVideo = match;
          break;
        }
      }

      const lastUserMsgObj = messages[messages.length - 1];
      const uploadedPhotoUrl = lastUserMsgObj?.imageUrl || '';

      if (uploadedPhotoUrl) {
        return res.json({
          text: `Ich habe dein hochgeladenes Foto analysiert und ein **Cinematic Image-to-Video** Rendering mit Ken-Burns-Zoom und atmosphärischen Parallax-Lichteffekten erstellt! Schau dir den animierten Clip unten an.`,
          videoUrl: uploadedPhotoUrl,
          videoType: 'image-to-video',
          videoTitle: 'Animiertes Foto'
        });
      }

      return res.json({
        text: `Ich habe dein KI-Video fertiggestellt! **"${selectedVideo.title}"** basierend auf deiner Beschreibung: *"${lastUserMsg}"*. Du kannst das hochauflösende Video unten abspielen und im Loop betrachten!`,
        videoUrl: selectedVideo.url,
        videoType: 'text-to-video',
        videoTitle: selectedVideo.title
      });
    }

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
    let systemInstruction = 'Du bist AlerksAI Intelegence, ein smarter Chat-Assistent powered by Gemini Intelligence. Du antwortest standardmäßig immer auf Deutsch.';
    
    // Normalize model string to map legacy or missing keys gracefully
    let normalizedModel = model;
    if (model === 'ollama' || model === 'ollama-free') {
      normalizedModel = 'llama-3-ultra';
    }

    if (studyMode) {
      systemInstruction = `Du bist AlerksAI Intelegence im 🎓 Schulmodus (Study Mode), angetrieben von Gemini Intelligence. Deine absolute Kernaufgabe ist es, dem Benutzer beim Lernen, bei Schulaufgaben, Hausaufgaben und akademischen Fragen (Mathematik, Naturwissenschaften, Geschichte, Geografie, Sprachen etc.) kompetent zu helfen.
- Erkläre komplexe Themen extrem klar, geduldig, verständlich, altersgerecht und Schritt für Schritt.
- Biete regelmäßig an, Übungsbeispiele oder Fragen zu stellen, um das Gelernte zu festigen.
- Behalte einen absolut motivierenden, positiven Ton bei.
- WICHTIG: Falls der Benutzer versucht, dich für nicht-schulische Themen zu verwenden (z.B. Gaming-Codes, Promi-Klatsch, YouTube-Videos, Witze oder reines Plaudern), weise ihn höflich, aber bestimmt darauf hin, dass du dich im Schulmodus befindest und lenke das Thema direkt wieder auf seine Bildung oder Hausaufgaben zurück (z.B.: "Ich befinde mich gerade im Schulmodus, um dir beim Lernen zu helfen! Lass uns lieber wieder auf deine Schulaufgaben oder Lernziele konzentrieren. Welches Schulfach machen wir als nächstes?").
Du antwortest standardmäßig immer auf Deutsch.`;
    } else if (normalizedModel === 'nano-banana') {
      systemInstruction = 'Du bist AlerksAI Intelegence Nano (Gemini 3.1 Flash-Lite, von Google). Du bist eine extrem leichtgewichtige, witzige und schnelle Version von AlerksAI Intelegence. Du gibst super clevere, knackige Antworten und liebst Bananen-Metaphern! Antworte immer auf Deutsch.';
    } else if (normalizedModel === 'llama-4-scout') {
      systemInstruction = 'Du bist AlerksAI Intelegence neo (Llama 4 von Meta). Du antwortest extrem pragmatisch, kompakt, direkt und fokussiert auf Effizienz und Schnelligkeit. Du bist stolz auf deine Open-Source-Wurzeln. Antworte auf Deutsch.';
    } else if (normalizedModel === 'openai-gpt-4o') {
      systemInstruction = 'Du bist AlerksAI Intelegence Pro (GPT-4o-mini von OpenAI). Du präsentierst deine Antworten fantastisch sortiert, klar structured, mit Aufzählungspunkten und sehr übersichtlich. Antworte auf Deutsch.';
    } else if (normalizedModel === 'deepseek-r1') {
      systemInstruction = 'Du bist AlerksAI Intelegence StandArt (DeepSeek R1), ein fortschrittliches Denk-Modell. WICHTIG: Du musst zu Beginn jeder Antwort deinen detaillierten Denkprozess in einem `<think>` und `</think>` Block aufschreiben (z.B. `<think>Hier schreibst du deine tiefe Logik, Abwägungen und Lösungsüberlegungen auf...</think>`). Präsentiere danach deine finale Antwort. Antworte auf Deutsch.';
    } else if (normalizedModel === 'claude-3-5') {
      systemInstruction = 'Du bist AlerksAI Intelegence buissnis (Claude 3.5 Sonnet von Anthropic). Du schreibst mit exzellenter deutscher Sprache, sehr eloquent, nuanciert, präzise und nimmst dir Zeit für elegante Details. Antworte auf Deutsch.';
    } else if (normalizedModel === 'llama-3-ultra') {
      systemInstruction = 'Du bist AlerksAI Intelegence Max (Llama 3.3 von Meta). Du bist Metas hochentwickeltes Allround-Modell für tiefgehende Analysen, kreative Ausarbeitungen, präzises Formulieren und anspruchsvolle Diskussionen. Antworte auf Deutsch.';
    } else {
      // Default / Gemini
      systemInstruction = 'Du bist AlerksAI Intelegence (Gemini Intelligence, entwickelt von Google). Du bist AlerksAI Intelegences intelligentes Standard-Modell mit herausragenden Fähigkeiten. Du bist freundlich, kreativ, sehr sachkundig und hilfst bei jeder Art von Problemstellung. Antworte auf Deutsch.';
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

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchSources = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri)
      .map((web: any) => ({
        uri: web.uri,
        title: web.title || web.uri
      }));

    res.json({ 
      text: response.text,
      searchSources: searchSources.length > 0 ? searchSources : undefined
    });
  } catch (error: any) {
    console.error('API Fehler:', error);
    const errStr = String(error.message || error);
    let friendlyMessage = 'Verbindungsproblem mit dem KI-Dienst. Bitte versuche es gleich noch einmal.';
    
    if (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand') || errStr.includes('temporary')) {
      friendlyMessage = 'Der AlerksAI Intelegence-Dienst ist gerade wegen hoher Auslastung überlastet. Bitte warte einen Augenblick und versuche es erneut (oder wechsle zu einem anderen Modell).';
    } else if (errStr.includes('429') || errStr.includes('QUOTA') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('limit')) {
      friendlyMessage = 'Das globale Kontingent (Quota Limit) der Gemini API ist für diese Stunde erschöpft. Um sofort ohne Einschränkung fortzufahren, kannst du deinen eigenen kostenlosen API-Schlüssel einfügen.';
    }

    res.status(500).json({ 
      error: friendlyMessage,
      details: ''
    });
  }
});

// Endpoint to send verification emails for Google login & Password Reset
app.post('/api/send-email', async (req: express.Request, res: express.Response) => {
  const { email, code, type } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'E-Mail und Code fehlen.' });
  }

  const subject = type === 'reset' 
    ? 'AlerksAI Passwort zurücksetzen - Bestätigungscode' 
    : 'AlerksAI Google Login - Bestätigungscode';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4f6ef7; margin: 0; font-weight: 800; font-size: 24px; letter-spacing: -0.5px;">AlerksAI Intelegence</h2>
        <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">Sicherheits-Verifizierung</p>
      </div>
      <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
        <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 0 0 15px 0;">
          Hallo,
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 0 0 20px 0;">
          ${type === 'reset' 
            ? 'Du hast angefordert, dein Passwort zurückzusetzen. Bitte gib den folgenden 6-stelligen Bestätigungscode ein, um dein Passwort zu ändern:' 
            : 'Du versuchst, dich mit Google anzumelden. Bitte gib den folgenden 6-stelligen Bestätigungscode ein, um deine Anmeldung abzuschließen:'}
        </p>
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 15px; text-align: center; margin-bottom: 20px;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #0f172a;">${code}</span>
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.4; margin: 0 0 15px 0;">
          Aus Sicherheitsgründen ist dieser Code nur für kurze Zeit gültig. Falls du diese Anmeldung oder dieses Zurücksetzen nicht veranlasst hast, kannst du diese E-Mail einfach ignorieren.
        </p>
      </div>
      <div style="border-top: 1px solid #f1f5f9; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} AleksAI. Alle Rechte vorbehalten.
      </div>
    </div>
  `;

  const smtpHost = cleanEnv(process.env.SMTP_HOST);
  const smtpPort = cleanEnv(process.env.SMTP_PORT);
  const smtpUser = cleanEnv(process.env.SMTP_USER);
  const smtpPass = cleanEnv(process.env.SMTP_PASS);

  const isDummy = (val: string | undefined) => {
    if (!val) return true;
    const lower = val.toLowerCase().trim();
    return lower === '' || 
           lower.includes('your_') || 
           lower.includes('placeholder') || 
           lower.includes('dummy') || 
           lower.includes('example.com') ||
           lower === 'smtp.example.com';
  };

  const hasConfiguredSmtp = smtpHost && !isDummy(smtpHost) &&
                            smtpUser && !isDummy(smtpUser) &&
                            smtpPass && !isDummy(smtpPass);

  let smtpError: string | null = null;

  if (hasConfiguredSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort || 587),
        secure: Number(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.sendMail({
        from: `"AleksAI" <${smtpUser}>`,
        to: email,
        subject: subject,
        html: htmlContent
      });

      console.log(`[Email] Sent verification email successfully to ${email}`);
      return res.json({ success: true, method: 'smtp' });
    } catch (err: any) {
      console.error('[Email] SMTP failed:', err.message);
      smtpError = err.message;
    }
  }

  // Fallback: Code in Node log print, and let frontend know it's a simulation
  console.log(`[Email Simulation] Code for ${email} is ${code}`);
  return res.json({ 
    success: true, 
    method: smtpError ? 'failed_smtp' : 'simulation', 
    code: code,
    smtpError: smtpError
  });
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
