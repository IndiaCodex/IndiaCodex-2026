import {
  buildStructuredInstructions,
  extractApiError,
  getClient,
  parseJsonFromText,
  resolveModel,
  supportsJsonObjectFormat,
} from "./shared";

export interface StreamEvent {
  type: "text" | "reasoning" | "tool_call" | "tool_call_output" | "error" | "done";
  content?: string;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  error?: string;
}

export function isMockMode(): boolean {
  return !getClient();
}

export async function* generateStream(
  systemPrompt: string,
  userMessage: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  },
): AsyncGenerator<StreamEvent> {
  const ai = getClient();

  if (!ai) {
    yield { type: "text", content: "Mock: OpenAI not configured. Set OPENAI_API_KEY." };
    yield { type: "done" };
    return;
  }

  const model = resolveModel(options?.model);
  const useJsonObject = Boolean(options?.jsonMode && supportsJsonObjectFormat(model));

  try {
    const stream = await ai.responses.create({
      model,
      instructions: systemPrompt,
      input: userMessage,
      temperature: options?.temperature ?? 0.7,
      max_output_tokens: options?.maxTokens || 8192,
      ...(useJsonObject ? { text: { format: { type: "json_object" } } } : {}),
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        yield { type: "text", content: event.delta };
      } else if (event.type === "response.output_item.added" && event.item?.type === "function_call") {
        yield {
          type: "tool_call",
          toolName: event.item.name,
          toolInput: event.item.arguments,
        };
      }
    }
  } catch (error) {
    yield { type: "error", error: extractApiError(error) };
  }

  yield { type: "done" };
}

export async function* generateStructuredStream<T>(
  systemPrompt: string,
  userMessage: string,
  schema: Record<string, unknown>,
  options?: {
    model?: string;
    temperature?: number;
  },
): AsyncGenerator<StreamEvent & { parsed?: T }> {
  const ai = getClient();
  if (!ai) {
    yield { type: "text", content: JSON.stringify({ mock: true }) };
    yield { type: "done" };
    return;
  }

  const model = resolveModel(options?.model);
  const useJsonObject = supportsJsonObjectFormat(model);
  const instructions = buildStructuredInstructions(systemPrompt, schema, useJsonObject);
  let accumulated = "";

  try {
    const stream = await ai.responses.create({
      model,
      instructions,
      input: userMessage,
      temperature: options?.temperature ?? 0.7,
      ...(useJsonObject ? { text: { format: { type: "json_object" } } } : {}),
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        accumulated += event.delta;
        yield { type: "text", content: event.delta };
      }
    }
  } catch (error) {
    yield { type: "error", error: extractApiError(error) };
    yield { type: "done" };
    return;
  }

  try {
    const parsed = parseJsonFromText<T>(accumulated);
    yield { type: "text", content: "", parsed };
  } catch {
    yield {
      type: "error",
      error: accumulated
        ? `Failed to parse structured output: ${accumulated.slice(0, 200)}`
        : "Model returned empty output",
    };
  }

  yield { type: "done" };
}