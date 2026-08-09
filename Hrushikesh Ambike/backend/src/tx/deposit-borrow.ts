// Deposit and Borrow are necessarily TWO separate transactions: vault.ak's
// Borrow redeemer only fires when SPENDING an existing vault UTxO, and a
// transaction can't spend an output it creates itself. Deposit is a plain
// send (no validator involved - vault.ak only gets invoked when spending
// FROM its address, not when receiving into it); Borrow spends that vault
// UTxO, recreates it with a higher principal_tusdm, and mints tUSDM.
//
// Borrow requires TWO signers in the same transaction: the owner (vault.ak
// checks extra_signatories for d.owner) and the admin (reserve.ak's mint
// is gated on admin_vkh - see validators/reserve.ak for why). This mirrors
// oracle-poster.ts's dependency-injection pattern: real Mesh builder calls,
// with a live devnet/provider required to actually complete().
import {
  type IFetcher,
  type ISubmitter,
  type PlutusScript,
  type UTxO,
  MeshTxBuilder,
  integer,
} from "@meshsdk/core";
import {
  buildBorrowRedeemer,
  buildRepayRedeemer,
  buildVaultDatum,
  type Tier,
} from "./datums";

export interface DepositWallet {
  getChangeAddress(): Promise<string>;
  getUtxos(): Promise<UTxO[]>;
  signTx(unsignedTx: string, partialSign?: boolean): Promise<string>;
}

/** Removes the chosen collateral UTxO from the coin-selection pool so it is
 * never spent as a regular fee/value input. A Plutus collateral input is
 * returned untouched on success, so keeping it out of selection lets the SAME
 * pure-ADA UTxO be reused as collateral borrow after borrow — the fix for the
 * "no pure-ADA UTxO for collateral" error recurring every time. Falls back to
 * the full set if excluding it would leave nothing to fund the tx (better a
 * consumed collateral than a tx that can't balance). */
function selectionExcludingCollateral(
  utxos: UTxO[],
  collateral: UTxO,
): UTxO[] {
  const filtered = utxos.filter(
    (u) =>
      !(
        u.input.txHash === collateral.input.txHash &&
        u.input.outputIndex === collateral.input.outputIndex
      ),
  );
  return filtered.length > 0 ? filtered : utxos;
}

export interface DepositDeps {
  wallet: DepositWallet;
  fetcher: IFetcher;
  submitter: ISubmitter;
}

export interface DepositParams {
  ownerVkh: string;
  collateralLovelace: number;
  vaultAddress: string;
}

/** Build-only deposit assembly, decoupled from any signing key. The web app
 * calls this SERVER-SIDE: the server holds the Blockfrost fetcher (to resolve
 * protocol params + coin-select the caller's UTxOs) but never the user's
 * signing key. It returns the unsigned CBOR for the browser wallet to sign and
 * submit itself. `buildDepositTx` below wraps this for the Node/e2e path. */
export interface BuildDepositUnsignedDeps {
  fetcher: IFetcher;
}

export interface BuildDepositUnsignedParams extends DepositParams {
  /** The depositor's own change/return address (their wallet). */
  changeAddress: string;
  /** The depositor's spendable UTxOs, for coin selection. */
  utxos: UTxO[];
  /** When set (>0), the deposit also sends this many lovelace back to the
   * depositor as a DEDICATED pure-ADA UTxO — a reusable Plutus collateral
   * input so future borrow/repay never fail for lack of one. The ADA stays in
   * the user's own wallet; it is only ever pledged as collateral (untouched on
   * success), never spent. */
  collateralReserveLovelace?: number;
}

export async function buildDepositTxUnsigned(
  deps: BuildDepositUnsignedDeps,
  params: BuildDepositUnsignedParams,
): Promise<string> {
  const txBuilder = new MeshTxBuilder({ fetcher: deps.fetcher });

  const datum = buildVaultDatum({
    ownerVkh: params.ownerVkh,
    principalTusdm: 0,
    collateralLovelace: params.collateralLovelace,
    tierAtOpen: "Bronze",
  });

  let builder = txBuilder
    .txOut(params.vaultAddress, [
      { unit: "lovelace", quantity: String(params.collateralLovelace) },
    ])
    .txOutInlineDatumValue(datum, "JSON");

  if (
    params.collateralReserveLovelace &&
    params.collateralReserveLovelace > 0
  ) {
    builder = builder.txOut(params.changeAddress, [
      { unit: "lovelace", quantity: String(params.collateralReserveLovelace) },
    ]);
  }

  return builder
    .changeAddress(params.changeAddress)
    .selectUtxosFrom(params.utxos)
    .complete();
}

/** Builds, signs, and submits the initial deposit: a plain send of ADA plus
 * an inline VaultDatum(principal_tusdm=0) to the vault's own address. */
