import { describe, it, expect } from "vitest";
import { CongestionPredictor } from "./congestion";
import { config } from "./config";

describe("CongestionPredictor.windowMs (score → batch window)", () => {
  it("high score → congested window", () => {
    const p = new CongestionPredictor();
    p.score = 0.9;
    expect(p.windowMs()).toBe(config.policy.congestedWindowMs);
  });

  it("low score → quiet window", () => {
    const p = new CongestionPredictor();
    p.score = 0.1;
    expect(p.windowMs()).toBe(config.policy.quietWindowMs);
  });

  it("mid score interpolates strictly between quiet and congested", () => {
    const p = new CongestionPredictor();
    p.score = 0.5;
    const w = p.windowMs();
    expect(w).toBeGreaterThan(config.policy.quietWindowMs);
    expect(w).toBeLessThan(config.policy.congestedWindowMs);
  });

  it("window is monotonic non-decreasing in score", () => {
    const p = new CongestionPredictor();
    const at = (s: number) => {
      p.score = s;
      return p.windowMs();
    };
    expect(at(0.4)).toBeLessThanOrEqual(at(0.6));
  });
});

describe("CongestionPredictor injection override", () => {
  it("tracks whether an injection is active", () => {
    const p = new CongestionPredictor();
    expect(p.isOverridden()).toBe(false);
    p.setOverride(0.66);
    expect(p.isOverridden()).toBe(true);
    p.setOverride(null);
    expect(p.isOverridden()).toBe(false);
  });
});
