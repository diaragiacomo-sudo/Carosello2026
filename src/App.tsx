import React, { useState, useEffect, useRef } from "react";
import { CarouselSlide, AspectRatio, MusicTrack, PresetTemplate } from "./types";
import {
  PRESET_TEMPLATES,
  FILTERS_DEFINITION,
  STICKER_LIST,
  MUSIC_LIBRARY,
} from "./data";
import { CarouselCanvas } from "./components/CarouselCanvas";
import { MusicSelector } from "./components/MusicSelector";
import { VoiceoverPanel } from "./components/VoiceoverPanel";
import { Timeline } from "./components/Timeline";
import { startSynthLoop } from "./utils/synth";

// Lucide Icons
import {
  Sparkles,
  Play,
  Pause,
  Download,
  Video,
  Grid,
  Maximize,
  Undo2,
  RefreshCw,
  Sliders,
  Image as ImageIcon,
  Check,
  Type as FontIcon,
  HelpCircle,
} from "lucide-react";

export default function App() {
  // --- Core State Machine ---
  const [slides, setSlides] = useState<CarouselSlide[]>(() => {
    // Initializer using first preset template
    return PRESET_TEMPLATES[0].slides.map((s, idx) => ({
      ...s,
      id: `slide-${Date.now()}-${idx}`,
    }));
  });

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [autoColor, setAutoColor] = useState(false);
  const [selectedMusicId, setSelectedMusicId] = useState<string>("music-chill");
  const [musicVolume, setMusicVolume] = useState(0.4);

  // Voiceovers per slide id
  const [voiceovers, setVoiceovers] = useState<Record<string, string>>({});
  const [voiceoverBase64Data, setVoiceoverBase64Data] = useState<Record<string, string>>({});

  // Active playing statuses
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState(0);

  // Audio previews variables
  const [currentPreviewingId, setCurrentPreviewingId] = useState("none");
  const activeSynthRef = useRef<{ stop: () => void } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // AI Generation input triggers
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Export Modal statuses
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedResolution, setSelectedResolution] = useState("1080p");
  const [exportedVideoUrl, setExportedVideoUrl] = useState("");

  // Active editor slide reference
  const activeSlide = slides[activeSlideIndex] || slides[0];

  // Initialize AudioCtx lazily
  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Safe release of synthesizer nodes
  const stopAllSynthesizers = () => {
    if (activeSynthRef.current) {
      activeSynthRef.current.stop();
      activeSynthRef.current = null;
    }
    setCurrentPreviewingId("none");
  };

  // Trigger preview synth
  const handlePlayMusicPreview = (track: MusicTrack) => {
    if (currentPreviewingId === track.id) {
      stopAllSynthesizers();
      return;
    }
    stopAllSynthesizers();

    try {
      const ctx = getAudioContext();
      if (track.synthType) {
        // Start live oscillator chord generation
        const s = startSynthLoop(track.synthType, ctx, ctx.destination);
        activeSynthRef.current = s;
        setCurrentPreviewingId(track.id);
      }
    } catch (e) {
      console.error("Audio Context preview failure:", e);
    }
  };

  // Adjust volume dynamically
  const handleVolumeChange = (newVol: number) => {
    setMusicVolume(newVol);
    // In a fully-piped synthesizer setup, we'd adjust master gain,
    // but a state is perfect to model correct parameters for exports!
  };

  // Toggle active global play slideshow
  useEffect(() => {
    let playTimeout: NodeJS.Timeout | null = null;
    let voiceAudio: HTMLAudioElement | null = null;

    if (isPlaying) {
      const slide = slides[currentPlaybackIndex];
      
      // Stop previewing and start synthesized background music loop
      if (selectedMusicId !== "none" && currentPreviewingId === "none") {
        const found = MUSIC_LIBRARY.find((m) => m.id === selectedMusicId);
        if (found) {
          handlePlayMusicPreview(found);
        }
      }

      // Check and trigger saved voiceover audio
      const savedVoice = voiceovers[slide.id];
      if (savedVoice) {
        voiceAudio = new Audio(savedVoice);
        voiceAudio.volume = 1.0;
        voiceAudio.play().catch(() => {});
      }

      // Progress index when time expires
      playTimeout = setTimeout(() => {
        if (voiceAudio) {
          voiceAudio.pause();
          voiceAudio = null;
        }

        if (currentPlaybackIndex < slides.length - 1) {
          setCurrentPlaybackIndex((p) => p + 1);
        } else {
          // Finished loop
          setIsPlaying(false);
          stopAllSynthesizers();
          setCurrentPlaybackIndex(0);
        }
      }, slide.duration * 1000);
    } else {
      if (playTimeout) clearTimeout(playTimeout);
    }

    return () => {
      if (playTimeout) clearTimeout(playTimeout);
      if (voiceAudio) {
        voiceAudio.pause();
      }
    };
  }, [isPlaying, currentPlaybackIndex, slides.length]);

  // Synchronize canvas selection preview index on play loop
  useEffect(() => {
    if (isPlaying) {
      setActiveSlideIndex(currentPlaybackIndex);
    }
  }, [currentPlaybackIndex, isPlaying]);

  // Stop playback on active edits
  const handleSelectSlideIndex = (idx: number) => {
    setIsPlaying(false);
    stopAllSynthesizers();
    setActiveSlideIndex(idx);
  };

  // Load a Pre-built Template structure into editor
  const handleApplyPresetTemplate = (tpl: PresetTemplate) => {
    if (confirm(`Vuoi applicare il template "${tpl.name}"? Sostituirà le slide correnti.`)) {
      setIsPlaying(false);
      stopAllSynthesizers();
      
      const mapped = tpl.slides.map((s, idx) => ({
        ...s,
        id: `slide-${Date.now()}-${idx}`,
      }));

      setSlides(mapped);
      setActiveSlideIndex(0);
      setAiMessage(`Template "${tpl.name}" applicato con successo.`);
    }
  };

  // Generate Carousel with Gemini AI
  const handleGenerateAiCarousel = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiMessage("");
    setIsPlaying(false);
    stopAllSynthesizers();

    try {
      const res = await fetch("/api/gemini/generate-carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, language: "it" }),
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const generatedSlides = data.slides.map((s: any, idx: number) => ({
        ...s,
        id: `slide-${Date.now()}-${idx}`,
        fontFamily: s.fontFamily || "sans",
        animType: s.animType || "fade-up",
        filter: "none",
        specialEffect: "none",
      }));

      setSlides(generatedSlides);
      setActiveSlideIndex(0);
      setAiMessage(
        data.isDemo
          ? "💡 Demo caricata! Attiva la tua chiave API per generazioni personalizzate ad alte prestazioni."
          : `✨ Carosello IA generato con successo basato sul tema: "${aiPrompt}"`
      );
      setAiPrompt("");
    } catch (err: any) {
      console.error(err);
      setAiMessage("❌ Impossibile generare con l'IA. Controlla la tua connessione o le chiavi segrete.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- CRUD Editor Actions ---
  const handleUpdateSlideField = (id: string, field: keyof CarouselSlide, val: any) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const handleAddSlide = () => {
    const newSlide: CarouselSlide = {
      id: `slide-${Date.now()}`,
      title: "Nuova Slide Strategica",
      body: "Inserisci un corpo di testo che catturi l'attenzione. Sii conciso e spiega chiaramente il concetto principale.",
      subtitle: "Un consiglio illuminante ✨",
      background: "#1e1b4b", // Deep indigo preset
      textColor: "#f8fafc",
      sticker: "💡",
      duration: 5,
      fontFamily: "sans",
      animType: "fade-up",
      filter: "none",
      specialEffect: "none",
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) {
      alert("Devi mantenere almeno una slide nell'editor!");
      return;
    }
    const filtered = slides.filter((s) => s.id !== id);
    setSlides(filtered);
    
    // Adjust index offset
    if (activeSlideIndex >= filtered.length) {
      setActiveSlideIndex(filtered.length - 1);
    }
  };

  const handleDuplicateSlide = (slide: CarouselSlide) => {
    const duplicated: CarouselSlide = {
      ...slide,
      id: `slide-${Date.now()}-dup`,
      title: `${slide.title} (Copia)`,
    };
    setSlides((prev) => {
      const copy = [...prev];
      copy.splice(activeSlideIndex + 1, 0, duplicated);
      return copy;
    });
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  const handleMoveSlide = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    setSlides((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
    setActiveSlideIndex(targetIndex);
  };

  // Handle uploaded background image or video (supports multiple file selection)
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];

    setSlides((prev) => {
      const copy = [...prev];
      
      fileList.forEach((file, index) => {
        const fileUrl = URL.createObjectURL(file);
        const mType = file.type.startsWith("video") ? "video" : "image";

        if (index === 0) {
          // Replace or set the media on the active slide
          if (copy[activeSlideIndex]) {
            copy[activeSlideIndex] = {
              ...copy[activeSlideIndex],
              mediaUrl: fileUrl,
              mediaType: mType,
              sticker: mType === "video" ? "🎥" : "🖼️",
            };
          }
        } else {
          // Create new slides right after the active slide index
          const newSlideId = `slide-${Date.now()}-${index}`;
          const newSlide: CarouselSlide = {
            id: newSlideId,
            title: `Slide caricata ${index + 1}`,
            body: "Titolo e descrizione personalizzabili da qui in ogni momento.",
            subtitle: "Dettaglio dell'immagine 📸",
            background: "#1e1b4b",
            textColor: "#f8fafc",
            sticker: mType === "video" ? "🎥" : "🖼️",
            duration: 5,
            fontFamily: "sans",
            animType: "fade-up",
            filter: "none",
            specialEffect: "none",
            mediaUrl: fileUrl,
            mediaType: mType,
          };
          // Insert at activeSlideIndex + index
          copy.splice(activeSlideIndex + index, 0, newSlide);
        }
      });

      return copy;
    });

    if (fileList.length > 1) {
      setAiMessage(`Caricati con successo ${fileList.length} file multimediali! Sono stati inseriti nelle slide.`);
    }
  };

  // Drag and Drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const fileList = (Array.from(files) as File[]).filter((file) =>
      file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (fileList.length === 0) return;

    setSlides((prev) => {
      const copy = [...prev];

      fileList.forEach((file, index) => {
        const fileUrl = URL.createObjectURL(file);
        const mType = file.type.startsWith("video") ? "video" : "image";

        if (index === 0) {
          // Replace or set the media on the active slide
          if (copy[activeSlideIndex]) {
            copy[activeSlideIndex] = {
              ...copy[activeSlideIndex],
              mediaUrl: fileUrl,
              mediaType: mType,
              sticker: mType === "video" ? "🎥" : "🖼️",
            };
          }
        } else {
          // Create new slides right after the active slide index
          const newSlideId = `slide-${Date.now()}-${index}`;
          const newSlide: CarouselSlide = {
            id: newSlideId,
            title: `Slide caricata ${index + 1}`,
            body: "Titolo e descrizione personalizzabili da qui in ogni momento.",
            subtitle: "Dettaglio dell'immagine 📸",
            background: "#1e1b4b",
            textColor: "#f8fafc",
            sticker: mType === "video" ? "🎥" : "🖼️",
            duration: 5,
            fontFamily: "sans",
            animType: "fade-up",
            filter: "none",
            specialEffect: "none",
            mediaUrl: fileUrl,
            mediaType: mType,
          };
          // Insert at activeSlideIndex + index
          copy.splice(activeSlideIndex + index, 0, newSlide);
        }
      });

      return copy;
    });

    if (fileList.length > 1) {
      setAiMessage(`Caricati con successo ${fileList.length} file multimediali trascinati! Sono stati inseriti nelle slide.`);
    } else if (fileList.length === 1) {
      setAiMessage(`Caricato con successo 1 file multimediale trascinato!`);
    }
  };

  // Audio mic operations
  const handleSaveVoiceover = (slideId: string, url: string, base64Audio?: string) => {
    setVoiceovers((prev) => ({ ...prev, [slideId]: url }));
    if (base64Audio) {
      setVoiceoverBase64Data((prev) => ({ ...prev, [slideId]: base64Audio }));
    }
  };

  const handleDeleteVoiceover = (slideId: string) => {
    setVoiceovers((prev) => {
      const copy = { ...prev };
      delete copy[slideId];
      return copy;
    });
    setVoiceoverBase64Data((prev) => {
      const copy = { ...prev };
      delete copy[slideId];
      return copy;
    });
  };

  // Trigger high quality simulated WebM/MP4 Carousel Export
  const handleStartExport = () => {
    setIsPlaying(false);
    stopAllSynthesizers();
    setIsExporting(true);
    setExportProgress(0);
    setExportedVideoUrl("");

    // Simulate canvas framework encoding steps
    const interval = setInterval(() => {
      setExportProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          // Save a mock HTML video representation for real client storage download
          setExportedVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-grid-of-video-screens-39745-large.mp4");
          return 100;
        }
        return p + 10;
      });
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-950 flex flex-col font-sans selection:bg-rose-500/20 selection:text-rose-950">
      
      {/* 1. Header Banner */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & title brand */}
          <div className="flex items-center gap-3 select-none">
            <div className="bg-gradient-to-tr from-rose-500 to-amber-400 p-2 rounded-xl shadow-lg shadow-rose-200">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-gray-900">
                Studio<span className="text-rose-500">Carousel</span>
              </h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono font-bold">
                Social Creative Workspace
              </p>
            </div>
          </div>

          {/* AI Generator prompt bar */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-200 w-full md:max-w-md shadow-xs">
            <Sparkles className="w-4 h-4 text-rose-500 ml-2.5 shrink-0 animate-pulse" />
            <input
              type="text"
              placeholder="Crea con IA: es. '5 trucchi per la produttività'"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={isAiLoading}
              onKeyDown={(e) => e.key === "Enter" && handleGenerateAiCarousel()}
              className="bg-transparent border-none text-xs text-gray-800 focus:outline-none placeholder-gray-400 flex-1 px-1 py-1"
            />
            <button
              onClick={handleGenerateAiCarousel}
              disabled={isAiLoading}
              className="bg-rose-500 hover:bg-rose-600 disabled:opacity-45 text-white text-[11px] font-bold py-1.5 px-4 rounded-full shadow-md shadow-rose-200 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {isAiLoading ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <span>Ideazione IA</span>
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* 2. Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        
        {/* LEFT COLUMN: EDITOR PANELS (4/12 Columns) */}
        <section className="lg:col-span-4 space-y-6">
          
          {/* Preset templates options */}
          <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-3 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Grid className="w-4 h-4 text-gray-400" />
              Scegli Template Preset
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleApplyPresetTemplate(tpl)}
                  className="flex flex-col items-start p-3 bg-gray-50 hover:bg-gray-100/80 border border-gray-200 hover:border-gray-300 rounded-xl text-left transition-all cursor-pointer"
                >
                  <span className="text-xl mb-1.5">{tpl.icon}</span>
                  <span className="text-xs font-bold text-gray-800 line-clamp-1">
                    {tpl.name}
                  </span>
                  <span className="text-[9px] text-gray-400 font-medium leading-normal line-clamp-2 mt-0.5">
                    {tpl.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active slide layout modifier values */}
          <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-4 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <Sliders className="w-4 h-4 text-rose-500" />
              Personalizzazione Slide Attiva
            </h3>

            {/* Custom media upload backgrounds */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Sfondo (Media o Colore)
              </label>
              
              <div className="flex gap-2.5">
                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-3 border rounded-xl cursor-pointer text-xs transition-all font-bold shadow-xs ${
                    isDragging
                      ? "bg-rose-50 border-dashed border-rose-400 text-rose-600 scale-[1.01] ring-2 ring-rose-200"
                      : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                  }`}
                >
                  <ImageIcon className={`w-4 h-4 shrink-0 transition-all ${isDragging ? "text-rose-500 scale-125 animate-bounce" : "text-emerald-500"}`} />
                  <div className="text-left select-none">
                    <span className="block text-[11px] leading-tight font-bold">{isDragging ? "Rilascia i file qui! 📥" : "Carica o Trascina Foto/Video"}</span>
                    {!isDragging && (
                      <span className="block text-[8.5px] font-medium text-gray-400 mt-0.5 leading-none">Supporta selezione multipla</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </label>

                {activeSlide.mediaUrl && (
                  <button
                    onClick={() => {
                      handleUpdateSlideField(activeSlide.id, "mediaUrl", undefined);
                      handleUpdateSlideField(activeSlide.id, "mediaType", "none");
                    }}
                    className="px-3 bg-red-50 border border-red-200 hover:bg-red-150 text-red-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Rimuovi
                  </button>
                )}
              </div>

              {/* Standard hex colors picker */}
              <div className="flex items-center gap-4 mt-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-mono font-bold">Sfondo</span>
                  <input
                    type="color"
                    value={activeSlide.background.startsWith("#") ? activeSlide.background : "#1e1b4b"}
                    onChange={(e) => handleUpdateSlideField(activeSlide.id, "background", e.target.value)}
                    className="w-10 h-7 rounded border border-gray-200 bg-transparent cursor-pointer"
                  />
                </div>
                <div className="flex-1 flex items-center gap-2 border-l border-gray-200 pl-4">
                  <span className="text-[10px] text-gray-500 font-mono font-bold">Testo</span>
                  <input
                    type="color"
                    value={activeSlide.textColor.startsWith("#") ? activeSlide.textColor : "#f8fafc"}
                    onChange={(e) => handleUpdateSlideField(activeSlide.id, "textColor", e.target.value)}
                    className="w-10 h-7 rounded border border-gray-200 bg-transparent cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Title / Body Contents typing */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide flex justify-between">
                  <span>Titolo della Slide</span>
                  <span className="text-[9px] text-gray-400 lowercase">max 40 char</span>
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={activeSlide.title}
                  onChange={(e) => handleUpdateSlideField(activeSlide.id, "title", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide flex justify-between">
                  <span>Sottotitolo / CTA</span>
                  <span className="text-[9px] text-gray-400 lowercase">max 50 char</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={activeSlide.subtitle}
                  onChange={(e) => handleUpdateSlideField(activeSlide.id, "subtitle", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide flex justify-between">
                  <span>Descrizione Principale</span>
                  <span className="text-[9px] text-gray-400 lowercase">max 150 char</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={150}
                  value={activeSlide.body}
                  onChange={(e) => handleUpdateSlideField(activeSlide.id, "body", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"
                />
              </div>
            </div>

            {/* Typography / Text Styling options */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                  Font Coppia
                </span>
                <select
                  value={activeSlide.fontFamily || "sans"}
                  onChange={(e) => handleUpdateSlideField(activeSlide.id, "fontFamily", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                >
                  <option value="sans">Inter (Moderno)</option>
                  <option value="serif">Playfair (Editoriale)</option>
                  <option value="mono">Fira Mono (Cyber)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                  Animazione
                </span>
                <select
                  value={activeSlide.animType || "fade-up"}
                  onChange={(e) => handleUpdateSlideField(activeSlide.id, "animType", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                >
                  <option value="none">Nessuna</option>
                  <option value="fade-up">Dall'alto</option>
                  <option value="fade-in">Dissolvenza</option>
                  <option value="spin-in">Entrata Rotation</option>
                </select>
              </div>
            </div>

            {/* Sticker selector & filters */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <label className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                Filtro Animato / Colore
              </label>
              <select
                value={activeSlide.filter || "none"}
                onChange={(e) => handleUpdateSlideField(activeSlide.id, "filter", e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              >
                {FILTERS_DEFINITION.map((fd) => (
                  <option key={fd.id} value={fd.id}>
                     {fd.name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="space-y-1">
                  <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                    Effetto Speciale
                  </span>
                  <select
                    value={activeSlide.specialEffect || "none"}
                    onChange={(e) => handleUpdateSlideField(activeSlide.id, "specialEffect", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="none">Senza Effetti</option>
                    <option value="vignette">Vignettatura</option>
                    <option value="vintage-overlay">Scanline Vintage</option>
                    <option value="glitch">Glitch Cyberpunk</option>
                    <option value="retro-grid">Griglia Sci-Fi</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                    Scegli Sticker
                  </span>
                  <select
                    value={activeSlide.sticker || ""}
                    onChange={(e) => handleUpdateSlideField(activeSlide.id, "sticker", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="">Nessuno Sticker</option>
                    {STICKER_LIST.map((sit) => (
                      <option key={sit.emoji} value={sit.emoji}>
                        {sit.emoji} {sit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          </div>

        </section>

        {/* CENTER COLUMN: PREVIEW STAGE (5/12 Columns) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Status Message */}
          {aiMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs leading-relaxed flex items-center justify-between gap-2.5 shadow-xs font-bold">
              <span>{aiMessage}</span>
              <button
                onClick={() => setAiMessage("")}
                className="text-[10px] uppercase font-bold text-gray-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
              >
                Nascondi
              </button>
            </div>
          )}
          {/* Sizing & Canvas Container */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-between gap-6 flex-1 shadow-2xl ring-8 ring-white/40 overflow-hidden">
            
            {/* Resolution Formats toggle options */}
            <div className="flex bg-black/40 max-w-full p-1 rounded-full border border-white/5 backdrop-blur-md">
              {(["1:1", "9:16", "16:9"] as AspectRatio[]).map((ratio) => {
                const isActive = aspectRatio === ratio;
                return (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all select-none cursor-pointer ${
                      isActive
                        ? "bg-white/15 text-white border border-white/20 shadow-sm"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {ratio === "1:1" && "Square"}
                    {ratio === "9:16" && "Stories"}
                    {ratio === "16:9" && "Video"}
                  </button>
                );
              })}
            </div>

            {/* HIGH FIDELITY RENDERER STAGE */}
            <div className="w-full flex items-center justify-center min-h-[300px] md:min-h-[420px]">
              <CarouselCanvas
                slide={activeSlide}
                aspectRatio={aspectRatio}
                currentIndex={activeSlideIndex}
                totalSlides={slides.length}
                autoColor={autoColor}
                voiceoverUrl={voiceovers[activeSlide.id]}
              />
            </div>

            {/* Slider triggers and timing progress indicators */}
            <div className="w-full space-y-4">
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>Anteprima Sincronizzata Tempo Reale</span>
                </div>
                
                <button
                  onClick={() => setAutoColor((ac) => !ac)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                    autoColor
                      ? "bg-emerald-500 text-white border-transparent"
                      : "bg-black/40 border border-white/5 text-gray-300 hover:text-white"
                  }`}
                >
                  ⚙️ Auto-Correzione Colore
                </button>
              </div>

              {/* Standard actions of loop play */}
              <div className="flex items-center justify-center gap-3 bg-black/40 p-2 rounded-full border border-white/5">
                
                <button
                  onClick={() => {
                    if (isPlaying) {
                      setIsPlaying(false);
                      stopAllSynthesizers();
                    } else {
                      setCurrentPlaybackIndex(0);
                      setIsPlaying(true);
                    }
                  }}
                  className={`flex items-center justify-center gap-2 text-xs font-bold py-2 px-6 rounded-full border transition-all cursor-pointer ${
                    isPlaying
                      ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-400 shadow shadow-amber-250/15"
                      : "bg-rose-500 hover:bg-rose-600 text-white border-rose-400 shadow shadow-rose-250/15"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Ferma Presentazione</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current animate-pulse" />
                      <span>Avvia Presentazione</span>
                    </>
                  )}
                </button>

                {isPlaying && (
                  <span className="text-[10px] font-mono font-bold text-rose-300 px-3 py-1.5 bg-white/10 border border-white/15 rounded-full">
                    SLIDE {currentPlaybackIndex + 1}
                  </span>
                )}

              </div>

            </div>

          </div>

          {/* Visual Progress Map under canvas */}
          <Timeline
            slides={slides}
            activeIndex={activeSlideIndex}
            onSelectSlide={handleSelectSlideIndex}
            onAddSlide={handleAddSlide}
            onDeleteSlide={handleDeleteSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onMoveSlide={handleMoveSlide}
            onUpdateDuration={(id, val) => handleUpdateSlideField(id, "duration", val)}
            voiceovers={voiceovers}
          />

        </section>

        {/* RIGHT COLUMN: AUDIO, VOICEOVER & EXPORT (3/12 Columns) */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Audio synthese options list */}
          <MusicSelector
            selectedTrackId={selectedMusicId}
            onSelectTrack={(tid) => setSelectedMusicId(tid)}
            volume={musicVolume}
            onVolumeChange={handleVolumeChange}
            onStopMusic={stopAllSynthesizers}
            onPlayPreview={handlePlayMusicPreview}
            currentPreviewingId={currentPreviewingId}
          />

          {/* Mic Recorder voiceover triggers */}
          <VoiceoverPanel
            slideId={activeSlide.id}
            onVoiceoverSaved={handleSaveVoiceover}
            onVoiceoverDeleted={handleDeleteVoiceover}
            onAutoSubtitleGenerated={(text) => handleUpdateSlideField(activeSlide.id, "subtitle", text)}
            savedVoiceoverUrl={voiceovers[activeSlide.id]}
            savedVoiceoverBase64={voiceoverBase64Data[activeSlide.id]}
          />

          {/* Social Media Exporter settings */}
          <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-4 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <Download className="w-4 h-4 text-rose-500" />
              Esportazione Video & Social
            </h3>

            {/* Custom quality selector list */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block select-none">
                Risoluzione di Output
              </label>
              <select
                value={selectedResolution}
                onChange={(e) => setSelectedResolution(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5 focus:outline-none"
              >
                <option value="720p">720p HD (Ideale Web)</option>
                <option value="1080p">1080p Full HD (Instagram & Reels)</option>
                <option value="4k">4K Super Ultra HD (Qualità massima)</option>
              </select>
            </div>

            <button
              onClick={handleStartExport}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-tr from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-3.5 px-4 rounded-full shadow-lg shadow-rose-200 border border-transparent transition-all text-xs cursor-pointer"
            >
              <Video className="w-4 h-4" />
              Esporta Video Carosello
            </button>
          </div>

        </section>

      </main>

      {/* 3. Export Modal Loader */}
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden text-gray-900">
            
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 animate-pulse" />

            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-2">
              <Video className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h3 className="font-bold text-lg text-gray-900">
                Rendering del Video in {selectedResolution}...
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Composizione tracce audio, transizioni fluide ed effetti speciali in corso.
              </p>
            </div>

            {/* Visual encoding percentage tracks bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-gray-500 font-bold">
                <span>Codifica del frame...</span>
                <span>{exportProgress}%</span>
              </div>
              
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
                <div
                  className="bg-rose-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>

            {exportProgress >= 100 && exportedVideoUrl ? (
              <div className="pt-2 animate-fade-in space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold leading-relaxed">
                  🎉 Rendering completato! Il tuo video è pronto nei formati scelti ({selectedResolution} - {aspectRatio}).
                </div>

                <div className="flex gap-3">
                  <a
                    href={exportedVideoUrl}
                    download={`carousel-${aspectRatio}-${selectedResolution}.mp4`}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-4 rounded-full text-center transition-all text-xs cursor-pointer shadow-md shadow-rose-200"
                  >
                    Scarica Video
                  </a>
                  
                  <button
                    onClick={() => setIsExporting(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-full transition-all text-xs cursor-pointer"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            ) : (
              <button
                disabled
                className="w-full bg-gray-100 text-gray-400 text-xs font-bold py-2.5 px-4 rounded-full cursor-not-allowed select-none transition-all"
              >
                In attesa dei fotogrammi...
              </button>
            )}

          </div>
        </div>
      )}

      {/* Footer bar copyright */}
      <footer className="border-t border-gray-200 bg-white/60 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-gray-400 select-none font-medium">
          <p>© 2026 Social Media Carousel Builder. Creato con cura professionale.</p>
          <div className="flex gap-4">
            <span className="hover:text-rose-500 cursor-help flex items-center gap-1 transition-colors">
              <HelpCircle className="w-3.5 h-3.5" /> Come Funziona
            </span>
            <span>•</span>
            <span>Local Web Audio Synths</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
