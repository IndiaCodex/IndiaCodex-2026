import { NextResponse } from "next/server";
import { CongestionPredictor } from "@/lib/agent/congestion";

export const runtime = "nodejs";
// Live congestion score — don't serve a cached value.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Persist one predictor across hot reloads / requests via globalThis.
const g = globalThis as unknown as { __congestion?: CongestionPredictor };
function predictor(): CongestionPredictor {
  if (!g.__congestion) {
    g.__congestion = new CongestionPredictor();
    g.__congestion.start().catch(() => {});
  }
  return g.__congestion;
}

export async function GET() {
  const p = predictor();
  return NextResponse.json({ score: p.score, injected: p.isOverridden() });
}

/** POST { override: number | null } — inject a congestion value (slider), or null to follow the real reading. */
export async function POST(req: Request) {
  const p = predictor();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  if (typeof body.override === "number" || body.override === null) {
    p.setOverride(body.override as number | null);
  }
  return NextResponse.json({ score: p.score, injected: p.isOverridden() });
}
