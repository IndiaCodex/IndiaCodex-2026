import { Reveal } from "./Reveal";
import shared from "./landing-shared.module.css";
import styles from "./built-on.module.css";

/* Live deployment facts — mirrored from ouro/offchain/deployments/preprod.json */
const FIRST_ORACLE_TX =
  "6c74816d0d94933bc59bc5b38cd4196129927505056bfb39008292dc119d8352";
const ORACLE_TX_URL = `https://preprod.cardanoscan.io/transaction/${FIRST_ORACLE_TX}`;

interface Fact {
  label: string;
  value: string;
  detail: string;
}

const FACTS: Fact[] = [
  {
    label: "on-chain",
    value: "4 Aiken validators",
    detail: "vault · oracle · reputation · reserve — the no-liquidation rule is enforced by the script, not a promise.",
  },
  {
    label: "verified",
    value: "66 tests",
    detail: "27 on-chain Aiken tests plus 39 off-chain transaction-builder tests, all green before every deploy.",
  },
  {
    label: "live oracle",
    value: "Real tADA/USD feed",
    detail: "A Kraken-sourced price posted to a preprod oracle UTxO the validators read at spend time.",
  },
  {
    label: "custody",
    value: "Your keys, your vault",
    detail: "You sign every transaction in your own CIP-30 wallet; the protocol co-signs, the script has the final word.",
  },
];

export function BuiltOnSection() {
  return (
    <section
      id="built"
      className={shared.section}
      aria-labelledby="built-heading"
    >
      <div className={shared.sectionInner}>
        <Reveal>
          <p className={shared.eyebrow}>
            <span className={shared.eyebrowIndex}>//</span> under the hood
          </p>
          <h2 id="built-heading" className={shared.sectionTitle}>
            Deployed and running on Cardano preprod
          </h2>
          <p className={shared.sectionLede}>
            Ouro is not a mockup. The validators are compiled, deployed, and
            spending real preprod UTxOs — the first oracle price is{" "}
            <a
              className={styles.txLink}
              href={ORACLE_TX_URL}
              target="_blank"
              rel="noreferrer"
            >
              on-chain to verify
            </a>
            .
          </p>
        </Reveal>

        <div className={styles.facts}>
          {FACTS.map((fact, index) => (
            <Reveal key={fact.label} delay={0.05 * index}>
              <div className={styles.fact}>
                <p className={styles.factLabel}>{fact.label}</p>
                <p className={styles.factValue}>{fact.value}</p>
                <p className={styles.factDetail}>{fact.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <p className={styles.stack}>
            AIKEN · MESH SDK · NEXT.JS · BLOCKFROST · CARDANO PREPROD
          </p>
        </Reveal>
      </div>
    </section>
  );
}
