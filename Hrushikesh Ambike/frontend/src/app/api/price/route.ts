import { NextResponse } from "next/server";
import { fetchAdaUsd } from "@ouro/offchain/price";

// Server-side proxy for the already-tested Kraken/Coinbase price fetch
// (ouro/offchain/src/price.ts, 4/4 tests passing there). Runs server-side
// so the browser never has to hit a third-party API directly (avoids CORS
// and keeps the door open for adding request signing/rate-limiting later).
export async function GET() {
  try {
    const price = await fetchAdaUsd();
    // fetchedAt lets the UI show freshness ("updated 12s ago") and flag a
    // stale quote if polling stalls.
    return NextResponse.json({ ...price, fetchedAt: Date.now() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Price fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
