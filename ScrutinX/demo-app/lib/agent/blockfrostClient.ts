/**
 * Thin Blockfrost wrapper. SERVER-SIDE ONLY (holds the project key).
 * Includes a tiny rate limiter because the free tier will throttle under a 30–50 request burst.
 */

import { config } from "./config";
import type { BlockSummary, ProtocolParams } from "./types";

// --- minimal serial rate limiter: spaces requests by minIntervalMs ---
let chain: Promise<unknown> = Promise.resolve();
const minIntervalMs = 100; // ~10 req/s, comfortably under free-tier limits
function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => sleep(minIntervalMs),
    () => sleep(minIntervalMs)
  );
  return run as Promise<T>;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function bfGet(path: string): Promise<any> {
  return throttle(async () => {
    const res = await fetch(`${config.blockfrost.url}${path}`, {
      headers: { project_id: config.blockfrost.projectId },
    });
    if (!res.ok) {
      throw new Error(`Blockfrost GET ${path} -> ${res.status} ${await res.text()}`);
    }
    return res.json();
  });
}

/** Latest N block summaries, newest first. */
export async function getLatestBlocks(count: number): Promise<BlockSummary[]> {
  const latest = await bfGet(`/blocks/latest`);
  const toSummary = (b: any): BlockSummary => ({
    height: b.height,
    size: b.size,
    txCount: b.tx_count,
  });
  if (count <= 1) return [toSummary(latest)];
  // /previous returns the blocks before `hash`, newest first
  const prev = await bfGet(`/blocks/${latest.hash}/previous?count=${count - 1}`);
  return [toSummary(latest), ...prev.map(toSummary)];
}

/** Live protocol parameters — always fetch, never hardcode fee params. */
export async function getProtocolParameters(): Promise<ProtocolParams> {
  const p = await bfGet(`/epochs/latest/parameters`);
  return {
    minFeeA: Number(p.min_fee_a),
    minFeeB: Number(p.min_fee_b),
    maxBlockSize: Number(p.max_block_size),
    priceMem: Number(p.price_mem),
    priceStep: Number(p.price_step),
    maxTxExMem: Number(p.max_tx_ex_mem),
    maxTxExSteps: Number(p.max_tx_ex_steps),
  };
}

/** UTXOs sitting at an address (e.g. the script address holding the tickets). */
export async function getAddressUtxos(address: string): Promise<any[]> {
  return bfGet(`/addresses/${address}/utxos`);
}

/** Poll until a tx is on-chain (or give up after `tries`). */
export async function awaitTx(txHash: string, tries = 30): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    try {
      await bfGet(`/txs/${txHash}`);
      return true; // 200 => confirmed
    } catch {
      await sleep(2000);
    }
  }
  return false;
}
