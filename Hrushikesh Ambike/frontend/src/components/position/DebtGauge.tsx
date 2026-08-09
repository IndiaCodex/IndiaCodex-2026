"use client";

import { useOuroWallet } from "@/components/wallet/WalletContext";
import { useVaultData } from "@/components/vault/VaultDataContext";
import { InfoTip } from "@/components/ui/InfoTip";
import { formatAda, formatTUsdm } from "@/lib/format";
import { MOCK_POSITION } from "@/lib/mockConstants";
import {
  buildPayoffProjection,
  epochsToPayoff,
  projectedPayoffDate,
  selfRepayPerEpochMicro,
  EPOCH_DAYS,
  STAKING_APY_BPS,
  SELF_REPAY_SHARE_BPS,
} from "@/lib/selfRepay";
import { PayoffChart } from "./PayoffChart";
import styles from "./debt-gauge.module.css";

const dateLabel = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/**
 * The self-repaying story, told from live chain data. With a vault and debt
 * open it projects the melt curve (staking yield × self-repay share) from
 * the vault's actual collateral, oracle price and principal. Without a
 * vault it falls back to a clearly-tagged example so the mechanic is still
 * legible to first-time visitors.
 */
export function DebtGauge() {
  const { connected } = useOuroWallet();
  const { vaultState } = useVaultData();

  const isLive = connected && vaultState !== null && vaultState.hasVault;

  if (!isLive) {
    return <ExampleGauge />;
  }

  const { collateralLovelace, principalTusdm, priceMicroUsd } = vaultState;
  const perEpochMicro = selfRepayPerEpochMicro(
    collateralLovelace,
    priceMicroUsd,
  );
  const payoffEpochs = epochsToPayoff(principalTusdm, perEpochMicro);
  const points = buildPayoffProjection(principalTusdm, perEpochMicro);
  const hasProjection = points.length >= 2 && Number.isFinite(payoffEpochs);
  const payoffDate = hasProjection
    ? dateLabel.format(projectedPayoffDate(payoffEpochs))
    : null;

  return (
    <section className={styles.panel} aria-labelledby="position-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Position</p>
          <h2 id="position-heading" className={styles.title}>
            Debt is melting
          </h2>
        </div>
        <span className={`${styles.placeholderTag} ${styles.liveTag}`}>
          live · preprod
        </span>
      </header>

      <div className={styles.readout}>
        <div>
          <p className={styles.readoutLabel}>Current debt</p>
          <p className={`${styles.readoutValue} mono-figure`}>
            {formatTUsdm(principalTusdm / 1_000_000)}
          </p>
        </div>
        <div className={styles.readoutSecondary}>
          <p className={styles.readoutLabel}>Collateral staked</p>
          <p className={`${styles.readoutPlain} mono-figure`}>
            {formatAda(collateralLovelace / 1_000_000)}
          </p>
        </div>
      </div>

      {principalTusdm <= 0 ? (
        <p className={styles.emptyDebtNote}>
          No debt drawn yet. Borrow tUSDM and your{" "}
          {formatAda(collateralLovelace / 1_000_000)} keeps staking — about{" "}
          <strong className="mono-figure">
            {formatTUsdm(perEpochMicro / 1_000_000)}
          </strong>{" "}
          of buy-down lands every epoch ({EPOCH_DAYS} days), automatically.
        </p>
      ) : (
        <>
          {hasProjection && payoffDate && (
            <PayoffChart
              points={points}
              endLabel={`~${payoffEpochs} epochs · ${payoffDate}`}
            />
          )}

          <dl className={styles.projectionStats}>
            <div>
              <dt>
                Buy-down / epoch
                <InfoTip label="Where does the buy-down come from?">
                  Your locked tADA keeps earning ~
                  {(STAKING_APY_BPS / 100).toFixed(0)}% staking yield.{" "}
                  {(SELF_REPAY_SHARE_BPS / 100).toFixed(0)}% of every
                  epoch&rsquo;s reward is harvested and used to repay your
                  debt — you do nothing.
                </InfoTip>
              </dt>
              <dd className="mono-figure">
                {formatTUsdm(perEpochMicro / 1_000_000)}
              </dd>
            </div>
            <div>
              <dt>Epochs to zero</dt>
              <dd className="mono-figure">
                {Number.isFinite(payoffEpochs) ? `~${payoffEpochs}` : "—"}
              </dd>
            </div>
            <div>
              <dt>
                Est. debt-free by
                <InfoTip label="How is this date calculated?">
                  A projection at today&rsquo;s collateral, debt, and
                  ~{(STAKING_APY_BPS / 100).toFixed(0)}% staking rate — it
                  moves closer if you deposit more or repay, and further out
                  if you borrow more.
                </InfoTip>
              </dt>
              <dd className="mono-figure">{payoffDate ?? "—"}</dd>
            </div>
          </dl>
        </>
      )}

      <p className={styles.mechanicNote}>
        Debt is <strong>monotonic</strong> — every epoch&apos;s ADA staking
        reward buys the balance down further. There is no liquidation path:
        this number only moves toward zero.
      </p>
    </section>
  );
}

/** Clearly-tagged example shown before a wallet + vault exist. */
function ExampleGauge() {
  const { originalDebtUsdm, currentDebtUsdm, epochsToProjectedPayoff } =
    MOCK_POSITION;
  const repaidUsdm = originalDebtUsdm - currentDebtUsdm;
  const repaidShare = Math.min(1, Math.max(0, repaidUsdm / originalDebtUsdm));
  const repaidPercentLabel = `${(repaidShare * 100).toFixed(1)}%`;

  return (
    <section className={styles.panel} aria-labelledby="position-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Position</p>
          <h2 id="position-heading" className={styles.title}>
            Debt is melting
          </h2>
        </div>
        <span className={styles.placeholderTag}>example</span>
      </header>

      <div className={styles.readout}>
        <div>
          <p className={styles.readoutLabel}>Current debt</p>
          <p className={`${styles.readoutValue} mono-figure`}>
            {formatTUsdm(currentDebtUsdm)}
          </p>
        </div>
        <div className={styles.readoutSecondary}>
          <p className={styles.readoutLabel}>Original draw</p>
          <p className="mono-figure">{formatTUsdm(originalDebtUsdm)}</p>
        </div>
      </div>

      <div
        className={styles.gaugeTrack}
        role="progressbar"
        aria-valuenow={Number((repaidShare * 100).toFixed(1))}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Debt repaid via self-repay yield"
      >
        <div
          className={styles.gaugeFill}
          style={{ width: `${repaidShare * 100}%` }}
        />
        <div className={styles.gaugeShimmer} style={{ width: `${repaidShare * 100}%` }} />
      </div>

      <div className={styles.gaugeCaption}>
        <span className={styles.gaugeCaptionPositive}>
          {repaidPercentLabel} self-repaid via staking yield
        </span>
        <span className={styles.gaugeCaptionMuted}>
          ~{epochsToProjectedPayoff} epochs to zero at current rate
        </span>
      </div>

      <p className={styles.mechanicNote}>
        This is an example position. Connect a wallet and deposit tADA to see
        your own debt melt in real time — debt is <strong>monotonic</strong>,
        with no liquidation path: it only moves toward zero.
      </p>
    </section>
  );
}
