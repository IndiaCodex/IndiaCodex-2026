/**
 * Env-driven network configuration plumbing.
 *
 * This does NOT open any live connection — it just resolves which network
 * profile the UI believes it is pointed at, for display purposes and for
 * later tasks that wire real providers (Task 4.2+). No Blockfrost/Yaci
 * client is instantiated here.
 */

export type OuroNetwork = "devnet" | "preprod";

export interface NetworkConfig {
  readonly network: OuroNetwork;
  readonly label: string;
  readonly blockfrostProjectId: string | null;
}

function readNetworkEnv(): OuroNetwork {
  const raw = process.env.NEXT_PUBLIC_NETWORK;
  if (raw === "preprod") {
    return "preprod";
  }
  // Defaults to devnet for local/hackathon iteration when unset or invalid.
  return "devnet";
}

export function getNetworkConfig(): NetworkConfig {
  const network = readNetworkEnv();
  const blockfrostProjectId =
    process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID ?? null;

  return {
    network,
    label: network === "preprod" ? "Preprod" : "Local Devnet",
    blockfrostProjectId: blockfrostProjectId || null,
  };
}
