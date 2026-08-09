/**
 * A deterministic, rule-based explanation of one Event, derived
 * entirely from Timeline data — the production-default output of the
 * Explainability module (ADR-0002). No code path here calls an LLM;
 * Assistant Mode's `AdvisoryExplanation` is a separate, Phase 2 type
 * that is never substitutable for this one.
 *
 * The type is defined here as part of the Step 3.1 domain layer; the
 * templating logic that generates it is the Explainability Engine,
 * implemented in Step 3.3.
 */
export interface EngineeringExplanation {
  readonly subjectEventSequence: number;
  readonly text: string;
  /** Sequence numbers of the Events this explanation is derived from. */
  readonly citedEvents: readonly number[];
}
