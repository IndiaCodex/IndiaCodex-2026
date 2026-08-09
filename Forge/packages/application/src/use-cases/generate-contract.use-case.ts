import type {
  ContractParameters,
  ContractParameterValue,
  ContractTemplate,
  GeneratedContract,
  Rationale,
  TemplateParameterDefinition,
  TemplateParameterType,
} from "@forge/domain";
import { createContractIntent, createRationale } from "@forge/domain";
import type { IContractTemplateEnginePort } from "../ports/contract-template-engine.port.js";
import type {
  ILanguageModelPort,
  JsonSchema,
  JsonSchemaProperty,
} from "../ports/language-model.port.js";
import { DEFAULT_MIN_TEMPLATE_MATCH_CONFIDENCE } from "./select-template.use-case.js";
import type { SelectTemplateUseCase } from "./select-template.use-case.js";

export interface GenerateContractResult {
  readonly contract: GeneratedContract;
  readonly templateRationale: Rationale;
  readonly parameterRationales: readonly Rationale[];
}

function jsonTypeFor(type: TemplateParameterType): JsonSchemaProperty["type"] {
  switch (type) {
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "string";
  }
}

function buildParameterSchema(template: ContractTemplate): JsonSchema {
  const properties: Record<string, JsonSchemaProperty> = {};
  for (const parameter of template.parameters) {
    properties[parameter.name] = {
      type: jsonTypeFor(parameter.type),
      description: parameter.description,
    };
  }
  return {
    type: "object",
    properties,
    required: template.parameters.filter((parameter) => parameter.required).map((p) => p.name),
  };
}

function resolveParameter(
  definition: TemplateParameterDefinition,
  extractedValue: unknown,
): { value: ContractParameterValue; factor: string } | undefined {
  const expectedType = jsonTypeFor(definition.type);
  if (extractedValue !== undefined && typeof extractedValue === expectedType) {
    const value = extractedValue as ContractParameterValue;
    return {
      value,
      factor: `extracted from the description ("${definition.name}" = ${String(value)})`,
    };
  }
  if (definition.defaultValue !== undefined) {
    return {
      value: definition.defaultValue,
      factor: `not present (or the wrong type) in the extracted parameters; used the template default`,
    };
  }
  if (definition.required) {
    throw new Error(
      `Missing required parameter "${definition.name}" for template "${definition.name}"`,
    );
  }
  return undefined;
}

function validateParameters(
  template: ContractTemplate,
  raw: Readonly<Record<string, unknown>>,
): { parameters: ContractParameters; rationales: Rationale[] } {
  const parameters: Record<string, ContractParameterValue> = {};
  const rationales: Rationale[] = [];

  for (const definition of template.parameters) {
    const resolved = resolveParameter(definition, raw[definition.name]);
    if (!resolved) {
      continue;
    }
    parameters[definition.name] = resolved.value;
    rationales.push(
      createRationale({
        subject: definition.name,
        category: "parameter",
        decision: `"${definition.name}" = ${String(resolved.value)}`,
        factors: [resolved.factor, definition.description],
      }),
    );
  }

  return { parameters, rationales };
}

/**
 * The one place a natural-language description becomes Aiken source — and
 * the language model never writes that source. It is asked exactly two
 * narrow questions (which template category, and what are the parameters),
 * both validated deterministically; rendering is delegated entirely to the
 * Forge Engine (IContractTemplateEnginePort).
 */
export class GenerateContractUseCase {
  constructor(
    private readonly languageModel: ILanguageModelPort,
    private readonly templateEngine: IContractTemplateEnginePort,
    private readonly selectTemplate: SelectTemplateUseCase,
  ) {}

  async execute(
    description: string,
    minConfidence: number = DEFAULT_MIN_TEMPLATE_MATCH_CONFIDENCE,
  ): Promise<GenerateContractResult> {
    const templates = await this.templateEngine.listTemplates();
    if (templates.length === 0) {
      throw new Error("No contract templates are registered");
    }

    const intentRaw = await this.languageModel.extractStructured({
      prompt: description,
      context: { availableCategories: templates.map((template) => template.category) },
      schema: {
        type: "object",
        properties: {
          category: { type: "string", description: "The closest matching template category" },
          confidence: { type: "number", description: "Confidence in this classification, 0 to 1" },
        },
        required: ["category", "confidence"],
      },
    });

    const intent = createContractIntent({
      description,
      category: typeof intentRaw.category === "string" ? intentRaw.category : "",
      confidence: typeof intentRaw.confidence === "number" ? intentRaw.confidence : 0,
    });

    // Throws LowConfidenceTemplateMatchError rather than proceeding when
    // nothing matches confidently — no parameters are extracted and no
    // source is rendered for a low-confidence guess.
    const { template, rationale: templateRationale } = this.selectTemplate.execute(
      intent,
      templates,
      minConfidence,
    );

    const parametersRaw = await this.languageModel.extractStructured({
      prompt: description,
      schema: buildParameterSchema(template),
    });

    const { parameters, rationales: parameterRationales } = validateParameters(
      template,
      parametersRaw,
    );

    const contract = await this.templateEngine.render(template.id, parameters);

    return { contract, templateRationale, parameterRationales };
  }
}
