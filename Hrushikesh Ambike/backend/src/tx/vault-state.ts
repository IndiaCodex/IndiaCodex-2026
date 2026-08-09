// Reads live on-chain state the borrow flow needs: the caller's vault UTxO
// (with its VaultDatum decoded) and the oracle's current price. Server-side
// only (needs a live fetcher). Mirrors the datum layouts in
// ouro/onchain/lib/ouro/types.ak (VaultDatum) and validators/oracle.ak
// (PriceDatum); decoded, never guessed, against the compiled encoders.
import { deserializeDatum, type IFetcher, type UTxO } from "@meshsdk/core";
import { collateralUsdValue, maxBorrow } from "../ledger/ltv";
import type { Tier } from "./datums";

const TIER_BY_INDEX: Record<number, Tier> = {
  0: "Bronze",
  1: "Silver",
  2: "Gold",
};

// PlutusData JSON shapes returned by @meshsdk/core's deserializeDatum. Ints
// and constructor indices come back as bigint.
interface PlutusInt {
  int: bigint | number;
}
interface PlutusBytes {
  bytes: string;
}
interface PlutusConstr {
  constructor: bigint | number;
  fields: unknown[];
}

function asInt(field: unknown): number {
  if (field && typeof field === "object" && "int" in field) {
    return Number((field as PlutusInt).int);
  }
  throw new Error("Expected a Plutus integer field");
}

function asBytes(field: unknown): string {
  if (field && typeof field === "object" && "bytes" in field) {
    return (field as PlutusBytes).bytes;
  }
  throw new Error("Expected a Plutus bytes field");
}

function constrIndex(field: unknown): number {
  if (field && typeof field === "object" && "constructor" in field) {
    return Number((field as PlutusConstr).constructor);
  }
  throw new Error("Expected a Plutus constructor field");
}

export interface VaultDatumDecoded {
  ownerVkh: string;
  principalTusdm: number;
  collateralLovelace: number;
  tierAtOpen: Tier;
}

/** Decodes an inline VaultDatum (Constr 0 [owner, principal, collateral, tier]). */
export function decodeVaultDatum(datumCbor: string): VaultDatumDecoded {
  const data = deserializeDatum(datumCbor) as PlutusConstr;
  const [owner, principal, collateral, tier] = data.fields;
  const tierIndex = constrIndex(tier);
  const tierAtOpen = TIER_BY_INDEX[tierIndex];
  if (!tierAtOpen) {
    throw new Error(`Unknown tier constructor index: ${tierIndex}`);
  }
  return {
    ownerVkh: asBytes(owner),
    principalTusdm: asInt(principal),
    collateralLovelace: asInt(collateral),
    tierAtOpen,
  };
}

/** Decodes an oracle PriceDatum, returning its price in micro-USD per ADA. */
export function decodeOraclePriceMicroUsd(datumCbor: string): number {
  const data = deserializeDatum(datumCbor) as PlutusConstr;
  return asInt(data.fields[0]);
}

export interface OraclePriceDecoded {
  priceMicroUsd: number;
  /** Freshness deadline as POSIX ms — the unit vault.ak compares the tx's
   * validity upper bound against (see oracle-poster.ts's units note). */
  validUntilPosixMs: number;
}

/** Decodes a full oracle PriceDatum (Constr 0 [price_micro_usd, valid_until]). */
export function decodeOraclePriceDatum(datumCbor: string): OraclePriceDecoded {
  const data = deserializeDatum(datumCbor) as PlutusConstr;
  return {
    priceMicroUsd: asInt(data.fields[0]),
    validUntilPosixMs: asInt(data.fields[1]),
  };
}

export interface OraclePriceState extends OraclePriceDecoded {
  utxo: UTxO;
}

/**
 * Picks the price UTxO with the LATEST validity deadline among the oracle
 * address's outputs. Re-posting a price does not consume older price UTxOs,
 * so expired (and legacy slot-denominated) datums accumulate at the address;
 * selecting by deadline makes every re-post self-discovering with no
 * deployment-record update. Undecodable outputs are skipped.
 */
export function pickFreshestOraclePrice(utxos: UTxO[]): OraclePriceState | null {
  return utxos.reduce<OraclePriceState | null>((best, utxo) => {
    const datumCbor = utxo.output.plutusData;
    if (!datumCbor) return best;
    try {
      const decoded = decodeOraclePriceDatum(datumCbor);
      return best === null || decoded.validUntilPosixMs > best.validUntilPosixMs
        ? { utxo, ...decoded }
        : best;
    } catch {
      // Not a PriceDatum-shaped output; skip it.
      return best;
    }
  }, null);
}

export interface VaultState extends VaultDatumDecoded {
  utxo: UTxO;
}

/**
 * Finds every vault UTxO at `vaultAddress` with a decodable VaultDatum. Each
 * deposit currently creates a fresh vault UTxO (there is no top-up action),
 * so repeat depositors legitimately have several live vaults at once.
 */
export async function findVaultUtxos(
  fetcher: IFetcher,
  vaultAddress: string,
): Promise<VaultState[]> {
  const utxos = await fetcher.fetchAddressUTxOs(vaultAddress);
  const vaults: VaultState[] = [];
  for (const utxo of utxos) {
    const datumCbor = utxo.output.plutusData;
    if (!datumCbor) continue;
    try {
      vaults.push({ utxo, ...decodeVaultDatum(datumCbor) });
    } catch {
      // Not a VaultDatum-shaped output; skip it.
      continue;
    }
  }
  return vaults;
}

/**
 * Picks the vault with the most remaining borrowing power at the given oracle
 * price. Borrow txs spend exactly one vault UTxO, so surfacing the richest
 * one keeps a fresh deposit borrowable even while an older vault sits fully
 * drawn at the same address. Bronze/0 mirrors the on-chain default used when
 * no reputation reference input is supplied.
 */
export function pickRichestVault(
  vaults: VaultState[],
  priceMicroUsd: number,
): VaultState | null {
  const remainingDraw = (vault: VaultState): number =>
    maxBorrow(
      collateralUsdValue(vault.collateralLovelace, priceMicroUsd),
      "Bronze",
      0,
    ) - vault.principalTusdm;

  return vaults.reduce<VaultState | null>(
    (best, vault) =>
      best === null || remainingDraw(vault) > remainingDraw(best)
        ? vault
        : best,
    null,
  );
}

/**
 * Finds the caller's single most borrowable vault UTxO, or null if the user
 * has not deposited yet. Kept for callers that only need one vault.
 */
export async function findVaultUtxo(
  fetcher: IFetcher,
  vaultAddress: string,
): Promise<VaultState | null> {
  const vaults = await findVaultUtxos(fetcher, vaultAddress);
  return vaults[0] ?? null;
}
