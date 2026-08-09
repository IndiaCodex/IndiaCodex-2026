import { describe, expect, it } from "vitest";
import { loadDeployment, vaultAddressForOwner } from "../src/deployment";

describe("loadDeployment", () => {
  it("reads the recorded preprod deployment with the expected public fields", () => {
    const d = loadDeployment("preprod");

    expect(d.network).toBe("preprod");
    expect(d.tusdmPolicy).toMatch(/^[0-9a-f]{56}$/);
    expect(d.oracleHash).toMatch(/^[0-9a-f]{56}$/);
    expect(d.reputationHash).toMatch(/^[0-9a-f]{56}$/);
    expect(d.oracleAddress).toMatch(/^addr_test1/);
  });
});

describe("vaultAddressForOwner", () => {
  const ownerA = "aa".repeat(28);
  const ownerB = "bb".repeat(28);

  it("derives a testnet script address for the owner", () => {
    const deployment = loadDeployment("preprod");
    const addr = vaultAddressForOwner(ownerA, deployment);

    expect(addr).toMatch(/^addr_test1/);
  });

  it("is deterministic for the same owner and differs per owner", () => {
    const deployment = loadDeployment("preprod");

    expect(vaultAddressForOwner(ownerA, deployment)).toBe(
      vaultAddressForOwner(ownerA, deployment),
    );
    expect(vaultAddressForOwner(ownerA, deployment)).not.toBe(
      vaultAddressForOwner(ownerB, deployment),
    );
  });
});
