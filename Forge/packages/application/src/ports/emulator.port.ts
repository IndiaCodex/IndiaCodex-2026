import type { TestResult, TestScenario, Wallet } from "@forge/domain";
import { createPortToken } from "@forge/plugin-api";
import type { PortToken } from "@forge/plugin-api";

export interface IEmulatorPort {
  seed(wallets: readonly Wallet[]): Promise<void>;
  run(scenario: TestScenario): Promise<TestResult>;
}

export const IEmulatorPortToken: PortToken<IEmulatorPort> =
  createPortToken<IEmulatorPort>("IEmulatorPort");
