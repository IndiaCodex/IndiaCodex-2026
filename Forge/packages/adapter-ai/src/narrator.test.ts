import type { Rationale } from "@forge/domain";
import { createRationale } from "@forge/domain";
import { describe, expect, it } from "vitest";
import { narrate } from "./narrator.js";

describe("narrate", () => {
  it("turns a rationale's decision and factors into a sentence", () => {
    const rationale: Rationale = createRationale({
      subject: "escrow-milestone",
      category: "template-selection",
      decision: 'Selected template "Escrow with milestone payments"',
      factors: ["intent category exactly matches"],
    });

    const result = narrate("escrow-milestone", [rationale]);

    expect(result).toContain('Selected template "Escrow with milestone payments"');
    expect(result).toContain("because intent category exactly matches");
  });

  it("returns a clear message when there are no facts", () => {
    expect(narrate("nothing", [])).toContain("No recorded reasoning");
  });
});
