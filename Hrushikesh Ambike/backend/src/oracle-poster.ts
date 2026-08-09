// Posts a signed ADA/USD price attestation on-chain for the `ouro_oracle`
// validator (see ouro/onchain/validators/oracle.ak) to gate.
//
// `buildPriceDatum` is pure and fully unit-testable in isolation. `postPrice`
// wires it into a real Mesh transaction build; it requires a live wallet +
// provider (a devnet or preprod connection) to actually submit, which is not
// available in this sandbox — see the accompanying test file for what is and
// isn't exercised.

import { MeshTxBuilder, conStr0, integer, type IFetcher, type ISubmitter, type UTxO } from "@meshsdk/core";
import { fetchAdaUsd } from "./price";

/** Mirrors `PriceDatum` in ouro/onchain/validators/oracle.ak.
 *
 * NOTE ON UNITS: the on-chain field is named `valid_until_slot`, but
 * vault.ak's read_oracle_price compares it against the tx's
 * `validity_range.upper_bound`. Plutus V3 exposes that upper bound as POSIX
 * time in MILLISECONDS (the ledger converts the tx's invalidHereafter SLOT to
 * POSIX ms in the script context). So the freshness deadline must be a
 * POSIX-ms timestamp, NOT a slot number — hence `validUntilPosixMs`. Posting a
 * slot here makes every borrow read as "stale" and fail. */
export interface PriceDatum {
  priceMicroUsd: number;
  validUntilPosixMs: number;
}

/**
 * Builds the Mesh PlutusData-JSON representation of the on-chain `PriceDatum`
 * constructor `PriceDatum { price_micro_usd, valid_until_slot }`. Aiken
 * encodes a type's sole constructor as `Constr 0 [...]` in PlutusData, in
 * field-declaration order, hence `conStr0`. The second field carries a POSIX
 * millisecond deadline (see the units note on `PriceDatum`).
 */
export function buildPriceDatum(
  price: { priceMicroUsd: number },
  validUntilPosixMs: number,
) {
  return conStr0([integer(price.priceMicroUsd), integer(validUntilPosixMs)]);
}

/** Freshness deadline for a posted price, as POSIX time in milliseconds — the
 * unit vault.ak effectively compares against (see `PriceDatum`). Kept pure so
 * the slot-vs-POSIX-ms unit contract is unit-testable. */
export function priceValidUntilPosixMs(
  nowMs: number,
  windowMs: number,
): number {
  return nowMs + windowMs;
}

/** Minimal wallet surface `postPrice` needs to build + sign a transaction. */
export interface OraclePosterWallet {
  getChangeAddress(): Promise<string>;
  getUtxos(): Promise<UTxO[]>;
  signTx(unsignedTx: string, partialSign?: boolean): Promise<string>;
}

export interface PostPriceConfig {
  /** Bech32 script address of the oracle's price UTxO. */
  oracleAddress: string;
  /** How long the posted price stays fresh, in MILLISECONDS, added to the
   * current wall-clock time to form the POSIX-ms deadline. */
  validityWindowMs?: number;
}

export interface PostPriceDeps {
  wallet: OraclePosterWallet;
  fetcher: IFetcher;
  submitter: ISubmitter;
  /** Current wall-clock time in POSIX ms; injectable for tests. Defaults to
   * `Date.now`. Used to compute the price's `validUntilPosixMs` deadline. */
  now?: () => number;
}

/** ~2 hours in ms. Generously exceeds any single borrow tx's short TTL while
 * still bounding how stale a price the vault will accept. */
export const DEFAULT_VALIDITY_WINDOW_MS = 2 * 60 * 60 * 1000;
const ORACLE_LOCK_LOVELACE = "2000000"; // 2 ADA min-UTxO-style lock, refined later

/**
 * Fetches the current ADA/USD price (Kraken primary, Coinbase fallback),
 * builds a transaction that sends a fresh price UTxO to `oracleAddress` with
 * an inline `PriceDatum`, signs it with the oracle wallet, and submits it.
 *
 * NOT executed against a live chain in this repo's test suite: no devnet is
 * available in this sandbox (deliberately deferred to a later testing phase
 * per project decision). The pure datum-building logic (`buildPriceDatum`)
 * is unit-tested directly; this function's transaction assembly is
 * type-checked and structurally reviewed but not run end-to-end here.
 */
export async function postPrice(
  config: PostPriceConfig,
  deps: PostPriceDeps,
): Promise<{ txHash: string }> {
  const price = await fetchAdaUsd();
  const nowMs = (deps.now ?? Date.now)();
  const validUntilPosixMs = priceValidUntilPosixMs(
    nowMs,
    config.validityWindowMs ?? DEFAULT_VALIDITY_WINDOW_MS,
  );

  const datum = buildPriceDatum(price, validUntilPosixMs);

  const changeAddress = await deps.wallet.getChangeAddress();
  const utxos = await deps.wallet.getUtxos();

  const txBuilder = new MeshTxBuilder({
    fetcher: deps.fetcher,
    submitter: deps.submitter,
  });

  const unsignedTx = await txBuilder
    .txOut(config.oracleAddress, [{ unit: "lovelace", quantity: ORACLE_LOCK_LOVELACE }])
    .txOutInlineDatumValue(datum, "JSON")
    .changeAddress(changeAddress)
    .selectUtxosFrom(utxos)
    .complete();

  const signedTx = await deps.wallet.signTx(unsignedTx);
  const txHash = await deps.submitter.submitTx(signedTx);

  return { txHash };
}
