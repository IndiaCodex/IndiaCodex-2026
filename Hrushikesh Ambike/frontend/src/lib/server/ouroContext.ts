// Server-only helper shared by /api/vault/state and /api/borrow/build. Given a
// user's wallet address it resolves everything the borrow flow reads on-chain:
// the user's per-owner vault address + current vault state, the live oracle
// price UTxO, and the LTV limit. Node-only (blueprint fs + Blockfrost).
import type { UTxO } from "@meshsdk/core";
import { deserializeAddress } from "@meshsdk/core";
import { getPreprodProvider } from "@ouro/offchain/preprod-provider";
import {
  loadDeployment,
  vaultAddressForOwner,
  type OuroDeployment,
} from "@ouro/offchain/deployment";
import {
  findVaultUtxos,
  pickFreshestOraclePrice,
  pickRichestVault,
  type VaultState,
} from "@ouro/offchain/tx/vault-state";
import { collateralUsdValue, maxBorrow } from "@ouro/offchain/ledger/ltv";

type OuroProvider = ReturnType<typeof getPreprodProvider>;

export const ORIGINATION_FEE_BPS = 100;

export interface OuroContext {
  provider: OuroProvider;
  deployment: OuroDeployment;
  ownerVkh: string;
  vaultAddress: string;
  vaultState: VaultState | null;
  oracleUtxo: UTxO;
  priceMicroUsd: number;
  /** Freshness deadline of the picked oracle price, POSIX ms. vault.ak rejects
   * any borrow/repay whose tx validity upper bound exceeds this. */
  priceValidUntilPosixMs: number;
  /** Full LTV borrow ceiling for the current vault collateral (Bronze/0 — the
   * on-chain default when no reputation reference input is supplied). */
  maxBorrowMicro: number;
  /** Additional tUSDM still drawable: maxBorrow - current principal, ≥ 0. */
  maxDrawMicro: number;
}

/** Resolves the full on-chain context for a borrower address. Throws if the
 * recorded oracle price UTxO can't be found/decoded (a broken deployment). */
export async function loadOuroContext(
  changeAddress: string,
): Promise<OuroContext> {
  const { pubKeyHash: ownerVkh } = deserializeAddress(changeAddress);
  if (!ownerVkh) {
    throw new Error("Wallet address has no payment key hash.");
  }

  const deployment = loadDeployment("preprod");
  const provider = getPreprodProvider();
  const vaultAddress = vaultAddressForOwner(ownerVkh, deployment);

  const [vaults, oracle] = await Promise.all([
    findVaultUtxos(provider, vaultAddress),
    loadOracle(provider, deployment),
  ]);
  // Each deposit creates a fresh vault UTxO, so after a top-up two vaults sit
  // at the same address; borrow against the one with the most headroom.
  const vaultState = pickRichestVault(vaults, oracle.priceMicroUsd);

  const collateralLovelace = vaultState?.collateralLovelace ?? 0;
  const principalTusdm = vaultState?.principalTusdm ?? 0;
  const collateralUsd = collateralUsdValue(collateralLovelace, oracle.priceMicroUsd);
  // Bronze/0 mirrors the on-chain default: this route supplies no reputation
  // reference input, so vault.ak falls back to Bronze with 0 cumulative repaid.
  const maxBorrowMicro = maxBorrow(collateralUsd, "Bronze", 0);
  const maxDrawMicro = Math.max(0, maxBorrowMicro - principalTusdm);

  return {
    provider,
    deployment,
    ownerVkh,
    vaultAddress,
    vaultState,
    oracleUtxo: oracle.utxo,
    priceMicroUsd: oracle.priceMicroUsd,
    priceValidUntilPosixMs: oracle.validUntilPosixMs,
    maxBorrowMicro,
    maxDrawMicro,
  };
}

/** Loads the FRESHEST price UTxO at the oracle address. Old price UTxOs are
 * never consumed by a re-post, so expired datums pile up there — picking by
 * latest deadline means a re-post takes effect with no deployment-record
 * update. */
async function loadOracle(
  provider: OuroProvider,
  deployment: OuroDeployment,
): Promise<{ utxo: UTxO; priceMicroUsd: number; validUntilPosixMs: number }> {
  const utxos = await provider.fetchAddressUTxOs(deployment.oracleAddress);
  const freshest = pickFreshestOraclePrice(utxos);
  if (!freshest) {
    throw new Error("Oracle price UTxO not found on-chain.");
  }
  return freshest;
}
