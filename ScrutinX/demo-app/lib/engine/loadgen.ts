/**
 * Load generator — fabricates a burst of claim requests (simulated users) targeting REAL on-chain
 * tickets. The users are synthetic (there's no real crowd on Preprod — expected per the brief), but the
 * tickets they claim are the actual UTXOs at the contract, so settling the batch is a real on-chain tx.
 * Deterministic (index-based, no Math.random) so a run is reproducible.
 */

import type { UserRequest } from "@/lib/agent/types";

export type Preset = "heavy" | "spread" | "mixed";

export interface Ticket {
  ref: string; // "txHash#index" — a real Open ticket UTXO
  itemId: string;
}

function claimant(i: number): string {
  return (i + 1).toString(16).padStart(56, "0"); // stand-in vkey hash; server signs as the real signer
}

/**
 * Build `count` claim requests over the given REAL tickets.
 *  - heavy:  most requests pile onto the first ~3 tickets  → dramatic contention, MIS shrinks to those few
 *  - spread: one request per ticket                         → near-complete independent set
 *  - mixed:  half heavy, half spread
 */
export function generateClaimRush(
  preset: Preset,
  tickets: Ticket[],
  count: number,
  startTs: number
): UserRequest[] {
  if (tickets.length === 0) return [];
  const reqs: UserRequest[] = [];
  const hot = Math.min(3, tickets.length);

  for (let i = 0; i < count; i++) {
    let t: Ticket;
    switch (preset) {
      case "heavy":
        t = tickets[i % hot]; // everyone fights over the first few
        break;
      case "spread":
        if (i >= tickets.length) continue; // one per distinct ticket
        t = tickets[i];
        break;
      case "mixed":
      default:
        t = i % 2 === 0 ? tickets[i % hot] : tickets[i % tickets.length];
        break;
    }
    reqs.push({
      id: `req-${startTs}-${i}`,
      kind: "claim",
      targetUtxoRef: t.ref,
      claimant: claimant(i),
      ts: startTs + i,
    });
  }
  return reqs;
}
