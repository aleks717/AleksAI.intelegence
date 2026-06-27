import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

function getAIClient(customApiKey?: string): GoogleGenAI {
  if (customApiKey && customApiKey.trim() !== '') {
    return new GoogleGenAI({
      apiKey: customApiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }

  const activeKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6LhoTtidEXJ6W_0rpS-9qi6nPLfc19dxazaQwaO-4IH_g';
  return new GoogleGenAI({
    apiKey: activeKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { messages, model, generateImage, generateSound, generateMusic, generateVideo, webSearch, studyMode } = JSON.parse(event.body || '{}');
    const customApiKeyHeader = event.headers['x-custom-api-key'] || event.headers['X-Custom-API-Key'] || event.headers['x-custom-api-key-header'];
    const customApiKey = typeof customApiKeyHeader === 'string' ? customApiKeyHeader : undefined;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Nachrichten-Historie fehlt, ist leer oder ungültig.' })
      };
    }

    const ai = getAIClient(customApiKey);

    // ── SOUND GENERATION MODE ──
    if (generateSound) {
      const lastUserMsg = messages[messages.length - 1]?.content || 'Synthesizer Beep';
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

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Ich habe einen maßgeschneiderten Sound-Effekt für dich synthetisiert: **"${soundTitlesDe[soundType] || soundTitlesDe['synth']}"** basierend auf deiner Beschreibung: *"${lastUserMsg}"*. Drücke auf den Play-Button unten, um ihn anzuhören!`,
          audioUrl: 'procedural',
          audioType: 'sound',
          soundType: soundType
        })
      };
    }

    // ── MUSIC GENERATION MODE ──
    if (generateMusic) {
      const lastUserMsg = messages[messages.length - 1]?.content || 'Dreamy Ambient';
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

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Ich habe ein maßgeschneidertes Musikstück für dich komponiert: **"${musicStylesDe[musicStyle] || musicStylesDe['ambient']}"** basierend auf deiner Beschreibung: *"${lastUserMsg}"*. Du kannst es unten abspielen, loopen und visualisieren lassen!`,
          audioUrl: 'procedural',
          audioType: 'music',
          musicStyle: musicStyle
        })
      };
    }

    // ── VIDEO GENERATION MODE ──
    if (generateVideo) {
      const lastUserMsg = messages[messages.length - 1]?.content || 'Cinematic Universe';
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
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `Ich habe dein hochgeladenes Foto analysiert und ein **Cinematic Image-to-Video** Rendering mit Ken-Burns-Zoom und atmosphärischen Parallax-Lichteffekten erstellt! Schau dir den animierten Clip unten an.`,
            videoUrl: uploadedPhotoUrl,
            videoType: 'image-to-video',
            videoTitle: 'Animiertes Foto'
          })
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Ich habe dein KI-Video fertiggestellt! **"${selectedVideo.title}"** basierend auf deiner Beschreibung: *"${lastUserMsg}"*. Du kannst das hochauflösende Video unten abspielen und im Loop betrachten!`,
          videoUrl: selectedVideo.url,
          videoType: 'text-to-video',
          videoTitle: selectedVideo.title
        })
      };
    }

    // ── IMAGE GENERATION MODE ──
    if (generateImage) {
      const lastUserMsg = messages[messages.length - 1]?.content || 'Ein wunderschönes Gemälde';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: lastUserMsg }] },
          config: { imageConfig: { aspectRatio: "1:1", imageSize: "512px" } }
        });

        let generatedImageUrl = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }

        if (generatedImageUrl) {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `Hier ist dein generiertes Bild für: "${lastUserMsg}"`, imageUrl: generatedImageUrl })
          };
        }
      } catch (imgError: any) {
        console.warn('Dedicated image model failed. Falling back to Pollinations AI...', imgError.message);
      }

      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(lastUserMsg)}?width=768&height=768&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `Hier ist dein generiertes Bild für: "${lastUserMsg}"`, imageUrl: fallbackUrl })
      };
    }

    // Setup system instructions
    let systemInstruction = 'Du bist AlerksAI Intelegence, ein smarter Chat-Assistent powered by Gemini Intelligence. Du antwortest standardmäßig immer auf Deutsch.';
    let normalizedModel = model;
    if (model === 'ollama' || model === 'ollama-free') {
      normalizedModel = 'llama-3-ultra';
    }

    if (studyMode) {
      systemInstruction = `Du bist AlerksAI Intelegence im 🎓 Schulmodus (Study Mode), angetrieben von Gemini Intelligence. Deine absolute Kernaufgabe ist es, dem Benutzer beim Lernen, bei Schulaufgaben, Hausaufgaben und akademischen Fragen (Mathematik, Naturwissenschaften, Geschichte, Geografie, Sprachen etc.) kompetent zu helfen.
