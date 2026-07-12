import type { Rationale } from "@forge/domain";

/**
 * Turns already-recorded Rationale facts into readable prose. This never
 * originates a claim — every bullet traces directly back to a
 * deterministic decision (`decision` + `factors`) a use case already made;
 * narration only organizes and phrases them. One bullet per fact, rather
 * than one run-on paragraph, so multi-fact explanations stay easy to scan
 * on a terminal.
 */
export function narrate(subject: string, facts: readonly Rationale[]): string {
  if (facts.length === 0) {
    return `No recorded reasoning is available for ${subject}.`;
  }

  return facts
    .map((fact) => `  • ${fact.decision}, because ${fact.factors.join(" and ")}.`)
    .join("\n");
}
