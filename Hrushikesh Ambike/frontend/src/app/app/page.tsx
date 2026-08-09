import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { BorrowPanel } from "@/components/borrow/BorrowPanel";
import { RepayPanel } from "@/components/borrow/RepayPanel";
import { OnboardingSteps } from "@/components/onboarding/OnboardingSteps";
import { DebtGauge } from "@/components/position/DebtGauge";
import { Passport } from "@/components/reputation/Passport";
import { VaultDataProvider } from "@/components/vault/VaultDataContext";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  return (
    <VaultDataProvider>
      <div className={styles.hero}>
        <p className={styles.heroKicker}>Self-repaying, non-liquidating loans</p>
        <h1 className={styles.heroTitle}>
          Your tADA keeps staking. Your debt keeps shrinking.
        </h1>
        <p className={styles.heroSubtitle}>
          Lock tADA as collateral, draw tUSDM against it, and let native
          staking rewards buy the balance down automatically — no deadline,
          no liquidation. Every loan you repay raises your borrow limit.
        </p>
      </div>

      <OnboardingSteps />

      <div className={styles.grid}>
        <div className={styles.gridBorrow}>
          <BorrowPanel />
        </div>
        <div className={styles.gridSide}>
          <DebtGauge />
          <RepayPanel />
          <Passport />
          <ActivityFeed />
        </div>
      </div>
    </VaultDataProvider>
  );
}
