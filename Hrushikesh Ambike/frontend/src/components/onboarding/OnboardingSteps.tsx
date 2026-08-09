"use client";

import { useOuroWallet } from "@/components/wallet/WalletContext";
import { useVaultData } from "@/components/vault/VaultDataContext";
import styles from "./onboarding-steps.module.css";

interface StepDef {
  title: string;
  body: string;
}

const STEPS: readonly StepDef[] = [
  {
    title: "Deposit tADA",
    body: "Lock collateral in your own vault. It keeps staking the whole time.",
  },
  {
    title: "Borrow tUSDM",
    body: "Draw a stablecoin loan up to your tier's limit. One 1% fee, no interest.",
  },
  {
    title: "Let it melt",
    body: "Each epoch's staking reward buys your debt down — automatically.",
  },
];

/**
 * Where-am-I strip for the dashboard: the three-step loan lifecycle with the
 * user's actual position highlighted from live vault state. First-time
 * visitors see exactly what to do next instead of a wall of zeroed panels.
 */
export function OnboardingSteps() {
  const { connected } = useOuroWallet();
  const { vaultState } = useVaultData();

  // 1-indexed current step; 0 = not connected yet.
  const currentStep = !connected
    ? 0
    : !vaultState?.hasVault
      ? 1
      : vaultState.principalTusdm <= 0
        ? 2
        : 3;

  return (
    <nav className={styles.strip} aria-label="How Ouro works">
      {!connected && (
        <p className={styles.connectHint}>
          Start by connecting a Preprod wallet (top right) — then:
        </p>
      )}
      <ol className={styles.steps}>
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isDone = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;
          return (
            <li
              key={step.title}
              className={`${styles.step} ${isActive ? styles.active : ""} ${isDone ? styles.done : ""}`}
              aria-current={isActive ? "step" : undefined}
            >
              <span className={styles.marker} aria-hidden="true">
                {isDone ? "✓" : stepNumber}
              </span>
              <span className={styles.stepText}>
                <span className={styles.stepTitle}>{step.title}</span>
                <span className={styles.stepBody}>{step.body}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
