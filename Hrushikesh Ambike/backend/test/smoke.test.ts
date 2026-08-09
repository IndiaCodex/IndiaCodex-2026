import { describe, it, expect } from "vitest";
import { CONFIG } from "../src/config";

describe("config", () => {
  it("targets testnet", () => {
    expect(CONFIG.networkId).toBe(0);
  });

  it("encodes the tUSDM asset name as hex('tUSDM')", () => {
    expect(CONFIG.tUSDM.assetNameHex).toBe("745553444d");
  });

  it("matches the approved economics from the spec", () => {
    expect(CONFIG.economics.originationFeeBps).toBe(100);
    expect(CONFIG.economics.yieldSpreadProtocolBps).toBe(1500);
  });
});
