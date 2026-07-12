import type { Rationale } from "./rationale.js";

export interface Explanation {
  readonly subject: string;
  readonly narrative: string;
  readonly basedOn: readonly Rationale[];
}
