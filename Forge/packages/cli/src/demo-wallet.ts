import type { Wallet } from "@forge/domain";

const DEMO_WALLET_ADDRESS = "addr_test1_forge_cli_demo_wallet";

/**
 * A synthetic wallet seeded purely so the in-memory emulator has
 * something spendable to check the generated contract's happy-path
 * scenario against. Not a real funded wallet — clearly named as a demo
 * fixture, never presented as a real address.
 */
export function createDemoWallet(): Wallet {
  return {
    address: DEMO_WALLET_ADDRESS,
    utxos: [
      {
        txHash: "0".repeat(64),
        outputIndex: 0,
        address: DEMO_WALLET_ADDRESS,
        assets: { lovelace: 100_000_000n },
      },
    ],
  };
}
