/**
 * src/lib/cardano.ts
 *
 * COMPATIBILITY SHIM — do not use directly in new code.
 *
 * This file re-exports from the new modular Cardano integration:
 *   - src/lib/cardano/network.ts
 *   - src/lib/cardano/validator.ts
 *   - src/lib/cardano/datum.ts
 *   - src/lib/cardano/transactions.ts
 *
 * Old imports from '@/lib/cardano' continue to work unchanged.
 *
 * IMPORTANT: The `isDemoBlockchain` flag and demo-mode fallback have been
 * REMOVED. A real Blockfrost project ID is now required for on-chain
 * transactions. Without it, the registration modal will show a clear error
 * instructing the user to add their Blockfrost key.
 */

export {
  CARDANO_NETWORK,
  NETWORK_ID,
  NETWORK_LABEL,
  SCRIPT_LOCK_LOVELACE,
  IDEA_PROOF_METADATA_LABEL,
  getCardanoExplorerTxUrl,
  getCardanoExplorerAddressUrl,
} from './cardano/network';

export {
  SCRIPT_ADDRESS,
  SCRIPT_HASH,
  IDEA_PROOF_SCRIPT,
  getScriptAddress,
  getScriptHash,
  getScript,
} from './cardano/validator';

export {
  buildIdeaProofDatum,
  validateIdeaHashHex,
  validatePaymentKeyHash,
  getWalletPaymentKeyHash,
} from './cardano/datum';

export {
  registerIdeaOnChain as registerIdeaOnCardano,
  formatCardanoError,
} from './cardano/transactions';

export type {
  RegisterIdeaResult as CardanoRegisterResult,
  TxStatus,
} from './cardano/transactions';

/**
 * Checks the confirmation status of a Cardano transaction via the server-side
 * Blockfrost API route at /api/cardano/transaction/[txHash].
 *
 * Returns 'Confirmed', 'Pending', or 'Failed'.
 * This function is safe to call from any client component.
 */
export async function checkCardanoTxConfirmation(
  txHash: string
): Promise<'Confirmed' | 'Pending' | 'Failed'> {
  // Demo hashes — never confirmed on a real chain
  if (!txHash || txHash.startsWith('demo_')) {
    return 'Failed';
  }

  // Must be a 64-char hex string
  if (!/^[0-9a-f]{64}$/i.test(txHash)) {
    return 'Failed';
  }

  try {
    const res = await fetch(`/api/cardano/transaction/${txHash}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return 'Pending';
    const data = await res.json();
    if (data.status === 'confirmed') return 'Confirmed';
    if (data.status === 'pending') return 'Pending';
    return 'Pending';
  } catch {
    return 'Pending';
  }
}

/**
 * @deprecated isDemoBlockchain is always false now.
 * Kept for backwards compatibility with legacy code that checks this flag.
 */
export const isDemoBlockchain = false;
