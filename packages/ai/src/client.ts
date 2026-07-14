import type { LanguageModel } from "ai";
import { createGroq } from "@ai-sdk/groq";

import type { GroqModelId } from "./types";

export type { GroqModelId };

export const DEFAULT_GROQ_MODEL_ID: GroqModelId = "openai/gpt-oss-20b";

/**
 * Groq provider instance.
 * Uses GROQ_API_KEY environment variable.
 */
export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Create a Groq chat model.
 */
export const createGroqModel = (
  modelId: GroqModelId = DEFAULT_GROQ_MODEL_ID,
): LanguageModel => groq(modelId);

/**
 * Groq fast structured-output model.
 * Used for latency-sensitive structured outputs.
 */
export const groqLlama: LanguageModel = createGroqModel();
