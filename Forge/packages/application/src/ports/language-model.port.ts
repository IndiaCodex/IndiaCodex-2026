import type { Rationale } from "@forge/domain";
import { createPortToken } from "@forge/plugin-api";
import type { PortToken } from "@forge/plugin-api";

export interface JsonSchemaProperty {
  readonly type: "string" | "number" | "boolean";
  readonly description?: string;
}

export interface JsonSchema {
  readonly type: "object";
  readonly properties: Readonly<Record<string, JsonSchemaProperty>>;
  readonly required?: readonly string[];
}

export interface StructuredExtractionRequest {
  readonly prompt: string;
  readonly context?: Readonly<Record<string, unknown>>;
  readonly schema: JsonSchema;
}

export interface NarrationRequest {
  readonly subject: string;
  readonly facts: readonly Rationale[];
}

/**
 * The platform's sole language-model abstraction. By design it has exactly
 * two capabilities — structured extraction and narration of already-known
 * facts — and no method that could plausibly be used to generate blockchain
 * logic. Contract source is never produced through this port.
 */
export interface ILanguageModelPort {
  extractStructured(
    request: StructuredExtractionRequest,
  ): Promise<Readonly<Record<string, unknown>>>;
  narrate(request: NarrationRequest): Promise<string>;
}

export const ILanguageModelPortToken: PortToken<ILanguageModelPort> =
  createPortToken<ILanguageModelPort>("ILanguageModelPort");
