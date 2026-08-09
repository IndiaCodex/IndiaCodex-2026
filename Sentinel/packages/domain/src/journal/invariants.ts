import type { Event } from "../events/event.js";

/**
 * Per ADR-0001, every Event that touches a nondeterministic boundary
 * must carry a Snapshot capturing that boundary's exact input/output.
 *
 * Decision events always wrap one LLM call and always require a
 * Snapshot. Tool and Payment events are two-phase: the `"invoked"` /
 * `"requested"` phase captures only the (deterministic) request, before
 * the nondeterministic response exists, so it must NOT carry a
 * Snapshot; the `"completed"` phase captures the response and MUST.
 * Lifecycle events are structural bookkeeping the Execution Journal
 * produces itself and never wrap an external call.
 *
 * Takes the full `Event` (not just `kind`) because `kind` alone can't
 * distinguish an in-flight Tool/Payment call from a completed one —
 * and taking a `Pick<Event, ...>` would lose the discriminated-union
 * correlation between `kind` and `payload` that the switch below
 * relies on for exhaustive, type-safe narrowing.
 */
export function requiresSnapshot(event: Event): boolean {
  switch (event.kind) {
    case "decision":
      return true;
    case "tool":
      return event.payload.phase === "completed";
    case "payment":
      return event.payload.phase === "completed";
    case "lifecycle":
      return false;
  }
}
