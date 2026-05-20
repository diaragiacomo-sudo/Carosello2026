import { PresetTemplate, MusicTrack } from "./types";

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "minimal-modern",
    name: "Minimal Modern",
    icon: "✨",
    description: "Design pulito, font sans-serif spazioso e colori eleganti. Ottimo per consigli e guide d'impatto.",
    themeClass: "theme-minimal",
    slides: [
      {
        title: "Pensa in Grande",
        body: "Come semplificare la tua routine giornaliera per ottenere il massimo della concentrazione creativa.",
        subtitle: "Scorri per scoprire il segreto 👉",
        background: "#0f172a", // Slate 900
        textColor: "#f1f5f9",
        sticker: "💡",
        duration: 5,
        fontFamily: "sans",
        animType: "fade-up",
        filter: "none"
      },
      {
        title: "Regola del 1%",
        body: "Migliorare anche solo dell'uno per cento ogni giorno porta a risultati straordinari nel lungo termine.",
        subtitle: "Focus e Costanza quotidiana",
        background: "#1e293b", // Slate 800
        textColor: "#f1f5f9",
        sticker: "📈",
        duration: 5,
        fontFamily: "sans",
        animType: "fade-in",
        filter: "none"
      },
      {
        title: "Scolpisci i Risultati",
        body: "Prendi nota delle tue abitudini vincenti e scarta il resto in modo spietato.",
        subtitle: "Massima consapevolezza",
        background: "#0f172a",
        textColor: "#38bdf8", // Sky blue text
        sticker: "✂️",
        duration: 5,
        fontFamily: "sans",
        animType: "fade-up",
        filter: "none"
      }
    ]
  },
  {
    id: "neon-cyberpunk",
    name: "Neon Cyberpunk",
    icon: "🔌",
    description: "Colori brillanti cyberpunk, font monospazio e un look accattivante ideale per tecnologia ed e-sports.",
    themeClass: "theme-cyberpunk",
    slides: [
      {
        title: "SYSTEM INITIALIZED",
        body: "Scopri come proteggere la tua privacy e ottimizzare il tuo codice con l'approccio modulare.",
        subtitle: "[STATUS: ACTIVE] Swipe Left",
        background: "#050505",
        textColor: "#39ff14", // Neon green
        sticker: "👾",
        duration: 6,
        fontFamily: "mono",
        animType: "fade-in",
        filter: "cyberpunk",
        specialEffect: "glitch"
      },
      {
        title: "CODE REFACTOR",
        body: "Minimizza i cicli nidificati, separa le funzioni pure e ottieni build fulminee in pochi passaggi.",
        subtitle: "[MODULE // 02]",
        background: "#0f051d", // Deep purple
        textColor: "#fe019a", // Neon pink
        sticker: "⚡",
        duration: 5,
        fontFamily: "mono",
        animType: "fade-up",
        filter: "cool",
        specialEffect: "none"
      },
      {
        title: "DEPLOY COMPLETED",
        body: "Lancia i tuoi caroselli animati e osserva la tua audience crescere in tempo reale sul Web.",
        subtitle: "[SYSTEM_ONLINE] Salva il post!",
        background: "#08041c",
        textColor: "#00ffff", // Cyan
        sticker: "🚀",
        duration: 6,
        fontFamily: "mono",
        animType: "fade-up",
        filter: "high-contrast",
        specialEffect: "glitch"
      }
    ]
  },
  {
    id: "warm-organic",
    name: "Warm Editorial",
    icon: "🍂",
    description: "Estetica calda, font graziati ed eleganti. Perfetto per lifestyle, meditazione, cibo e benessere.",
    themeClass: "theme-editorial",
    slides: [
      {
        title: "Un Ritmo Lento",
        body: "Trovare la calma nel caos quotidiano attraverso semplici gesti di auto-cura e mindful breathing.",
        subtitle: "Prenditi un momento per respirare 🌾",
        background: "#fdf8f5", // Soft warm beige
        textColor: "#451a03", // Deep warm brown
        sticker: "🧘",
        duration: 6,
        fontFamily: "serif",
        animType: "fade-up",
        filter: "warm"
      },
      {
        title: "Riconnettersi alla Terra",
        body: "Camminare a piedi nudi sull'erba per soli dieci minuti riduce lo stress e rigenera l'organismo.",
        subtitle: "I benefici del grounding naturale",
        background: "#eae0d5", // Soft sand gray
        textColor: "#22333b", // Slate gray-blue
        sticker: "🌿",
        duration: 5,
        fontFamily: "serif",
        animType: "fade-up",
        filter: "vintage"
      },
      {
        title: "Accoglienza d'Animo",
        body: "Lascia andare ciò che non puoi controllare e concentrati sui dettagli che donano vera gioia.",
        subtitle: "Scrivilo nei commenti",
        background: "#fcf6f0",
        textColor: "#9a3412", // Terracotta
        sticker: "☕",
        duration: 6,
        fontFamily: "serif",
        animType: "fade-in",
        filter: "warm"
      }
    ]
  },
  {
    id: "dark-academy",
    name: "Bold Business",
    icon: "💼",
    description: "Design aziendale professionale e ad alto contrasto per report finanziari, marketing e statistiche.",
    themeClass: "theme-business",
    slides: [
      {
        title: "Strategie di Crescita",
        body: "Come scalare la tua startup usando strategie organiche a costo zero nel mercato contemporaneo.",
        subtitle: "Analisi di Mercato 2026",
        background: "#0b2545", // Navy blue
        textColor: "#f4f5f6",
        sticker: "📊",
        duration: 5,
        fontFamily: "sans",
        animType: "fade-up",
        filter: "none"
      },
      {
        title: "Fattore Conversione",
        body: "Una call-to-action posizionata sopra la piega aumenta le conversioni dirette di oltre il 24%.",
        subtitle: "Dati empirici reali",
        background: "#134074", // Rich steel blue
        textColor: "#eef4f8",
        sticker: "🎯",
        duration: 5,
        fontFamily: "sans",
        animType: "fade-in",
        filter: "none"
      },
      {
        title: "Il Prossimo Step",
        body: "Vuoi espandere il tuo business? Lasciami un messaggio e analizzeremo insieme il tuo funnel.",
        subtitle: "Consulenza Gratuita",
        background: "#081c15", // Forest Green
        textColor: "#52b788", // Bright green
        sticker: "⭐",
        duration: 5,
        fontFamily: "sans",
        animType: "fade-up",
        filter: "none"
      }
    ]
  }
];

