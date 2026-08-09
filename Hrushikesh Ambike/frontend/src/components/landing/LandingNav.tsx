import Link from "next/link";
import { getNetworkConfig } from "@/lib/networkConfig";
import styles from "./landing-nav.module.css";

/**
 * Marketing-site chrome: brand mark, network chip, and the single job of
 * this page — the Launch app button. Server Component; no wallet code.
 */
export function LandingNav() {
  const network = getNetworkConfig();

  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            &#9791;
          </span>
          <span className={styles.wordmark}>OURO</span>
          <span className={styles.networkChip}>
            <span className={styles.networkDot} aria-hidden="true" />
            {network.label}
          </span>
        </Link>

        <nav className={styles.links} aria-label="Landing sections">
          <a href="#process" className={styles.link}>
            How it works
          </a>
          <a href="#tiers" className={styles.link}>
            Passport
          </a>
          <a href="#built" className={styles.link}>
            Under the hood
          </a>
        </nav>

        <Link href="/app" className={styles.launch}>
          Launch app
        </Link>
      </div>
    </header>
  );
}
