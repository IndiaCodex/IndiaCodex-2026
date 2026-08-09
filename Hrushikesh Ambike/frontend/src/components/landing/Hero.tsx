"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { MOCK_POSITION, YIELD_SPREAD_SELF_REPAY_BPS } from "@/lib/mockConstants";
import { OuroborosRing } from "./OuroborosRing";
import styles from "./hero.module.css";

const ORIGINAL_DEBT = MOCK_POSITION.originalDebtUsdm;

/** tUSDM of debt one epoch of staking yield burns in the demo loop. */
const YIELD_PER_EPOCH = 3;
const EPOCH_TICK_MS = 1400;

const SELF_REPAY_PCT = YIELD_SPREAD_SELF_REPAY_BPS / 100;

interface LivePrice {
  priceMicroUsd: number;
  source: string;
}

interface EpochSim {
  epoch: number;
  debt: number;
}

/** Static frame shown when the visitor prefers reduced motion. */
const STATIC_SIM: EpochSim = {
  epoch: Math.round(
    (ORIGINAL_DEBT - MOCK_POSITION.currentDebtUsdm) / YIELD_PER_EPOCH,
  ),
  debt: MOCK_POSITION.currentDebtUsdm,
};

function selfRepaidPct(debt: number): string {
  return (((ORIGINAL_DEBT - debt) / ORIGINAL_DEBT) * 100).toFixed(1);
}

export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const [price, setPrice] = useState<LivePrice | null>(null);
  const [sim, setSim] = useState<EpochSim>({ epoch: 0, debt: ORIGINAL_DEBT });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/price")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: LivePrice | null) => {
        if (!cancelled && data && typeof data.priceMicroUsd === "number") {
          setPrice(data);
        }
      })
      .catch(() => {
        /* landing stays useful without a live quote */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const timer = setInterval(() => {
      setSim((previous) => {
        if (previous.debt <= 0) {
          return { epoch: 0, debt: ORIGINAL_DEBT };
        }
        return {
          epoch: previous.epoch + 1,
          debt: Math.max(0, previous.debt - YIELD_PER_EPOCH),
        };
      });
    }, EPOCH_TICK_MS);

    return () => clearInterval(timer);
  }, [prefersReducedMotion]);

  const frame = prefersReducedMotion ? STATIC_SIM : sim;
  const priceUsd =
    price === null ? null : (price.priceMicroUsd / 1_000_000).toFixed(4);

  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <motion.p
            className={styles.kicker}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            Self-repaying &middot; non-liquidating &middot; Cardano preprod
          </motion.p>

          <motion.h1
            id="hero-heading"
            className={styles.title}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            Your tADA keeps staking.
            <br />
            <span className={styles.titleAccent}>
              Your debt keeps shrinking.
            </span>
          </motion.h1>

          <motion.p
            className={styles.lede}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            Lock tADA as collateral and draw tUSDM against it. Your collateral
            never stops staking — every epoch&rsquo;s rewards buy the balance
            down automatically. No deadline, no margin call, no liquidation.
          </motion.p>

          <motion.div
            className={styles.actions}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="/app" className={styles.ctaPrimary}>
              Launch app
            </Link>
            <a href="#process" className={styles.ctaGhost}>
              See how it works
            </a>
          </motion.div>

          <motion.dl
            className={styles.stats}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            <div className={styles.stat}>
              <dt className={styles.statLabel}>
                {price === null ? "tADA / USD" : `tADA / USD · ${price.source}`}
              </dt>
              <dd className={styles.statValue}>
                {priceUsd === null ? "—" : `$${priceUsd}`}
              </dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Yield to your debt</dt>
              <dd className={styles.statValue}>{SELF_REPAY_PCT}%</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Liquidations, ever</dt>
              <dd className={styles.statValue}>0</dd>
            </div>
          </motion.dl>
        </div>

        <div className={styles.visual}>
          <OuroborosRing>
            <p className={styles.debtLabel}>Current debt</p>
            <p className={styles.debtValue} aria-live="off">
              {frame.debt.toFixed(2)}
            </p>
            <p className={styles.debtUnit}>tUSDM</p>
            <p className={styles.debtMeta}>
              epoch {frame.epoch} &middot; {selfRepaidPct(frame.debt)}%
              self-repaid
            </p>
          </OuroborosRing>
        </div>
      </div>
    </section>
  );
}
