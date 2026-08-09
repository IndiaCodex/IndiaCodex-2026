"use client";

import { useEffect, useState } from "react";
import {
  ACTIVITY_EVENT,
  loadActivity,
  type ActivityEntry,
  type ActivityKind,
} from "@/lib/activity";
import { truncateAddress } from "@/lib/format";
import styles from "./activity-feed.module.css";

const KIND_LABELS: Record<ActivityKind, string> = {
  deposit: "Deposit",
  borrow: "Borrow",
  repay: "Repay",
  collateral: "Collateral UTxO",
};

function relativeTime(at: number, now: number): string {
  const diffMs = Math.max(0, now - at);
  if (diffMs < 60_000) return "just now";
  if (diffMs < 60 * 60_000) return `${Math.round(diffMs / 60_000)}m ago`;
  if (diffMs < 24 * 60 * 60_000) return `${Math.round(diffMs / 3_600_000)}h ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(at));
}

/**
 * Recent transactions submitted from this browser (see lib/activity.ts),
 * each linking to Cardanoscan. Local-first on purpose: it appears the
 * instant a tx is submitted, needs no indexer, and only ever shows the
 * current user's own actions.
 */
export function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setEntries(loadActivity());
    const refresh = () => setEntries(loadActivity());
    window.addEventListener(ACTIVITY_EVENT, refresh);
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.removeEventListener(ACTIVITY_EVENT, refresh);
      clearInterval(tick);
    };
  }, []);

  return (
    <section className={styles.panel} aria-labelledby="activity-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>History</p>
          <h2 id="activity-heading" className={styles.title}>
            Recent activity
          </h2>
        </div>
        <span className={styles.scopeTag}>this browser</span>
      </header>

      {entries.length === 0 ? (
        <p className={styles.empty}>
          Nothing yet — deposits and borrows you submit will show up here with
          links to the chain.
        </p>
      ) : (
        <ol className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.txHash} className={styles.row}>
              <span className={`${styles.kind} ${styles[`kind_${entry.kind}`]}`}>
                {KIND_LABELS[entry.kind]}
              </span>
              <span className={`${styles.amount} mono-figure`}>
                {entry.amountLabel}
              </span>
              <span className={styles.when}>{relativeTime(entry.at, now)}</span>
              <a
                className={styles.link}
                href={`https://preprod.cardanoscan.io/transaction/${entry.txHash}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`View transaction ${truncateAddress(entry.txHash)} on Cardanoscan`}
              >
                {truncateAddress(entry.txHash, 4)} ↗
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
