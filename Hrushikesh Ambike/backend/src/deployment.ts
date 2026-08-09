// Loads a recorded Ouro deployment (public addresses/hashes written by
// scripts/deploy-preprod.ts) and derives per-owner vault addresses from it.
// Node-only (reads the deployment JSON + the compiled blueprint via
// src/blueprint.ts); intended for server-side callers (CLI scripts and the
// web app's API routes), never the browser.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePlutusScriptAddress } from "@meshsdk/core";
import { loadValidators } from "./blueprint";
import { CONFIG } from "./config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type OuroNetwork = "preprod" | "devnet";

/** Public deployment record shape (see deployments/<network>.json). */
export interface OuroDeployment {
  network: string;
  adminVkh: string;
  oracleVkh?: string;
  tusdmPolicy: string;
  tusdmAssetNameHex?: string;
  oracleHash: string;
  oracleAddress: string;
  reputationHash: string;
  firstOraclePriceTxHash?: string;
}

export function loadDeployment(network: OuroNetwork): OuroDeployment {
  const path = resolve(__dirname, `../deployments/${network}.json`);
  return JSON.parse(readFileSync(path, "utf-8")) as OuroDeployment;
}

/**
 * Vault script address for a specific owner on a given deployment. The vault
 * validator is parameterized per owner (see onchain/validators/vault.ak and
 * src/blueprint.ts), so every user gets their own vault address — the deposit
 * must be sent to the address derived for THAT depositor's payment key hash.
 */
export function vaultAddressForOwner(
  ownerVkh: string,
  deployment: OuroDeployment,
): string {
  const vaultScript = loadValidators().vault(
    ownerVkh,
    deployment.tusdmPolicy,
    deployment.tusdmAssetNameHex ?? CONFIG.tUSDM.assetNameHex,
    deployment.oracleHash,
    deployment.reputationHash,
  );
  return resolvePlutusScriptAddress(vaultScript, CONFIG.networkId);
}
