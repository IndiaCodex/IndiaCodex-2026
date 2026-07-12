"use client";

import { useCallback, useEffect, useState } from "react";
import type { UTxO } from "@meshsdk/core";
import { useOuroWallet } from "@/components/wallet/WalletContext";
import { PRICE_STALE_MS, useVaultData } from "@/components/vault/VaultDataContext";
import { InfoTip } from "@/components/ui/InfoTip";
import { useToast } from "@/components/ui/Toast";
import { collateralUsdValue, maxBorrow, netAfterFee } from "@ouro/offchain/ledger/ltv";
import { recordActivity } from "@/lib/activity";
import { formatAda, formatPercent, formatTUsdm, formatUsd } from "@/lib/format";
import { ORIGINATION_FEE_BPS } from "@/lib/mockConstants";
import {
  DepositReviewModal,
  type DepositReview,
} from "./DepositReviewModal";
import { TxSuccessModal, type TxKind } from "./TxSuccessModal";
import styles from "./borrow-panel.module.css";

/** 10 tADA: safely above the 5 tADA server-side collateral floor. */
const COLLATERAL_UTXO_LOVELACE = 10_000_000;

/** Minimum pure-ADA a UTxO must hold to serve as Plutus collateral. */
const COLLATERAL_MIN_LOVELACE = 5_000_000;

/** Kept back from "Max" deposits so fees + min-change never bounce the tx. */
const MAX_DEPOSIT_BUFFER_ADA = 5;

/** Below this the wallet can't really exercise the flow; point at the faucet. */
const LOW_BALANCE_ADA = 10;

const FAUCET_URL = "https://docs.cardano.org/cardano-testnets/tools/faucet/";

/** Refresh the "updated Xs ago" label without waiting for a re-render. */
const PRICE_AGE_TICK_MS = 10_000;

const PENDING_LABEL: Record<"deposit" | "borrow" | "repay", string> = {
  deposit: "Deposit",
  borrow: "Borrow",
  repay: "Repay",
};

/**
 * Real wallet state (via the app wallet context) and real live ADA/USD price
 * and vault state (via the shared VaultDataProvider, which polls /api/price
 * and /api/vault/state for every dashboard panel at once). LTV math uses the
 * exact same formulas as ouro/onchain/lib/ouro/ltv.ak (via
 * @ouro/offchain/ledger/ltv).
 *
 * The connected `wallet` is a @meshsdk/core BrowserWallet (see
 * WalletContext.tsx) — the same well-typed client ouro/offchain's tx builders
 * are designed against. Reputation tier defaults to Bronze/0, matching the
 * on-chain default for a borrower with no reputation UTxO yet.
 */
