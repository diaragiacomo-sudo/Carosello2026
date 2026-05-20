import React from "react";
import { MusicTrack } from "../types";
import { MUSIC_LIBRARY } from "../data";
import { Music, Play, Square, Volume2 } from "lucide-react";

interface MusicSelectorProps {
  selectedTrackId: string;
  onSelectTrack: (trackId: string) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onStopMusic: () => void;
  onPlayPreview: (track: MusicTrack) => void;
  currentPreviewingId: string;
}

export const MusicSelector: React.FC<MusicSelectorProps> = ({
  selectedTrackId,
  onSelectTrack,
  volume,
  onVolumeChange,
  onStopMusic,
  onPlayPreview,
  currentPreviewingId,
}) => {
  return (
    <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
            Libreria Musicale Interna
          </h3>
        </div>
        
        {currentPreviewingId !== "none" && (
          <button
            onClick={onStopMusic}
            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2.5 py-1.5 rounded-full border border-red-200 transition-all font-bold cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
            Spegni Audio
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 leading-relaxed font-medium">
        Scegli una traccia d'atmosfera generata live dagli oscillatori Web Audio. Nessun copyright o problema di caricamento esterno!
      </p>

      {/* Track Grid list */}
      <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
        {MUSIC_LIBRARY.map((track) => {
          const isSelected = selectedTrackId === track.id;
          const isPreviewing = currentPreviewingId === track.id;

          return (
            <div
              key={track.id}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all group ${
                isSelected
                  ? "bg-indigo-50/80 border-indigo-400"
                  : "bg-gray-50 border-gray-155 hover:border-gray-305"
              }`}
            >
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onSelectTrack(track.id)}
              >
                <div className={`font-bold text-xs transition-colors ${
                  isSelected ? "text-indigo-950" : "text-gray-800 group-hover:text-indigo-600"
                }`}>
                  {track.title}
                </div>
                <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                  {track.artist} • <span className="italic">{track.genre}</span>
                </div>
              </div>

              {/* Play buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPlayPreview(track)}
                  title={isPreviewing ? "Ferma anteprima" : "Ascolta anteprima"}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    isPreviewing
                      ? "bg-red-100 text-red-600 border border-red-200"
                      : "bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 shadow-xs"
                  }`}
                >
                  {isPreviewing ? (
                    <Square className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                </button>

                <button
                  onClick={() => onSelectTrack(isSelected ? "none" : track.id)}
                  className={`text-[10px] uppercase font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow shadow-indigo-100"
                      : "bg-white hover:bg-gray-100 border border-gray-200 text-gray-500"
                  }`}
                >
                  {isSelected ? "Attiva" : "Scegli"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Volume control */}
      <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
        <Volume2 className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 bg-gray-100 rounded-lg cursor-pointer h-1.5"
          />
        </div>
        <span className="text-[10px] font-mono font-bold text-gray-400 min-w-[20px] text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
};
