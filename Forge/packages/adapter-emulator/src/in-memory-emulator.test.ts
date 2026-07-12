import type { TestScenario, Wallet } from "@forge/domain";
import { describe, expect, it } from "vitest";
import { InMemoryEmulator } from "./in-memory-emulator.js";

const scenario: TestScenario = {
  name: "happy path",
  kind: "functional",
  description: "beneficiary claims a milestone",
};

describe("InMemoryEmulator", () => {
  it("fails a scenario when nothing has been seeded", async () => {
    const emulator = new InMemoryEmulator();

    const result = await emulator.run(scenario);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("No seeded wallet");
  });

  it("passes a scenario once a wallet with a spendable UTxO is seeded", async () => {
    const emulator = new InMemoryEmulator();
    const wallet: Wallet = {
      address: "addr_test1beneficiary",
      utxos: [
        {
          txHash: "tx1",
          outputIndex: 0,
          address: "addr_test1beneficiary",
          assets: { lovelace: 5_000_000n },
        },
      ],
    };

    await emulator.seed([wallet]);
    const result = await emulator.run(scenario);

    expect(result.passed).toBe(true);
    expect(result.name).toBe("happy path");
    expect(result.kind).toBe("functional");
  });

  it("does not treat a zero-lovelace UTxO as spendable", async () => {
    const emulator = new InMemoryEmulator();
    const wallet: Wallet = {
      address: "addr_test1empty",
      utxos: [
        { txHash: "tx1", outputIndex: 0, address: "addr_test1empty", assets: { lovelace: 0n } },
      ],
    };

    await emulator.seed([wallet]);
    const result = await emulator.run(scenario);

    expect(result.passed).toBe(false);
  });

  it("exposes seeded UTxOs by address via getUtxosAt", async () => {
    const emulator = new InMemoryEmulator();
    const wallet: Wallet = {
      address: "addr_test1beneficiary",
      utxos: [
        {
          txHash: "tx1",
          outputIndex: 0,
          address: "addr_test1beneficiary",
          assets: { lovelace: 5_000_000n },
        },
      ],
    };

    await emulator.seed([wallet]);

    expect(emulator.getUtxosAt("addr_test1beneficiary")).toHaveLength(1);
    expect(emulator.getUtxosAt("addr_test1unknown")).toEqual([]);
  });

  it("clears previous state on re-seeding", async () => {
    const emulator = new InMemoryEmulator();
    const wallet: Wallet = {
      address: "addr_test1beneficiary",
      utxos: [
        {
          txHash: "tx1",
          outputIndex: 0,
          address: "addr_test1beneficiary",
          assets: { lovelace: 5_000_000n },
        },
      ],
    };

    await emulator.seed([wallet]);
    await emulator.seed([]);

    expect(emulator.getUtxosAt("addr_test1beneficiary")).toEqual([]);
    expect((await emulator.run(scenario)).passed).toBe(false);
  });
});
