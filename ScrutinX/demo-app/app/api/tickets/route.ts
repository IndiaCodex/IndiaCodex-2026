import { NextResponse } from "next/server";
import { config, realSettlementReady } from "@/lib/agent/config";
import { isPendingSpent } from "@/lib/agent/pendingSpent";

export const runtime = "nodejs";
// Chain state changes every block — never serve a cached snapshot, or the ticket list drifts
// from reality and settlement rejects "already-spent" tickets the UI still shows as Open.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * GET the REAL Open ticket UTXOs at the script address — resolved via the SAME `lucid.utxosAt` that
 * settleReal uses, so the ticket list and the settlement can never disagree.
 */
export async function GET() {
  if (!config.blockfrost.projectId || !config.scriptAddress) {
    return NextResponse.json({ tickets: [], configured: false });
  }
  try {
    const { Lucid, Blockfrost, Data, toText } = (await import(
      "@lucid-evolution/lucid"
    )) as any;
    const lucid = await Lucid(
      new Blockfrost(config.blockfrost.url, config.blockfrost.projectId),
      "Preprod"
    );

    const StatusSchema = Data.Enum([Data.Literal("Open"), Data.Literal("Claimed")]);
    const BatchDatumSchema = Data.Object({
      owner: Data.Bytes(),
      item_id: Data.Bytes(),
      status: StatusSchema,
    });

    const utxos = (await lucid.utxosAt(config.scriptAddress)) as any[];
    const tickets: { ref: string; itemId: string }[] = [];
    for (const u of utxos) {
      if (!u.datum) continue; // inline datum only
      try {
        const d = Data.from(u.datum, BatchDatumSchema);
        const ref = `${u.txHash}#${u.outputIndex}`;
        if (d.status === "Open" && !isPendingSpent(ref)) {
          tickets.push({ ref, itemId: safeText(toText, d.item_id) });
        }
      } catch {
        /* skip undecodable UTXOs */
      }
    }
    return NextResponse.json({ tickets, configured: realSettlementReady() });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ tickets: [], configured: false, error: message }, { status: 500 });
  }
}

function safeText(toText: (h: string) => string, hex: string): string {
  try {
    return toText(hex);
  } catch {
    return hex.slice(0, 8);
  }
}
