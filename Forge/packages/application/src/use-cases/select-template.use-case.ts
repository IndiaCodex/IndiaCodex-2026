import type { ContractIntent, ContractTemplate, Rationale } from "@forge/domain";
import { createRationale } from "@forge/domain";

export interface TemplateSelection {
  readonly template: ContractTemplate;
  readonly rationale: Rationale;
}

/** Below this match score, no template is considered a confident match. */
export const DEFAULT_MIN_TEMPLATE_MATCH_CONFIDENCE = 0.6;

/**
 * Thrown instead of silently picking a template when nothing matches with
 * enough confidence — a low-confidence guess must never reach the Forge
 * Engine and produce a project.
 */
function formatTemplateList(templates: readonly ContractTemplate[]): string {
  return templates
    .map((template, index) => {
      const useCases =
        template.useCases && template.useCases.length > 0
          ? `\n   Use Cases:\n${template.useCases.map((useCase) => `   • ${useCase}`).join("\n")}`
          : "";
      return `${index + 1}. ${template.name}${useCases}`;
    })
    .join("\n\n");
}

export class LowConfidenceTemplateMatchError extends Error {
  constructor(
    public readonly confidence: number,
    public readonly threshold: number,
    public readonly availableTemplates: readonly ContractTemplate[],
  ) {
    super(
      `No supported template matched this description with sufficient confidence ` +
        `(detected confidence ${confidence.toFixed(2)}, required at least ${threshold.toFixed(2)}). ` +
        `Try rephrasing the description, or lower --min-confidence if this is intentional.\n\n` +
        `Supported Smart Contract Templates\n\n${formatTemplateList(availableTemplates)}`,
    );
    this.name = "LowConfidenceTemplateMatchError";
  }
}

/**
 * Deterministic template selection: no language-model call happens here.
 * The intent's category and confidence (already extracted) are matched
 * against the registered templates by simple, auditable scoring. A match
 * scoring below `minConfidence` is rejected outright rather than returned
 * as a best-effort guess.
 */
export class SelectTemplateUseCase {
  execute(
    intent: ContractIntent,
    templates: readonly ContractTemplate[],
    minConfidence: number = DEFAULT_MIN_TEMPLATE_MATCH_CONFIDENCE,
  ): TemplateSelection {
    if (templates.length === 0) {
      throw new Error("No contract templates are registered");
    }

    const scored = templates
      .map((template) => ({ template, score: this.score(template, intent) }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (!best) {
      throw new Error("Template scoring produced no candidates");
    }

    if (best.score < minConfidence) {
      throw new LowConfidenceTemplateMatchError(best.score, minConfidence, templates);
    }

    const rationale = createRationale({
      subject: best.template.id,
      category: "template-selection",
      decision: `Selected template "${best.template.name}"`,
      factors: [
        best.template.category === intent.category
          ? `intent category "${intent.category}" exactly matches template category "${best.template.category}"`
          : `intent category "${intent.category}" was the closest available match to template category "${best.template.category}"`,
        `intent parsing confidence was ${intent.confidence.toFixed(2)}`,
        `match score ${best.score.toFixed(2)} of 1.00`,
      ],
    });

    return { template: best.template, rationale };
  }

  private score(template: ContractTemplate, intent: ContractIntent): number {
    const categoryMatch = template.category === intent.category ? 1 : 0;
    return categoryMatch * intent.confidence;
  }
}
