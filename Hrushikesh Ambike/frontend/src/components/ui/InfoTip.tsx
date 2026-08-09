"use client";

import { useId, type ReactNode } from "react";
import styles from "./info-tip.module.css";

interface InfoTipProps {
  /** Accessible name for the trigger, e.g. "What is loan-to-value?" */
  label: string;
  children: ReactNode;
}

/**
 * Inline "?" glossary popover for protocol jargon (LTV, origination fee,
 * self-repay…). Pure CSS reveal on hover/focus so it works without JS state
 * and stays keyboard-accessible: the trigger is a real button, the bubble is
 * linked via aria-describedby.
 */
export function InfoTip({ label, children }: InfoTipProps) {
  const bubbleId = useId();

  return (
    <span className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-describedby={bubbleId}
      >
        ?
      </button>
      <span id={bubbleId} role="tooltip" className={styles.bubble}>
        {children}
      </span>
    </span>
  );
}
