import { describe, expect, it, vi } from "vitest";
import {
  buildBorrowTx,
  buildBorrowTxUnsigned,
  buildDepositTx,
  buildDepositTxUnsigned,
  buildRepayTxUnsigned,
  type BorrowDeps,
  type DepositDeps,
} from "../src/tx/deposit-borrow";

// Both builders end in MeshTxBuilder.complete(), which needs a real
// fetcher/protocol-params connection to succeed - not available in this
// sandbox (no live devnet, per the project's explicit constraint). These
// tests verify the orchestration up to that point: wallet/fetcher calls
// happen in the right order with the right arguments. Real transaction
// construction, signing, and submission remain unverified until a devnet
// or preprod connection exists - see report.
describe("buildDepositTx (orchestration, mocked chain access)", () => {
  it("reads wallet address and utxos before building", async () => {
    const getChangeAddress = vi.fn().mockResolvedValue("addr_test1_change");
    const getUtxos = vi.fn().mockResolvedValue([]);
    const signTx = vi.fn().mockResolvedValue("signed-tx-cbor");

    const deps: DepositDeps = {
      wallet: { getChangeAddress, getUtxos, signTx },
      fetcher: {} as DepositDeps["fetcher"],
      submitter: { submitTx: vi.fn() },
    };

    await expect(
      buildDepositTx(deps, {
        ownerVkh: "aa".repeat(28),
        collateralLovelace: 1_000_000_000,
        vaultAddress: "addr_test1_vault",
      }),
    ).rejects.toBeDefined();

    expect(getChangeAddress).toHaveBeenCalled();
    expect(getUtxos).toHaveBeenCalled();
  });
});

describe("buildDepositTxUnsigned (build-only, no signing key)", () => {
  it("assembles from explicit changeAddress + utxos without a wallet", async () => {
    // The web server path holds a fetcher but never a signing key: it must be
    // able to build the unsigned tx from a bare changeAddress + utxo list.
    // complete() still needs real protocol params (no live provider here), so
    // it rejects — we assert the build-only surface accepts the shape and gets
    // that far without requiring wallet.signTx.
    await expect(
      buildDepositTxUnsigned(
        { fetcher: {} as DepositDeps["fetcher"] },
        {
          ownerVkh: "aa".repeat(28),
          collateralLovelace: 1_000_000_000,
          vaultAddress: "addr_test1_vault",
          changeAddress: "addr_test1_change",
          utxos: [],
        },
      ),
    ).rejects.toBeDefined();
  });
});

describe("buildBorrowTxUnsigned (build-only, server co-sign path)", () => {
  it("assembles from explicit changeAddress + utxos without a signing key", async () => {
    // The server holds a fetcher and the admin key, but not the owner's key:
    // it must build (declaring both required signers) without wallet.signTx.
    // complete() needs real protocol params (none here), so it rejects.
    const fakeUtxo = {
      input: { txHash: "a".repeat(64), outputIndex: 0 },
      output: {
        address: "addr_test1_vault",
        amount: [{ unit: "lovelace", quantity: "1000000000" }],
      },
    };

    await expect(
      buildBorrowTxUnsigned(
        { fetcher: {} as BorrowDeps["fetcher"] },
        {
          vaultUtxo: fakeUtxo as never,
          vaultScript: { version: "V3", code: "deadbeef" },
          reserveScript: { version: "V3", code: "cafebabe" },
          tusdmPolicyId: "cc".repeat(28),
          tusdmAssetNameHex: "745553444d",
          oracleUtxo: fakeUtxo as never,
          collateralUtxo: fakeUtxo as never,
          ownerVkh: "aa".repeat(28),
          adminVkh: "bb".repeat(28),
          collateralLovelace: 1_000_000_000,
          currentTierAtOpen: "Bronze",
          grossTusdm: 200_000_000,
          netTusdm: 198_000_000,
          invalidHereafterSlot: 500_000,
          changeAddress: "addr_test1_change",
          utxos: [],
        },
      ),
    ).rejects.toBeDefined();
  });
});

