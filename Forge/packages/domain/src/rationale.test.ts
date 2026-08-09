import { describe, expect, it } from "vitest";
import { createRationale } from "./rationale.js";

describe("createRationale", () => {
  it("creates a rationale when subject, decision, and factors are present", () => {
    const rationale = createRationale({
      subject: "escrow-milestone template",
      category: "template-selection",
      decision: "selected escrow-milestone",
      factors: ["description mentions 'milestone'", "description mentions 'escrow'"],
    });

    expect(rationale.subject).toBe("escrow-milestone template");
    expect(rationale.factors).toHaveLength(2);
  });

  it("rejects an empty subject", () => {
    expect(() =>
      createRationale({
        subject: "  ",
        category: "parameter",
        decision: "default of 30 days",
        factors: ["template default"],
      }),
    ).toThrow(/non-empty subject/);
  });

  it("rejects an empty decision", () => {
    expect(() =>
      createRationale({
        subject: "milestoneCount",
        category: "parameter",
        decision: "",
        factors: ["template default"],
      }),
    ).toThrow(/non-empty decision/);
  });

  it("rejects a rationale with no factors", () => {
    expect(() =>
      createRationale({
        subject: "milestoneCount",
        category: "parameter",
        decision: "default of 3",
        factors: [],
      }),
    ).toThrow(/at least one factor/);
  });
});
