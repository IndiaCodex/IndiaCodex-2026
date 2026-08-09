import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAdaUsd } from "../src/price";

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}

describe("fetchAdaUsd", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses the Kraken last-trade price into integer micro-USD", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        error: [],
        result: {
          ADAUSD: {
            c: ["0.4000", "123.0"],
          },
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAdaUsd();

    expect(result).toEqual({ priceMicroUsd: 400000, source: "kraken" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.kraken.com/0/public/Ticker?pair=ADAUSD",
    );
  });

  it("falls back to Coinbase when Kraken fails", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("kraken unreachable"))
      .mockResolvedValueOnce(
        jsonResponse({
          data: { base: "ADA", currency: "USD", amount: "0.40" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAdaUsd();

    expect(result).toEqual({ priceMicroUsd: 400000, source: "coinbase" });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.kraken.com/0/public/Ticker?pair=ADAUSD",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.coinbase.com/v2/prices/ADA-USD/spot",
    );
  });

  it("rounds fractional micro-USD prices to the nearest integer", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        result: { ADAUSD: { c: ["0.401234", "10.0"] } },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAdaUsd();

    expect(result.priceMicroUsd).toBe(401234);
    expect(result.source).toBe("kraken");
  });

  it("throws when both Kraken and Coinbase fail", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("kraken down"))
      .mockRejectedValueOnce(new Error("coinbase down"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAdaUsd()).rejects.toThrow();
  });
});
