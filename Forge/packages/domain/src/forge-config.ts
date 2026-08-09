import type { Network } from "./network.js";

export interface ResolvedForgeConfig {
  readonly projectRoot: string;
  readonly network: Network;
  readonly plugins: readonly string[];
}
