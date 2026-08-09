import { NextResponse } from "next/server";
import type { UTxO } from "@meshsdk/core";
import { loadValidators } from "@ouro/offchain/blueprint";
import { buildRepayTxUnsigned } from "@ouro/offchain/tx/deposit-borrow";
import { loadAdminWallet } from "@ouro/offchain/admin-signer";
import { loadOuroContext } from "@/lib/server/ouroContext";

// Builds a Repay tx for the connected wallet and adds the ADMIN co-signature
// (reserve.ak gates the tUSDM BURN on admin_vkh, same as the mint). Returns a
// PARTIALLY signed tx; the browser wallet adds the owner signature and submits.
// Node runtime (blueprint fs + Blockfrost).
export const runtime = "nodejs";

const MIN_COLLATERAL_LOVELACE = 5_000_000;

interface Body {
  changeAddress?: unknown;
  utxos?: unknown;
  repayTusdm?: unknown;
}

/** Every rejection also lands in the server log — the terminal otherwise only
 * shows "400" while the reason is buried in a JSON body the UI may not show. */
function reject(error: string) {
  console.warn(`[repay/build] rejected: ${error}`);
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const changeAddress =
      typeof body.changeAddress === "string" ? body.changeAddress : "";
    const utxos = Array.isArray(body.utxos) ? (body.utxos as UTxO[]) : [];
    const repayTusdm = Number(body.repayTusdm);

    if (!changeAddress.startsWith("addr")) {
      return reject("Missing or invalid wallet address.");
    }
    if (utxos.length === 0) {
      return reject("No wallet UTxOs provided.");
    }
    if (!Number.isInteger(repayTusdm) || repayTusdm <= 0) {
      return reject(
        "Repay amount must be a positive whole number of micro-tUSDM.",
      );
    }

    const ctx = await loadOuroContext(changeAddress);
    if (!ctx.vaultState) {
      return reject("No vault found — nothing to repay.");
    }
    if (ctx.vaultState.principalTusdm <= 0) {
      return reject("This vault has no outstanding debt.");
    }
    if (repayTusdm > ctx.vaultState.principalTusdm) {
      return reject(
        `Repay exceeds outstanding debt. Current debt: ${ctx.vaultState.principalTusdm} µtUSDM.`,
      );
    }

    const collateralUtxo = pickCollateral(utxos);
    if (!collateralUtxo) {
      return reject(
        "No pure-ADA UTxO (≥5 tADA) available for Plutus collateral. Enable a collateral UTxO in your wallet settings (e.g. Eternl → Collateral), or send yourself a little tADA to create one.",
      );
    }

    const validators = loadValidators();
    const tusdmAssetNameHex = ctx.deployment.tusdmAssetNameHex ?? "745553444d";
    const vaultScript = validators.vault(
      ctx.ownerVkh,
      ctx.deployment.tusdmPolicy,
      tusdmAssetNameHex,
      ctx.deployment.oracleHash,
      ctx.deployment.reputationHash,
    );
    const reserveScript = validators.reserve(ctx.deployment.adminVkh);

    const newPrincipalTusdm = ctx.vaultState.principalTusdm - repayTusdm;

    const unsignedTx = await buildRepayTxUnsigned(
      { fetcher: ctx.provider },
      {
        vaultUtxo: ctx.vaultState.utxo,
        vaultScript,
        reserveScript,
        tusdmPolicyId: ctx.deployment.tusdmPolicy,
        tusdmAssetNameHex,
        collateralUtxo,
        ownerVkh: ctx.ownerVkh,
        adminVkh: ctx.deployment.adminVkh,
        collateralLovelace: ctx.vaultState.collateralLovelace,
        currentTierAtOpen: ctx.vaultState.tierAtOpen,
        newPrincipalTusdm,
        repayAmount: repayTusdm,
        changeAddress,
        utxos,
      },
    );

    // Admin co-signs the burn now (partial); the browser wallet adds the owner
    // signature and submits.
    const adminWallet = await loadAdminWallet(ctx.provider, ctx.provider);
    const partialSignedTx = await adminWallet.signTx(unsignedTx, true);

    return NextResponse.json({
      partialSignedTx,
      repayTusdm,
      newPrincipalTusdm,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to build repay transaction.";
    console.error("[repay/build] failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Smallest pure-ADA UTxO ≥ 5 tADA (Plutus collateral), else the largest
 * pure-ADA UTxO, else none. Mirrors the borrow route's picker. */
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
