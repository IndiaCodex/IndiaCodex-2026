import { BlockfrostProvider } from "@meshsdk/core";

const BLOCKFROST_PREPROD_URL = "https://cardano-preprod.blockfrost.io/api/v0";

function requireKey(): string {
  const key = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID_PREPROD;
  if (!key) {
    throw new Error(
      "Missing Blockfrost key. Copy apps/web/.env.example to .env.local and set NEXT_PUBLIC_BLOCKFROST_PROJECT_ID_PREPROD to a Preprod project key from https://blockfrost.io"
    );
  }
  return key;
}

/**
 * Blockfrost provider for Preprod. Used by MeshTxBuilder as the fetcher (protocol
 * params + UTxOs) and evaluator (Plutus execution units).
 *
 * The key is read client-side (NEXT_PUBLIC_) for this milestone — acceptable on a
 * testnet demo, but for production the provider calls should be proxied through a
 * server route so the key isn't shipped to the browser.
 */
let cached: BlockfrostProvider | null = null;

export function getProvider(): BlockfrostProvider {
  if (cached) return cached;
  cached = new BlockfrostProvider(requireKey());
  return cached;
}

/**
 * Fetch the CURRENT Plutus cost models from Preprod as `[PlutusV1, PlutusV2,
 * PlutusV3]` number arrays, to feed MeshTxBuilder via `setNetwork(...)`.
 *
 * Mesh 1.8.x ships bundled cost models that are stale relative to the live chain
 * (e.g. PlutusV3 gained params via governance), which makes the serializer
 * compute a wrong script-data hash → the node rejects the tx with
 * `ScriptIntegrityHashMismatch`. Passing the live cost models fixes that.
 */
let cachedCostModels: number[][] | null = null;

export async function fetchCostModels(): Promise<number[][]> {
  if (cachedCostModels) return cachedCostModels;
  const res = await fetch(`${BLOCKFROST_PREPROD_URL}/epochs/latest/parameters`, {
    headers: { project_id: requireKey() },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch protocol parameters from Blockfrost (${res.status}).`);
  }
  const params = await res.json();
  const raw = params.cost_models_raw;
  if (!raw?.PlutusV1 || !raw?.PlutusV2 || !raw?.PlutusV3) {
    throw new Error("Blockfrost response missing cost_models_raw.");
  }
  cachedCostModels = [raw.PlutusV1, raw.PlutusV2, raw.PlutusV3];
  return cachedCostModels;
}
