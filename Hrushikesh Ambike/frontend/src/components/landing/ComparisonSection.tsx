import { Reveal } from "./Reveal";
import shared from "./landing-shared.module.css";
import styles from "./comparison.module.css";

interface ComparisonRow {
  event: string;
  cdp: string;
  ouro: string;
}

const ROWS: ComparisonRow[] = [
  {
    event: "tADA price drops 30%",
    cdp: "Margin call. Your collateral is auctioned off at the worst possible moment.",
    ouro: "Nothing happens. Your vault keeps staking and your debt keeps shrinking.",
  },
  {
    event: "Time passes",
    cdp: "Interest accrues. The balance grows while you sleep.",
    ouro: "Yield accrues. 85% of every epoch's rewards burn the balance down.",
  },
  {
    event: "Repayment deadline",
    cdp: "Set by the protocol, enforced by liquidation.",
    ouro: "None. Repay when you want — or let it melt to zero on its own.",
  },
  {
    event: "Your repayment history",
    cdp: "Forgotten the moment the loan closes.",
    ouro: "Recorded on-chain in your Borrower Passport. Each repaid loan raises your limit.",
  },
];

export function ComparisonSection() {
  return (
    <section
      className={shared.section}
      aria-labelledby="comparison-heading"
    >
      <div className={shared.sectionInner}>
        <Reveal>
          <p className={shared.eyebrow}>
            <span className={shared.eyebrowIndex}>//</span> why no liquidation
          </p>
          <h2 id="comparison-heading" className={shared.sectionTitle}>
            The loan that never calls your margin
          </h2>
          <p className={shared.sectionLede}>
            Classic CDP lending punishes you for volatility you can&rsquo;t
            control. Ouro removes the punishment entirely: there is no
            liquidation path in the validator — the debt number can only move
            toward zero.
          </p>
        </Reveal>

        <div className={styles.columns}>
          <Reveal className={styles.colCdp} delay={0.05}>
            <h3 className={styles.colTitleCdp}>A liquidating CDP</h3>
            <dl className={styles.list}>
              {ROWS.map((row) => (
                <div key={row.event} className={styles.item}>
                  <dt className={styles.event}>{row.event}</dt>
                  <dd className={styles.outcome}>{row.cdp}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal className={styles.colOuro} delay={0.15}>
            <h3 className={styles.colTitleOuro}>An Ouro vault</h3>
            <dl className={styles.list}>
              {ROWS.map((row) => (
                <div key={row.event} className={styles.item}>
                  <dt className={styles.event}>{row.event}</dt>
                  <dd className={styles.outcome}>{row.ouro}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
