/**
 * A faithful subset of the CIP-57 (Plutus Contract Blueprint) schema — the
 * machine-readable interface Aiken emits for a compiled validator. Shape
 * verified against real `aiken build` output (Aiken v1.1.23), not assumed:
 * definitions are a flat dictionary keyed by (JSON-pointer-escaped) name,
 * and datum/redeemer/parameters reference them via "$ref".
 */
export interface BlueprintSchema {
  readonly title?: string;
  readonly description?: string;
  readonly dataType?: string;
  readonly index?: number;
  readonly fields?: readonly BlueprintSchema[];
  readonly anyOf?: readonly BlueprintSchema[];
  readonly $ref?: string;
}

export interface BlueprintArgument {
  readonly title?: string;
  readonly schema: BlueprintSchema;
}

export interface ValidatorBlueprint {
  readonly title: string;
  readonly datum?: BlueprintArgument;
  readonly redeemer: BlueprintArgument;
  readonly parameters?: readonly BlueprintArgument[];
  readonly compiledCode: string;
  readonly hash: string;
}

export interface BlueprintPreamble {
  readonly title: string;
  readonly version: string;
  readonly plutusVersion: string;
}

export interface Blueprint {
  readonly preamble: BlueprintPreamble;
  readonly validators: readonly ValidatorBlueprint[];
  readonly definitions: Readonly<Record<string, BlueprintSchema>>;
}

export function findValidator(blueprint: Blueprint, title: string): ValidatorBlueprint | undefined {
  return blueprint.validators.find((validator) => validator.title === title);
}

/**
 * CIP-57 "$ref" values are JSON pointers into `definitions`, with `/`
 * escaped as `~1` and `~` escaped as `~0` (standard JSON Pointer escaping).
 */
export function resolveSchemaRef(blueprint: Blueprint, ref: string): BlueprintSchema | undefined {
  const prefix = "#/definitions/";
  if (!ref.startsWith(prefix)) {
    return undefined;
  }
  const key = ref.slice(prefix.length).replaceAll("~1", "/").replaceAll("~0", "~");
  return blueprint.definitions[key];
}
