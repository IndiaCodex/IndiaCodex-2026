import type { ContractParameters, ContractTemplate, GeneratedContract } from "@forge/domain";

export class TemplateRenderError extends Error {
  constructor(message: string) {
    super(`Failed to render contract template: ${message}`);
    this.name = "TemplateRenderError";
  }
}

function fileNameFor(template: ContractTemplate): string {
  return `${template.id.replaceAll("-", "_")}.ak`;
}

/**
 * Deterministic placeholder substitution — the Forge Engine. No language
 * model is involved: every value either came from validated, extracted
 * parameters or from the template's own declared default.
 */
export function renderTemplate(
  template: ContractTemplate,
  parameters: ContractParameters,
): GeneratedContract {
  let source = template.sourceTemplate;

  for (const definition of template.parameters) {
    const value = parameters[definition.name] ?? definition.defaultValue;
    if (value === undefined) {
      if (definition.required) {
        throw new TemplateRenderError(
          `missing required parameter "${definition.name}" for template "${template.id}"`,
        );
      }
      continue;
    }
    source = source.replaceAll(`{{${definition.name}}}`, String(value));
  }

  const unresolved = /\{\{\s*[\w.]+\s*\}\}/.exec(source);
  if (unresolved) {
    throw new TemplateRenderError(
      `template "${template.id}" has an unresolved placeholder: ${unresolved[0]}`,
    );
  }

  return {
    templateId: template.id,
    parameters,
    source,
    fileName: fileNameFor(template),
  };
}
