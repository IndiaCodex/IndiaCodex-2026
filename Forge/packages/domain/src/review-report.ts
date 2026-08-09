import type { Rationale } from "./rationale.js";

export interface ReviewObservation {
  readonly summary: string;
  readonly relatedRationale?: Rationale;
}

export interface ReviewReport {
  readonly observations: readonly ReviewObservation[];
}
