export interface CarouselSlide {
  id: string;
  title: string;
  body: string;
  subtitle: string;
  background: string; // Hex color or CSS gradient
  textColor: string;   // Hex color for contrast
  sticker: string;     // Emoji or small sign symbol
  duration: number;    // seconds
  mediaUrl?: string;   // Custom uploaded background image/video
  mediaType?: "image" | "video" | "none";
  filter?: string;     // Color correction or aesthetic filters
  specialEffect?: "none" | "glitch" | "flash" | "vignette" | "vintage-overlay";
  textSize?: "sm" | "base" | "lg" | "xl";
  fontFamily?: "sans" | "serif" | "mono" | "dyslexic";
  animType?: "none" | "fade-up" | "fade-in" | "spin-in" | "bounce";
}

export type AspectRatio = "1:1" | "9:16" | "16:9";

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  url?: string;
  synthType?: "chill" | "techno" | "vintage" | "drum-loop"; // Used for local synthesized tracks to bypass CORS issues!
}

export interface PresetTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  themeClass: string;
  slides: Omit<CarouselSlide, "id">[];
}