export function BorrowPanel() {
  const { connected, wallet } = useOuroWallet();
  const {
    price,
    priceError,
    priceReceivedAt,
    vaultState,
    refreshVaultState,
    pendingTx,
    markTxPending,
  } = useVaultData();
  const { showToast } = useToast();
  const [collateralAda, setCollateralAda] = useState("1000");
  const [walletBalanceAda, setWalletBalanceAda] = useState<number | null>(null);
  const [hasCollateralUtxo, setHasCollateralUtxo] = useState<boolean | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [depositTxHash, setDepositTxHash] = useState<string | null>(null);
  const [depositReview, setDepositReview] = useState<
    (DepositReview & { unsignedTx: string }) | null
  >(null);
  const [depositSigning, setDepositSigning] = useState(false);
  const [borrowTusdm, setBorrowTusdm] = useState("");
  const [borrowTxHash, setBorrowTxHash] = useState<string | null>(null);
  const [borrowError, setBorrowError] = useState<string | null>(null);
  const [borrowPending, setBorrowPending] = useState(false);
  const [collateralFixPending, setCollateralFixPending] = useState(false);
  const [collateralFixTxHash, setCollateralFixTxHash] = useState<string | null>(
    null,
  );
  const [successTx, setSuccessTx] = useState<{
    kind: TxKind;
    hash: string;
  } | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), PRICE_AGE_TICK_MS);
    return () => clearInterval(id);
  }, []);

  /** Reads spendable balance AND whether a usable Plutus collateral UTxO
   * (pure-ADA ≥5 tADA) exists — checking both regular UTxOs and the wallet's
   * dedicated CIP-30 collateral. Drives the proactive one-time setup card. */
  const refreshWalletFunds = useCallback(async () => {
    if (!wallet) {
      setWalletBalanceAda(null);
      setHasCollateralUtxo(null);
      return;
    }
    try {
      const [utxos, collateral] = await Promise.all([
        wallet.getUtxos(),
        wallet.getCollateral().catch(() => [] as UTxO[]),
      ]);
      const totalLovelace = utxos.reduce((sum, utxo) => {
        const lovelace = utxo.output.amount.find((a) => a.unit === "lovelace");
        return sum + (lovelace ? Number(lovelace.quantity) : 0);
      }, 0);
      setWalletBalanceAda(totalLovelace / 1_000_000);

      const pool = [...utxos, ...collateral];
      const hasPureAdaCollateral = pool.some((u) => {
        const isPureAda = u.output.amount.every((a) => a.unit === "lovelace");
        if (!isPureAda) return false;
        const lovelace = u.output.amount.reduce(
          (sum, a) => sum + Number(a.quantity),
          0,
        );
        return lovelace >= COLLATERAL_MIN_LOVELACE;
      });
      setHasCollateralUtxo(hasPureAdaCollateral);
    } catch {
      setWalletBalanceAda(null);
      setHasCollateralUtxo(null);
    }
  }, [wallet]);

  useEffect(() => {
    void refreshWalletFunds();
  }, [refreshWalletFunds]);

  async function handleBorrow() {
    setBorrowError(null);
    setBorrowTxHash(null);
    setBorrowPending(true);
    try {
      if (!wallet) throw new Error("Connect a wallet first.");
      const drawTusdm = Math.round(Number(borrowTusdm) * 1_000_000);
      if (!Number.isFinite(drawTusdm) || drawTusdm <= 0) {
        throw new Error("Enter an amount of tUSDM to borrow.");
      }

      // The server rebuilds the borrow tx against live vault + oracle state and
      // adds the admin's required co-signature (reserve.ak gates the mint on
      // the admin key); it returns a PARTIALLY signed tx. The wallet adds the
      // owner signature and submits — the owner key stays in the extension.
      //
      // The wallet's dedicated collateral UTxOs (CIP-30 getCollateral) ride
      // along: after a prior borrow, wallets often consolidate change so every
      // regular UTxO carries tUSDM, leaving no pure-ADA UTxO for the server's
      // Plutus-collateral pick unless the reserved one is included.
      const changeAddress = await wallet.getChangeAddress();
      const [walletUtxos, collateralUtxos] = await Promise.all([
        wallet.getUtxos(),
        wallet.getCollateral().catch(() => [] as UTxO[]),
      ]);
      const seen = new Set(
        walletUtxos.map((u) => `${u.input.txHash}#${u.input.outputIndex}`),
      );
      const utxos = [
        ...walletUtxos,
        ...collateralUtxos.filter(
          (u) => !seen.has(`${u.input.txHash}#${u.input.outputIndex}`),
        ),
      ];
      const res = await fetch("/api/borrow/build", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ changeAddress, utxos, drawTusdm }),
      });
      const body = (await res.json()) as {
        partialSignedTx?: string;
        error?: string;
      };
      if (!res.ok || !body.partialSignedTx) {
        throw new Error(body.error ?? "Failed to build borrow transaction.");
      }

      const fullySigned = await wallet.signTx(body.partialSignedTx, true);
      const hash = await wallet.submitTx(fullySigned);
      setBorrowTxHash(hash);
      setSuccessTx({ kind: "borrow", hash });
      recordActivity({
        kind: "borrow",
        txHash: hash,
        amountLabel: formatTUsdm(drawTusdm / 1_000_000),
      });
      markTxPending("borrow");
      setBorrowTusdm("");
      await refreshVaultState();
      void refreshWalletFunds();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Borrow failed";
      setBorrowError(message);
      showToast(message);
    } finally {
      setBorrowPending(false);
    }
  }

  /** A self-send output is always pure ADA — exactly what the Plutus
   * collateral pick needs when every wallet UTxO carries tUSDM. */
  async function handleCreateCollateralUtxo() {
    if (!wallet) return;
    setCollateralFixPending(true);
    setCollateralFixTxHash(null);
    try {
      // Loaded on demand: the tx builder is heavy and this path only runs
      // when a wallet has no usable collateral UTxO.
      const { Transaction } = await import("@meshsdk/core");
      const selfAddress = await wallet.getChangeAddress();
      const unsigned = await new Transaction({ initiator: wallet })
        .sendLovelace(selfAddress, COLLATERAL_UTXO_LOVELACE.toString())
        .build();
      const signed = await wallet.signTx(unsigned);
      const hash = await wallet.submitTx(signed);
      setCollateralFixTxHash(hash);
      setSuccessTx({ kind: "collateral", hash });
      recordActivity({
        kind: "collateral",
        txHash: hash,
        amountLabel: formatAda(COLLATERAL_UTXO_LOVELACE / 1_000_000),
      });
      setBorrowError(null);
      void refreshWalletFunds();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not create a collateral UTxO";
      setBorrowError(message);
      showToast(message);
    } finally {
      setCollateralFixPending(false);
    }
  }

  const collateralLovelace = Math.max(0, Math.round(Number(collateralAda) * 1_000_000));
  const collateralUsdMicro = price
    ? collateralUsdValue(collateralLovelace, price.priceMicroUsd)
    : 0;
  const collateralUsd = collateralUsdMicro / 1_000_000;

  // No live reputation read yet (needs a network provider) - Bronze/0 is
  // the correct, honest default a brand-new borrower actually gets.
  const grossBorrowMicro = maxBorrow(collateralUsdMicro, "Bronze", 0);
  const netBorrowMicro = netAfterFee(grossBorrowMicro, ORIGINATION_FEE_BPS);
  const feeMicro = grossBorrowMicro - netBorrowMicro;

  // Live preview for the borrow (step 2): what the entered amount pays out
  // after the origination fee.
  const borrowDrawMicro = Math.max(0, Math.round(Number(borrowTusdm) * 1_000_000));
  const borrowNetMicro = netAfterFee(borrowDrawMicro, ORIGINATION_FEE_BPS);
  const depositMeetsMin = collateralLovelace >= 5_000_000;
  // Mirrors the server's LTV gate so an over-limit amount is stopped here,
  // with the max visible, instead of as a rejected round-trip.
  const borrowExceedsMax =
    vaultState !== null && borrowDrawMicro > vaultState.maxDrawMicro;
  const needsCollateralFix =
    borrowError !== null && /plutus collateral/i.test(borrowError);
  // Fully drawn: the borrow controls are pointless — explain the state and
  // point at the deposit flow instead of leaving a dead disabled button.
  const borrowLimitReached =
    vaultState !== null && vaultState.hasVault && vaultState.maxDrawMicro <= 0;

  const maxDepositAda = Math.max(
    0,
    Math.floor(((walletBalanceAda ?? 0) - MAX_DEPOSIT_BUFFER_ADA) * 100) / 100,
  );
  const showFaucetHint =
    connected &&
    walletBalanceAda !== null &&
    walletBalanceAda < LOW_BALANCE_ADA;

  const priceAgeMs =
    priceReceivedAt !== null ? Math.max(0, nowTick - priceReceivedAt) : null;
  const priceIsStale = priceAgeMs !== null && priceAgeMs > PRICE_STALE_MS;
  const priceAgeLabel =
    priceAgeMs === null
      ? null
      : priceAgeMs < 60_000
        ? `${Math.round(priceAgeMs / 1_000)}s ago`
        : `${Math.round(priceAgeMs / 60_000)}m ago`;

  async function handleDeposit() {
    setActionError(null);
    setDepositTxHash(null);
    setActionPending(true);
    try {
      if (!wallet) throw new Error("Connect a wallet first.");
      if (collateralLovelace < 5_000_000) {
        throw new Error("Minimum deposit is 5 tADA.");
      }

      // The server derives this user's own (per-owner) vault address from the
      // compiled blueprint and coin-selects against a Blockfrost fetcher whose
      // key never leaves the server; it returns an UNSIGNED tx plus the vault
      // address. Nothing is signed here — the tx is held for the review modal
      // and only handed to the wallet extension after the user confirms.
      const changeAddress = await wallet.getChangeAddress();
      const res = await fetch("/api/deposit/build", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ changeAddress, collateralLovelace }),
      });
      const body = (await res.json()) as {
        unsignedTx?: string;
        vaultAddress?: string;
        collateralReservedLovelace?: number;
        error?: string;
      };
      if (!res.ok || !body.unsignedTx || !body.vaultAddress) {
        throw new Error(body.error ?? "Failed to build deposit transaction.");
      }

      setDepositReview({
        unsignedTx: body.unsignedTx,
        vaultAddress: body.vaultAddress,
        fromAddress: changeAddress,
        collateralLovelace,
        collateralReservedLovelace: body.collateralReservedLovelace ?? 0,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Deposit failed";
      setActionError(message);
      showToast(message);
    } finally {
      setActionPending(false);
    }
  }

  async function handleDepositConfirm() {
    if (!depositReview || !wallet) return;
    setDepositSigning(true);
    try {
      const signedTx = await wallet.signTx(depositReview.unsignedTx, false);
      const hash = await wallet.submitTx(signedTx);
      setDepositTxHash(hash);
      setSuccessTx({ kind: "deposit", hash });
      recordActivity({
        kind: "deposit",
        txHash: hash,
        amountLabel: formatAda(depositReview.collateralLovelace / 1_000_000),
      });
      markTxPending("deposit");
      setDepositReview(null);

      // Reflect the spent collateral and the newly reserved collateral UTxO.
      void refreshWalletFunds();
      // The vault UTxO takes ~20-60s to confirm before it's borrowable; kick
      // off a refresh so the Borrow section appears once it lands.
      void refreshVaultState();
    } catch (error: unknown) {
      // A declined signature invalidates nothing on-chain; drop the built tx
      // and surface why under the deposit button.
      setDepositReview(null);
      const message =
        error instanceof Error ? error.message : "Deposit failed";
      setActionError(message);
      showToast(message);
    } finally {
      setDepositSigning(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="borrow-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.stepTag}>
            <span className={styles.stepNum}>1</span> Deposit collateral
          </p>
          <h2 id="borrow-heading" className={styles.title}>
            Lock tADA to unlock tUSDM
          </h2>
        </div>
        <span
          className={`${styles.placeholderTag} ${priceIsStale ? styles.placeholderTagStale : ""}`}
        >
          {price
            ? priceIsStale
              ? `price ${priceAgeLabel} — refreshing`
              : `live · ${price.source}${priceAgeLabel ? ` · ${priceAgeLabel}` : ""}`
            : priceError
              ? "price unavailable"
              : "loading price…"}
        </span>
      </header>

      <div className={styles.inputRow}>
        <label className={styles.fieldLabel} htmlFor="collateral-input">
          How much tADA do you want to lock?
        </label>
        <div className={styles.fieldControl}>
          <input
            id="collateral-input"
            className={`${styles.fieldInput} mono-figure`}
            type="text"
            inputMode="decimal"
            value={collateralAda}
            onChange={(e) => setCollateralAda(e.target.value)}
            aria-describedby="collateral-hint"
          />
          {connected && walletBalanceAda !== null && maxDepositAda > 0 && (
            <button
              type="button"
              className={styles.maxButton}
              aria-label="Max deposit"
              onClick={() => setCollateralAda(maxDepositAda.toString())}
            >
              Max
            </button>
          )}
          <span className={styles.fieldSuffix}>tADA</span>
        </div>
        <p id="collateral-hint" className={styles.fieldHint}>
          {connected
            ? walletBalanceAda !== null
              ? `Wallet balance: ${formatAda(walletBalanceAda)}. Max keeps ${MAX_DEPOSIT_BUFFER_ADA} tADA back for fees.`
              : "Reading wallet balance…"
            : "Connect a wallet to see your real balance."}
          {showFaucetHint && (
            <>
              {" "}
              Low on tADA?{" "}
              <a href={FAUCET_URL} target="_blank" rel="noreferrer">
                Get free preprod funds from the faucet
              </a>
              .
            </>
          )}
        </p>
      </div>

      <div className={styles.calc} aria-label="Borrowing power calculation">
        <div className={styles.calcRow}>
          <span className={styles.calcLabel}>You deposit</span>
          <span className={`${styles.calcValue} mono-figure`}>
            {formatAda(Number(collateralAda) || 0)}
          </span>
        </div>
        <div className={styles.calcRow}>
          <span className={styles.calcLabel}>
            Collateral value
            <InfoTip label="How is my collateral valued?">
              Your locked tADA priced at the live ADA/USD oracle rate. The
              oracle only sizes borrow limits — Ouro has no liquidations, so a
              falling price never closes your position.
            </InfoTip>
          </span>
          <span className={`${styles.calcValue} mono-figure`}>
            {price ? formatUsd(collateralUsd) : "—"}
            {price && (
              <span className={styles.calcSub}>
                at {formatUsd(price.priceMicroUsd / 1_000_000, 4)} / ADA
              </span>
            )}
          </span>
        </div>
        <div className={styles.calcRow}>
          <span className={styles.calcLabel}>
            Your tier
            <InfoTip label="What are tiers?">
              Loan-to-value (LTV) is how much you can borrow against your
              collateral. Everyone starts at Bronze (50%). Repaying loans
              builds an on-chain passport that unlocks Silver (65%) and Gold
              (80% + a small credit line).
            </InfoTip>
          </span>
          <span className={styles.calcValue}>
            Bronze
            <span className={styles.calcSub}>50% loan-to-value</span>
          </span>
        </div>

        <div className={styles.calcDivider} />

        <div className={styles.calcRow}>
          <span className={styles.calcLabel}>Max borrow</span>
          <span className={`${styles.calcValue} mono-figure`}>
            {formatTUsdm(grossBorrowMicro / 1_000_000)}
          </span>
        </div>
        <div className={styles.calcRow}>
          <span className={styles.calcLabel}>
            Origination fee ({formatPercent(ORIGINATION_FEE_BPS)})
            <InfoTip label="What is the origination fee?">
              A one-time {formatPercent(ORIGINATION_FEE_BPS)} fee taken from
              each draw — the protocol&rsquo;s only upfront charge. There is no
              recurring interest; staking yield repays the balance instead.
            </InfoTip>
          </span>
          <span className={`${styles.calcValue} ${styles.calcValueMuted} mono-figure`}>
            −{formatTUsdm(feeMicro / 1_000_000)}
          </span>
        </div>

        <div className={styles.calcDivider} />

        <div className={`${styles.calcRow} ${styles.calcTotalRow}`}>
          <span className={styles.calcTotalLabel}>You can borrow up to</span>
          <span className={`${styles.calcTotalValue} mono-figure`}>
            {formatTUsdm(netBorrowMicro / 1_000_000)}
          </span>
        </div>
      </div>

      <button
        type="button"
        className={`${styles.borrowButton} ${actionPending ? styles.pending : ""}`}
        onClick={handleDeposit}
        disabled={!wallet || actionPending || !price || !depositMeetsMin}
      >
        {actionPending ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Preparing transaction…
          </>
        ) : !connected ? (
          "Connect a wallet to deposit"
        ) : !depositMeetsMin ? (
          "Enter at least 5 tADA"
        ) : (
          `Deposit ${formatAda(Number(collateralAda) || 0)}`
        )}
      </button>
      {depositReview && (
        <DepositReviewModal
          review={depositReview}
          signing={depositSigning}
          onConfirm={handleDepositConfirm}
          onCancel={() => setDepositReview(null)}
        />
      )}
      {successTx && (
        <TxSuccessModal
          kind={successTx.kind}
          txHash={successTx.hash}
          onClose={() => setSuccessTx(null)}
        />
      )}
      {actionError && <p className={styles.formNote}>{actionError}</p>}
      {depositTxHash && (
        <p className={styles.formNote}>
          Deposit submitted ·{" "}
          <a
            href={`https://preprod.cardanoscan.io/transaction/${depositTxHash}`}
            target="_blank"
            rel="noreferrer"
          >
            view on Cardanoscan
          </a>
        </p>
      )}
      {pendingTx && (
        <p className={styles.pendingChip} role="status">
          <span className={styles.pendingDot} aria-hidden="true" />
          {PENDING_LABEL[pendingTx.kind]} confirming on-chain — usually
          20–60&nbsp;s. These numbers update by themselves.
        </p>
      )}

      {connected && vaultState?.hasVault && (
        <div className={styles.borrowSection}>
          <header className={styles.header}>
            <div>
              <p className={styles.stepTag}>
                <span className={styles.stepNum}>2</span> Borrow tUSDM
              </p>
              <h3 className={styles.subtitle}>Your vault is live — draw against it</h3>
            </div>
          </header>

          {hasCollateralUtxo === false && !collateralFixTxHash && (
            <div className={styles.collateralSetup}>
              <div>
                <p className={styles.collateralSetupTitle}>
                  One-time collateral setup
                </p>
                <p className={styles.collateralSetupBody}>
                  Cardano smart-contract transactions need a small pure-ADA
                  collateral UTxO. This sends 10&nbsp;tADA to yourself to create
                  one — you keep it, and it&rsquo;s reused for every borrow and
                  repay, so you won&rsquo;t see this again.
                </p>
              </div>
              <button
                type="button"
                className={styles.collateralSetupButton}
                onClick={handleCreateCollateralUtxo}
                disabled={collateralFixPending}
              >
                {collateralFixPending
                  ? "Confirm in your wallet…"
                  : "Set up collateral"}
              </button>
            </div>
          )}

          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt>Collateral locked</dt>
              <dd className="mono-figure">
                {formatAda(vaultState.collateralLovelace / 1_000_000)}
              </dd>
            </div>
            <div className={styles.stat}>
              <dt>Current debt</dt>
              <dd className="mono-figure">
                {formatTUsdm(vaultState.principalTusdm / 1_000_000)}
              </dd>
            </div>
            <div className={styles.stat}>
              <dt>
                Available to borrow
                <InfoTip label="How is this limit computed?">
                  Collateral value × your tier&rsquo;s LTV, minus what you
                  already owe. Topping up collateral — or repaying — raises
                  it.
                </InfoTip>
              </dt>
              <dd className="mono-figure">
                {formatTUsdm(vaultState.maxDrawMicro / 1_000_000)}
              </dd>
            </div>
          </dl>

          {borrowLimitReached ? (
            <p className={styles.limitNote}>
              You&rsquo;ve already borrowed{" "}
              <strong className="mono-figure">
                {formatTUsdm(vaultState.principalTusdm / 1_000_000)}
              </strong>{" "}
              — the full limit for your{" "}
              {formatAda(vaultState.collateralLovelace / 1_000_000)} collateral.
              Deposit more tADA above to borrow more.
            </p>
          ) : (
            <>
          <div className={styles.inputRow}>
            <label className={styles.fieldLabel} htmlFor="borrow-input">
              How much tUSDM do you want to borrow?
            </label>
            <div className={styles.fieldControl}>
              <input
                id="borrow-input"
                className={`${styles.fieldInput} mono-figure`}
                type="text"
                inputMode="decimal"
                value={borrowTusdm}
                placeholder={(vaultState.maxDrawMicro / 1_000_000).toString()}
                onChange={(e) => setBorrowTusdm(e.target.value)}
                aria-describedby="borrow-hint"
              />
              <button
                type="button"
                className={styles.maxButton}
                onClick={() =>
                  setBorrowTusdm((vaultState.maxDrawMicro / 1_000_000).toString())
                }
              >
                Max
              </button>
              <span className={styles.fieldSuffix}>tUSDM</span>
            </div>
            <p id="borrow-hint" className={styles.fieldHint}>
              Max {formatTUsdm(vaultState.maxDrawMicro / 1_000_000)} at your
              current collateral.
            </p>
          </div>

          {borrowDrawMicro > 0 && (
            <div className={styles.calc} aria-label="Borrow payout">
              <div className={styles.calcRow}>
                <span className={styles.calcLabel}>You borrow</span>
                <span className={`${styles.calcValue} mono-figure`}>
                  {formatTUsdm(borrowDrawMicro / 1_000_000)}
                </span>
              </div>
              <div className={styles.calcRow}>
                <span className={styles.calcLabel}>
                  Origination fee ({formatPercent(ORIGINATION_FEE_BPS)})
                </span>
                <span className={`${styles.calcValue} ${styles.calcValueMuted} mono-figure`}>
                  −{formatTUsdm((borrowDrawMicro - borrowNetMicro) / 1_000_000)}
                </span>
              </div>
              <div className={styles.calcDivider} />
              <div className={`${styles.calcRow} ${styles.calcTotalRow}`}>
                <span className={styles.calcTotalLabel}>Lands in your wallet</span>
                <span className={`${styles.calcTotalValue} mono-figure`}>
                  {formatTUsdm(borrowNetMicro / 1_000_000)}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            className={`${styles.borrowButton} ${borrowPending ? styles.pending : ""}`}
            onClick={handleBorrow}
            disabled={
              borrowPending ||
              vaultState.maxDrawMicro <= 0 ||
              borrowDrawMicro <= 0 ||
              borrowExceedsMax
            }
          >
            {borrowPending ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Confirm in your wallet…
              </>
            ) : borrowDrawMicro <= 0 ? (
              "Enter an amount to borrow"
            ) : borrowExceedsMax ? (
              `Over your limit — max ${formatTUsdm(vaultState.maxDrawMicro / 1_000_000)}`
            ) : (
              `Borrow ${formatTUsdm(borrowDrawMicro / 1_000_000)}`
            )}
          </button>
            </>
          )}
          {borrowError && (
            <p className={styles.formNote} role="alert">
              {borrowError}
            </p>
          )}
          {needsCollateralFix && (
            <button
              type="button"
              className={styles.helperButton}
              onClick={handleCreateCollateralUtxo}
              disabled={collateralFixPending}
            >
              {collateralFixPending
                ? "Confirm in your wallet…"
                : "Create collateral UTxO — send 10 tADA to yourself"}
            </button>
          )}
          {collateralFixTxHash && (
            <p className={styles.formNote}>
              Collateral UTxO created · wait ~30s for it to confirm, then borrow
              again ·{" "}
              <a
                href={`https://preprod.cardanoscan.io/transaction/${collateralFixTxHash}`}
                target="_blank"
                rel="noreferrer"
              >
                view on Cardanoscan
              </a>
            </p>
          )}
          {borrowTxHash && (
            <p className={styles.formNote}>
              Borrow submitted ·{" "}
              <a
                href={`https://preprod.cardanoscan.io/transaction/${borrowTxHash}`}
                target="_blank"
                rel="noreferrer"
              >
                view on Cardanoscan
              </a>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
