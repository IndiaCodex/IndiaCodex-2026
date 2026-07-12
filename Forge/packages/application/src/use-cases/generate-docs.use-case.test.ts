import type { Blueprint, Rationale, ReviewReport } from "@forge/domain";
import { createRationale } from "@forge/domain";
import { describe, expect, it, vi } from "vitest";
import type { ILanguageModelPort } from "../ports/language-model.port.js";
import { GenerateDocsUseCase } from "./generate-docs.use-case.js";

const blueprint: Blueprint = {
  preamble: { title: "escrow", version: "1.0.0", plutusVersion: "v3" },
  validators: [
    {
      title: "escrow.spend",
      redeemer: { schema: { title: "Action" } },
      compiledCode: "590a",
      hash: "abc",
    },
  ],
  definitions: {},
};

const project = { name: "escrow-demo", rootDir: "/tmp/escrow-demo" };

describe("GenerateDocsUseCase", () => {
  it("lists validators and includes narrated notes when a language model and rationale are available", async () => {
    const rationale: Rationale = createRationale({
      subject: "escrow-milestone",
      category: "template-selection",
      decision: "Selected template",
      factors: ["exact category match"],
    });
    const review: ReviewReport = {
      observations: [{ summary: "Looks correct", relatedRationale: rationale }],
    };
    const narrate = vi.fn().mockResolvedValue("This project implements a milestone escrow.");
    const languageModel: ILanguageModelPort = { extractStructured: vi.fn(), narrate };

    const useCase = new GenerateDocsUseCase(languageModel);
    const doc = await useCase.execute({ project, blueprint, review });

    expect(doc.fileName).toBe("GENERATED_README.md");
    expect(doc.content).toContain("escrow.spend");
    expect(doc.content).toContain("This project implements a milestone escrow.");
    expect(narrate).toHaveBeenCalledWith({
      subject: "usage guide for escrow-demo",
      facts: [rationale],
    });
  });

  it("falls back to the review summaries when no language model is bound", async () => {
    const review: ReviewReport = { observations: [{ summary: "Looks correct" }] };
    const useCase = new GenerateDocsUseCase(undefined);

    const doc = await useCase.execute({ project, blueprint, review });

    expect(doc.content).toContain("Looks correct");
  });
});
