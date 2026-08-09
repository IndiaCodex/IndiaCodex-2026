/**
 * src/lib/cardano/transactions.ts
 *
 * Builds, signs, and submits the IdeaProof registration transaction.
 * Uses the connected CIP-30 wallet (via Mesh SDK) to:
 *  1. Fetch wallet UTxOs
 *  2. Build a transaction locking 2 ADA at the validator script address
 *  3. Attach the encoded inline datum
 *  4. Attach minimal metadata under label 674
 *  5. Request wallet signature
 *  6. Submit via the wallet
 *  7. Return the real transaction hash
 *
 * NEVER simulates or mocks a transaction hash. The hash comes from the
 * Cardano network after actual submission.
 */

import { MeshTxBuilder, resolvePaymentKeyHash, BlockfrostProvider } from '@meshsdk/core';
import { getScriptAddress } from './validator';
import { buildIdeaProofDatum, getWalletPaymentKeyHash } from './datum';
import {
  SCRIPT_LOCK_LOVELACE,
  IDEA_PROOF_METADATA_LABEL,
  CARDANO_NETWORK,
} from './network';

// ─── types ────────────────────────────────────────────────────────────────────

export type TxStatus =
  | 'preparing'
  | 'awaiting_signature'
  | 'submitting'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'failed';

export interface RegisterIdeaParams {
  wallet: any;         // Mesh BrowserWallet instance (connected CIP-30 wallet)
  ideaId: string;
  ideaHash: string;    // 64-char SHA-256 hex (from hashing.ts)
  title: string;       // Idea title for metadata (max 64 chars)
}

export interface RegisterIdeaResult {
  transactionHash: string;    // Real tx hash from Cardano
  scriptAddress: string;      // The script address funds were locked at
  outputIndex: number;        // Output index at the script address (usually 0)
  utxoReference: string;      // "{txHash}#{outputIndex}"
  network: string;
  confirmationStatus: 'submitted' | 'demo';
  submittedAt: string;        // ISO timestamp
  ownerPkh: string;           // Payment key hash (for verification)
}

// ─── user-friendly error translator ──────────────────────────────────────────

export function formatCardanoError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    // Common CIP-30 / Mesh errors
    if (msg.includes('user declined') || msg.includes('UserDeclined') || msg.includes('Refused')) {
      return 'You declined the wallet signing request. Please try again and approve the transaction.';
    }
    if (msg.includes('InsufficientFunds') || msg.includes('insufficient') || msg.toLowerCase().includes('balance')) {
      return 'Insufficient test ADA. Please get Preview Testnet ADA from the faucet: https://docs.cardano.org/cardano-testnets/tools/faucet/';
    }
    if (msg.includes('UTxO Balance Insufficient') || msg.includes('UTxOBalanceInsufficient')) {
      return 'No spendable UTxOs in your wallet. Please send some Preview ADA to your wallet address.';
    }
    if (msg.includes('network') && msg.includes('0') && msg.includes('1')) {
      return 'Wrong network. Please switch your Cardano wallet to Preview Testnet.';
    }
    if (msg.includes('getUtxos') || msg.includes('getChangeAddress')) {
      return 'Could not read wallet UTxOs. Ensure your wallet is unlocked and connected.';
    }
    if (msg.toLowerCase().includes('submit') || msg.includes('submitTx')) {
      return 'Transaction submission failed. The network may be congested. Please try again.';
    }
    return msg;
  }
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred during the Cardano transaction.';
}

// ─── main registration function ───────────────────────────────────────────────

/**
 * Registers an idea hash on the Cardano Preview Testnet.
 *
 * This function performs a REAL on-chain transaction. It will:
 *  - Use the user's connected CIP-30 wallet
 *  - Build a transaction locking 2 test ADA at the validator address
 *  - Attach an inline datum containing the idea proof
 *  - Request wallet signing (user must approve in their wallet extension)
 *  - Submit the transaction to Preview Testnet
 *  - Return the REAL transaction hash
 *
 * No hashes are simulated or invented.
 */
