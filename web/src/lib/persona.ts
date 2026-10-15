export type VoicePreset = "calm" | "deep" | "bright" | "energetic" | "robotic";

export const VOICE_PRESETS: Record<VoicePreset, { label: string; pitch: number; rate: number }> = {
  calm: { label: "Calm", pitch: 1, rate: 0.9 },
  deep: { label: "Deep", pitch: 0.6, rate: 0.9 },
  bright: { label: "Bright", pitch: 1.4, rate: 1.05 },
  energetic: { label: "Energetic", pitch: 1.2, rate: 1.25 },
  robotic: { label: "Robotic", pitch: 0.1, rate: 0.95 },
};

export type PersonaMetadata = {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
  persona: {
    personality: string;
    voice: VoicePreset;
  };
};

export function avatarImageUrl(prompt: string, seed: number) {
  const full = `portrait avatar of ${prompt}, centered, vibrant, digital art, clean background`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=512&height=512&seed=${seed}&nologo=true`;
}

// Unicode-safe base64 so names/bios with emoji or accents survive.
function toBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function fromBase64(b64: string) {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const DATA_PREFIX = "data:application/json;base64,";

export function encodeMetadata(meta: PersonaMetadata) {
  return DATA_PREFIX + toBase64(JSON.stringify(meta));
}

export function decodeMetadata(uri: string): PersonaMetadata | null {
  try {
    if (!uri.startsWith(DATA_PREFIX)) return null;
    return JSON.parse(fromBase64(uri.slice(DATA_PREFIX.length)));
  } catch {
    return null;
  }
}

export function speak(text: string, preset: VoicePreset) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const { pitch, rate } = VOICE_PRESETS[preset] ?? VOICE_PRESETS.calm;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = pitch;
  utterance.rate = rate;
  const english = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("en"));
  if (english) utterance.voice = english;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
