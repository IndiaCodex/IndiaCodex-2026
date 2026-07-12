import type {
  ILanguageModelPort,
  NarrationRequest,
  StructuredExtractionRequest,
} from "@forge/application";
import { classifyIntent } from "./intent-classifier.js";
import { narrate } from "./narrator.js";
import { extractParameters } from "./parameter-extractor.js";

function isIntentRequest(request: StructuredExtractionRequest): boolean {
  return "category" in request.schema.properties && "confidence" in request.schema.properties;
}

function readAvailableCategories(request: StructuredExtractionRequest): readonly string[] {
  const raw = request.context?.["availableCategories"];
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((item): item is string => typeof item === "string");
}

/**
 * The real ILanguageModelPort binding: local, deterministic, and
 * dependency-free — no hosted API call, no network, no API key. Per
 * ADR-003, its only two responsibilities are structured extraction
 * (intent, then parameters) and narration of already-known facts; it
 * never writes Aiken source.
 */
export class LocalLanguageModelAdapter implements ILanguageModelPort {
  extractStructured(
    request: StructuredExtractionRequest,
  ): Promise<Readonly<Record<string, unknown>>> {
    if (isIntentRequest(request)) {
      const { category, confidence } = classifyIntent(
        request.prompt,
        readAvailableCategories(request),
      );
      return Promise.resolve({ category, confidence });
    }
    return Promise.resolve(extractParameters(request.prompt, request.schema));
  }

  narrate(request: NarrationRequest): Promise<string> {
    return Promise.resolve(narrate(request.subject, request.facts));
  }
}
