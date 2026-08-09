export type RationaleCategory =
  "template-selection" | "parameter" | "validator" | "test" | "deployment";

export interface Rationale {
  readonly subject: string;
  readonly category: RationaleCategory;
  readonly decision: string;
  readonly factors: readonly string[];
}

export function createRationale(input: {
  subject: string;
  category: RationaleCategory;
  decision: string;
  factors: readonly string[];
}): Rationale {
  if (input.subject.trim().length === 0) {
    throw new Error("Rationale requires a non-empty subject");
  }
  if (input.decision.trim().length === 0) {
    throw new Error("Rationale requires a non-empty decision");
  }
  if (input.factors.length === 0) {
    throw new Error(
      "Rationale requires at least one factor — a decision with no recorded reason is not a rationale",
    );
  }
  return {
    subject: input.subject,
    category: input.category,
    decision: input.decision,
    factors: input.factors,
  };
}
