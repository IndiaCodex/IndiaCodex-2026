// preprod e2e, stage 2: real deposit - send collateral tADA + an inline
// VaultDatum(principal_tusdm=0) to the vault's own address. Plain send, no
// validator involved (vault.ak only gets invoked when SPENDING from this
// address). First real test of buildDepositTx from tx/deposit-borrow.ts.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { MeshWallet, resolvePlutusScriptAddress } from "@meshsdk/core";
import { loadValidators, scriptHash } from "../src/blueprint";
import { getPreprodProvider } from "../src/preprod-provider";
import { buildDepositTx } from "../src/tx/deposit-borrow";
import { CONFIG } from "../src/config";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const WALLET_PATH = resolve(__dirname, "../.secrets/admin-wallet.json");
const COLLATERAL_ADA = 1000;

async function main() {
  const saved = JSON.parse(readFileSync(WALLET_PATH, "utf-8")) as {
    mnemonic: string[];
    adminVkh: string;
  };
  const deployment = JSON.parse(
    readFileSync(resolve(__dirname, "../deployments/preprod.json"), "utf-8"),
  ) as {
    adminVkh: string;
    tusdmPolicy: string;
    oracleHash: string;
    reputationHash: string;
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

  console.log("Depositing", COLLATERAL_ADA, "tADA to vault:", vaultAddress);

  const { txHash } = await buildDepositTx(
    { wallet, fetcher: provider, submitter: provider },
    {
      ownerVkh: deployment.adminVkh,
      collateralLovelace: COLLATERAL_ADA * 1_000_000,
      vaultAddress,
    },
  );

  console.log("Deposit tx submitted:", txHash);
  console.log(`https://preprod.cardanoscan.io/transaction/${txHash}`);
}

main().catch((error) => {
  console.error("Deposit failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
