// preprod e2e, stage 3: real borrow - spends the deposit UTxO with the
// Borrow redeemer, mints net tUSDM, recreates the vault with a higher
// principal. Needs both owner and admin signatures (same wallet here, so
// one signTx call satisfies both requiredSignerHash checks). First real
// test of buildBorrowTx.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { MeshWallet, resolvePlutusScriptAddress } from "@meshsdk/core";
import type { UTxO } from "@meshsdk/core";
import { loadValidators, scriptHash } from "../src/blueprint";
import { getPreprodProvider } from "../src/preprod-provider";
import { buildBorrowTx, type BorrowDeps } from "../src/tx/deposit-borrow";
import { CONFIG } from "../src/config";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const WALLET_PATH = resolve(__dirname, "../.secrets/admin-wallet.json");

const COLLATERAL_LOVELACE = 1_000_000_000;
const GROSS_TUSDM = 50_000_000; // 50 tUSDM, well within Bronze's ~74.96 limit
const NET_TUSDM = 49_500_000; // after 1% origination fee

const VAULT_TX_HASH =
  "f4203578e400084b3b195a53d97c64df48cac21b39c593905b8c191618c2e312";

async function main() {
  const saved = JSON.parse(readFileSync(WALLET_PATH, "utf-8")) as {
    mnemonic: string[];
  };
  const deployment = JSON.parse(
    readFileSync(resolve(__dirname, "../deployments/preprod.json"), "utf-8"),
  ) as {
    adminVkh: string;
    tusdmPolicy: string;
    oracleHash: string;
    oracleAddress: string;
    reputationHash: string;
    firstOraclePriceTxHash: string;
  };

  const provider = getPreprodProvider();
  const wallet = new MeshWallet({
    networkId: 0,
    fetcher: provider,
    submitter: provider,
    key: { type: "mnemonic", words: saved.mnemonic },
  });
  await wallet.init();

  const validators = loadValidators();
  const vaultScript = validators.vault(
    deployment.adminVkh,
    deployment.tusdmPolicy,
    CONFIG.tUSDM.assetNameHex,
    deployment.oracleHash,
    deployment.reputationHash,
  );
  const vaultAddress = resolvePlutusScriptAddress(vaultScript, CONFIG.networkId);
  const reserveScript = validators.reserve(deployment.adminVkh);

  const vaultUtxo: UTxO = {
    input: { txHash: VAULT_TX_HASH, outputIndex: 0 },
    output: {
      address: vaultAddress,
      amount: [{ unit: "lovelace", quantity: String(COLLATERAL_LOVELACE) }],
    },
  };
  const oracleUtxo: UTxO = {
    input: { txHash: deployment.firstOraclePriceTxHash, outputIndex: 0 },
    output: {
      address: deployment.oracleAddress,
      amount: [{ unit: "lovelace", quantity: "2000000" }],
    },
  };

  const latestBlock = await fetch(
    `https://cardano-preprod.blockfrost.io/api/v0/blocks/latest`,
    { headers: { project_id: process.env.BLOCKFROST_PREPROD_PROJECT_ID! } },
  ).then((r) => r.json());
  const invalidHereafterSlot = Number(latestBlock.slot) + 300;

  // Pick the smallest pure-ADA wallet UTxO as collateral (the ~5 ADA one we
  // split off), leaving the large UTxO free for fees. Collateral must not
  // also be a spending input.
  const walletUtxos = await wallet.getUtxos();
  const pureAda = walletUtxos
    .filter((u) => u.output.amount.every((a) => a.unit === "lovelace"))
    .sort(
      (a, b) =>
        Number(a.output.amount[0].quantity) - Number(b.output.amount[0].quantity),
    );
  const collateralUtxo = pureAda[0];
  if (!collateralUtxo) throw new Error("No pure-ADA collateral UTxO found");
  console.log(
    "Collateral:",
    collateralUtxo.input.txHash + "#" + collateralUtxo.input.outputIndex,
    collateralUtxo.output.amount[0].quantity,
    "lovelace",
  );

  const deps: BorrowDeps = {
    wallet,
    adminSigner: wallet, // same key covers both roles for this verification
    fetcher: provider,
    submitter: provider,
  };

  console.log("Building borrow tx: gross", GROSS_TUSDM / 1e6, "tUSDM, net", NET_TUSDM / 1e6, "tUSDM");

  const { txHash } = await buildBorrowTx(deps, {
    vaultUtxo,
    vaultScript,
    reserveScript,
    tusdmPolicyId: deployment.tusdmPolicy,
    tusdmAssetNameHex: CONFIG.tUSDM.assetNameHex,
    oracleUtxo,
    collateralUtxo,
    ownerVkh: deployment.adminVkh,
    adminVkh: deployment.adminVkh,
    collateralLovelace: COLLATERAL_LOVELACE,
    currentTierAtOpen: "Bronze",
    grossTusdm: GROSS_TUSDM,
    netTusdm: NET_TUSDM,
    invalidHereafterSlot,
  });

  console.log("Borrow tx submitted:", txHash);
  console.log(`https://preprod.cardanoscan.io/transaction/${txHash}`);
}

main().catch((error) => {
  console.error("Borrow failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
