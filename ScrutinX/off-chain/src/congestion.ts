/**
 * Congestion Predictor — emits a live score in [0,1] via EWMA of block fullness.
 *
 * TOGGLE (config.congestionMode):
 *   'real' -> BlockfrostCongestionSource: fullness = latestBlock.size / maxBlockSize
 *   'demo' -> DemoCongestionSource: a controllable value (manual override + optional synthetic wave)
 *
 * The EWMA math is identical in both modes — only the *sample* source differs. That's the point:
 * the adaptive POLICY is real; in demo mode we just feed it a realistic input because Preprod is idle.
 */

import { config, type Mode } from "./config";
import { getLatestBlocks, getProtocolParameters } from "./blockfrostClient";

/** A source produces one fullness sample in [0,1]. */
export interface CongestionSource {
  sample(): Promise<number>;
}

// ---------- REAL ----------
export class BlockfrostCongestionSource implements CongestionSource {
  private maxBlockSize = 90112; // seeded from protocol params on first use

  async init() {
    try {
      const p = await getProtocolParameters();
      this.maxBlockSize = p.maxBlockSize || this.maxBlockSize;
    } catch {
      /* keep default; predictor stays alive even if params fetch fails */
    }
  }

  async sample(): Promise<number> {
    const [latest] = await getLatestBlocks(1);
    return clamp01(latest.size / this.maxBlockSize);
  }
}

// ---------- DEMO ----------
/**
 * Simulated source. Drive it from the UI:
 *   - setOverride(v): pin the score (the demo slider). null = auto.
 *   - when auto, produces a slow synthetic wave so the demo "breathes" without touching it.
 */
export class DemoCongestionSource implements CongestionSource {
  private override: number | null = 0.2; // start quiet
  private t = 0; // internal step counter (NO Date.now — keeps it deterministic/testable)

  setOverride(v: number | null) {
    this.override = v === null ? null : clamp01(v);
  }

  async sample(): Promise<number> {
    this.t += 1;
    if (this.override !== null) return this.override;
    // synthetic wave in [0.1, 0.9], period ~ 24 samples
    return clamp01(0.5 + 0.4 * Math.sin(this.t / 4));
  }
}

// ---------- PREDICTOR ----------
export class CongestionPredictor {
  score = 0.2;
  private timer: ReturnType<typeof setInterval> | null = null;
  readonly demo = new DemoCongestionSource();
  private real = new BlockfrostCongestionSource();

  private source(): CongestionSource {
    return config.congestionMode === "real" ? this.real : this.demo;
  }

  async start() {
    if (config.congestionMode === "real") await this.real.init();
    await this.tick(); // seed immediately so score isn't stale
    this.timer = setInterval(() => this.tick().catch(() => {}), config.pollIntervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Flip the toggle at runtime (e.g. from a UI button). */
  async setMode(mode: Mode) {
    config.congestionMode = mode;
    if (mode === "real") await this.real.init();
    await this.tick();
  }

  private async tick() {
    try {
      const fullness = await this.source().sample();
      this.score = config.ewmaAlpha * fullness + (1 - config.ewmaAlpha) * this.score;
    } catch {
      /* keep last score; never let a fetch failure block the optimizer */
    }
  }

  /** Congestion score -> batch window (ms). High score => wait, batch big; low => clear fast. */
  windowMs(): number {
    const { highThreshold, lowThreshold, congestedWindowMs, quietWindowMs } = config.policy;
    const s = this.score;
    if (s >= highThreshold) return congestedWindowMs;
    if (s <= lowThreshold) return quietWindowMs;
    // linear interpolate between quiet and congested
    const f = (s - lowThreshold) / (highThreshold - lowThreshold);
    return Math.round(quietWindowMs + f * (congestedWindowMs - quietWindowMs));
  }
}

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}
