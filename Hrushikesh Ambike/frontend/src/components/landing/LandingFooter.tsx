import { getNetworkConfig } from "@/lib/networkConfig";
import styles from "./landing-footer.module.css";

export function LandingFooter() {
  const network = getNetworkConfig();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            &#9791;
          </span>
          OURO — self-repaying tADA loans
        </p>
        <p className={styles.meta}>
          Cardano hackathon prototype · {network.label} · debt only ever
          shrinks
        </p>
      </div>
    </footer>
  );
}
