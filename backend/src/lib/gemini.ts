import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  if (!env.GEMINI_API_KEY) return null;
  if (!client) {
    client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return client;
}

export function isGeminiConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

export async function generateText(prompt: string): Promise<string | null> {
  const genai = getClient();
  if (!genai) return null;

  try {
    const model = genai.getGenerativeModel({ model: env.GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text()?.trim();
    return text || null;
  } catch {
    return null;
  }
}

export async function generateJson<T>(prompt: string): Promise<T | null> {
  const text = await generateText(prompt);
  if (!text) return null;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}