export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: "music-chill",
    title: "Lo-Fi Midnight Coffee",
    artist: "Chilled Waves",
    genre: "Chill / Study",
    synthType: "chill"
  },
  {
    id: "music-techno",
    title: "Synthwave Circuit Master",
    artist: "Neon Operator",
    genre: "Techno / Retro",
    synthType: "techno"
  },
  {
    id: "music-vintage",
    title: "Vintage Cinema Acoustic Study",
    artist: "Harmonic Moods",
    genre: "Acoustic / Warm",
    synthType: "vintage"
  },
  {
    id: "music-beat",
    title: "Urban Hype Hip Hop Loop",
    artist: "Beatmaker Pro",
    genre: "Hip Hop Beats",
    synthType: "drum-loop"
  }
];

export const FILTERS_DEFINITION = [
  { id: "none", name: "Originale", style: "" },
  { id: "cool", name: "Fresco (Nordic)", style: "saturate(1.1) brightness(1.05) hue-rotate(5deg)" },
  { id: "warm", name: "Caldo (Golden Hour)", style: "sepia(0.2) saturate(1.2) brightness(1.02) contrast(0.98)" },
  { id: "vintage", name: "Classico Retrò", style: "sepia(0.35) contrast(0.9) brightness(0.95) saturate(0.85)" },
  { id: "bw", name: "Bianco & Nero", style: "grayscale(1) contrast(1.25) brightness(1.0)" },
  { id: "cyberpunk", name: "Cyberpunk 2077", style: "contrast(1.3) hue-rotate(330deg) saturate(1.4)" },
  { id: "high-contrast", name: "Contrasto Alto", style: "contrast(1.4) saturate(1.1) brightness(0.95)" },
  { id: "auto-enhance", name: "Color Correction IA (Auto)", style: "contrast(1.15) saturate(1.2) brightness(1.05) contrast(1.1)" }
];

export const STICKER_LIST = [
  // Social Badges / CTA
  { emoji: "👉", label: "Freccia destra" },
  { emoji: "📌", label: "Pin" },
  { emoji: "🔔", label: "Notifica" },
  { emoji: "❤️", label: "Like" },
  { emoji: "💬", label: "Commento" },
  { emoji: "📥", label: "Salva" },
  { emoji: "🔥", label: "Trend" },
  { emoji: "⭐", label: "Preferito" },

  // Business / Growth
  { emoji: "💡", label: "Idea" },
  { emoji: "📈", label: "Grafico" },
  { emoji: "🎯", label: "Highlight" },
  { emoji: "💎", label: "Premium" },
  { emoji: "⏱️", label: "Tempo" },
  { emoji: "🏆", label: "Vittoria" },
  { emoji: "🥇", label: "Top" },
  { emoji: "🗺️", label: "Mappa" },

  // Techno / Creative
  { emoji: "🎨", label: "Design" },
  { emoji: "🚀", label: "Lancio" },
  { emoji: "💻", label: "Tech" },
  { emoji: "⚡", label: "Energia" },
  { emoji: "🧠", label: "Mente" },
  { emoji: "🎧", label: "Musica" },
  { emoji: "🛸", label: "UFO" },
  { emoji: "🌍", label: "Pianeta" }
];
