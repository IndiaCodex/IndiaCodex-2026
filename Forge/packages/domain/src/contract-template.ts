export type TemplateParameterType = "string" | "number" | "boolean" | "duration" | "address";

export interface TemplateParameterDefinition {
  readonly name: string;
  readonly type: TemplateParameterType;
  readonly description: string;
  readonly required: boolean;
  readonly defaultValue?: string | number | boolean;
}

export interface ContractTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly parameters: readonly TemplateParameterDefinition[];
  readonly sourceTemplate: string;
  /** Short, real-world scenarios this template fits — shown to a caller choosing among templates. */
  readonly useCases?: readonly string[];
}
