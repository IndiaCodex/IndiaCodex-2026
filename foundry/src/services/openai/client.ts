import {
  buildStructuredInstructions,
  extractApiError,
  getClient,
  parseJsonFromText,
  resolveModel,
  supportsJsonObjectFormat,
} from "./shared";

export async function generateResponse(
  systemPrompt: string,
  userMessage: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  },
): Promise<string> {
  const ai = getClient();

  if (!ai) {
    return JSON.stringify({
      summary: "Mock response - OpenAI not configured",
      message: "Set OPENAI_API_KEY in .env.local to enable real AI responses",
    });
  }

  const model = resolveModel(options?.model);
  const useJsonObject = Boolean(options?.jsonMode && supportsJsonObjectFormat(model));

  try {
    const response = await ai.responses.create({
      model,
      instructions: systemPrompt,
      input: userMessage,
      temperature: options?.temperature ?? 0.7,
      max_output_tokens: options?.maxTokens || 4096,
      ...(useJsonObject ? { text: { format: { type: "json_object" } } } : {}),
    });

    return response.output_text;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function generateStructuredResponse<T>(
  systemPrompt: string,
  userMessage: string,
  schema: Record<string, unknown>,
  options?: {
    model?: string;
    temperature?: number;
  },
): Promise<T> {
  const ai = getClient();

  if (!ai) {
    return { mock: true } as T;
  }

  const model = resolveModel(options?.model);
  const useJsonObject = supportsJsonObjectFormat(model);
  const instructions = buildStructuredInstructions(systemPrompt, schema, useJsonObject);

  try {
    const response = await ai.responses.create({
      model,
      instructions,
      input: userMessage,
      temperature: options?.temperature ?? 0.7,
      ...(useJsonObject ? { text: { format: { type: "json_object" } } } : {}),
    });

    return parseJsonFromText<T>(response.output_text);
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export { getClient } from "./shared";