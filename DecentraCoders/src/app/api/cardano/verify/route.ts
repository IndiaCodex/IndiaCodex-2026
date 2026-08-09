/**
 * src/app/api/cardano/verify/route.ts
 *
 * Server-side route to verify a given idea hash against a Cardano transaction.
 * Fetches UTxOs at the validator script address and checks if the datum matches.
 */

import { NextRequest, NextResponse } from 'next/server';

const BLOCKFROST_KEY = process.env.BLOCKFROST_PROJECT_ID || '';
const NETWORK = process.env.CARDANO_NETWORK || 'preview';

function getBlockfrostBase(): string {
  if (NETWORK === 'mainnet') return 'https://cardano-mainnet.blockfrost.io/api/v0';
  if (NETWORK === 'preprod') return 'https://cardano-preprod.blockfrost.io/api/v0';
  return 'https://cardano-preview.blockfrost.io/api/v0';
}

async function blockfrostFetch(path: string) {
  const res = await fetch(`${getBlockfrostBase()}${path}`, {
    headers: { project_id: BLOCKFROST_KEY },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { txHash, ideaHash, scriptAddress } = body;

  if (!txHash || !ideaHash || !scriptAddress) {
    return NextResponse.json(
      { error: 'txHash, ideaHash, and scriptAddress are required.' },
      { status: 400 }
    );
  }

  if (!/^[0-9a-f]{64}$/i.test(txHash)) {
    return NextResponse.json({ error: 'Invalid txHash format.' }, { status: 400 });
  }

  if (!/^[0-9a-f]{64}$/i.test(ideaHash)) {
    return NextResponse.json({ error: 'Invalid ideaHash format (must be 64 hex chars).' }, { status: 400 });
  }

  if (!BLOCKFROST_KEY) {
    return NextResponse.json({
      verified: false,
      message: 'Blockfrost is not configured. Cannot perform on-chain verification.',
      configured: false,
    });
  }

  try {
    // 1. Fetch the transaction
    const tx = await blockfrostFetch(`/txs/${txHash}`);
    if (!tx) {
      return NextResponse.json({
        verified: false,
        message: 'Transaction not found on Blockfrost. It may not be confirmed yet.',
        txConfirmed: false,
      });
    }

    // 2. Fetch the UTxOs of this transaction
    const utxos = await blockfrostFetch(`/txs/${txHash}/utxos`);
    if (!utxos) {
      return NextResponse.json({
        verified: false,
        message: 'Could not fetch UTxOs for this transaction.',
      });
    }

    // 3. Find the output at the script address
    const scriptOutput = (utxos.outputs || []).find(
      (o: any) => o.address === scriptAddress
    );
    if (!scriptOutput) {
      return NextResponse.json({
        verified: false,
        message: 'No output found at the script address in this transaction.',
        txConfirmed: true,
        blockHash: tx.block,
        blockHeight: tx.block_height,
        blockTime: tx.block_time,
      });
    }

    // 4. Check inline datum
    const inlineDatum = scriptOutput.inline_datum;
    if (!inlineDatum) {
      return NextResponse.json({
        verified: false,
        message: 'Script output found but has no inline datum.',
        txConfirmed: true,
        blockHash: tx.block,
        blockHeight: tx.block_height,
      });
    }

    // 5. Check if the idea hash is present in the datum
    // The datum is CBOR-encoded Plutus Data. The ideaHash is the 2nd field (index 1)
    // in the constructor. For verification, we check if the hex string appears in the CBOR.
    const datumStr = typeof inlineDatum === 'string'
      ? inlineDatum
      : JSON.stringify(inlineDatum);
    const ideaHashInDatum = datumStr.toLowerCase().includes(ideaHash.toLowerCase());

    return NextResponse.json({
      verified: ideaHashInDatum,
      message: ideaHashInDatum
        ? 'Idea hash verified on Cardano Preview Testnet!'
        : 'Idea hash not found in the on-chain datum.',
      txConfirmed: true,
      blockHash: tx.block,
      blockHeight: tx.block_height,
      blockTime: tx.block_time,
      confirmedAt: new Date(tx.block_time * 1000).toISOString(),
      scriptOutputValue: scriptOutput.amount,
    });
  } catch (err: any) {
    console.error('[Verify] Error:', err);
    return NextResponse.json(
      { error: 'Verification failed.', detail: err?.message },
      { status: 500 }
    );
  }
}
