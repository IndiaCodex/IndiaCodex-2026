import { deserializeDatum } from "@meshsdk/core";
import type { UTxO } from "@meshsdk/core";
import { getProvider } from "./provider";
import {
  curveAddress,
  decodePoolDatum,
  GRADUATION_THRESHOLD,
} from "./contract";
import { priceAt } from "./curve";

export type Pool = {
  utxo: UTxO;
  tokenPolicy: string;
  tokenName: string; // hex, includes CIP-68 label 222 prefix
  ticker: string; // decoded name body
  unit: string; // policyId + tokenName
  sold: bigint;
  reserve: bigint;
  owner: string;
  price: bigint; // spot price (lovelace)
  progress: number; // sold / graduation threshold, 0..1
  graduated: boolean;
};

function hexToUtf8(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  try {
    return new TextDecoder().decode(bytes);
  } catch {
    return hex;
  }
}

/** Read every bonding-curve pool (all pools live at the one curve address). */
export async function fetchPools(): Promise<Pool[]> {
  const utxos = await getProvider().fetchAddressUTxOs(curveAddress);
  const pools: Pool[] = [];
  for (const u of utxos) {
    const cbor = u.output.plutusData;
    if (!cbor) continue;
    try {
      const f = decodePoolDatum(deserializeDatum(cbor));
      pools.push({
        utxo: u,
        tokenPolicy: f.tokenPolicy,
        tokenName: f.tokenName,
        ticker: hexToUtf8(f.tokenName.slice(8)), // strip 4-byte label prefix
        unit: f.tokenPolicy + f.tokenName,
        sold: f.sold,
        reserve: f.reserve,
        owner: f.owner,
        price: priceAt(f.sold),
        progress: Math.min(1, Number(f.sold) / Number(GRADUATION_THRESHOLD)),
        graduated: f.sold >= GRADUATION_THRESHOLD,
      });
    } catch {
      // not a pool UTxO (or an old/unknown datum shape) — skip
    }
  }
  return pools;
}
