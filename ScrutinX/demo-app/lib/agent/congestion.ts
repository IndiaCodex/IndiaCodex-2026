/**
 * Congestion Predictor — a live score in [0,1] via EWMA of REAL Cardano block fullness (Blockfrost).
 *
 * On an idle testnet the real reading sits near 0, so an OPTIONAL manual injection (the slider) can
 * override the input to demonstrate the adaptive batch-sizing policy. The injection is clearly a
 * demonstration aid — the base signal and the EWMA/policy are always real.
 */

import { config } from "./config";
import { getLatestBlocks, getProtocolParameters } from "./blockfrostClient";

export class CongestionPredictor {
  score = 0;
  private realReading = 0; // last real block-fullness sample from Blockfrost
  private override: number | null = null; // manual injection; null = follow the real reading
  private maxBlockSize = 90112;
  private tickCount = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  /** Set/clear the manual congestion injection (the slider). null → follow the real reading. */
  setOverride(v: number | null) {
    this.override = v === null ? null : clamp01(v);
  }

  isOverridden() {
    return this.override !== null;
  }

  async start() {
    try {
      const p = await getProtocolParameters();
      this.maxBlockSize = p.maxBlockSize || this.maxBlockSize;
    } catch {
      /* keep default */
    }
    await this.fetchReal();
    this.score = this.override ?? this.realReading;
    // EWMA loop at 1.5s (responsive slider); real Blockfrost fetched ~every 20s (block cadence).
    this.timer = setInterval(() => this.tick().catch(() => {}), 1500);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async fetchReal() {
    try {
      if (!config.blockfrost.projectId) return; // no key → real reading stays 0; use the slider
      const [latest] = await getLatestBlocks(1);
      this.realReading = clamp01(latest.size / this.maxBlockSize);
    } catch {
      /* keep last real reading */
    }
  }

  private async tick() {
    this.tickCount++;
    if (this.override === null && this.tickCount % 13 === 0) {
      await this.fetchReal(); // refresh the real reading ~every 20s when not overridden
    }
    const target = this.override ?? this.realReading;
    this.score = config.ewmaAlpha * target + (1 - config.ewmaAlpha) * this.score;
  }

  /** Congestion score → batch window (ms). High score → wait, batch big; low → clear fast. */
  windowMs(): number {
    const { highThreshold, lowThreshold, congestedWindowMs, quietWindowMs } = config.policy;
    const s = this.score;
    if (s >= highThreshold) return congestedWindowMs;
    if (s <= lowThreshold) return quietWindowMs;
    const f = (s - lowThreshold) / (highThreshold - lowThreshold);
    return Math.round(quietWindowMs + f * (congestedWindowMs - quietWindowMs));
  }
}

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}