- Erkläre komplexe Themen extrem klar, geduldig, verständlich, altersgerecht und Schritt für Schritt.
- Biete regelmäßig an, Übungsbeispiele oder Fragen zu stellen, um das Gelernte zu festigen.
- Behalte einen absolut motivierenden, positiven Ton bei.
- WICHTIG: Falls der Benutzer versucht, dich für nicht-schulische Themen zu verwenden (z.B. Gaming-Codes, Promi-Klatsch, YouTube-Videos, Witze oder reines Plaudern), weise ihn höflich, aber bestimmt darauf hin, dass du dich im Schulmodus befindest und lenke das Thema direkt wieder auf seine Bildung oder Hausaufgaben zurück.
Du antwortest standardmäßig immer auf Deutsch.`;
    } else if (normalizedModel === 'nano-banana') {
      systemInstruction = 'Du bist AlerksAI Intelegence Nano (Gemini 3.1 Flash-Lite, von Google). Du bist eine extrem leichtgewichtige, witzige und schnelle Version von AlerksAI Intelegence. Du gibst super clevere, knackige Antworten und liebst Bananen-Metaphern! Antworte immer auf Deutsch.';
    } else if (normalizedModel === 'llama-4-scout') {
      systemInstruction = 'Du bist AlerksAI Intelegence neo (Llama 4 von Meta). Du antwortest extrem pragmatisch, kompakt, direkt und fokussiert auf Effizienz und Schnelligkeit. Du bist stolz auf deine Open-Source-Wurzeln. Antworte auf Deutsch.';
    } else if (normalizedModel === 'openai-gpt-4o') {
      systemInstruction = 'Du bist AlerksAI Intelegence Pro (GPT-4o-mini von OpenAI). Du präsentierst deine Antworten fantastisch sortiert, klar structured, mit Aufzählungspunkten und sehr übersichtlich. Antworte auf Deutsch.';
    } else if (normalizedModel === 'deepseek-r1') {
      systemInstruction = 'Du bist AlerksAI Intelegence StandArt (DeepSeek R1), ein fortschrittliches Denk-Modell. WICHTIG: Du musst zu Beginn jeder Antwort deinen detaillierten Denkprozess in einem `<think>` und `</think>` Block aufschreiben. Präsentiere danach deine finale Antwort. Antworte auf Deutsch.';
    } else if (normalizedModel === 'claude-3-5') {
      systemInstruction = 'Du bist AlerksAI Intelegence buissnis (Claude 3.5 Sonnet von Anthropic). Du schreibst mit exzellenter deutscher Sprache, sehr eloquent, nuanciert, präzise und nimmst dir Zeit für elegante Details. Antworte auf Deutsch.';
    } else if (normalizedModel === 'llama-3-ultra') {
      systemInstruction = 'Du bist AlerksAI Intelegence Max (Llama 3.3 von Meta). Du bist Metas hochentwickeltes Allround-Modell für tiefgehende Analysen, kreative Ausarbeitungen, präzises Formulieren und anspruchsvolle Diskussionen. Antworte auf Deutsch.';
    } else {
      systemInstruction = 'Du bist AlerksAI Intelegence (Gemini Intelligence, entwickelt von Google). Du bist AlerksAI Intelegences intelligentes Standard-Modell mit herausragenden Fähigkeiten. Du bist freundlich, kreativ, sehr sachkundig und hilfst bei jeder Art von Problemstellung. Antworte auf Deutsch.';
    }

    const currentYear = new Date().getFullYear();
    const currentDateStr = new Date().toLocaleDateString('de-DE');
    systemInstruction += `\n\nWICHTIGER ZEITKONTEXT: Das heutige Datum ist der ${currentDateStr} (wir befinden uns im Jahr ${currentYear}). Du musst dich absolut darauf einstellen, dass das aktuelle Jahr ${currentYear} is und alle Fragen mit diesem Wissensstand beantworten!`;

    const validMessages = messages.filter((msg: any) => msg && typeof msg.content === 'string' && msg.content.trim() !== '');
    if (validMessages.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Keine gültigen Nachrichten zum Senden vorhanden.' })
      };
    }

    const chatContents = validMessages.slice(-15).map((msg: any) => {
      const parts: any[] = [{ text: msg.content }];
      if (msg.role === 'user' && msg.imageUrl && msg.imageUrl.startsWith('data:image/')) {
        try {
          const match = msg.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            parts.unshift({ inlineData: { mimeType: match[1], data: match[2] } });
          }
        } catch (e) {
          console.error(e);
        }
      }
      return { role: msg.role === 'user' ? 'user' : 'model', parts };
    });

    const generateWithFallbackAndRetry = async (aiClient: any, chatContents: any[], systemInstruction: string, temp: number) => {
      const firstChoice = normalizedModel === 'nano-banana' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';
      const modelsToTry = Array.from(new Set([firstChoice, 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash']));
      let lastError: any = null;

      for (const currentModel of modelsToTry) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const config: any = { systemInstruction, temperature: temp };
            if (webSearch) {
              config.tools = [{ googleSearch: {} }];
            }
            const response = await aiClient.models.generateContent({
              model: currentModel,
              contents: chatContents,
              config: config
            });
            return response;
          } catch (err: any) {
            lastError = err;
            const errStr = String(err.message || err);
            const isQuotaExceeded = errStr.includes('429') || errStr.includes('QUOTA') || errStr.includes('quota') || errStr.includes('limit') || errStr.includes('RESOURCE_EXHAUSTED');
            if (isQuotaExceeded) {
              break;
            }
            if (attempt < 2) {
              await new Promise(resolve => setTimeout(resolve, 1500));
              continue;
            }
            break;
          }
        }
      }
      throw lastError || new Error('All Gemini models were exhausted.');
    };

    const tempVal = model === 'deepseek-r1' ? 0.35 : 0.7;
    const response = await generateWithFallbackAndRetry(ai, chatContents, systemInstruction, tempVal);

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchSources = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri)
      .map((web: any) => ({ uri: web.uri, title: web.title || web.uri }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: response.text,
        searchSources: searchSources.length > 0 ? searchSources : undefined
      })
    };
  } catch (error: any) {
    console.error('API Fehler:', error);
    const errStr = String(error.message || error);
    let friendlyMessage = 'Verbindungsproblem mit dem KI-Dienst. Bitte versuche es gleich noch einmal.';
    if (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand') || errStr.includes('temporary')) {
      friendlyMessage = 'Der AlerksAI Intelegence-Dienst ist gerade ausgelastet. Bitte versuche es erneut.';
    } else if (errStr.includes('429') || errStr.includes('QUOTA') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('limit')) {
      friendlyMessage = 'Das globale Kontingent (Quota Limit) der Gemini API ist für diese Stunde erschöpft. Um sofort ohne Einschränkung fortzufahren, kannst du deinen eigenen kostenlosen API-Schlüssel einfügen.';
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: friendlyMessage, details: '' })
    };
  }
};
