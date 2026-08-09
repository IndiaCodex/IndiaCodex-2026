import type { Explanation, Rationale } from "@forge/domain";
import type { ILanguageModelPort } from "../ports/language-model.port.js";

/**
 * Never invents reasoning. It narrates the Rationale(s) a deterministic
 * component already recorded — with a language model if one is
 * configured, or as directly formatted facts if not. Either way the
 * content is identical; only the presentation changes.
 */
export class ExplainUseCase {
  constructor(private readonly languageModel: ILanguageModelPort | undefined) {}

  async execute(subject: string, rationales: readonly Rationale[]): Promise<Explanation> {
    if (rationales.length === 0) {
      throw new Error(`No rationale is recorded for "${subject}"`);
    }

    if (this.languageModel) {
      const narrative = await this.languageModel.narrate({ subject, facts: rationales });
      return { subject, narrative, basedOn: rationales };
    }

    const narrative = rationales
      .map((rationale) => `${rationale.decision} — because ${rationale.factors.join("; ")}`)
      .join("\n");
    return { subject, narrative, basedOn: rationales };
  }
}
