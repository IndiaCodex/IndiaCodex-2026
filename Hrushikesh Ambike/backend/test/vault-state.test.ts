import { describe, expect, it } from "vitest";
import type { IFetcher, UTxO } from "@meshsdk/core";
import {
  decodeOraclePriceDatum,
  decodeOraclePriceMicroUsd,
  decodeVaultDatum,
  findVaultUtxos,
  pickFreshestOraclePrice,
  pickRichestVault,
  type VaultState,
} from "../src/tx/vault-state";

describe("decodeVaultDatum", () => {
  // Real inline datum from the confirmed preprod borrow (vault 87adff…): owner
  // 54466bfa…, principal 50 tUSDM, collateral 1000 ADA, Bronze.
  const REAL_VAULT_DATUM =
    "d8799f581c54466bfa7b31d8f1e93dc7dc23fa6ce8e2897b735cff780a0b744cfd1a02faf0801a3b9aca00d87980ff";

  it("decodes owner, principal, collateral and tier from a real datum", () => {
    const decoded = decodeVaultDatum(REAL_VAULT_DATUM);

    expect(decoded.ownerVkh).toBe(
      "54466bfa7b31d8f1e93dc7dc23fa6ce8e2897b735cff780a0b744cfd",
    );
    expect(decoded.principalTusdm).toBe(50_000_000);
    expect(decoded.collateralLovelace).toBe(1_000_000_000);
    expect(decoded.tierAtOpen).toBe("Bronze");
  });
});

function vaultUtxo(txHash: string, plutusData?: string): UTxO {
  return {
    input: { txHash, outputIndex: 0 },
    output: {
      address: "addr_test1vault",
      amount: [{ unit: "lovelace", quantity: "10000000" }],
      plutusData,
    },
  } as UTxO;
}

const REAL_VAULT_DATUM_FOR_LIST =
  "d8799f581c54466bfa7b31d8f1e93dc7dc23fa6ce8e2897b735cff780a0b744cfd1a02faf0801a3b9aca00d87980ff";

describe("findVaultUtxos", () => {
  it("returns every decodable vault at the address, skipping non-vault outputs", async () => {
    const fetcher = {
      fetchAddressUTxOs: async () => [
        vaultUtxo("aa".repeat(32), REAL_VAULT_DATUM_FOR_LIST),
        vaultUtxo("bb".repeat(32)), // no datum — skipped
        vaultUtxo("cc".repeat(32), REAL_VAULT_DATUM_FOR_LIST),
      ],
    } as unknown as IFetcher;

    const vaults = await findVaultUtxos(fetcher, "addr_test1vault");

    expect(vaults).toHaveLength(2);
    expect(vaults[0].utxo.input.txHash).toBe("aa".repeat(32));
    expect(vaults[1].utxo.input.txHash).toBe("cc".repeat(32));
  });
});

describe("pickRichestVault", () => {
  const PRICE_MICRO_USD = 150_219; // ~$0.15/ADA, the real posted oracle price

  function vault(
    txHash: string,
    collateralLovelace: number,
    principalTusdm: number,
  ): VaultState {
    return {
      utxo: vaultUtxo(txHash),
      ownerVkh: "54466bfa7b31d8f1e93dc7dc23fa6ce8e2897b735cff780a0b744cfd",
      principalTusdm,
      collateralLovelace,
      tierAtOpen: "Bronze",
    };
  }

  it("picks the vault with the most remaining borrowing power", () => {
    // 10 tADA fully drawn (~0.75 max, 0.75 borrowed) vs fresh 100 tADA vault.
    const exhausted = vault("aa".repeat(32), 10_000_000, 751_000);
    const fresh = vault("bb".repeat(32), 100_000_000, 0);

    expect(pickRichestVault([exhausted, fresh], PRICE_MICRO_USD)).toBe(fresh);
    expect(pickRichestVault([fresh, exhausted], PRICE_MICRO_USD)).toBe(fresh);
  });

  it("returns null for no vaults and the sole vault when only one exists", () => {
    const only = vault("aa".repeat(32), 10_000_000, 0);

    expect(pickRichestVault([], PRICE_MICRO_USD)).toBeNull();
    expect(pickRichestVault([only], PRICE_MICRO_USD)).toBe(only);
  });
});

describe("decodeOraclePriceMicroUsd", () => {
  // Real oracle PriceDatum from preprod: price 150219 µUSD, valid_until POSIX-ms.
  const REAL_ORACLE_DATUM = "d8799f1a00024acb1b0000019f412b8e2cff";

  it("reads the micro-USD price from a real oracle datum", () => {
    expect(decodeOraclePriceMicroUsd(REAL_ORACLE_DATUM)).toBe(150_219);
  });
});

// Both fixtures are real datums sitting at the preprod oracle address:
// the deploy-time posting (POSIX-ms deadline, expired 2026-07-08) and the
// legacy slot-denominated posting from before the units fix.
const ORACLE_DATUM_POSIX_MS = "d8799f1a00024acb1b0000019f412b8e2cff";
const ORACLE_DATUM_LEGACY_SLOT = "d8799f1a000249a11a079e583fff";

describe("decodeOraclePriceDatum", () => {
  it("reads price and validity deadline from a real oracle datum", () => {
    expect(decodeOraclePriceDatum(ORACLE_DATUM_POSIX_MS)).toEqual({
      priceMicroUsd: 150_219,
      validUntilPosixMs: 1_783_504_801_324,
    });
  });
});

describe("pickFreshestOraclePrice", () => {
  it("picks the datum UTxO with the latest validity deadline", () => {
    const legacy = vaultUtxo("aa".repeat(32), ORACLE_DATUM_LEGACY_SLOT);
    const fresh = vaultUtxo("bb".repeat(32), ORACLE_DATUM_POSIX_MS);

    const picked = pickFreshestOraclePrice([legacy, fresh]);

    expect(picked?.utxo.input.txHash).toBe("bb".repeat(32));
    expect(picked?.priceMicroUsd).toBe(150_219);
    expect(picked?.validUntilPosixMs).toBe(1_783_504_801_324);
  });

  it("skips UTxOs without a decodable PriceDatum", () => {
    const noDatum = vaultUtxo("aa".repeat(32));
    const notAPrice = vaultUtxo("bb".repeat(32), REAL_VAULT_DATUM_FOR_LIST);
    const fresh = vaultUtxo("cc".repeat(32), ORACLE_DATUM_POSIX_MS);

    const picked = pickFreshestOraclePrice([noDatum, notAPrice, fresh]);

    expect(picked?.utxo.input.txHash).toBe("cc".repeat(32));
  });

  it("returns null when no price UTxO exists", () => {
    expect(pickFreshestOraclePrice([])).toBeNull();
    expect(pickFreshestOraclePrice([vaultUtxo("aa".repeat(32))])).toBeNull();
  });
});
