import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACTIVITY_EVENT,
  loadActivity,
  recordActivity,
} from "@/lib/activity";

describe("activity log", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("records entries newest-first and notifies listeners", () => {
    const listener = vi.fn();
    window.addEventListener(ACTIVITY_EVENT, listener);

    recordActivity({
      kind: "deposit",
      txHash: "aa".repeat(32),
      amountLabel: "100 ADA",
      at: 1,
    });
    recordActivity({
      kind: "borrow",
      txHash: "bb".repeat(32),
      amountLabel: "2.25 tUSDM",
      at: 2,
    });

    const entries = loadActivity();
    expect(entries).toHaveLength(2);
    expect(entries[0]?.kind).toBe("borrow");
    expect(entries[1]?.kind).toBe("deposit");
    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener(ACTIVITY_EVENT, listener);
  });

  it("caps the log at 20 entries", () => {
    for (let i = 0; i < 25; i += 1) {
      recordActivity({
        kind: "deposit",
        txHash: `${i}`.padStart(64, "0"),
        amountLabel: `${i} ADA`,
        at: i,
      });
    }
    expect(loadActivity()).toHaveLength(20);
  });

  it("ignores corrupt storage instead of throwing", () => {
    window.localStorage.setItem("ouro.activity.v1", "{not json");
    expect(loadActivity()).toEqual([]);

    window.localStorage.setItem(
      "ouro.activity.v1",
      JSON.stringify([{ kind: "bogus" }, null, 5]),
    );
    expect(loadActivity()).toEqual([]);
  });
});
