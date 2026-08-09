/**
 * src/lib/cardano/network.ts
 * Network constants, Preview Testnet configuration, explorer URLs.
 */

export const CARDANO_NETWORK = (process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preview') as 'preview' | 'mainnet';

// Network ID: 0 = testnet (preview/preprod), 1 = mainnet
export const NETWORK_ID = CARDANO_NETWORK === 'mainnet' ? 1 : 0;

// CIP-30 Network IDs returned by wallet.getNetworkId()
export const CIP30_NETWORK_PREVIEW = 0;
export const CIP30_NETWORK_MAINNET = 1;

export const CARDANO_EXPLORERS = {
  preview: {
    tx: (txHash: string) => `https://preview.cardanoscan.io/transaction/${txHash}`,
    address: (addr: string) => `https://preview.cardanoscan.io/address/${addr}`,
    block: (blockHash: string) => `https://preview.cardanoscan.io/block/${blockHash}`,
  },
  mainnet: {
    tx: (txHash: string) => `https://cardanoscan.io/transaction/${txHash}`,
    address: (addr: string) => `https://cardanoscan.io/address/${addr}`,
    block: (blockHash: string) => `https://cardanoscan.io/block/${blockHash}`,
  },
} as const;

export function getCardanoExplorerTxUrl(txHash: string): string {
  return CARDANO_EXPLORERS[CARDANO_NETWORK].tx(txHash);
}

export function getCardanoExplorerAddressUrl(address: string): string {
  return CARDANO_EXPLORERS[CARDANO_NETWORK].address(address);
}

/** Human-readable label for the current network */
export const NETWORK_LABEL = CARDANO_NETWORK === 'mainnet' ? 'Cardano Mainnet' : 'Cardano Preview Testnet';

/** ADA to Lovelace conversion factor (1 ADA = 1,000,000 Lovelace) */
export const ADA_TO_LOVELACE = 1_000_000;

/** Min ADA to lock at script (2 ADA for min UTxO) */
export const SCRIPT_LOCK_LOVELACE = '2000000';

/** Metadata label for idea proofs (CIP-0010) */
export const IDEA_PROOF_METADATA_LABEL = 674;
