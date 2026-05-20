import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser middleware with safe size limits for audio payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper to check and retrieve Gemini client with proper user agent option
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. AI Slide Carousel Generator Endpoint
app.post("/api/gemini/generate-carousel", async (req, res) => {
  try {
    const { prompt, language = "it" } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Il prompt è obbligatorio." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return a professional mock structure as fallback if the key is missing,
      // informing the user how to activate the real AI generator
      return res.json({
        isDemo: true,
        message: "Configura la tua GEMINI_API_KEY per generare contenuti illimitati tramite l'IA!",
        slides: [
          {
            title: "Ottimizza il tuo Tempo",
            body: "Il primo passo per migliorare l'efficienza quotidiana inizia dalla gestione dei primi 90 minuti della tua giornata lavorativa.",
            subtitle: "1. Pianifica sempre la sera prima",
            background: "#1e1b4b", // Deep indigo
            textColor: "#f8fafc",
            sticker: "⏱️",
            duration: 5,
          },
          {
            title: "Elimina le Distrazioni",
            body: "Spegni le notifiche dei social, tieni il cellulare in un'altra stanza e dedicati a sessioni di lavoro concentrato di 25 minuti.",
            subtitle: "2. La tecnica del Pomodoro funziona",
            background: "#311042", // Deep violet/wine
            textColor: "#f8fafc",
            sticker: "🚀",
            duration: 5,
          },
          {
            title: "Traccia i tuoi Progressi",
            body: "Usa un diario visivo o una tabella per segnare i compiti completati. Vedere i progressi mantiene alta la motivazione.",
            subtitle: "3. Celebra i piccoli successi",
            background: "#065f46", // Dark emerald
            textColor: "#f8fafc",
            sticker: "📊",
            duration: 5,
          },
          {
            title: "Fai Pause Strategiche",
            body: "Il cervello ha bisogno di recuperare. Fai una passeggiata leggera o allungati per 5 minuti ogni ora.",
            subtitle: "4. Ricarica le batterie fisiche",
            background: "#b45309", // Warm amber
            textColor: "#f8fafc",
            sticker: "🧘",
            duration: 5,
          },
          {
            title: "Il Prossimo Passo",
            body: "Inizia oggi stesso aplicando una sola di queste abitudini. Salva il post o lascia un commento con la tua preferita!",
            subtitle: "Inizia ora e condividi!",
            background: "#991b1b", // Dark red
            textColor: "#f8fafc",
            sticker: "⭐",
            duration: 6,
          }
        ],
      });
    }

    const systemInstruction = `Sei un esperto copywriter ed esperto di marketing sui canali social (Instagram, TikTok, LinkedIn). 
Ti viene chiesto di ideare una sequenza di slide per un carosello di immagini/video accattivante.
Genera una struttura coerente di 4-6 slide che affrontano il tema specificato in lingua ${language}.
Crea testi brevi, accattivanti, di forte impatto visivo.
Fornisci colori moderni e complementari per gli sfondi e sticker emoji che si adattano al tema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Crea un carosello sul tema: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["slides"],
          properties: {
            slides: {
              type: Type.ARRAY,
              description: "Lista ordinata delle slide che compongono il carosello",
              items: {
                type: Type.OBJECT,
                required: ["title", "body", "subtitle", "background", "textColor", "sticker", "duration"],
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Titolo accattivante della slide (massimo 40 caratteri)",
                  },
                  body: {
                    type: Type.STRING,
                    description: "Testo descrittivo principale, fluido e persuasivo (massimo 150 caratteri)",
                  },
                  subtitle: {
                    type: Type.STRING,
                    description: "Testo di supporto o dicitura del sottotitolo temporizzato (massimo 50 caratteri)",
                  },
                  background: {
                    type: Type.STRING,
                    description: "Codice esadecimale moderno e accattivante per lo sfondo della slide (es. #1e1b4b)",
                  },
                  textColor: {
                    type: Type.STRING,
                    description: "Codice esadecimale per il testo, leggibile e ad alto contrasto (es. #ffffff o #f8fafc)",
                  },
                  sticker: {
                    type: Type.STRING,
                    description: "Un singolo carattere emoji coerente con il tema di questa slide",
                  },
                  duration: {
                    type: Type.INTEGER,
                    description: "Durata consigliata in secondi per questa slide (tra 4 e 8)",
                  },
                },
              },
            },
          },
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({ isDemo: false, slides: parsedData.slides });
  } catch (error: any) {
    console.error("Errore durante la generazione del carosello:", error);
    res.status(500).json({ error: error.message || "Errore sconosciuto nella generazione AI." });
  }
});

// 2. AI Voiceover transcription and subtitle generation
app.post("/api/gemini/transcribe", async (req, res) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio) {
      return res.status(400).json({ error: "Audio non fornito." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        isDemo: true,
        text: "Audio registrato correttamente! Per la trascrizione automatica intelligente con IA, attiva le tue chiavi API.",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "audio/webm",
            data: audio,
          },
        },
        "Trascrivi fedelmente questo audio parlato in italiano per creare dei sottotitoli social coerenti. Fornisci direttamente ed esclusivamente la trascrizione letterale formattata in modo pulito, senza commenti o frasi aggiuntive.",
      ],
    });

    const transcribedText = response.text?.trim() || "Trascrizione vuota.";
    res.json({ isDemo: false, text: transcribedText });
  } catch (error: any) {
    console.error("Errore nella trascrizione vocale:", error);
    res.status(500).json({ error: error.message || "Errore del modulo di trascrizione AI." });
  }
});

// 3. Integrate Vite Middleware for UI representation
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on host 0.0.0.0 port ${PORT}`);
  });
}

startServer();