export async function registerIdeaOnChain(
  params: RegisterIdeaParams
): Promise<RegisterIdeaResult> {
  const { wallet, ideaId, ideaHash, title } = params;

  if (!wallet) {
    throw new Error('No wallet connected. Please connect a Cardano wallet first.');
  }

  // 1. Get wallet info
  const { paymentKeyHash, addressBech32 } = await getWalletPaymentKeyHash(wallet);
  const changeAddress = addressBech32;
  const ownerPkh = paymentKeyHash;

  // 2. Get wallet UTxOs
  const { BrowserWallet } = await import('@meshsdk/core');
  const browserWallet = new (BrowserWallet as any)(wallet);
  const utxos = await browserWallet.getUtxos();
  if (!utxos || utxos.length === 0) {
    throw new Error(
      'No spendable UTxOs found in your wallet. ' +
      'Please fund your Preview wallet from: https://docs.cardano.org/cardano-testnets/tools/faucet/'
    );
  }

  // Explicitly validate UTxO formats and log
  for (let i = 0; i < utxos.length; i++) {
    const utxo = utxos[i];
    console.log("[CARDANO DEBUG] object before reading address:", utxo?.output);
    if (!utxo || !utxo.output || !utxo.output.address) {
      throw new Error(`Missing address in UTxO index ${i}`);
    }
  }

  // 3. Build inline datum
  const submittedAt = Date.now();
  const inlineDatum = buildIdeaProofDatum({
    ideaId,
    ideaHash,
    ownerPkh,
    submittedAt,
  });

  // 4. Build metadata (label 674, CIP-0010 compliant)
  const metadata: Record<string, string> = {
    app: 'LaunchNest',
    version: '1.0',
    type: 'IDEA_PROOF',
    ideaId: ideaId.substring(0, 50),
    ideaHash: ideaHash, // 64-char hex, within metadata limits
    title: title.substring(0, 64),
    submittedAt: new Date(submittedAt).toISOString(),
    network: CARDANO_NETWORK,
  };

  // 5. Initialize Blockfrost provider for fee estimation and UTxO selection
  const blockfrostId = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID || '';
  if (!blockfrostId) {
    throw new Error(
      'NEXT_PUBLIC_BLOCKFROST_PROJECT_ID is not set. ' +
      'Please create a Blockfrost project at https://blockfrost.io and add the key to .env.local'
    );
  }
  const provider = new BlockfrostProvider(blockfrostId);

  // 6. Get script address from validator
  const scriptAddress = getScriptAddress();

  // 7. Build the transaction
  const txBuilder = new MeshTxBuilder({
    fetcher: provider,
    submitter: provider,
  });

  const unsignedTx = await txBuilder
    .txOut(scriptAddress, [{ unit: 'lovelace', quantity: SCRIPT_LOCK_LOVELACE }])
    .txOutInlineDatumValue(inlineDatum)
    .metadataValue(String(IDEA_PROOF_METADATA_LABEL), metadata)
    .changeAddress(changeAddress)
    .selectUtxosFrom(utxos)
    .complete();

  // 8. Request wallet signing (user approves in their browser wallet extension)
  console.log("[CARDANO] Unsigned transaction hex:", unsignedTx);
  const signedTx = await browserWallet.signTx(unsignedTx, true);
  console.log("[CARDANO] Signed transaction hex:", signedTx);

  // 9. Submit to Preview Testnet
  console.log("[CARDANO] Submitting transaction hex (submitted CBOR):", signedTx);
  const txHash = await browserWallet.submitTx(signedTx);
  console.log("[CARDANO] Submitted transaction hash:", txHash);

  // txHash is the REAL transaction hash from the Cardano node.
  return {
    transactionHash: txHash,
    scriptAddress,
    outputIndex: 0,
    utxoReference: `${txHash}#0`,
    network: CARDANO_NETWORK,
    confirmationStatus: 'submitted',
    submittedAt: new Date(submittedAt).toISOString(),
    ownerPkh,
  };
}