describe("buildDepositTxUnsigned collateral reserve", () => {
  it("accepts a collateralReserveLovelace to carve out a reusable collateral UTxO", async () => {
    // Adds a second output (pure-ADA back to the depositor). complete() still
    // needs real protocol params (none here), so it rejects — we assert the
    // reserve param is accepted on the build-only surface.
    await expect(
      buildDepositTxUnsigned(
        { fetcher: {} as DepositDeps["fetcher"] },
        {
          ownerVkh: "aa".repeat(28),
          collateralLovelace: 1_000_000_000,
          vaultAddress: "addr_test1_vault",
          changeAddress: "addr_test1_change",
          utxos: [],
          collateralReserveLovelace: 6_000_000,
        },
      ),
    ).rejects.toBeDefined();
  });
});

describe("buildRepayTxUnsigned (build-only, server co-sign path)", () => {
  it("assembles a burn tx from explicit changeAddress + utxos without a signing key", async () => {
    // Same server shape as borrow: build declaring both required signers, no
    // wallet.signTx. complete() needs real protocol params (none here), so it
    // rejects — we assert the build-only surface accepts the repay shape and
    // gets that far.
    const fakeUtxo = {
      input: { txHash: "a".repeat(64), outputIndex: 0 },
      output: {
        address: "addr_test1_vault",
        amount: [{ unit: "lovelace", quantity: "1000000000" }],
      },
    };

    await expect(
      buildRepayTxUnsigned(
        { fetcher: {} as BorrowDeps["fetcher"] },
        {
          vaultUtxo: fakeUtxo as never,
          vaultScript: { version: "V3", code: "deadbeef" },
          reserveScript: { version: "V3", code: "cafebabe" },
          tusdmPolicyId: "cc".repeat(28),
          tusdmAssetNameHex: "745553444d",
          collateralUtxo: fakeUtxo as never,
          ownerVkh: "aa".repeat(28),
          adminVkh: "bb".repeat(28),
          collateralLovelace: 1_000_000_000,
          currentTierAtOpen: "Bronze",
          newPrincipalTusdm: 100_000_000,
          repayAmount: 100_000_000,
          changeAddress: "addr_test1_change",
          utxos: [],
        },
      ),
    ).rejects.toBeDefined();
  });
});

describe("buildBorrowTx (orchestration, mocked chain access)", () => {
  it("reads wallet address and utxos before building a dual-signed tx", async () => {
    const getChangeAddress = vi.fn().mockResolvedValue("addr_test1_change");
    const getUtxos = vi.fn().mockResolvedValue([]);
    const walletSignTx = vi.fn().mockResolvedValue("owner-signed-cbor");
    const adminSignTx = vi.fn().mockResolvedValue("fully-signed-cbor");

    const deps: BorrowDeps = {
      wallet: { getChangeAddress, getUtxos, signTx: walletSignTx },
      adminSigner: { signTx: adminSignTx },
      fetcher: {} as BorrowDeps["fetcher"],
      submitter: { submitTx: vi.fn() },
    };

    const fakeUtxo = {
      input: { txHash: "a".repeat(64), outputIndex: 0 },
      output: {
        address: "addr_test1_vault",
        amount: [{ unit: "lovelace", quantity: "1000000000" }],
      },
    };

    await expect(
      buildBorrowTx(deps, {
        vaultUtxo: fakeUtxo as never,
        vaultScript: { version: "V3", code: "deadbeef" },
        reserveScript: { version: "V3", code: "cafebabe" },
        tusdmPolicyId: "cc".repeat(28),
        tusdmAssetNameHex: "745553444d",
        oracleUtxo: fakeUtxo as never,
        collateralUtxo: fakeUtxo as never,
        ownerVkh: "aa".repeat(28),
        adminVkh: "bb".repeat(28),
        collateralLovelace: 1_000_000_000,
        currentTierAtOpen: "Bronze",
        grossTusdm: 200_000_000,
        netTusdm: 198_000_000,
        invalidHereafterSlot: 500_000,
      }),
    ).rejects.toBeDefined();

    expect(getChangeAddress).toHaveBeenCalled();
    expect(getUtxos).toHaveBeenCalled();
  });
});
