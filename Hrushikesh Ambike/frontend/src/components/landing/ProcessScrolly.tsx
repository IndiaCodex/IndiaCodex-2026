"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import shared from "./landing-shared.module.css";
import styles from "./process-scrolly.module.css";

type RowTone = "default" | "accent" | "positive" | "dim";

interface SceneRow {
  label: string;
  value: string;
  tone?: RowTone;
}

interface Scene {
  panelTitle: string;
  rows: SceneRow[];
  meterLabel: string;
  meterPct: number;
  meterTone: "accent" | "positive";
}

interface Step {
  index: string;
  name: string;
  title: string;
  body: string;
  scene: Scene;
}

/* Numbers follow one worked example end-to-end: 1,000 tADA at $0.40,
   Bronze 50% LTV, 1% origination fee, ~3 tUSDM of routed yield per epoch. */
const STEPS: Step[] = [
  {
    index: "01",
    name: "Lock",
    title: "Lock tADA in your vault",
    body: "Deposit tADA into a script-owned vault on Cardano preprod. It never leaves the chain, never stops staking, and only you can close the position.",
    scene: {
      panelTitle: "VAULT · DEPOSIT",
      rows: [
        { label: "deposit", value: "1,000.00 tADA" },
        { label: "collateral value", value: "400.00 tUSDM" },
        { label: "tier", value: "BRONZE · 50% LTV", tone: "accent" },
        { label: "staking", value: "ACTIVE", tone: "positive" },
      ],
      meterLabel: "collateral locked",
      meterPct: 100,
      meterTone: "accent",
    },
  },
  {
    index: "02",
    name: "Draw",
    title: "Draw tUSDM against it",
    body: "Borrow up to your tier's loan-to-value in tUSDM. A 1% origination fee is the only cost — there is no interest clock and no liquidation price to watch.",
    scene: {
      panelTitle: "VAULT · BORROW",
      rows: [
        { label: "max borrow (50%)", value: "200.00 tUSDM" },
        { label: "origination fee (1%)", value: "−2.00 tUSDM", tone: "dim" },
        { label: "you receive", value: "198.00 tUSDM", tone: "accent" },
        { label: "liquidation price", value: "NONE", tone: "positive" },
      ],
      meterLabel: "debt vs collateral",
      meterPct: 50,
      meterTone: "accent",
    },
  },
  {
    index: "03",
    name: "Melt",
    title: "Staking yield melts the debt",
    body: "Every Cardano epoch, 85% of your vault's staking rewards are swapped and burned against the balance. Debt is monotonic — it only ever moves toward zero.",
    scene: {
      panelTitle: "VAULT · EPOCH 12",
      rows: [
        { label: "yield routed to debt", value: "85%" },
        { label: "debt", value: "141.60 tUSDM ▼", tone: "positive" },
        { label: "self-repaid", value: "28.5%", tone: "positive" },
        { label: "projected payoff", value: "~47 EPOCHS", tone: "dim" },
      ],
      meterLabel: "debt remaining",
      meterPct: 35,
      meterTone: "positive",
    },
  },
  {
    index: "04",
    name: "Rise",
    title: "Every repaid loan raises your limit",
    body: "Repayments are recorded in an on-chain Borrower Passport. Bronze starts at 50% LTV; Silver unlocks 65%; Gold reaches 80% plus a small uncollateralized credit line.",
    scene: {
      panelTitle: "PASSPORT · REPUTATION",
      rows: [
        { label: "loans repaid", value: "3" },
        { label: "tier", value: "SILVER", tone: "accent" },
        { label: "max LTV", value: "50% → 65%", tone: "positive" },
        { label: "progress to gold", value: "3 / 5 LOANS", tone: "dim" },
      ],
      meterLabel: "progress to gold",
      meterPct: 60,
      meterTone: "accent",
    },
  },
];

export function ProcessScrolly() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.45", "end 0.7"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const step = Math.min(
      STEPS.length - 1,
      Math.max(0, Math.floor(progress * STEPS.length)),
    );
    setActive(step);
  });

  const scene = STEPS[active].scene;

  return (
    <section
      id="process"
      className={`${shared.section} ${styles.section}`}
      aria-labelledby="process-heading"
    >
      <div className={shared.sectionInner}>
        <p className={shared.eyebrow}>
          <span className={shared.eyebrowIndex}>//</span> the full process
        </p>
        <h2 id="process-heading" className={shared.sectionTitle}>
          One loan, four moves, zero deadlines
        </h2>

        <div className={styles.grid} ref={trackRef}>
          <div className={styles.stickyCol}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelDot} aria-hidden="true" />
                <span className={styles.panelTitle}>{scene.panelTitle}</span>
                <span className={styles.panelSteps}>
                  {STEPS.map((step, index) => (
                    <span
                      key={step.index}
                      className={
                        index === active
                          ? styles.panelStepActive
                          : styles.panelStep
                      }
                      aria-hidden="true"
                    />
                  ))}
                </span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  className={styles.panelBody}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <dl className={styles.rows}>
                    {scene.rows.map((row) => (
                      <div key={row.label} className={styles.row}>
                        <dt className={styles.rowLabel}>{row.label}</dt>
                        <dd
                          className={styles.rowValue}
                          data-tone={row.tone ?? "default"}
                        >
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className={styles.meter}>
                    <div className={styles.meterHead}>
                      <span>{scene.meterLabel}</span>
                      <span className="mono-figure">{scene.meterPct}%</span>
                    </div>
                    <div
                      className={styles.meterTrack}
                      role="img"
                      aria-label={`${scene.meterLabel}: ${scene.meterPct}%`}
                    >
                      <motion.div
                        className={styles.meterFill}
                        data-tone={scene.meterTone}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: scene.meterPct / 100 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <ol className={styles.steps}>
            {STEPS.map((step, index) => (
              <li
                key={step.index}
                className={styles.step}
                data-active={index === active}
              >
                <p className={styles.stepEyebrow}>
                  {step.index} · {step.name}
                </p>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepBody}>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
