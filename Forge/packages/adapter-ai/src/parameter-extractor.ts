import type { JsonSchema } from "@forge/application";
import { extractNumbers } from "./number-words.js";

/**
 * Extracts values for a template's declared numeric parameters from free
 * text. Deliberately conservative: a parameter is only ever set here when
 * a number was actually found in the text — never guessed. Anything left
 * unset falls through to the template's own default (or a loud, explicit
 * error if the parameter is required with no default), per
 * GenerateContractUseCase's deterministic validation.
 */
export function extractParameters(
  description: string,
  schema: JsonSchema,
): Readonly<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  const numbers = extractNumbers(description);
  let numberIndex = 0;

  for (const [name, property] of Object.entries(schema.properties)) {
    if (property.type === "number" && numberIndex < numbers.length) {
      result[name] = numbers[numberIndex];
      numberIndex += 1;
    }
  }

  return result;
}
