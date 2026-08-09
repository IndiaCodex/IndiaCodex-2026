import OpenAI from "openai";
import {
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  OPENAI_MODEL,
  OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL,
  OPENROUTER_MODEL,
} from "@/lib/constants";

let client: OpenAI | null = null;

export function getActiveBaseURL(): string {
  return OPENAI_BASE_URL || OPENROUTER_BASE_URL || "";
}

export function isOpenRouter(): boolean {
  return getActiveBaseURL().includes("openrouter.ai");
}

export function resolveModel(model?: string): string {
  const requested = model || OPENAI_MODEL || OPENROUTER_MODEL || "gpt-4o-mini";
  if (isOpenRouter() && !requested.includes("/")) {
    return `openai/${requested}`;
  }
  return requested;
}

/** OpenRouter free/third-party models often reject json_object — use prompt parsing instead. */
export function supportsJsonObjectFormat(model?: string): boolean {
  if (isOpenRouter()) return false;
  const resolved = (model || OPENAI_MODEL || "").toLowerCase();
  if (resolved.includes(":free") || resolved.includes("tencent/")) return false;
  return true;
}

export function getClient(): OpenAI | null {
  if (!client) {
    const apiKey = OPENAI_API_KEY || OPENROUTER_API_KEY || "";
    const baseURL = getActiveBaseURL();

    if (!apiKey || apiKey === "sk-your-openai-api-key-here") {
      return null;
    }

    client = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
      ...(isOpenRouter()
        ? {
            defaultHeaders: {
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
              "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "Foundry",
            },
          }
        : {}),
    });
  }
  return client;
}

export function extractApiError(error: unknown): string {
  if (error instanceof OpenAI.APIError) {
    const body = error.error as { message?: string } | undefined;
    return body?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

export function parseJsonFromText<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const jsonSlice =
    start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
  return JSON.parse(jsonSlice) as T;
}

export function buildStructuredInstructions(
  systemPrompt: string,
  schema: Record<string, unknown>,
  useJsonObject: boolean,
): string {
  const base = `${systemPrompt}\n\nRespond with valid JSON matching this schema: ${JSON.stringify(schema)}`;
  if (useJsonObject) return base;
  return `${base}\n\nReturn ONLY a single JSON object. No markdown fences, no commentary.`;
}