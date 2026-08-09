"use client";

import { useCallback, useEffect, useState } from "react";
import type { UTxO } from "@meshsdk/core";
import { useOuroWallet } from "@/components/wallet/WalletContext";
import { useVaultData } from "@/components/vault/VaultDataContext";
import { InfoTip } from "@/components/ui/InfoTip";
import { useToast } from "@/components/ui/Toast";
import { recordActivity } from "@/lib/activity";
import { formatTUsdm } from "@/lib/format";
import { TxSuccessModal } from "./TxSuccessModal";
import styles from "./repay-panel.module.css";

const MICRO = 1_000_000;

/**
 * Step 3 of the loan lifecycle: repay tUSDM to shrink the debt on-chain. The
 * server rebuilds the Repay tx against live vault state and co-signs the burn
 * as admin (reserve.ak gates burns on the admin key, same as mints); the
 * browser wallet adds the owner signature and submits.
 *
 * The real cap on repayment is min(outstanding debt, tUSDM the wallet holds).
 * Because a borrow credits net-of-fee tUSDM but records the gross as debt, a
 * borrower can't fully zero a vault from borrowed funds alone — the last sliver
 * is what the automatic self-repay (harvest) is designed to cover. This panel
 * makes that explicit rather than offering a Max that would fail on-chain.
 */
