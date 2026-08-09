import { MeshTxBuilder, mConStr0, metadataToCip68 } from "@meshsdk/core";
import type { IWallet } from "@meshsdk/core";
import { getProvider, fetchCostModels } from "./provider";
import {
  buildMintScript,
  curveAddress,
  poolDatum,
  ownerKeyHash,
  TOTAL_SUPPLY,
  POOL_MIN_ADA,
} from "./contract";

export type LaunchInput = {
  name: string;
  ticker: string; // used as the on-chain asset name body
  description: string;
  image: string;
};

export type LaunchResult = {
  txHash: string;
  policyId: string;
  userUnit: string;
};

/**
 * Launch: mint the CIP-68 reference NFT (label 100, metadata inline datum) to the
 * wallet, and deposit the full fixed supply of the user token (label 222) into a
 * bonding-curve POOL UTxO with initial state {sold: 0, reserve: 0, m, c, owner}.
 * The token is then tradeable only against the curve until graduation.
 */
export async function launchToken(
  wallet: IWallet,
  input: LaunchInput
): Promise<LaunchResult> {
  const provider = getProvider();
  const costModels = await fetchCostModels();

  const utxos = await wallet.getUtxos();
  if (utxos.length === 0) {
    throw new Error(
      "Your wallet has no UTxOs. Fund it from the Preprod faucet: https://docs.cardano.org/cardano-testnets/tools/faucet"
    );
  }
  const changeAddress = await wallet.getChangeAddress();
  const collateral = (await wallet.getCollateral())[0];
  if (!collateral) {
    throw new Error(
      "No collateral available. Enable collateral (a small pure-ADA UTxO) in your wallet settings, then retry."
    );
  }

  const seed = utxos[0];
  const rest = utxos.slice(1);
  const script = buildMintScript(seed, input.ticker);
  const owner = ownerKeyHash(changeAddress);

  const metadata = metadataToCip68({
    name: input.name,
    ticker: input.ticker,
    description: input.description,
    image: input.image,
    decimals: "0",
  });

  const datum = poolDatum({
    tokenPolicy: script.policyId,
    tokenName: script.userAssetName,
    sold: 0n,
    reserve: 0n,
    owner,
  });

  const txBuilder = new MeshTxBuilder({
    fetcher: provider,
    submitter: provider,
    evaluator: provider,
  });

  const unsignedTx = await txBuilder
    .mintPlutusScriptV3()
    .mint("1", script.policyId, script.refAssetName)
    .mintingScript(script.scriptCbor)
    .mintRedeemerValue(mConStr0([]))
    .mintPlutusScriptV3()
    .mint(TOTAL_SUPPLY.toString(), script.policyId, script.userAssetName)
    .mintingScript(script.scriptCbor)
    .mintRedeemerValue(mConStr0([]))
    // reference NFT + metadata -> launcher wallet
    .txOut(changeAddress, [{ unit: script.refUnit, quantity: "1" }])
    .txOutInlineDatumValue(metadata)
    // full user-token supply -> bonding-curve pool
    .txOut(curveAddress, [
      { unit: "lovelace", quantity: POOL_MIN_ADA.toString() },
      { unit: script.userUnit, quantity: TOTAL_SUPPLY.toString() },
    ])
    .txOutInlineDatumValue(datum)
    .txIn(
      seed.input.txHash,
      seed.input.outputIndex,
      seed.output.amount,
      seed.output.address
    )
    .txInCollateral(
      collateral.input.txHash,
      collateral.input.outputIndex,
      collateral.output.amount,
      collateral.output.address
    )
    .selectUtxosFrom(rest)
    .changeAddress(changeAddress)
    .setNetwork(costModels)
    .complete();

  const signedTx = await wallet.signTx(unsignedTx, true);
  const txHash = await wallet.submitTx(signedTx);

  return { txHash, policyId: script.policyId, userUnit: script.userUnit };
}
