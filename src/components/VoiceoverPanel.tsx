import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Loader, Sparkles, Volume2, CheckCircle2 } from "lucide-react";

interface VoiceoverPanelProps {
  slideId: string;
  onVoiceoverSaved: (slideId: string, url: string, base64Audio?: string) => void;
  onVoiceoverDeleted: (slideId: string) => void;
  onAutoSubtitleGenerated: (text: string) => void;
  savedVoiceoverUrl?: string;
  savedVoiceoverBase64?: string;
}

export const VoiceoverPanel: React.FC<VoiceoverPanelProps> = ({
  slideId,
  onVoiceoverSaved,
  onVoiceoverDeleted,
  onAutoSubtitleGenerated,
  savedVoiceoverUrl,
  savedVoiceoverBase64,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startVoiceRecording = async () => {
    try {
      setTranscriptionError("");
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Convert to base64 for AI transcription
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Extract pure base64 content
          const base64str = base64data.split(",")[1];
          onVoiceoverSaved(slideId, audioUrl, base64str);
        };

        // Stop all track streams
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200); // chunk size
      setIsRecording(true);
    } catch (err: any) {
      console.error(err);
      setTranscriptionError("Impossibile accedere al microfono. Verifica i permessi browser.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Convert custom voiceover back to subtitles using Gemini API
  const handleGenerateAISubtitle = async () => {
    if (!savedVoiceoverBase64) return;
    setIsTranscribing(true);
    setTranscriptionError("");

    try {
      const res = await fetch("/api/gemini/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio: savedVoiceoverBase64,
          mimeType: "audio/webm",
        }),
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      onAutoSubtitleGenerated(data.text);
    } catch (err: any) {
      console.error(err);
      setTranscriptionError("Errore nella trascrizione della voce fuori campo.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Mic className="w-5 h-5 text-rose-500" />
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
          Registra Voce Fuori Campo
        </h3>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed font-medium">
        Registra la tua voce per questa singola slide. Sarà riprodotta in sincronia durate la riproduzione o nell'esportazione finale del carosello.
      </p>

      {/* Control Actions states */}
      <div className="flex flex-col gap-3">
        {isRecording ? (
          <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span className="text-xs font-bold text-rose-600">Registrazione in corso...</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-rose-700">{formatTimer(recordDuration)}</span>
              <button
                onClick={stopVoiceRecording}
                className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-full transition-all flex items-center justify-center shadow-lg shadow-rose-200 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white text-white" />
              </button>
            </div>
          </div>
        ) : savedVoiceoverUrl ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-700 font-bold select-none">Doppiaggio salvato</span>
              </div>
              <div className="flex items-center gap-2">
                <audio src={savedVoiceoverUrl} controls className="h-6 w-36 mt-0.5" />
                <button
                  onClick={() => onVoiceoverDeleted(slideId)}
                  className="bg-transparent hover:bg-red-50 text-gray-400 hover:text-red-500 p-2 rounded-lg transition-all border border-transparent hover:border-gray-200 cursor-pointer"
                  title="Elimina voce fuori campo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AI Auto-transcribe subtitle builder */}
            <button
              onClick={handleGenerateAISubtitle}
              disabled={isTranscribing}
              className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-55 text-white text-xs font-bold py-3 rounded-full transition-all shadow-lg shadow-rose-200 cursor-pointer"
            >
              {isTranscribing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Plancia IA in ascolto...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300 fill-current" />
                  Auto-Sottotitoli con IA
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={startVoiceRecording}
            className="w-full h-11 flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 hover:bg-gray-100/90 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4 text-rose-500" />
            Inizia Registrazione Mic
          </button>
        )}

        {transcriptionError && (
          <p className="text-[11px] text-red-600 font-bold select-none border border-red-200 bg-red-50 px-2.5 py-1.5 rounded-lg">
            ⚠️ {transcriptionError}
          </p>
        )}
      </div>
    </div>
  );
};
