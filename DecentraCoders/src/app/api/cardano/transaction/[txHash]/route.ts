/**
 * src/app/api/cardano/transaction/[txHash]/route.ts
 *
 * Server-side route to check Cardano transaction confirmation status.
 * Uses Blockfrost API without exposing the key to the client.
 */

import { NextRequest, NextResponse } from 'next/server';

const BLOCKFROST_KEY = process.env.BLOCKFROST_PROJECT_ID || '';
const NETWORK = process.env.CARDANO_NETWORK || 'preview';

function getBlockfrostBase(): string {
  if (NETWORK === 'mainnet') return 'https://cardano-mainnet.blockfrost.io/api/v0';
  if (NETWORK === 'preprod') return 'https://cardano-preprod.blockfrost.io/api/v0';
  return 'https://cardano-preview.blockfrost.io/api/v0';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { txHash: string } }
) {
  const { txHash } = params;

  // Validate tx hash format (64 hex chars)
  if (!/^[0-9a-f]{64}$/i.test(txHash)) {
    return NextResponse.json(
      { error: 'Invalid transaction hash format.' },
      { status: 400 }
    );
  }

  if (!BLOCKFROST_KEY) {
    return NextResponse.json(
      {
        error: 'Blockfrost is not configured.',
        status: 'pending',
        configured: false,
      },
      { status: 200 }
    );
  }

  try {
    const base = getBlockfrostBase();
    const res = await fetch(`${base}/txs/${txHash}`, {
      headers: { project_id: BLOCKFROST_KEY },
      next: { revalidate: 0 }, // always fresh
    });

    if (res.status === 404) {
      // Not yet confirmed — do not treat as failure
      return NextResponse.json({
        txHash,
        status: 'pending',
        message: 'Transaction not yet found on Blockfrost. It may still be propagating.',
      });
    }

    if (!res.ok) {
      const body = await res.text();
      console.error('[Blockfrost] Error fetching tx:', res.status, body);
      return NextResponse.json(
        { error: 'Blockfrost returned an error.', blockfrostStatus: res.status },
        { status: 502 }
      );
    }

    const tx = await res.json();

    return NextResponse.json({
      txHash,
      status: 'confirmed',
      blockHash: tx.block,
      blockHeight: tx.block_height,
      blockTime: tx.block_time,
      fees: tx.fees,
      confirmedAt: new Date(tx.block_time * 1000).toISOString(),
    });
  } catch (err: any) {
    console.error('[Blockfrost] Fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to reach Blockfrost. Please try again.', detail: err?.message },
      { status: 503 }
    );
  }
}
