import {
  GOLD_CREDIT_LINE_CAP_USD,
  TIERS,
  type TierConfig,
} from "@/lib/mockConstants";
import { Reveal } from "./Reveal";
import shared from "./landing-shared.module.css";
import styles from "./tiers.module.css";

function requirementLine(tier: TierConfig): string {
  if (tier.minLoansRepaid === 0) {
    return "Start here — no history needed";
  }
  return `${tier.minLoansRepaid} loans repaid · ${tier.minCumulativeRepaidUsd.toLocaleString("en-US")} tUSDM cumulative`;
}

export function TiersSection() {
  return (
    <section
      id="tiers"
      className={shared.section}
      aria-labelledby="tiers-heading"
    >
      <div className={shared.sectionInner}>
        <Reveal>
          <p className={shared.eyebrow}>
            <span className={shared.eyebrowIndex}>//</span> borrower passport
          </p>
          <h2 id="tiers-heading" className={shared.sectionTitle}>
            Reputation you can borrow against
          </h2>
          <p className={shared.sectionLede}>
            Every repaid loan is written to an on-chain passport datum. The
            protocol reads it back and lends you more against the same
            collateral — credit history, minus the credit bureau.
          </p>
        </Reveal>

        <div className={styles.cards}>
          {TIERS.map((tier, index) => (
            <Reveal
              key={tier.id}
              className={styles.card}
              delay={0.06 * index}
            >
              <div className={styles.cardInner} data-tier={tier.id}>
                <p className={styles.tierName}>{tier.label}</p>
                <p className={styles.ltv}>
                  {tier.ltvBps / 100}
                  <span className={styles.ltvUnit}>% LTV</span>
                </p>
                <p className={styles.requirement}>{requirementLine(tier)}</p>
                {tier.hasCreditLine ? (
                  <p className={styles.creditLine}>
                    + credit line: min({GOLD_CREDIT_LINE_CAP_USD}, 10% &times;
                    repaid) tUSDM above collateral
                  </p>
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
