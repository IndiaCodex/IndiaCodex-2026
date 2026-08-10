/**
 * Settlement — turns a chosen Batch into a SettlementResult.
 *
 * TOGGLE (config.settlementMode):
 *   'real' -> settleReal():   build + sign + submit a real batch tx on Preprod via Lucid + seed wallet.
 *   'demo' -> settleDemo():   compute a realistic *simulated* result, no chain call.
 *
 * IMPORTANT: 'real' must run SERVER-SIDE (it uses the wallet seed). Call it from an API route
 * (e.g. Next.js /api/settle), never from the browser.
 *
 * Install for real mode:  npm i @lucid-evolution/lucid
 * NOTE: use `@lucid-evolution/lucid` (Anastasia Labs) — NOT the newer `@evolution-sdk/*`
 * (IntersectMBO "Evolution SDK"). Different package, different API. See Docs/cardano-tools.md.
 */

import { config } from "./config";
import { getProtocolParameters } from "./blockfrostClient";
import { markSpent } from "./pendingSpent";
import type { Batch, SettlementResult } from "./types";

/** Single entry point. Picks the path from the toggle. */
export async function settleBatch(batch: Batch): Promise<SettlementResult> {
  return config.settlementMode === "real" ? settleReal(batch) : settleDemo(batch);
}

// ============================================================================
// DEMO PATH — no chain. Fees estimated from live protocol params (or fallbacks).
// ============================================================================
export async function settleDemo(batch: Batch): Promise<SettlementResult> {
  const n = batch.requests.length;

  let minFeeA = 44,
    minFeeB = 155381;
  try {
    if (config.blockfrost.projectId) {
      const p = await getProtocolParameters();
      minFeeA = p.minFeeA;
      minFeeB = p.minFeeB;
    }
  } catch {
    /* use fallbacks */
  }

  // Rough sizes: shared tx overhead + marginal per claim. Illustrative but consistent.
  const perClaimBytes = 250;
  const overheadBytes = 900;
  const scriptFeePerClaim = 40_000; // amortized script cost per claim (lovelace)

  const batchedSize = overheadBytes + n * perClaimBytes;
  const feeLovelace =
    minFeeB + minFeeA * batchedSize + scriptFeePerClaim * n;

  // Naive: N independent single-claim txs, each paying minFeeB once.
  const naiveFeeEstimate = n * config.singleClaimFeeLovelace;

  return {
    txHash: fakeHash(batch),
    batchSize: n,
    feeLovelace: Math.round(feeLovelace),
    naiveFeeEstimate,
    savedLovelace: Math.max(0, naiveFeeEstimate - Math.round(feeLovelace)),
    mode: "demo",
  };
}

