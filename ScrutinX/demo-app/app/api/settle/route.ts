import { NextResponse } from "next/server";
import { settleReal } from "@/lib/agent/settlement";
import { config, realSettlementReady } from "@/lib/agent/config";

export const runtime = "nodejs"; // Lucid needs Node, not the edge runtime
// Never let Next cache Lucid's internal Blockfrost fetches — settlement must see live chain state.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/** POST a Batch → SettlementResult. Always a REAL on-chain settlement on Preprod. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  // --- validate BEFORE building any real transaction (AGENT.md §4) ---
  if (!body || !Array.isArray(body.requests) || body.requests.length === 0) {
    return NextResponse.json({ error: "empty or invalid batch" }, { status: 400 });
  }
  if (body.requests.length > config.batchCap) {
    return NextResponse.json({ error: "batch exceeds cap" }, { status: 400 });
  }
  for (const r of body.requests) {
    if (typeof r?.targetUtxoRef !== "string" || typeof r?.claimant !== "string") {
      return NextResponse.json({ error: "malformed request in batch" }, { status: 400 });
    }
  }
  if (!realSettlementReady()) {
    return NextResponse.json(
      { error: "on-chain not configured — set BLOCKFROST_PROJECT_ID, WALLET_SEED, SCRIPT_ADDRESS in .env.local" },
      { status: 503 }
    );
  }

  try {
    const result = await settleReal({
      requests: body.requests,
      builtAtScore: typeof body.builtAtScore === "number" ? body.builtAtScore : 0,
    });
    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
