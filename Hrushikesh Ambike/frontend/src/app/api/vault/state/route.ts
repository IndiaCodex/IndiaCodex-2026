import { NextResponse } from "next/server";
import { loadOuroContext } from "@/lib/server/ouroContext";

// Read-only: reports the caller's vault (if any), current debt, live oracle
// price and how much more tUSDM they can draw. Used by the UI to render the
// borrow panel. Node runtime (blueprint fs + Blockfrost).
export const runtime = "nodejs";

interface Body {
  address?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const address = typeof body.address === "string" ? body.address : "";
    if (!address.startsWith("addr")) {
      return NextResponse.json(
        { error: "Missing or invalid wallet address." },
        { status: 400 },
      );
    }

    const ctx = await loadOuroContext(address);

    // The tUSDM asset unit (policy + name hex) lets the client read how much
    // tUSDM the wallet actually holds — the real ceiling on how much debt it
    // can repay/burn (which, after the origination fee, is below the gross
    // principal).
    const tusdmUnit =
      ctx.deployment.tusdmPolicy +
      (ctx.deployment.tusdmAssetNameHex ?? "745553444d");

    return NextResponse.json({
      hasVault: ctx.vaultState !== null,
      vaultAddress: ctx.vaultAddress,
      collateralLovelace: ctx.vaultState?.collateralLovelace ?? 0,
      principalTusdm: ctx.vaultState?.principalTusdm ?? 0,
      tierAtOpen: ctx.vaultState?.tierAtOpen ?? "Bronze",
      priceMicroUsd: ctx.priceMicroUsd,
      priceValidUntilPosixMs: ctx.priceValidUntilPosixMs,
      maxBorrowMicro: ctx.maxBorrowMicro,
      maxDrawMicro: ctx.maxDrawMicro,
      tusdmUnit,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to read vault state.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
