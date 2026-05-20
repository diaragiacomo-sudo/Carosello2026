import React, { useEffect, useRef } from "react";
import { CarouselSlide, AspectRatio } from "../types";
import { FILTERS_DEFINITION } from "../data";

interface CarouselCanvasProps {
  slide: CarouselSlide;
  aspectRatio: AspectRatio;
  currentIndex: number;
  totalSlides: number;
  autoColor: boolean;
  voiceoverUrl?: string;
  isExportStyle?: boolean;
}

export const CarouselCanvas: React.FC<CarouselCanvasProps> = ({
  slide,
  aspectRatio,
  currentIndex,
  totalSlides,
  autoColor,
  voiceoverUrl,
  isExportStyle = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play slide video if active
  useEffect(() => {
    if (videoRef.current && slide.mediaType === "video" && slide.mediaUrl) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Safe check for autoplay policies
      });
    }
  }, [slide.id, slide.mediaUrl]);

  // Determine aspect ratio class
  const getAspectClass = () => {
    switch (aspectRatio) {
      case "9:16":
        return "aspect-[9/16] w-full max-w-[340px] md:max-w-[380px]";
      case "16:9":
        return "aspect-[16/9] w-full max-w-[650px]";
      case "1:1":
      default:
        return "aspect-square w-full max-w-[420px]";
    }
  };

  // Build the filter string (Auto-Color + specific slide filter)
  const getFilterStyle = () => {
    let filterString = "";
    
    // Find custom filter definition
    if (slide.filter && slide.filter !== "none") {
      const found = FILTERS_DEFINITION.find((f) => f.id === slide.filter);
      if (found) filterString += found.style + " ";
    }
    
    // Auto Color Correction rules
    if (autoColor) {
      filterString += "contrast(1.18) saturate(1.22) brightness(1.04) ";
    }

    return filterString.trim() || undefined;
  };

  // Get font class
  const getFontFamilyClass = () => {
    switch (slide.fontFamily) {
      case "serif":
        return "font-serif tracking-tight";
      case "mono":
        return "font-mono tracking-wider uppercase";
      default:
        return "font-sans tracking-tight";
    }
  };

  // Animation classes
  const getAnimationClass = () => {
    switch (slide.animType) {
      case "fade-up":
        return "animate-bounce-subtle mt-4 translate-y-0 opacity-100 transition-all duration-700";
      case "fade-in":
        return "opacity-100 transition-opacity duration-1000";
      case "spin-in":
        return "rotate-0 scale-100 transition-all duration-500 hover:rotate-6";
      default:
        return "";
    }
  };

  return (
    <div
      id={`slide-canvas-${slide.id}`}
      className={`relative overflow-hidden rounded-2xl shadow-2xl flex flex-col justify-between p-8 md:p-12 border border-slate-800 transition-all duration-300 ${getAspectClass()}`}
      style={{
        backgroundColor: slide.mediaType === "none" || !slide.mediaUrl ? slide.background : "#000000",
        color: slide.textColor,
        filter: getFilterStyle(),
      }}
    >
      {/* Background Graphic Grid */}
      {slide.specialEffect === "retro-grid" && (
        <div className="absolute inset-0 retro-cyan-grid opacity-30 z-0 pointer-events-none" />
      )}

      {/* Uploaded Background Image or Video */}
      {slide.mediaUrl && slide.mediaType === "image" && (
        <img
          src={slide.mediaUrl}
          alt="Slide Background"
          className="absolute inset-x-0 inset-y-0 w-full h-full object-cover z-0 pointer-events-none"
          referrerPolicy="no-referrer"
        />
      )}

      {slide.mediaUrl && slide.mediaType === "video" && (
        <video
          ref={videoRef}
          src={slide.mediaUrl}
          muted
          loop
          playsInline
          className="absolute inset-x-0 inset-y-0 w-full h-full object-cover z-0 pointer-events-none"
        />
      )}

      {/* Special Effects Overlays */}
      {slide.specialEffect === "vintage-overlay" && (
        <div className="absolute inset-0 analog-scanlines z-10 pointer-events-none" />
      )}
      {slide.specialEffect === "vignette" && (
        <div className="absolute inset-x-0 inset-y-0 vignette-overlay z-10 pointer-events-none" />
      )}
      {slide.specialEffect === "glitch" && (
        <div className="absolute inset-0 bg-red-500/10 mix-blend-screen glitch-flash z-10 pointer-events-none" />
      )}

      {/* 1. Header Area: Social Handle & Slide Counter */}
      <div className="relative z-20 flex justify-between items-center w-full select-none">
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] md:text-xs font-mono tracking-wider uppercase opacity-90">
            @creator_studio
          </span>
        </div>
        
        {/* Dynamic Badge Counter */}
        <div className="bg-white/15 px-3 py-1 rounded-full text-[10px] md:text-xs font-mono select-none">
          {currentIndex + 1} / {totalSlides}
        </div>
      </div>

      {/* 2. Middle Content: Title, Body, Sticker */}
      <div className="relative z-20 flex flex-col justify-center items-center my-auto text-center w-full">
        {/* Responsive Emoji Sticker component with specific pulse animation */}
        {slide.sticker && (
          <div className="mb-4 text-5xl md:text-6xl select-none filter drop-shadow-lg transform active:scale-125 transition-transform duration-300">
            <span className="inline-block animate-pulse">{slide.sticker}</span>
          </div>
        )}

        {/* Slide Title */}
        <h2
          className={`${getFontFamilyClass()} font-bold text-2xl md:text-3xl lg:text-4xl leading-tight mb-4 select-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]`}
          style={{ color: slide.textColor }}
        >
          {slide.title}
        </h2>

        {/* Slide Body Description */}
        <p
          className={`${getFontFamilyClass()} text-sm md:text-base leading-relaxed max-w-sm md:max-w-md mx-auto opacity-95 mb-4 select-text drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]`}
          style={{ color: slide.textColor }}
        >
          {slide.body}
        </p>
      </div>

      {/* 3. Footer Area: Subtitles / Action Callouts */}
      <div className="relative z-20 w-full flex flex-col items-center">
        {/* Subtitle Bar segment */}
        {slide.subtitle && (
          <div className="bg-yellow-400/90 text-slate-950 font-bold px-4 py-2 text-xs md:text-sm text-center rounded-lg shadow-md max-w-[90%] select-none tracking-wide animate-pulse-subtle">
            {slide.subtitle}
          </div>
        )}

        {/* Voiceover active indicator */}
        {voiceoverUrl && (
          <div className="mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Doppiaggio attivo</span>
          </div>
        )}
      </div>
    </div>
  );
};
