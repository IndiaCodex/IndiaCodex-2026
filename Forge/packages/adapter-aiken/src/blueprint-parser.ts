import type {
  Blueprint,
  BlueprintArgument,
  BlueprintSchema,
  ValidatorBlueprint,
} from "@forge/domain";
import { asRecord } from "./json-helpers.js";

export class BlueprintParseError extends Error {
  constructor(message: string) {
    super(`Failed to parse Aiken blueprint: ${message}`);
    this.name = "BlueprintParseError";
  }
}

function parseSchema(raw: unknown): BlueprintSchema {
  const { title, description, dataType, index, fields, anyOf, $ref } = asRecord(raw, "a schema");
  return {
    title: typeof title === "string" ? title : undefined,
    description: typeof description === "string" ? description : undefined,
    dataType: typeof dataType === "string" ? dataType : undefined,
    index: typeof index === "number" ? index : undefined,
    fields: Array.isArray(fields) ? fields.map(parseSchema) : undefined,
    anyOf: Array.isArray(anyOf) ? anyOf.map(parseSchema) : undefined,
    $ref: typeof $ref === "string" ? $ref : undefined,
  };
}

function parseArgument(raw: unknown): BlueprintArgument {
  const { title, schema } = asRecord(raw, "an argument");
  if (schema === undefined) {
    throw new Error("argument is missing its schema");
  }
  return {
    title: typeof title === "string" ? title : undefined,
    schema: parseSchema(schema),
  };
}

function parseValidator(raw: unknown): ValidatorBlueprint {
  const { title, compiledCode, hash, datum, redeemer, parameters } = asRecord(raw, "a validator");
  if (typeof title !== "string") {
    throw new Error("validator is missing a title");
  }
  if (typeof compiledCode !== "string" || typeof hash !== "string") {
    throw new Error(`validator "${title}" is missing compiledCode or hash`);
  }
  if (redeemer === undefined) {
    throw new Error(`validator "${title}" is missing a redeemer`);
  }
  return {
    title,
    datum: datum !== undefined ? parseArgument(datum) : undefined,
    redeemer: parseArgument(redeemer),
    parameters: Array.isArray(parameters) ? parameters.map(parseArgument) : undefined,
    compiledCode,
    hash,
  };
}

/**
 * Aiken emits one "else" purpose per multi-purpose validator as a
 * catch-all fallback handler. It has no meaningful datum/redeemer
 * interface of its own, so it is excluded here — SDK generation and the
 * security rule engine have nothing useful to do with it.
 */
function isFallbackPurpose(title: string): boolean {
  return title.endsWith(".else");
}

export function parseBlueprint(rawJson: string): Blueprint {
  try {
    const parsed: unknown = JSON.parse(rawJson);
    const { preamble, validators, definitions } = asRecord(parsed, "the blueprint");

    const { title, version, plutusVersion } = asRecord(preamble, "the preamble");
    if (
      typeof title !== "string" ||
      typeof version !== "string" ||
      typeof plutusVersion !== "string"
    ) {
      throw new Error("preamble is missing title, version, or plutusVersion");
    }

    if (!Array.isArray(validators)) {
      throw new Error("missing validators array");
    }

    const parsedDefinitions: Record<string, BlueprintSchema> = {};
    if (typeof definitions === "object" && definitions !== null) {
      for (const [key, definition] of Object.entries(definitions as Record<string, unknown>)) {
        parsedDefinitions[key] = parseSchema(definition);
      }
    }

    return {
      preamble: { title, version, plutusVersion },
      validators: validators
        .map(parseValidator)
        .filter((validator) => !isFallbackPurpose(validator.title)),
      definitions: parsedDefinitions,
    };
  } catch (cause) {
    throw new BlueprintParseError((cause as Error).message);
  }
}
