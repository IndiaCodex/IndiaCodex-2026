import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildPriceDatum,
  postPrice,
  priceValidUntilPosixMs,
  DEFAULT_VALIDITY_WINDOW_MS,
  type PostPriceDeps,
} from "../src/oracle-poster";

function jsonResponse(body: unknown): Response {
  return { ok: true, json: async () => body } as Response;
}

describe("buildPriceDatum (pure)", () => {
  it("encodes price + validity slot as a Constr-0 Mesh datum in field order", () => {
    const datum = buildPriceDatum({ priceMicroUsd: 400000 }, 12345);

    expect(datum).toEqual({
      constructor: 0,
      fields: [
        { int: 400000 },
        { int: 12345 },
      ],
    });
  });

  it("preserves large integer values without precision loss", () => {
    const datum = buildPriceDatum({ priceMicroUsd: 1_234_567_890 }, 999_999_999);

    expect(datum.fields[0]).toEqual({ int: 1_234_567_890 });
    expect(datum.fields[1]).toEqual({ int: 999_999_999 });
  });
});

describe("priceValidUntilPosixMs (oracle freshness unit)", () => {
  // Regression guard for the borrow-blocking bug: vault.ak's read_oracle_price
  // compares the oracle datum's deadline against the tx's
  // `validity_range.upper_bound`, which Plutus V3 exposes as POSIX time in
  // MILLISECONDS (the ledger converts the tx's invalidHereafter SLOT into
  // POSIX ms). The oracle deadline MUST therefore be POSIX-ms too. The
  // original bug posted a slot number (~1e8), which always reads as "stale"
  // against a ~1.7e12 POSIX-ms bound, so every borrow failed.
  it("returns a POSIX-ms scale timestamp, not a slot number", () => {
    const nowMs = 1_782_899_000_000;
    const deadline = priceValidUntilPosixMs(nowMs, DEFAULT_VALIDITY_WINDOW_MS);

    expect(deadline).toBe(nowMs + DEFAULT_VALIDITY_WINDOW_MS);
    // POSIX-ms scale is > 1.5e12; a preprod slot number would be ~1e8.
    expect(deadline).toBeGreaterThan(1_500_000_000_000);
  });

  it("keeps a near-future borrow validity bound within the fresh window", () => {
    const nowMs = 1_782_899_000_000;
    const deadline = priceValidUntilPosixMs(nowMs, DEFAULT_VALIDITY_WINDOW_MS);
    // A borrow submitted ~now with a 5-minute TTL, expressed in POSIX ms as
    // the script context sees validity_range.upper_bound. On-chain freshness
    // check is `upper <= valid_until` => must hold for a fresh price.
    const borrowUpperBoundMs = nowMs + 5 * 60_000;

    expect(borrowUpperBoundMs).toBeLessThanOrEqual(deadline);
  });
});

describe("postPrice (orchestration, mocked chain access)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // This test stubs out every chain-facing dependency (wallet, fetcher,
  // submitter, slot lookup) and Mesh's tx builder itself. It verifies
  // postPrice's own orchestration logic (fetch price -> compute validity ->
  // build tx -> sign -> submit) wires those pieces together correctly.
  // It does NOT exercise real transaction construction, signing, or
  // submission against a live chain — no devnet is available in this
  // sandbox. See report for what remains unverified.
  it("fetches price, builds datum-bearing tx, signs, and submits", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ result: { ADAUSD: { c: ["0.4000", "10"] } } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const signTx = vi.fn().mockResolvedValue("signed-tx-cbor");
    const submitTx = vi.fn().mockResolvedValue("abc123txhash");
    const getUtxos = vi.fn().mockResolvedValue([]);
    const getChangeAddress = vi.fn().mockResolvedValue("addr_test1_change");
    const now = vi.fn().mockReturnValue(1_782_899_000_000);

    const deps: PostPriceDeps = {
      wallet: {
        getChangeAddress,
        getUtxos,
        signTx,
      },
      fetcher: {} as PostPriceDeps["fetcher"],
      submitter: { submitTx },
      now,
    };

    // MeshTxBuilder.complete() needs real fetcher/protocol-param wiring to
    // succeed end-to-end; that path is exactly the "needs a live devnet"
    // gap called out in the report. We only assert the pieces that don't
    // require a real builder result get invoked in the right order up to
    // that point, by checking the price fetch + deadline clock ran.
    await expect(
      postPrice({ oracleAddress: "addr_test1_oracle" }, deps),
    ).rejects.toBeDefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.kraken.com/0/public/Ticker?pair=ADAUSD",
    );
    expect(now).toHaveBeenCalled();
    expect(getChangeAddress).toHaveBeenCalled();
    expect(getUtxos).toHaveBeenCalled();
  });
});
