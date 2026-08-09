// preprod e2e, stage 1: compute the demo vault's address (owner = the
// already-funded admin wallet, reused as borrower for this technical
// verification) and confirm the oracle price UTxO is still live.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { resolvePlutusScriptAddress } from "@meshsdk/core";
import { loadValidators, scriptHash } from "../src/blueprint";
import { CONFIG } from "../src/config";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const deployment = JSON.parse(
  readFileSync(resolve(__dirname, "../deployments/preprod.json"), "utf-8"),
) as {
  adminVkh: string;
  tusdmPolicy: string;
  oracleHash: string;
  oracleAddress: string;
  reputationHash: string;
};

async function main() {
  const validators = loadValidators();
  const vaultScript = validators.vault(
    deployment.adminVkh, // owner = admin wallet, reused as borrower here
    deployment.tusdmPolicy,
    CONFIG.tUSDM.assetNameHex,
    deployment.oracleHash,
    deployment.reputationHash,
  );
  const vaultHash = scriptHash(vaultScript);
  const vaultAddress = resolvePlutusScriptAddress(vaultScript, CONFIG.networkId);

  console.log("Vault script hash:", vaultHash);
  console.log("Vault address:    ", vaultAddress);

  console.log("\nChecking oracle price UTxO...");
  const projectId = process.env.BLOCKFROST_PREPROD_PROJECT_ID!;
  const res = await fetch(
    `https://cardano-preprod.blockfrost.io/api/v0/addresses/${deployment.oracleAddress}/utxos`,
    { headers: { project_id: projectId } },
  );
  const utxos = (await res.json()) as Array<{
    tx_hash: string;
    output_index: number;
    inline_datum: string;
  }>;
  console.log("Oracle UTxOs:", JSON.stringify(utxos, null, 2));
}

main().catch((e) => console.error("FAILED:", e));
