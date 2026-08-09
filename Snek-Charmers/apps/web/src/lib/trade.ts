import { MeshTxBuilder, mConStr0, mConStr1, mConStr2 } from "@meshsdk/core";
import type { IWallet } from "@meshsdk/core";
import { getProvider, fetchCostModels } from "./provider";
import { curveAddress, curveScriptCbor, poolDatum } from "./contract";
import { buyCost, sellRefund } from "./curve";
import type { Pool } from "./pool";

function lovelaceOf(pool: Pool): bigint {
  const a = pool.utxo.output.amount.find((x) => x.unit === "lovelace");
  return BigInt(a?.quantity ?? "0");
}
function tokensOf(pool: Pool): bigint {
  const a = pool.utxo.output.amount.find((x) => x.unit === pool.unit);
  return BigInt(a?.quantity ?? "0");
}

async function common(wallet: IWallet) {
  const provider = getProvider();
  const costModels = await fetchCostModels();
  const changeAddress = await wallet.getChangeAddress();
  const collateral = (await wallet.getCollateral())[0];
  if (!collateral) {
    throw new Error(
      "No collateral available. Enable collateral in your wallet settings, then retry."
    );
  }
  const utxos = await wallet.getUtxos();
  return { provider, costModels, changeAddress, collateral, utxos };
}

/** Buy `amount` tokens from the pool along the curve. */
export async function buyTokens(
  wallet: IWallet,
  pool: Pool,
  amount: bigint
): Promise<string> {
  const { provider, costModels, changeAddress, collateral, utxos } =
    await common(wallet);

  const price = buyCost(pool.sold, amount);
  const newDatum = poolDatum({
    tokenPolicy: pool.tokenPolicy,
    tokenName: pool.tokenName,
    sold: pool.sold + amount,
    reserve: pool.reserve + price,
    owner: pool.owner,
  });

  const txBuilder = new MeshTxBuilder({
    fetcher: provider,
    submitter: provider,
    evaluator: provider,
  });

  const unsignedTx = await txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      pool.utxo.input.txHash,
      pool.utxo.input.outputIndex,
      pool.utxo.output.amount,
      pool.utxo.output.address
    )
    .txInInlineDatumPresent()
    .txInRedeemerValue(mConStr0([Number(amount)])) // Buy { amount }
    .txInScript(curveScriptCbor)
    .txOut(curveAddress, [
      { unit: "lovelace", quantity: (lovelaceOf(pool) + price).toString() },
      { unit: pool.unit, quantity: (tokensOf(pool) - amount).toString() },
    ])
    .txOutInlineDatumValue(newDatum)
    .txOut(changeAddress, [{ unit: pool.unit, quantity: amount.toString() }])
    .txInCollateral(
      collateral.input.txHash,
      collateral.input.outputIndex,
      collateral.output.amount,
      collateral.output.address
    )
    .selectUtxosFrom(utxos)
    .changeAddress(changeAddress)
    .setNetwork(costModels)
    .complete();

  return wallet.submitTx(await wallet.signTx(unsignedTx, true));
}

/** Sell `amount` tokens back to the pool along the curve. */
export async function sellTokens(
  wallet: IWallet,
  pool: Pool,
  amount: bigint
): Promise<string> {
  const { provider, costModels, changeAddress, collateral, utxos } =
    await common(wallet);

  const refund = sellRefund(pool.sold, amount);
  const newDatum = poolDatum({
    tokenPolicy: pool.tokenPolicy,
    tokenName: pool.tokenName,
    sold: pool.sold - amount,
    reserve: pool.reserve - refund,
    owner: pool.owner,
  });

  const txBuilder = new MeshTxBuilder({
    fetcher: provider,
    submitter: provider,
    evaluator: provider,
  });

  const unsignedTx = await txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      pool.utxo.input.txHash,
      pool.utxo.input.outputIndex,
      pool.utxo.output.amount,
      pool.utxo.output.address
    )
    .txInInlineDatumPresent()
    .txInRedeemerValue(mConStr1([Number(amount)])) // Sell { amount }
    .txInScript(curveScriptCbor)
    .txOut(curveAddress, [
      { unit: "lovelace", quantity: (lovelaceOf(pool) - refund).toString() },
      { unit: pool.unit, quantity: (tokensOf(pool) + amount).toString() },
    ])
    .txOutInlineDatumValue(newDatum)
    .txInCollateral(
      collateral.input.txHash,
      collateral.input.outputIndex,
      collateral.output.amount,
      collateral.output.address
    )
    .selectUtxosFrom(utxos)
    .changeAddress(changeAddress)
    .setNetwork(costModels)
    .complete();

  return wallet.submitTx(await wallet.signTx(unsignedTx, true));
}

/** Graduate a pool (owner only, once sold >= threshold): release liquidity to owner. */
export async function graduatePool(
  wallet: IWallet,
  pool: Pool
): Promise<string> {
  const { provider, costModels, changeAddress, collateral, utxos } =
    await common(wallet);

  const txBuilder = new MeshTxBuilder({
    fetcher: provider,
    submitter: provider,
    evaluator: provider,
  });

  const unsignedTx = await txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      pool.utxo.input.txHash,
      pool.utxo.input.outputIndex,
      pool.utxo.output.amount,
      pool.utxo.output.address
    )
    .txInInlineDatumPresent()
    .txInRedeemerValue(mConStr2([])) // Graduate
    .txInScript(curveScriptCbor)
    // release the pool's reserve + remaining tokens to the owner (Minswap seeding done off-chain later)
    .txOut(changeAddress, pool.utxo.output.amount)
    .txInCollateral(
      collateral.input.txHash,
      collateral.input.outputIndex,
      collateral.output.amount,
      collateral.output.address
    )
    .requiredSignerHash(pool.owner)
    .selectUtxosFrom(utxos)
    .changeAddress(changeAddress)
    .setNetwork(costModels)
    .complete();

  return wallet.submitTx(await wallet.signTx(unsignedTx, true));
}
