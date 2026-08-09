import { NextResponse } from "next/server";
import { deserializeAddress } from "@meshsdk/core";
import { getPreprodProvider } from "@ouro/offchain/preprod-provider";
import { loadDeployment, vaultAddressForOwner } from "@ouro/offchain/deployment";
import { buildDepositTxUnsigned } from "@ouro/offchain/tx/deposit-borrow";

// Runs in Node (not Edge): derives the per-owner vault address from the
// compiled blueprint (node:fs) and talks to Blockfrost with a SERVER-ONLY
// project id (BLOCKFROST_PREPROD_PROJECT_ID), so the key never reaches the
// browser. The browser sends its address + amount; this returns an UNSIGNED
// tx for the wallet to sign and submit itself.
export const runtime = "nodejs";

// 5 tADA floor: comfortably above the vault output's min-UTxO once the inline
// datum is attached, and a sane smallest demo deposit.
const MIN_DEPOSIT_LOVELACE = 5_000_000;

// Size of the dedicated pure-ADA collateral UTxO the deposit sets aside when
// the wallet has none. 6 tADA clears the 5 tADA Plutus-collateral floor with
// headroom; it stays in the user's wallet and is only ever pledged (never
// spent) as collateral for borrow/repay.
const COLLATERAL_RESERVE_LOVELACE = 6_000_000;
const COLLATERAL_MIN_LOVELACE = 5_000_000;
const COLLATERAL_DEDICATED_MAX_LOVELACE = 20_000_000;

/** True when a UTxO is pure ADA and sized like a dedicated collateral input
 * (≥5 and ≤20 tADA) — i.e. the wallet already has a reusable collateral UTxO
 * and the deposit needn't carve out another. */
function isDedicatedCollateral(utxo: {
  output: { amount: { unit: string; quantity: string }[] };
}): boolean {
  const { amount } = utxo.output;
  if (amount.length !== 1 || amount[0].unit !== "lovelace") return false;
  const lovelace = Number(amount[0].quantity);
  return (
    lovelace >= COLLATERAL_MIN_LOVELACE &&
    lovelace <= COLLATERAL_DEDICATED_MAX_LOVELACE
  );
}

interface DepositBuildBody {
  changeAddress?: unknown;
  collateralLovelace?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DepositBuildBody;
    const changeAddress =
      typeof body.changeAddress === "string" ? body.changeAddress : "";
    const collateralLovelace = Number(body.collateralLovelace);

    if (!changeAddress.startsWith("addr")) {
      return NextResponse.json(
        { error: "Missing or invalid wallet address." },
        { status: 400 },
      );
    }
    if (
      !Number.isInteger(collateralLovelace) ||
      collateralLovelace < MIN_DEPOSIT_LOVELACE
    ) {
      return NextResponse.json(
        {
          error: `Deposit must be a whole number of lovelace ≥ ${MIN_DEPOSIT_LOVELACE} (5 tADA).`,
        },
        { status: 400 },
      );
    }

    const { pubKeyHash: ownerVkh } = deserializeAddress(changeAddress);
    if (!ownerVkh) {
      return NextResponse.json(
        { error: "Wallet address has no payment key hash (script address?)." },
        { status: 400 },
      );
    }

    const deployment = loadDeployment("preprod");
    const vaultAddress = vaultAddressForOwner(ownerVkh, deployment);

    const provider = getPreprodProvider();
    const utxos = await provider.fetchAddressUTxOs(changeAddress);
    if (utxos.length === 0) {
      return NextResponse.json(
        { error: "No UTxOs at this address — fund it with preprod tADA first." },
        { status: 400 },
      );
    }

    // Carve out a reusable collateral UTxO unless the wallet already has one,
    // so borrow/repay (Plutus txs) never fail for lack of pure-ADA collateral.
    const hasCollateral = utxos.some(isDedicatedCollateral);
    const collateralReserveLovelace = hasCollateral
      ? undefined
      : COLLATERAL_RESERVE_LOVELACE;

    const unsignedTx = await buildDepositTxUnsigned(
      { fetcher: provider },
      {
        ownerVkh,
        collateralLovelace,
        vaultAddress,
        changeAddress,
        utxos,
        collateralReserveLovelace,
      },
    );

    return NextResponse.json({
      unsignedTx,
      vaultAddress,
      collateralReservedLovelace: collateralReserveLovelace ?? 0,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to build deposit transaction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
