import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";
const modelName = process.env.GEMINI_MODEL_NAME || "gemini-1.5-pro";

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export interface GeminiResponse {
  responseText: string;
  model: string;
  latencyMs: number;
  tokensIn?: number;
  tokensOut?: number;
}

/**
 * Calls the Gemini model with a prompt and returns the response with metadata.
 */
export async function callModel(prompt: string): Promise<GeminiResponse> {
  const model = genAI.getGenerativeModel({ model: modelName });
  
  const start = Date.now();
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  const end = Date.now();
  const latencyMs = end - start;
  
  const responseText = response.text();
  
  // Extract token usage if available
  const tokensIn = response.usageMetadata?.promptTokenCount;
  const tokensOut = response.usageMetadata?.candidatesTokenCount;

  return {
    responseText,
    model: modelName,
    latencyMs,
    tokensIn,
    tokensOut,
  };
}
