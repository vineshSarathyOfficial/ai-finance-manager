import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiClient(customApiKey?: string) {
  const apiKey =
    customApiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new GoogleGenerativeAI(apiKey);
}

export function getGeminiModel(customApiKey?: string) {
  const client = getGeminiClient(customApiKey);
  if (!client) return null;

  // Uses the fast, highly capable Gemini 2.5 Flash model
  try {
    return client.getGenerativeModel({ model: "gemini-2.5-flash" });
  } catch {
    return client.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
}
