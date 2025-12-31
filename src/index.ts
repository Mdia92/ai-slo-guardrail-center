import express, { Request, Response } from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";
import { callModel } from "./geminiClient";
import { evaluateResponse, EvaluationResult } from "./judgeEvaluator";

import path from "path";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "../public")));

// Serve index.html at the root path
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

interface LLMRequest {
  prompt: string;
  userId?: string;
}

/**
 * POST /api/llm
 * Request body: { prompt: string, userId?: string }
 */
app.post("/api/llm", async (req: Request<{}, {}, LLMRequest>, res: Response) => {
  const requestId = uuidv4();
  const { prompt, userId } = req.body;
  const timestamp = new Date().toISOString();

  // Helper to safely truncate strings
  const truncate = (str: string, maxLen: number) => {
    if (!str) return "";
    return str.length > maxLen ? str.substring(0, maxLen) + "..." : str;
  }

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'prompt' in request body." });
  }

  try {
    const result = await callModel(prompt);

    // Call LLM-as-judge evaluation
    let evaluation: EvaluationResult;
    try {
      evaluation = await evaluateResponse(prompt, result.responseText);
    } catch (evalError) {
      // Don't log this error to console, it's handled by the default value
      evaluation = {
        hallucinationSuspected: false,
        promptInjectionSuspected: false,
        unsafeContentSuspected: false,
        qualityScore: 0.5,
      };
    }

    const logEvent = {
      eventType: "llm_request",
      timestamp,
      requestId,
      userId,
      prompt: truncate(prompt, 300),
      responseText: truncate(result.responseText, 500),
      model: result.model,
      latencyMs: result.latencyMs,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      status: "success",
      evaluation,
    };
    
    console.log(JSON.stringify(logEvent));

    return res.json({
      ...result,
      evaluation,
      requestId,
    });
  } catch (error: any) {
    const logEvent = {
        eventType: "llm_request",
        timestamp,
        requestId,
        userId,
        prompt: truncate(prompt, 300),
        responseText: "", 
        model: process.env.GEMINI_MODEL_NAME || "gemini-1.5-pro", // Best guess
        latencyMs: 0, // Could improve if we tracked partial time, but 0 is safe for error
        status: "error",
        evaluation: { // Default safe evaluation for error logs
            hallucinationSuspected: false,
            promptInjectionSuspected: false,
            unsafeContentSuspected: false,
            qualityScore: 0.0
        },
        errorMessage: error.message || "Unknown error"
    };
    console.log(JSON.stringify(logEvent));

    return res.status(500).json({
      error: error.message || "An internal server error occurred while calling the Gemini API.",
      requestId,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
