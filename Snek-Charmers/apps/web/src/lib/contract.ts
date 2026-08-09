import {
  applyParamsToScript,
  resolveScriptHash,
  serializePlutusScript,
  mOutputReference,
  mConStr0,
  CIP68_100,
  CIP68_222,
  stringToHex,
  deserializeAddress,
} from "@meshsdk/core";
import type { UTxO } from "@meshsdk/core";
import blueprint from "@/data/plutus.json";

/** Must match contracts/lib/launchpad/mint.ak + curve.ak. */
export const TOTAL_SUPPLY = 1_000_000_000n;
export const GRADUATION_THRESHOLD = 800_000_000n; // 80% of supply
export const NETWORK_ID = 0; // Preprod
/** ADA that rides with the pool UTxO to satisfy min-UTxO (not part of the curve reserve). */
export const POOL_MIN_ADA = 2_000_000n;

function validatorCode(suffix: string): string {
  const v = blueprint.validators.find((x) => x.title.endsWith(suffix));
  if (!v) throw new Error(`validator '${suffix}' not found in plutus.json`);
  return v.compiledCode;
}

// ---- bonding-curve validator (no params → one shared pool address) ----
export const curveScriptCbor = applyParamsToScript(
  validatorCode("bonding_curve.spend"),
  []
);
export const curveScriptHash = resolveScriptHash(curveScriptCbor, "V3");
export const curveAddress = serializePlutusScript(
  { code: curveScriptCbor, version: "V3" },
  undefined,
  NETWORK_ID
).address;

// ---- per-token minting policy (parameterized by a seed UTxO) ----
const mintCode = validatorCode(".mint");

export type MintScript = {
  scriptCbor: string;
  policyId: string;
  refAssetName: string; // CIP-68 label 100
  userAssetName: string; // CIP-68 label 222
  refUnit: string;
  userUnit: string;
};

export function buildMintScript(seed: UTxO, tokenName: string): MintScript {
  const nameHex = stringToHex(tokenName);
  const param = mOutputReference(seed.input.txHash, seed.input.outputIndex);
  const scriptCbor = applyParamsToScript(mintCode, [param], "Mesh");
  const policyId = resolveScriptHash(scriptCbor, "V3");
  const refAssetName = CIP68_100(nameHex);
  const userAssetName = CIP68_222(nameHex);
  return {
    scriptCbor,
    policyId,
    refAssetName,
    userAssetName,
    refUnit: policyId + refAssetName,
    userUnit: policyId + userAssetName,
  };
}

/** The PoolDatum fields, mirroring the Aiken type (in declaration order).
 *  Curve params are fixed protocol constants (see curve.ts), so they are NOT
 *  stored per-pool. */
export type PoolFields = {
  tokenPolicy: string;
  tokenName: string; // user token asset name (label 222 + body)
  sold: bigint;
  reserve: bigint;
  owner: string; // owner payment key hash
};

/** Build the inline datum for a pool UTxO. */
export function poolDatum(f: PoolFields) {
  return mConStr0([f.tokenPolicy, f.tokenName, f.sold, f.reserve, f.owner]);
}

/** Decode a pool inline datum (Mesh JSON form) back to PoolFields. */
export function decodePoolDatum(data: {
  fields: Array<{ bytes?: string; int?: number | string }>;
}): PoolFields {
  const f = data.fields;
  const b = (i: number) => f[i].bytes as string;
  const n = (i: number) => BigInt(f[i].int as number | string);
  return {
    tokenPolicy: b(0),
    tokenName: b(1),
    sold: n(2),
    reserve: n(3),
    owner: b(4),
  };
}

export function ownerKeyHash(address: string): string {
  return deserializeAddress(address).pubKeyHash;
}
