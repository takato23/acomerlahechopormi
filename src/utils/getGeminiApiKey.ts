// src/utils/getGeminiApiKey.ts
export function getGeminiApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY;
}
