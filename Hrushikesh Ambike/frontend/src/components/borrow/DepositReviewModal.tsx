"use client";

import { useEffect } from "react";
import { formatAda, truncateAddress } from "@/lib/format";
import modalStyles from "@/components/ui/modal.module.css";
import styles from "./deposit-review-modal.module.css";

export interface DepositReview {
  collateralLovelace: number;
  fromAddress: string;
  vaultAddress: string;
  /** Extra pure-ADA the tx sets aside in the user's OWN wallet as a reusable
   * Plutus collateral UTxO. 0 when the wallet already has one. */
  collateralReservedLovelace?: number;
}

interface DepositReviewModalProps {
  review: DepositReview;
  signing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Pre-signature review step for a deposit. The transaction is already built
 * server-side at this point; nothing moves until the user confirms and the
 * wallet extension collects the actual signature.
 */
export function DepositReviewModal({
  review,
  signing,
  onConfirm,
  onCancel,
}: DepositReviewModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !signing) {
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, signing]);

  return (
    <div
      className={modalStyles.overlay}
      onClick={() => {
        if (!signing) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deposit-review-heading"
        className={modalStyles.dialog}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <p className={styles.eyebrow}>Step 1 · Deposit collateral</p>
          <h3 id="deposit-review-heading" className={styles.title}>
            Review deposit
          </h3>
        </header>

        <p className={`${styles.amount} mono-figure`}>
          {formatAda(review.collateralLovelace / 1_000_000)}
        </p>

        <dl className={styles.details}>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>From — your wallet</dt>
            <dd
              className={`${styles.detailValue} mono-figure`}
              title={review.fromAddress}
            >
              {truncateAddress(review.fromAddress)}
            </dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>To — your vault (script)</dt>
            <dd
              className={`${styles.detailValue} mono-figure`}
              title={review.vaultAddress}
            >
              {truncateAddress(review.vaultAddress)}
            </dd>
          </div>
          {review.collateralReservedLovelace
            ? (
              <div className={styles.detailRow}>
                <dt className={styles.detailLabel}>
                  Collateral set aside (stays in your wallet)
                </dt>
                <dd className={`${styles.detailValue} mono-figure`}>
                  {formatAda(review.collateralReservedLovelace / 1_000_000)}
                </dd>
              </div>
            )
            : null}
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>Network</dt>
            <dd className={styles.detailValue}>Cardano Preprod</dd>
          </div>
        </dl>

        <p className={styles.note}>
          {review.collateralReservedLovelace
            ? "Nothing is signed yet. This also sets aside a small reusable collateral UTxO in your own wallet so borrowing never stalls — you keep it. "
            : "Nothing is signed yet. "}
          Confirming opens your wallet extension, where you approve the exact
          transaction shown above.
        </p>

        <footer className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={signing}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={signing}
          >
            {signing ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Confirm in your wallet…
              </>
            ) : (
              "Confirm & sign"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
