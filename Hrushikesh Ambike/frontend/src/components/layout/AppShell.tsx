import type { ReactNode } from "react";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { getNetworkConfig } from "@/lib/networkConfig";
import styles from "./app-shell.module.css";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Top-level page chrome: brand mark, network indicator, wallet connect.
 * Server Component — the interactive wallet piece is isolated inside
 * <WalletConnect />.
 */
export function AppShell({ children }: AppShellProps) {
  const network = getNetworkConfig();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            &#9791;
          </span>
          <div>
            <p className={styles.wordmark}>OURO</p>
            <p className={styles.tagline}>self-repaying tADA loans</p>
          </div>
        </div>

        <nav className={styles.networkBadge} aria-label="Network status">
          <span className={styles.networkDot} aria-hidden="true" />
          {network.label}
        </nav>

        <div className={styles.walletSlot}>
          <WalletConnect />
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <p>
          Hackathon prototype — Cardano L1, {network.label}. No liquidation.
          Debt only ever shrinks.
        </p>
      </footer>
    </div>
  );
}
