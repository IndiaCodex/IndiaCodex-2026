"use client";

import { useOuroWallet } from "@/components/wallet/WalletContext";
import { useVaultData } from "@/components/vault/VaultDataContext";
import { InfoTip } from "@/components/ui/InfoTip";
import { formatPercent, formatTUsdm } from "@/lib/format";
import {
  calculateCreditLine,
  getTierConfig,
  MOCK_POSITION,
  TIERS,
  type ReputationTier,
} from "@/lib/mockConstants";
import styles from "./passport.module.css";

interface PassportPosition {
  tier: ReputationTier;
  cumulativeRepaidUsdm: number;
  loansRepaid: number;
}

function isReputationTier(value: string): value is ReputationTier {
  return TIERS.some((candidate) => candidate.id === value);
}

/**
 * Tier, progress toward the next tier, and the Gold credit-line unlock.
 *
 * With a live vault this shows the borrower's actual on-chain standing:
 * the vault's tier plus zero repayment history — exactly what vault.ak
 * assumes for a wallet with no reputation UTxO yet (repay isn't wired into
 * the UI, so every live borrower is a fresh Bronze). Without a vault it
 * falls back to a clearly-tagged example that demonstrates tier progress.
 */
export function Passport() {
  const { connected } = useOuroWallet();
  const { vaultState } = useVaultData();

  const isLive = connected && vaultState !== null && vaultState.hasVault;
  const liveTier = vaultState?.tierAtOpen.toLowerCase() ?? "bronze";

  const position: PassportPosition = isLive
    ? {
        tier: isReputationTier(liveTier) ? liveTier : "bronze",
        // On-chain default for a borrower with no reputation UTxO.
        cumulativeRepaidUsdm: 0,
        loansRepaid: 0,
      }
    : MOCK_POSITION;

  const { tier, cumulativeRepaidUsdm, loansRepaid } = position;
  const tierIndex = TIERS.findIndex((candidate) => candidate.id === tier);
  const currentTier = getTierConfig(tier);
  const nextTier = TIERS[tierIndex + 1];
  const creditLine = calculateCreditLine(cumulativeRepaidUsdm);

  // Both thresholds (loan count + cumulative repaid) must be met, so the
  // binding constraint is whichever ratio is furthest from 1.
  const loansRatio = nextTier
    ? Math.min(1, loansRepaid / nextTier.minLoansRepaid)
    : 1;
  const repaidRatio = nextTier
    ? Math.min(1, cumulativeRepaidUsdm / nextTier.minCumulativeRepaidUsd)
    : 1;
  const bindingRatio = Math.min(loansRatio, repaidRatio);

  return (
    <section className={styles.panel} aria-labelledby="passport-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Reputation</p>
          <h2 id="passport-heading" className={styles.title}>
            Borrower Passport
            <InfoTip label="What is the Borrower Passport?">
              Your on-chain repayment record. Every loan you repay is written
              to a reputation datum; hitting the thresholds below unlocks
              higher loan-to-value tiers and, at Gold, a small credit line.
            </InfoTip>
          </h2>
        </div>
        <span
          className={`${styles.placeholderTag} ${isLive ? styles.liveTag : ""}`}
        >
          {isLive ? "live · preprod" : "example"}
        </span>
      </header>

      <div className={`${styles.tierBadge} ${styles[`tier_${currentTier.id}`]}`}>
        <span className={styles.tierBadgeLabel}>{currentTier.label}</span>
        <span className={styles.tierBadgeLtv}>
          {formatPercent(currentTier.ltvBps)} LTV unlocked
        </span>
      </div>

      <dl className={styles.metrics}>
        <div className={styles.metric}>
          <dt>Loans repaid</dt>
          <dd className="mono-figure">{loansRepaid}</dd>
        </div>
        <div className={styles.metric}>
          <dt>Cumulative repaid</dt>
          <dd className="mono-figure">{formatTUsdm(cumulativeRepaidUsdm)}</dd>
        </div>
      </dl>

      {nextTier ? (
        <div className={styles.progressBlock}>
          <div className={styles.progressHeader}>
            <span>
              Progress to <strong>{nextTier.label}</strong>
            </span>
            <span className="mono-figure">
              {(bindingRatio * 100).toFixed(0)}%
            </span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={Number((bindingRatio * 100).toFixed(0))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress toward ${nextTier.label} tier`}
          >
            <div
              className={styles.progressFill}
              style={{ width: `${bindingRatio * 100}%` }}
            />
          </div>
          <ul className={styles.requirementList}>
            <li className={loansRatio >= 1 ? styles.requirementMet : ""}>
              {loansRepaid} / {nextTier.minLoansRepaid} loans repaid
            </li>
            <li className={repaidRatio >= 1 ? styles.requirementMet : ""}>
              {formatTUsdm(cumulativeRepaidUsdm)} /{" "}
              {formatTUsdm(nextTier.minCumulativeRepaidUsd)} repaid
            </li>
          </ul>
        </div>
      ) : (
        <p className={styles.maxTierNote}>Top tier reached.</p>
      )}

      <div className={styles.creditLine}>
        <div className={styles.creditLineHeader}>
          <span>Gold credit line</span>
          {currentTier.hasCreditLine ? (
            <span className={styles.creditLineUnlocked}>unlocked</span>
          ) : (
            <span className={styles.creditLineLocked}>locked</span>
          )}
        </div>
        <p className={`${styles.creditLineValue} mono-figure`}>
          {formatTUsdm(currentTier.hasCreditLine ? creditLine : 0)}
        </p>
        <p className={styles.creditLineFormula}>
          min(25 tUSDM, 10% × cumulative repaid) — Gold&apos;s only
          above-collateral exposure, bounded by proven repayment volume.
        </p>
      </div>
    </section>
  );
}
