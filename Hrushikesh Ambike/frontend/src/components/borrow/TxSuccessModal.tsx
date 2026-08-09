"use client";

import { useEffect } from "react";
import modalStyles from "@/components/ui/modal.module.css";
import styles from "./tx-success-modal.module.css";

export type TxKind = "deposit" | "borrow" | "repay" | "collateral";

const KIND_COPY: Record<TxKind, { label: string; hint: string }> = {
  deposit: {
    label: "Deposit",
    hint: "Your tADA is on its way to your vault. It takes ~20–60s to confirm — then you can borrow against it.",
  },
  borrow: {
    label: "Borrow",
    hint: "Your tUSDM lands in your wallet once the transaction confirms (~20–60s).",
  },
  repay: {
    label: "Repay",
    hint: "Your tUSDM is being burned and your debt reduced on-chain. The new balance shows once it confirms (~20–60s).",
  },
  collateral: {
    label: "Collateral setup",
    hint: "Wait ~30s for the new pure-ADA UTxO to confirm, then borrow again.",
  },
};

interface TxSuccessModalProps {
  kind: TxKind;
  txHash: string;
  onClose: () => void;
}

/** Shown once a transaction has been signed and accepted by the node. The
 * hash is the submission receipt — confirmation still takes a block or two,
 * which the per-kind hint spells out. */
export function TxSuccessModal({ kind, txHash, onClose }: TxSuccessModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-success-heading"
        className={modalStyles.dialog}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <span className={styles.check} aria-hidden="true">
            ✓
          </span>
          <div>
            <p className={styles.eyebrow}>{KIND_COPY[kind].label}</p>
            <h3 id="tx-success-heading" className={styles.title}>
              Transaction submitted
            </h3>
          </div>
        </header>

        <p className={styles.hint}>{KIND_COPY[kind].hint}</p>

        <div className={styles.hashBlock}>
          <span className={styles.hashLabel}>Transaction hash</span>
          <code className={`${styles.hashValue} mono-figure`}>{txHash}</code>
        </div>

        <footer className={styles.actions}>
          <a
            className={styles.linkButton}
            href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            View on Cardanoscan
          </a>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
