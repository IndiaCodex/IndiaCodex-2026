import type { Rationale } from "@forge/domain";
import { createRationale } from "@forge/domain";
import { describe, expect, it, vi } from "vitest";
import type { ILanguageModelPort } from "../ports/language-model.port.js";
import { ExplainUseCase } from "./explain.use-case.js";

const rationale: Rationale = createRationale({
  subject: "milestoneCount",
  category: "parameter",
  decision: '"milestoneCount" = 4',
  factors: ['extracted from the description ("milestoneCount" = 4)'],
});

describe("ExplainUseCase", () => {
  it("narrates via the language model when one is bound", async () => {
    const narrate = vi.fn().mockResolvedValue("It's 4 because you asked for 4 milestones.");
    const languageModel: ILanguageModelPort = { extractStructured: vi.fn(), narrate };

    const useCase = new ExplainUseCase(languageModel);
    const explanation = await useCase.execute("milestoneCount", [rationale]);

    expect(narrate).toHaveBeenCalledWith({ subject: "milestoneCount", facts: [rationale] });
    expect(explanation.narrative).toBe("It's 4 because you asked for 4 milestones.");
    expect(explanation.basedOn).toEqual([rationale]);
  });

  it("falls back to templated formatting of the rationale when no language model is bound", async () => {
    const useCase = new ExplainUseCase(undefined);
    const explanation = await useCase.execute("milestoneCount", [rationale]);

    expect(explanation.narrative).toContain('"milestoneCount" = 4');
    expect(explanation.narrative).toContain(
      'extracted from the description ("milestoneCount" = 4)',
    );
  });

  it("throws when there is no rationale on record for the subject", async () => {
    const useCase = new ExplainUseCase(undefined);

    await expect(useCase.execute("unknown-thing", [])).rejects.toThrow(/No rationale is recorded/);
  });
});
