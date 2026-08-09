import { describe, expect, it } from "vitest";
import { loadValidators, scriptHash } from "../src/blueprint";

const OWNER_A = "aa".repeat(28);
const OWNER_B = "bb".repeat(28);
const POLICY = "cc".repeat(28);
const ASSET_NAME = "745553444d"; // hex("tUSDM")
const ORACLE_HASH = "dd".repeat(28);
const REPUTATION_HASH = "ff".repeat(28);

describe("blueprint", () => {
  it("applies params to the vault script deterministically", () => {
    const validators = loadValidators();
    const first = validators.vault(
      OWNER_A,
      POLICY,
      ASSET_NAME,
      ORACLE_HASH,
      REPUTATION_HASH,
    );
    const second = validators.vault(
      OWNER_A,
      POLICY,
      ASSET_NAME,
      ORACLE_HASH,
      REPUTATION_HASH,
    );
    expect(scriptHash(first)).toEqual(scriptHash(second));
  });

  it("produces a different vault hash per owner (per-user stake credential)", () => {
    const validators = loadValidators();
    const a = validators.vault(
      OWNER_A,
      POLICY,
      ASSET_NAME,
      ORACLE_HASH,
      REPUTATION_HASH,
    );
    const b = validators.vault(
      OWNER_B,
      POLICY,
      ASSET_NAME,
      ORACLE_HASH,
      REPUTATION_HASH,
    );
    expect(scriptHash(a)).not.toEqual(scriptHash(b));
  });

  it("loads the reserve script parameterized by an admin key", () => {
    const validators = loadValidators();
    const adminVkh = "ee".repeat(28);
    const reserve = validators.reserve(adminVkh);
    expect(scriptHash(reserve)).toMatch(/^[0-9a-f]{56}$/);
  });

  it("loads the oracle script parameterized by an oracle key", () => {
    const validators = loadValidators();
    const oracleVkh = "11".repeat(28);
    const a = validators.oracle(oracleVkh);
    const b = validators.oracle("22".repeat(28));
    expect(scriptHash(a)).toMatch(/^[0-9a-f]{56}$/);
    expect(scriptHash(a)).not.toEqual(scriptHash(b));
  });

  it("loads the reputation script with no parameters", () => {
    const validators = loadValidators();
    const reputation = validators.reputation();
    expect(scriptHash(reputation)).toMatch(/^[0-9a-f]{56}$/);
  });
});
