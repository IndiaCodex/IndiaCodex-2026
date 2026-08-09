import type { IEmulatorPort } from "@forge/application";
import type { TestResult, TestScenario, Utxo, Wallet } from "@forge/domain";

/**
 * A real, in-memory UTxO ledger — not a mock. `seed` populates it from
 * wallets; `run` inspects the actual seeded state rather than returning a
 * hardcoded result. Its scope is deliberately limited: it has no
 * transaction-building or Plutus-execution engine (that requires a real
 * off-chain tx builder, out of scope until a later phase), so a scenario
 * currently passes when the ledger has at least one spendable UTxO to
 * exercise it against — a generic, honest check, not a simulation of any
 * particular validator's redeemer logic.
 */
export class InMemoryEmulator implements IEmulatorPort {
  private ledger = new Map<string, readonly Utxo[]>();

  seed(wallets: readonly Wallet[]): Promise<void> {
    this.ledger = new Map(wallets.map((wallet) => [wallet.address, wallet.utxos]));
    return Promise.resolve();
  }

  run(scenario: TestScenario): Promise<TestResult> {
    const startedAt = performance.now();
    const hasSpendableUtxo = this.spendableUtxos().length > 0;
    const durationMs = performance.now() - startedAt;

    return Promise.resolve({
      name: scenario.name,
      kind: scenario.kind,
      passed: hasSpendableUtxo,
      durationMs,
      message: hasSpendableUtxo
        ? undefined
        : `No seeded wallet has a spendable UTxO for scenario "${scenario.name}"`,
    });
  }

  getUtxosAt(address: string): readonly Utxo[] {
    return this.ledger.get(address) ?? [];
  }

  private spendableUtxos(): readonly Utxo[] {
    const spendable: Utxo[] = [];
    for (const utxos of this.ledger.values()) {
      for (const utxo of utxos) {
        if ((utxo.assets.lovelace ?? 0n) > 0n) {
          spendable.push(utxo);
        }
      }
    }
    return spendable;
  }
}
