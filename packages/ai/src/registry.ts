import { experimental_createProviderRegistry as createProviderRegistry } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createOllama } from "ollama-ai-provider";

declare const process: { env: Record<string, string | undefined> };
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/api";

export const registry = createProviderRegistry({
  ollama: createOllama({ baseURL: ollamaBaseUrl }),
  google,
  anthropic,
});

export const models = {
  parse: "ollama:gemma3:27b",
  tailor: "google:gemini-2.5-flash",
  compose: "google:gemini-2.5-flash",
  review: "anthropic:claude-sonnet-4-20250514",
  answer: "anthropic:claude-sonnet-4-20250514",
} as const;