export async function buildDepositTx(
  deps: DepositDeps,
  params: DepositParams,
): Promise<{ txHash: string }> {
  const changeAddress = await deps.wallet.getChangeAddress();
  const utxos = await deps.wallet.getUtxos();

  const unsignedTx = await buildDepositTxUnsigned(
    { fetcher: deps.fetcher },
    { ...params, changeAddress, utxos },
  );

  const signedTx = await deps.wallet.signTx(unsignedTx);
  const txHash = await deps.submitter.submitTx(signedTx);
  return { txHash };
}

export interface AdminSigner {
  signTx(unsignedTx: string, partialSign?: boolean): Promise<string>;
}

export interface BorrowDeps {
  wallet: DepositWallet;
  adminSigner: AdminSigner;
  fetcher: IFetcher;
  submitter: ISubmitter;
}

export interface BorrowParams {
  vaultUtxo: UTxO;
  vaultScript: PlutusScript;
  reserveScript: PlutusScript;
  tusdmPolicyId: string;
  tusdmAssetNameHex: string;
  oracleUtxo: UTxO;
  reputationUtxo?: UTxO;
  /** Pure-ADA collateral UTxO, SEPARATE from any fee input. Required because
   * this transaction executes Plutus scripts. */
  collateralUtxo: UTxO;
  ownerVkh: string;
  adminVkh: string;
  collateralLovelace: number;
  currentTierAtOpen: Tier;
  grossTusdm: number;
  netTusdm: number;
  /** Tx TTL as a SLOT. The ledger converts this to a POSIX-ms upper bound in
   * the script context; vault.ak requires that bound to be <= the oracle
   * datum's POSIX-ms deadline (`validUntilPosixMs`), else it treats the price
   * as stale and rejects the borrow. Keep the oracle's validity window well
   * above this TTL. */
  invalidHereafterSlot: number;
}

/** Build-only borrow assembly, decoupled from signing. Used SERVER-SIDE by
 * the web app: the server builds the tx (declaring BOTH owner and admin as
 * required signers) and the admin co-signs, then the browser wallet adds the
 * owner signature and submits. `newDatum.principalTusdm` here is the vault's
 * NEW TOTAL principal (current + this draw), because vault.ak derives the
 * borrowed delta as `new.principal - old.principal`; `netTusdm` is that
 * delta net of the origination fee (what actually gets minted). */
export interface BuildBorrowUnsignedDeps {
  fetcher: IFetcher;
}

export interface BuildBorrowUnsignedParams extends BorrowParams {
  changeAddress: string;
  utxos: UTxO[];
}

export async function buildBorrowTxUnsigned(
  deps: BuildBorrowUnsignedDeps,
  params: BuildBorrowUnsignedParams,
): Promise<string> {
  const sameSigner = params.ownerVkh === params.adminVkh;
  const txBuilder = new MeshTxBuilder({ fetcher: deps.fetcher });

  const newDatum = buildVaultDatum({
    ownerVkh: params.ownerVkh,
    principalTusdm: params.grossTusdm,
    collateralLovelace: params.collateralLovelace,
    tierAtOpen: params.currentTierAtOpen,
  });

  let builder = txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      params.vaultUtxo.input.txHash,
      params.vaultUtxo.input.outputIndex,
      params.vaultUtxo.output.amount,
      params.vaultUtxo.output.address,
    )
    .txInScript(params.vaultScript.code)
    .txInInlineDatumPresent()
    .txInRedeemerValue(buildBorrowRedeemer(), "JSON")
    .txOut(params.vaultUtxo.output.address, params.vaultUtxo.output.amount)
    .txOutInlineDatumValue(newDatum, "JSON")
    .mintPlutusScriptV3()
    .mint(String(params.netTusdm), params.tusdmPolicyId, params.tusdmAssetNameHex)
    .mintingScript(params.reserveScript.code)
    .mintRedeemerValue(integer(0), "JSON")
    .readOnlyTxInReference(
      params.oracleUtxo.input.txHash,
      params.oracleUtxo.input.outputIndex,
    )
    .txInCollateral(
      params.collateralUtxo.input.txHash,
      params.collateralUtxo.input.outputIndex,
      params.collateralUtxo.output.amount,
      params.collateralUtxo.output.address,
    );

  if (params.reputationUtxo) {
    builder = builder.readOnlyTxInReference(
      params.reputationUtxo.input.txHash,
      params.reputationUtxo.input.outputIndex,
    );
  }

  builder = builder.requiredSignerHash(params.ownerVkh);
  if (!sameSigner) {
    builder = builder.requiredSignerHash(params.adminVkh);
  }

  return builder
    .invalidHereafter(params.invalidHereafterSlot)
    .changeAddress(params.changeAddress)
    .selectUtxosFrom(
      selectionExcludingCollateral(params.utxos, params.collateralUtxo),
    )
    .complete();
}

