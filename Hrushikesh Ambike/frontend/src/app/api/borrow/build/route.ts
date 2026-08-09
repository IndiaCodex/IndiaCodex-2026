import { NextResponse } from "next/server";
import type { UTxO } from "@meshsdk/core";
import { loadValidators } from "@ouro/offchain/blueprint";
import { buildBorrowTxUnsigned } from "@ouro/offchain/tx/deposit-borrow";
import { loadAdminWallet } from "@ouro/offchain/admin-signer";
import { netAfterFee } from "@ouro/offchain/ledger/ltv";
import { loadOuroContext, ORIGINATION_FEE_BPS } from "@/lib/server/ouroContext";

// Builds a Borrow tx for the connected wallet and adds the ADMIN co-signature
// (reserve.ak gates the tUSDM mint on admin_vkh). Returns a PARTIALLY signed
// tx; the browser wallet adds the owner signature and submits. Node runtime.
export const runtime = "nodejs";

const MIN_COLLATERAL_LOVELACE = 5_000_000;
const TTL_SLOTS = 300;

interface Body {
  changeAddress?: unknown;
  utxos?: unknown;
  drawTusdm?: unknown;
}

/** Every rejection also lands in the server log — the terminal otherwise only
 * shows "400" while the reason is buried in a JSON body the UI may not show. */
function reject(error: string) {
  console.warn(`[borrow/build] rejected: ${error}`);
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const changeAddress =
      typeof body.changeAddress === "string" ? body.changeAddress : "";
    const utxos = Array.isArray(body.utxos) ? (body.utxos as UTxO[]) : [];
    const drawTusdm = Number(body.drawTusdm);

    if (!changeAddress.startsWith("addr")) {
      return reject("Missing or invalid wallet address.");
    }
    if (utxos.length === 0) {
      return reject("No wallet UTxOs provided.");
    }
    if (!Number.isInteger(drawTusdm) || drawTusdm <= 0) {
      return reject(
        "Borrow amount must be a positive whole number of micro-tUSDM.",
      );
    }

    const ctx = await loadOuroContext(changeAddress);
    // vault.ak's borrow_ok requires the tx's validity upper bound (≈ now +
    // TTL, as POSIX ms) to sit before the oracle price's deadline; catching a
    // stale price here turns an opaque on-chain Plutus error into an
    // actionable message.
    if (ctx.priceValidUntilPosixMs < Date.now() + TTL_SLOTS * 1000) {
      return reject(
        `Oracle price expired ${new Date(ctx.priceValidUntilPosixMs).toISOString()} — borrows are blocked until a fresh price is posted. Run: cd ouro/offchain && npx tsx --env-file=.env scripts/repost-oracle-price.ts`,
      );
    }
    if (!ctx.vaultState) {
      return reject("No vault found — deposit collateral first.");
    }
    if (drawTusdm > ctx.maxDrawMicro) {
      return reject(
        `Borrow exceeds LTV limit. Max drawable now: ${ctx.maxDrawMicro} µtUSDM.`,
      );
    }

    const collateralUtxo = pickCollateral(utxos);
    if (!collateralUtxo) {
      return reject(
        "No pure-ADA UTxO (≥5 tADA) available for Plutus collateral. Enable a collateral UTxO in your wallet settings (e.g. Eternl → Collateral), or send yourself a little tADA to create one.",
      );
    }

    const validators = loadValidators();
    const vaultScript = validators.vault(
      ctx.ownerVkh,
      ctx.deployment.tusdmPolicy,
      ctx.deployment.tusdmAssetNameHex ?? "745553444d",
      ctx.deployment.oracleHash,
      ctx.deployment.reputationHash,
    );
    const reserveScript = validators.reserve(ctx.deployment.adminVkh);

    const latestBlock = await ctx.provider.fetchLatestBlock();
    const invalidHereafterSlot = Number(latestBlock.slot) + TTL_SLOTS;

    // vault.ak derives the borrowed delta as new.principal - old.principal, so
    // the new datum carries the NEW TOTAL principal; the mint is the delta net
    // of the origination fee.
    const newPrincipalTusdm = ctx.vaultState.principalTusdm + drawTusdm;
    const netTusdm = netAfterFee(drawTusdm, ORIGINATION_FEE_BPS);

    const unsignedTx = await buildBorrowTxUnsigned(
      { fetcher: ctx.provider },
      {
        vaultUtxo: ctx.vaultState.utxo,
        vaultScript,
        reserveScript,
        tusdmPolicyId: ctx.deployment.tusdmPolicy,
        tusdmAssetNameHex: ctx.deployment.tusdmAssetNameHex ?? "745553444d",
        oracleUtxo: ctx.oracleUtxo,
        collateralUtxo,
        ownerVkh: ctx.ownerVkh,
        adminVkh: ctx.deployment.adminVkh,
        collateralLovelace: ctx.vaultState.collateralLovelace,
        currentTierAtOpen: ctx.vaultState.tierAtOpen,
        grossTusdm: newPrincipalTusdm,
        netTusdm,
        invalidHereafterSlot,
        changeAddress,
        utxos,
      },
    );

    // Admin co-signs the mint now (partial); the browser wallet adds the owner
    // signature and submits.
    const adminWallet = await loadAdminWallet(ctx.provider, ctx.provider);
    const partialSignedTx = await adminWallet.signTx(unsignedTx, true);

    return NextResponse.json({
      partialSignedTx,
      drawTusdm,
      netTusdm,
      newPrincipalTusdm,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to build borrow transaction.";
    console.error("[borrow/build] failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Smallest pure-ADA UTxO ≥ 5 tADA (Plutus collateral), else the largest
 * pure-ADA UTxO, else none. */
function pickCollateral(utxos: UTxO[]): UTxO | undefined {
  const pureAda = utxos
    .filter((u) => u.output.amount.every((a) => a.unit === "lovelace"))
    .sort(
      (a, b) =>
        Number(a.output.amount[0].quantity) - Number(b.output.amount[0].quantity),
    );
  const bigEnough = pureAda.filter(
    (u) => Number(u.output.amount[0].quantity) >= MIN_COLLATERAL_LOVELACE,
  );
  return bigEnough[0] ?? pureAda[pureAda.length - 1];
}
