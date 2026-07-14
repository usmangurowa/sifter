import type { ModelMessage } from "ai";

/**
 * Re-export ModelMessage from AI SDK for convenience.
 * (In v6, CoreMessage was renamed to ModelMessage)
 */
export type { ModelMessage };

/**
 * Alias for AI SDK message type.
 */
export type AIMessage = ModelMessage;

/**
 * Available Groq chat model identifiers used by this repo.
 */
export type GroqModelId =
  | "openai/gpt-oss-20b"
  | "openai/gpt-oss-120b"
  | "llama-3.1-8b-instant"
  | "llama-3.3-70b-versatile"
  | "meta-llama/llama-4-scout-17b-16e-instruct"
  | "meta-llama/llama-4-maverick-17b-128e-instruct"
  | (string & {});

/**
 * Common options for text generation.
 */
export interface GenerateTextOptions {
  /** The prompt to generate text from. */
  prompt: string;
  /** Optional system message. */
  system?: string;
  /** Maximum number of tokens to generate. */
  maxTokens?: number;
  /** Temperature for response randomness (0-2). */
  temperature?: number;
}

/**
 * Common options for chat completion.
 */
export interface ChatOptions {
  /** Array of messages in the conversation. */
  messages: AIMessage[];
  /** Optional system message. */
  system?: string;
  /** Maximum number of tokens to generate. */
  maxTokens?: number;
  /** Temperature for response randomness (0-2). */
  temperature?: number;
}