/** Builds a Borrow transaction: spends the existing vault UTxO, recreates it
 * with a higher principal_tusdm, and mints the net tUSDM to the borrower.
 *
 * Signing: vault.ak requires the owner's signature and reserve.ak requires
 * the admin's. When owner and admin are the SAME key (a common
 * hackathon/single-operator setup) a single full signature satisfies both
 * required-signer checks. When they DIFFER, the owner partial-signs, then the
 * admin partial-signs - the two-party path a production server-side admin
 * route would use. */
export async function buildBorrowTx(
  deps: BorrowDeps,
  params: BorrowParams,
): Promise<{ txHash: string }> {
  const changeAddress = await deps.wallet.getChangeAddress();
  const utxos = await deps.wallet.getUtxos();
  const sameSigner = params.ownerVkh === params.adminVkh;

  const unsignedTx = await buildBorrowTxUnsigned(
    { fetcher: deps.fetcher },
    { ...params, changeAddress, utxos },
  );

  let signedTx: string;
  if (sameSigner) {
    signedTx = await deps.wallet.signTx(unsignedTx, false);
  } else {
    const ownerSigned = await deps.wallet.signTx(unsignedTx, true);
    signedTx = await deps.adminSigner.signTx(ownerSigned, true);
  }
  const txHash = await deps.submitter.submitTx(signedTx);
  return { txHash };
}

export interface RepayParams {
  vaultUtxo: UTxO;
  vaultScript: PlutusScript;
  reserveScript: PlutusScript;
  tusdmPolicyId: string;
  tusdmAssetNameHex: string;
  /** Pure-ADA collateral UTxO for Plutus execution — same requirement as
   * borrow (this tx runs the vault spend + reserve burn scripts). */
  collateralUtxo: UTxO;
  ownerVkh: string;
  adminVkh: string;
  collateralLovelace: number;
  currentTierAtOpen: Tier;
  /** The vault's principal AFTER this repayment (current − repayAmount). */
  newPrincipalTusdm: number;
  /** Micro-tUSDM burned this tx; vault.ak requires mint == −repayAmount. */
  repayAmount: number;
}

export interface BuildRepayUnsignedDeps {
  fetcher: IFetcher;
}

export interface BuildRepayUnsignedParams extends RepayParams {
  changeAddress: string;
  utxos: UTxO[];
}

/** Build-only Repay assembly, decoupled from signing. Mirrors the borrow
 * server path: the server declares both required signers (owner spends the
 * vault + owns the tUSDM being burned; admin gates the reserve burn) and
 * co-signs as admin, then the browser wallet adds the owner signature and
 * submits.
 *
 * vault.ak's Repay(amount) requires: mint == −amount of tUSDM (an actual
 * burn), new principal == old − amount, and collateral/owner unchanged. No
 * oracle is read on repay (unlike borrow), so no price reference input or
 * staleness TTL is needed. The tUSDM to burn is coin-selected from the
 * owner's own UTxOs. */
export async function buildRepayTxUnsigned(
  deps: BuildRepayUnsignedDeps,
  params: BuildRepayUnsignedParams,
): Promise<string> {
  const sameSigner = params.ownerVkh === params.adminVkh;
  const txBuilder = new MeshTxBuilder({ fetcher: deps.fetcher });

  const newDatum = buildVaultDatum({
    ownerVkh: params.ownerVkh,
    principalTusdm: params.newPrincipalTusdm,
    collateralLovelace: params.collateralLovelace,
    tierAtOpen: params.currentTierAtOpen,
  });

  let builder = txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      params.vaultUtxo.input.txHash,
      params.vaultUtxo.input.outputIndex,
      params.vaultUtxo.output.amount,
      params.vaultUtxo.output.address,
    )
    .txInScript(params.vaultScript.code)
    .txInInlineDatumPresent()
    .txInRedeemerValue(buildRepayRedeemer(params.repayAmount), "JSON")
    // Collateral is unchanged, so the continuing vault output keeps the same
    // value it came in with.
    .txOut(params.vaultUtxo.output.address, params.vaultUtxo.output.amount)
    .txOutInlineDatumValue(newDatum, "JSON")
    // Negative mint = burn; reserve.ak gates it on the admin signature.
    .mintPlutusScriptV3()
    .mint(
      String(-params.repayAmount),
      params.tusdmPolicyId,
      params.tusdmAssetNameHex,
    )
    .mintingScript(params.reserveScript.code)
    .mintRedeemerValue(integer(1), "JSON")
    .txInCollateral(
      params.collateralUtxo.input.txHash,
      params.collateralUtxo.input.outputIndex,
      params.collateralUtxo.output.amount,
      params.collateralUtxo.output.address,
    );

  builder = builder.requiredSignerHash(params.ownerVkh);
  if (!sameSigner) {
    builder = builder.requiredSignerHash(params.adminVkh);
  }

  return builder
    .changeAddress(params.changeAddress)
    .selectUtxosFrom(
      selectionExcludingCollateral(params.utxos, params.collateralUtxo),
    )
    .complete();
}