// ============================================================================
// REAL PATH — Preprod via Lucid Evolution + seed wallet.
// ============================================================================
export async function settleReal(batch: Batch): Promise<SettlementResult> {
  // Lazy import so demo mode never needs the dependency installed.
  // Cast to any: the real path is verified at runtime (behind the toggle); we don't want a
  // version-specific Lucid type signature to break the build for everyone in demo mode.
  const { Lucid, Blockfrost, Data, fromText, paymentCredentialOf } = (await import(
    "@lucid-evolution/lucid"
  )) as any;

  const lucid = await Lucid(
    new Blockfrost(config.blockfrost.url, config.blockfrost.projectId),
    "Preprod"
  );
  lucid.selectWallet.fromSeed(config.walletSeed);

  // On-chain rule 2 checks each claimant is in extra_signatories. In the MVP the server wallet signs
  // for all users (disclosed simplification — onchain-spec §4 rule 3), so the claimant on-chain is the
  // wallet's own payment key hash, and we add it as a required signer below.
  const walletAddress = await lucid.wallet().address();
  const signerKeyHash = paymentCredentialOf(walletAddress).hash as string;

  // Load the compiled validator from plutus.json (CIP-0057 blueprint). Server-side only.
  // The raw compiledCode's hash matches Aiken's hash (verified), so no double-CBOR wrap is needed.
  const { readFileSync } = await import("node:fs");
  const blueprint = JSON.parse(readFileSync(config.plutusJsonPath, "utf8"));
  const validator = {
    type: "PlutusV3" as const,
    script: blueprint.validators[0].compiledCode as string,
  };

  // --- Datum/redeemer schemas: MUST match on-chain/lib/types.ak (onchain-spec §2) ---
  const StatusSchema = Data.Enum([
    Data.Literal("Open"),
    Data.Literal("Claimed"),
  ]);
  const BatchDatumSchema = Data.Object({
    owner: Data.Bytes(),
    item_id: Data.Bytes(),
    status: StatusSchema,
  });
  const ClaimEntrySchema = Data.Object({
    utxo_ref: Data.Object({
      transaction_id: Data.Bytes(),
      output_index: Data.Integer(),
    }),
    claimant: Data.Bytes(),
  });
  const BatchRedeemerSchema = Data.Object({
    claims: Data.Array(ClaimEntrySchema),
  });

  // Resolve tickets from the SAME address-UTXO source /api/tickets uses (utxosAt) so the two can't
  // disagree, then settle only the ones still present. Some may have been spent since the client fetched
  // its list (a race) — those are simply dropped.
  const wantedRefs = new Set(batch.requests.map((r) => r.targetUtxoRef));
  const allScriptUtxos = (await lucid.utxosAt(config.scriptAddress)) as any[];
  const scriptUtxos = allScriptUtxos.filter((u) =>
    wantedRefs.has(`${u.txHash}#${u.outputIndex}`)
  );
  const found = new Set(scriptUtxos.map((u) => `${u.txHash}#${u.outputIndex}`));
  const liveRequests = batch.requests.filter((r) => found.has(r.targetUtxoRef));
  if (liveRequests.length === 0) {
    throw new Error(
      "None of these tickets are still Open on-chain (already spent) — refresh tickets and try again."
    );
  }

  const redeemer = Data.to(
    {
      claims: liveRequests.map((r) => {
        const { txHash, index } = splitRef(r.targetUtxoRef);
        return {
          utxo_ref: {
            transaction_id: txHash,
            output_index: BigInt(index),
          },
          claimant: signerKeyHash, // the actual signer (server wallet) — must match extra_signatories
        };
      }),
    },
    BatchRedeemerSchema as any
  );

  // Build: spend the live ticket inputs with the batch redeemer, re-pay each back to the script
  // marked Claimed (state STAYS SPLIT — one output per claim; onchain-spec rule 6).
  let tx = lucid.newTx().collectFrom(scriptUtxos, redeemer);

  for (const r of liveRequests) {
    const claimedDatum = Data.to(
      {
        owner: signerKeyHash,
        item_id: fromText(r.id),
        status: "Claimed",
      },
      BatchDatumSchema as any
    );
    tx = tx.pay.ToContract(
      config.scriptAddress,
      { kind: "inline", value: claimedDatum },
      {} // no value moved for the claim-pattern MVP; adjust if tickets carry assets
    );
  }

  // Attach the validator + require the signer key so it lands in extra_signatories (rule 2).
  tx = tx.attach.SpendingValidator(validator).addSignerKey(signerKeyHash);

  const completed = await tx.complete();
  const signed = await completed.sign.withWallet().complete();
  const txHash = await signed.submit();

  // Hide these tickets from the list until this tx confirms, so the next rush can't re-pick them.
  markSpent(liveRequests.map((r) => r.targetUtxoRef));

  const feeLovelace = readFeeLovelace(completed, signed);
  const naiveFeeEstimate = liveRequests.length * config.singleClaimFeeLovelace;

  return {
    txHash,
    batchSize: liveRequests.length,
    feeLovelace,
    naiveFeeEstimate,
    savedLovelace: Math.max(0, naiveFeeEstimate - feeLovelace),
    mode: "real",
    explorerUrl: `https://preprod.cardanoscan.io/transaction/${txHash}`,
  };
}

// --- helpers ---
/** Read the real tx fee (lovelace) robustly across Lucid Evolution / CML shapes. */
function readFeeLovelace(completed: any, signed: any): number {
  const toNum = (v: any): number => {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    if (typeof v === "bigint") return Number(v);
    if (typeof v?.to_str === "function") return Number(v.to_str());
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  let f = toNum(completed?.fee);
  if (f > 0) return f;
  for (const src of [completed?.txComplete, signed?.txSigned, completed, signed]) {
    try {
      f = toNum(src?.body?.()?.fee?.());
      if (f > 0) return f;
    } catch {
      /* try next */
    }
    try {
      f = toNum(src?.toTransaction?.()?.body?.()?.fee?.());
      if (f > 0) return f;
    } catch {
      /* try next */
    }
  }
  return f;
}

function splitRef(ref: string): { txHash: string; index: number } {
  const [txHash, idx] = ref.split("#");
  return { txHash, index: Number(idx) };
}

/** Deterministic fake hash for demo mode (no Date.now / no Math.random).
 *  Seeded from the settled request IDs (unique per cycle) so each settlement gets a distinct hash —
 *  seeding from targetUtxoRef would collide when successive cycles settle the same tickets. */
function fakeHash(batch: Batch): string {
  const seed = batch.requests.map((r) => r.id).join("|");
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return "demo" + h.toString(16).padStart(60, "0");
}
