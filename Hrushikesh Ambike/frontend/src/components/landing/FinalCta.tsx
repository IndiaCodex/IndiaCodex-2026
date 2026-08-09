import Link from "next/link";
import { Reveal } from "./Reveal";
import shared from "./landing-shared.module.css";
import styles from "./final-cta.module.css";

export function FinalCta() {
  return (
    <section className={shared.section} aria-labelledby="cta-heading">
      <div className={`${shared.sectionInner} ${styles.inner}`}>
        <Reveal>
          <p className={`${shared.eyebrow} ${styles.eyebrowCenter}`}>
            <span className={shared.eyebrowIndex}>//</span> ready
          </p>
          <h2 id="cta-heading" className={styles.title}>
            Watch your debt eat itself.
          </h2>
          <p className={styles.lede}>
            Connect a CIP-30 wallet on Cardano preprod, lock tADA, and draw
            tUSDM in minutes.
          </p>
          <div className={styles.actions}>
            <Link href="/app" className={styles.launch}>
              Launch app
            </Link>
          </div>
          <p className={styles.note}>
            Testnet prototype — tADA and tUSDM carry no real-world value.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
