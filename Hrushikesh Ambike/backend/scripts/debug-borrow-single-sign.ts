// Diagnostic: build the exact same borrow tx but sign ONCE (final, not
// partial) to isolate whether the two-step partial-sign dance is what's
// corrupting the CBOR, independent of same-key-twice.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { MeshTxBuilder, MeshWallet, integer, resolvePlutusScriptAddress } from "@meshsdk/core";
import type { UTxO } from "@meshsdk/core";
import { loadValidators, scriptHash } from "../src/blueprint";
import { getPreprodProvider } from "../src/preprod-provider";
import { buildBorrowRedeemer, buildVaultDatum } from "../src/tx/datums";
import { CONFIG } from "../src/config";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const WALLET_PATH = resolve(__dirname, "../.secrets/admin-wallet.json");
const COLLATERAL_LOVELACE = 1_000_000_000;
const GROSS_TUSDM = 50_000_000;
const NET_TUSDM = 49_500_000;
const VAULT_TX_HASH = "f4203578e400084b3b195a53d97c64df48cac21b39c593905b8c191618c2e312";
const ORACLE_TX_HASH = "816c28e1bd54b688a6cd9df4ab5311f5445f667903934aa72345df14b11cdb9c";

async function main() {
  const saved = JSON.parse(readFileSync(WALLET_PATH, "utf-8")) as { mnemonic: string[] };
  const deployment = JSON.parse(readFileSync(resolve(__dirname, "../deployments/preprod.json"), "utf-8")) as {
    adminVkh: string; tusdmPolicy: string; oracleHash: string; oracleAddress: string; reputationHash: string;
  };

  const provider = getPreprodProvider();
  const wallet = new MeshWallet({ networkId: 0, fetcher: provider, submitter: provider, key: { type: "mnemonic", words: saved.mnemonic } });
  await wallet.init();

  const validators = loadValidators();
  const vaultScript = validators.vault(deployment.adminVkh, deployment.tusdmPolicy, CONFIG.tUSDM.assetNameHex, deployment.oracleHash, deployment.reputationHash);
  const vaultAddress = resolvePlutusScriptAddress(vaultScript, CONFIG.networkId);
  const reserveScript = validators.reserve(deployment.adminVkh);

  const vaultUtxo: UTxO = { input: { txHash: VAULT_TX_HASH, outputIndex: 0 }, output: { address: vaultAddress, amount: [{ unit: "lovelace", quantity: String(COLLATERAL_LOVELACE) }] } };
  const oracleUtxo: UTxO = { input: { txHash: ORACLE_TX_HASH, outputIndex: 0 }, output: { address: deployment.oracleAddress, amount: [{ unit: "lovelace", quantity: "2000000" }] } };

  const latestBlock = await fetch(`https://cardano-preprod.blockfrost.io/api/v0/blocks/latest`, { headers: { project_id: process.env.BLOCKFROST_PREPROD_PROJECT_ID! } }).then((r) => r.json());
  const invalidHereafterSlot = Number(latestBlock.slot) + 300;

  const changeAddress = await wallet.getChangeAddress();
  const utxos = await wallet.getUtxos();
  const collateralUtxos = await wallet.getCollateral();
  if (collateralUtxos.length === 0) throw new Error("No collateral UTxO available on this wallet");
  const collateral = collateralUtxos[0];
  console.log("collateral utxo:", collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount);

  const newDatum = buildVaultDatum({ ownerVkh: deployment.adminVkh, principalTusdm: GROSS_TUSDM, collateralLovelace: COLLATERAL_LOVELACE, tierAtOpen: "Bronze" });

  const txBuilder = new MeshTxBuilder({ fetcher: provider, submitter: provider, verbose: true });
  const unsignedTx = await txBuilder
    .spendingPlutusScriptV3()
    .txIn(vaultUtxo.input.txHash, vaultUtxo.input.outputIndex, vaultUtxo.output.amount, vaultUtxo.output.address)
    .txInScript(vaultScript.code)
    .txInInlineDatumPresent()
    .txInRedeemerValue(buildBorrowRedeemer(), "JSON")
    .txOut(vaultUtxo.output.address, vaultUtxo.output.amount)
    .txOutInlineDatumValue(newDatum, "JSON")
    .mintPlutusScriptV3()
    .mint(String(NET_TUSDM), deployment.tusdmPolicy, CONFIG.tUSDM.assetNameHex)
    .mintingScript(reserveScript.code)
    .mintRedeemerValue(integer(0), "JSON")
    .readOnlyTxInReference(oracleUtxo.input.txHash, oracleUtxo.input.outputIndex)
    .requiredSignerHash(deployment.adminVkh)
    .invalidHereafter(invalidHereafterSlot)
    .changeAddress(changeAddress)
    .selectUtxosFrom(utxos)
    .complete();

  console.log("unsigned tx built, length:", unsignedTx.length);

  // Sign ONCE, fully (not partial) - only one required signer, one key.
  const signedTx = await wallet.signTx(unsignedTx, false);
  console.log("signed tx length:", signedTx.length);

  const txHash = await provider.submitTx(signedTx);
  console.log("SUBMITTED:", txHash);
}

main().catch((e) => console.error("FAILED:", e instanceof Error ? e.message : e));