export function RepayPanel() {
  const { connected, wallet } = useOuroWallet();
  const { vaultState, refreshVaultState, markTxPending } = useVaultData();
  const { showToast } = useToast();
  const [heldTusdmMicro, setHeldTusdmMicro] = useState<number | null>(null);
  const [repayTusdm, setRepayTusdm] = useState("");
  const [repayPending, setRepayPending] = useState(false);
  const [repayError, setRepayError] = useState<string | null>(null);
  const [successHash, setSuccessHash] = useState<string | null>(null);

  const tusdmUnit = vaultState?.tusdmUnit ?? null;

  const readHeldTusdm = useCallback(async () => {
    if (!wallet || !tusdmUnit) {
      setHeldTusdmMicro(null);
      return;
    }
    try {
      const utxos = await wallet.getUtxos();
      const held = utxos.reduce((sum, utxo) => {
        const asset = utxo.output.amount.find((a) => a.unit === tusdmUnit);
        return sum + (asset ? Number(asset.quantity) : 0);
      }, 0);
      setHeldTusdmMicro(held);
    } catch {
      setHeldTusdmMicro(null);
    }
  }, [wallet, tusdmUnit]);

  useEffect(() => {
    void readHeldTusdm();
  }, [readHeldTusdm]);

  const principalMicro = vaultState?.principalTusdm ?? 0;
  // On-chain repay burns tUSDM the wallet must actually hold, and can't exceed
  // the debt — the payable ceiling is the smaller of the two.
  const repayableMicro =
    heldTusdmMicro === null
      ? principalMicro
      : Math.min(principalMicro, heldTusdmMicro);

  const repayDrawMicro = Math.max(0, Math.round(Number(repayTusdm) * MICRO));
  const exceedsRepayable = repayDrawMicro > repayableMicro;
  const debtAfterMicro = Math.max(0, principalMicro - repayDrawMicro);
  const shortOfFull =
    heldTusdmMicro !== null && heldTusdmMicro < principalMicro;

  async function handleRepay() {
    setRepayError(null);
    setRepayPending(true);
    try {
      if (!wallet) throw new Error("Connect a wallet first.");
      const amount = Math.round(Number(repayTusdm) * MICRO);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter an amount of tUSDM to repay.");
      }

      // Same input assembly as borrow: regular UTxOs plus the wallet's
      // dedicated collateral UTxO (Plutus execution needs a pure-ADA input,
      // and the tUSDM to burn is coin-selected from these).
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

      const res = await fetch("/api/repay/build", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ changeAddress, utxos, repayTusdm: amount }),
      });
      const body = (await res.json()) as {
        partialSignedTx?: string;
        error?: string;
      };
      if (!res.ok || !body.partialSignedTx) {
        throw new Error(body.error ?? "Failed to build repay transaction.");
      }

      const fullySigned = await wallet.signTx(body.partialSignedTx, true);
      const hash = await wallet.submitTx(fullySigned);
      setSuccessHash(hash);
      recordActivity({
        kind: "repay",
        txHash: hash,
        amountLabel: formatTUsdm(amount / MICRO),
      });
      markTxPending("repay");
      setRepayTusdm("");
      await Promise.all([refreshVaultState(), readHeldTusdm()]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Repay failed";
      setRepayError(message);
      showToast(message);
    } finally {
      setRepayPending(false);
    }
  }

  // Only meaningful once a connected wallet has a vault carrying debt.
  if (!connected || !vaultState?.hasVault || principalMicro <= 0) {
    return null;
  }

  return (
    <section className={styles.panel} aria-labelledby="repay-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.stepTag}>
            <span className={styles.stepNum}>3</span> Repay &amp; build reputation
          </p>
          <h2 id="repay-heading" className={styles.title}>
            Shrink your debt on demand
            <InfoTip label="Why repay?">
              Repaying burns tUSDM and lowers your on-chain debt immediately.
              Each repaid loan builds your Borrower Passport toward Silver and
              Gold — higher borrowing power over time.
            </InfoTip>
          </h2>
        </div>
      </header>

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>Current debt</dt>
          <dd className="mono-figure">{formatTUsdm(principalMicro / MICRO)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>
            tUSDM you hold
            <InfoTip label="Why does this cap repayment?">
              Repaying burns tUSDM from your wallet, so you can only repay what
              you hold. The 1% origination fee means a fresh borrow leaves you
              just under your debt — the automatic self-repay covers the rest.
            </InfoTip>
          </dt>
          <dd className="mono-figure">
            {heldTusdmMicro === null
              ? "…"
              : formatTUsdm(heldTusdmMicro / MICRO)}
          </dd>
        </div>
      </dl>

      <div className={styles.inputRow}>
        <label className={styles.fieldLabel} htmlFor="repay-input">
          How much tUSDM do you want to repay?
        </label>
        <div className={styles.fieldControl}>
          <input
            id="repay-input"
            className={`${styles.fieldInput} mono-figure`}
            type="text"
            inputMode="decimal"
            value={repayTusdm}
            placeholder={(repayableMicro / MICRO).toString()}
            onChange={(e) => setRepayTusdm(e.target.value)}
            aria-describedby="repay-hint"
          />
          <button
            type="button"
            className={styles.maxButton}
            onClick={() => setRepayTusdm((repayableMicro / MICRO).toString())}
            disabled={repayableMicro <= 0}
          >
            Max
          </button>
          <span className={styles.fieldSuffix}>tUSDM</span>
        </div>
        <p id="repay-hint" className={styles.fieldHint}>
          You can repay up to {formatTUsdm(repayableMicro / MICRO)} right now.
          {shortOfFull && (
            <>
              {" "}
              Your last{" "}
              {formatTUsdm((principalMicro - (heldTusdmMicro ?? 0)) / MICRO)} of
              debt is covered by self-repay yield.
            </>
          )}
        </p>
      </div>

      {repayDrawMicro > 0 && !exceedsRepayable && (
        <div className={styles.preview} aria-label="Repay preview">
          <div className={styles.previewRow}>
            <span>Debt now</span>
            <span className="mono-figure">
              {formatTUsdm(principalMicro / MICRO)}
            </span>
          </div>
          <div className={styles.previewRow}>
            <span>You repay</span>
            <span className="mono-figure">
              −{formatTUsdm(repayDrawMicro / MICRO)}
            </span>
          </div>
          <div className={styles.previewDivider} />
          <div className={`${styles.previewRow} ${styles.previewTotal}`}>
            <span>Debt after</span>
            <span className="mono-figure">
              {formatTUsdm(debtAfterMicro / MICRO)}
            </span>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`${styles.repayButton} ${repayPending ? styles.pending : ""}`}
        onClick={handleRepay}
        disabled={
          repayPending ||
          repayDrawMicro <= 0 ||
          exceedsRepayable ||
          repayableMicro <= 0
        }
      >
        {repayPending ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Confirm in your wallet…
          </>
        ) : repayableMicro <= 0 ? (
          "No tUSDM held to repay with"
        ) : repayDrawMicro <= 0 ? (
          "Enter an amount to repay"
        ) : exceedsRepayable ? (
          `Over what you can repay — max ${formatTUsdm(repayableMicro / MICRO)}`
        ) : (
          `Repay ${formatTUsdm(repayDrawMicro / MICRO)}`
        )}
      </button>

      {repayError && (
        <p className={styles.formNote} role="alert">
          {repayError}
        </p>
      )}

      {successHash && (
        <TxSuccessModal
          kind="repay"
          txHash={successHash}
          onClose={() => setSuccessHash(null)}
        />
      )}
    </section>
  );
}
