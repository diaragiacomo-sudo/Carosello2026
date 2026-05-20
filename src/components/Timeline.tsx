import React from "react";
import { CarouselSlide } from "../types";
import { Plus, Trash2, ArrowLeft, ArrowRight, Copy, Clock, Music, Sparkles } from "lucide-react";

interface TimelineProps {
  slides: CarouselSlide[];
  activeIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDeleteSlide: (id: string) => void;
  onDuplicateSlide: (slide: CarouselSlide) => void;
  onMoveSlide: (index: number, direction: "left" | "right") => void;
  onUpdateDuration: (id: string, secs: number) => void;
  voiceovers: Record<string, string>;
}

export const Timeline: React.FC<TimelineProps> = ({
  slides,
  activeIndex,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onMoveSlide,
  onUpdateDuration,
  voiceovers,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-2">
            Timeline dei Social Post
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
            Trascina o ordina le slide. Totale: {slides.reduce((sum, s) => sum + s.duration, 0)}s secondi
          </p>
        </div>
        
        <button
          onClick={onAddSlide}
          className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2 px-4 rounded-full shadow-lg shadow-rose-200 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Aggiungi Slide
        </button>
      </div>

      {/* Horizontal List of Slides */}
      <div className="flex items-stretch gap-4 overflow-x-auto pb-3 pr-1 pt-1 scrollbar-thin">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          const hasVoice = !!voiceovers[slide.id];
          const hasEffect = slide.specialEffect && slide.specialEffect !== "none";

          return (
            <div
              key={slide.id}
              className={`shrink-0 flex flex-col justify-between w-36 rounded-xl border p-3 select-none transition-all group relative ${
                isActive
                  ? "bg-rose-50/50 border-rose-500 ring-2 ring-rose-500/20"
                  : "bg-gray-50 border-gray-200/85 hover:border-gray-300"
              }`}
            >
              {/* Top Details & index */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-bold text-gray-400">
                  SLIDE {index + 1}
                </span>

                <div className="flex items-center gap-1">
                  {hasVoice && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Audio vocale" />
                  )}
                  {hasEffect && (
                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" title="Effetto speciale" />
                  )}
                </div>
              </div>

              {/* Thumbnail Representation content */}
              <div 
                onClick={() => onSelectSlide(index)}
                className="cursor-pointer flex-1 flex flex-col justify-center min-h-[50px] mb-3 text-center rounded bg-white p-1.5 border border-gray-100 shadow-xs"
              >
                <div className="text-[18px] mb-1 leading-none">{slide.sticker || "📄"}</div>
                <div className="text-[10px] text-gray-700 font-bold line-clamp-1 px-1">
                  {slide.title || "Senza titolo"}
                </div>
              </div>

              {/* Sizer adjust timer */}
              <div className="flex items-center justify-between mt-auto bg-white p-1 py-1 px-1.5 rounded border border-gray-200">
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3 h-3 shrink-0" />
                  <input
                    type="number"
                    min="2"
                    max="15"
                    value={slide.duration}
                    onChange={(e) => onUpdateDuration(slide.id, parseInt(e.target.value) || 5)}
                    className="w-8 text-[11px] font-mono font-bold bg-transparent border-none text-gray-800 focus:outline-none p-0 text-center"
                  />
                  <span className="text-[9px] text-gray-400 font-semibold select-none">s</span>
                </div>

                <button
                  onClick={() => onDuplicateSlide(slide)}
                  title="Duplica"
                  className="p-1 hover:bg-gray-100 text-gray-400 hover:text-rose-500 rounded transition-all"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>

              {/* Action Floating Buttons */}
              <div className="absolute -top-1.5 -right-1.5 flex gap-1 transform scale-0 group-hover:scale-100 transition-transform duration-200">
                <button
                  onClick={() => onDeleteSlide(slide.id)}
                  title="Elimina"
                  className="bg-red-500 hover:bg-red-650 text-white p-1 rounded-full border border-red-100 shadow shadow-red-550/10 cursor-pointer"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Direction Badges on bottom */}
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-200 gap-2">
                <button
                  onClick={() => onMoveSlide(index, "left")}
                  disabled={index === 0}
                  className="flex-1 py-1 bg-white hover:bg-gray-100 disabled:opacity-35 text-gray-500 rounded border border-gray-150 transition-all flex justify-center"
                  title="Sposta a sinistra"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onMoveSlide(index, "right")}
                  disabled={index === slides.length - 1}
                  className="flex-1 py-1 bg-white hover:bg-gray-100 disabled:opacity-35 text-gray-500 rounded border border-gray-150 transition-all flex justify-center"
                  title="Sposta a destra"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
