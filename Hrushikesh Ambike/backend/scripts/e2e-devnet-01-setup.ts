// e2e Task 5.2, stage 1: derive borrower/admin wallets from Yaci DevKit's
// well-known public test mnemonic (printed by the devnet itself at
// startup - not a secret, devnet-only), compute the real script
// addresses for THIS devnet, and post the first oracle price.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  MeshWallet,
  resolvePaymentKeyHash,
  resolvePlutusScriptAddress,
} from "@meshsdk/core";
import { loadValidators, scriptHash } from "../src/blueprint";
import { getDevnetProvider } from "../src/devnet-provider";
import { postPrice } from "../src/oracle-poster";
import { CONFIG } from "../src/config";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const OUT_PATH = resolve(__dirname, "../deployments/devnet.json");

// Public, well-known Yaci DevKit test mnemonic (printed at devnet startup) -
// derives the 20 pre-funded default addresses. Not a secret.
const TEST_MNEMONIC =
  "test test test test test test test test test test test test test test test test test test test test test test test sauce".split(
    " ",
  );

async function main() {
  const provider = getDevnetProvider();

  const borrower = new MeshWallet({
    networkId: 0,
    fetcher: provider,
    submitter: provider,
    key: { type: "mnemonic", words: TEST_MNEMONIC },
    accountIndex: 0,
  });
  await borrower.init();

  const admin = new MeshWallet({
    networkId: 0,
    fetcher: provider,
    submitter: provider,
    key: { type: "mnemonic", words: TEST_MNEMONIC },
    accountIndex: 1,
  });
  await admin.init();

  const borrowerAddr = borrower.getAddresses().baseAddressBech32!;
  const adminAddr = admin.getAddresses().baseAddressBech32!;
  const borrowerVkh = resolvePaymentKeyHash(borrowerAddr);
  const adminVkh = resolvePaymentKeyHash(adminAddr);

  console.log("Borrower address:", borrowerAddr);
  console.log("Borrower vkh:    ", borrowerVkh);
  console.log("Admin address:   ", adminAddr);
  console.log("Admin vkh:       ", adminVkh);

  const validators = loadValidators();
  const reserveScript = validators.reserve(adminVkh);
  const tusdmPolicy = scriptHash(reserveScript);

  const oracleScript = validators.oracle(adminVkh); // same key, oracle role
  const oracleHash = scriptHash(oracleScript);
  const oracleAddress = resolvePlutusScriptAddress(oracleScript, CONFIG.networkId);

  const reputationScript = validators.reputation();
  const reputationHash = scriptHash(reputationScript);

  console.log("\nComputed devnet addresses:");
  console.log("  tusdm_policy:    ", tusdmPolicy);
  console.log("  oracle hash:     ", oracleHash);
  console.log("  oracle address:  ", oracleAddress);
  console.log("  reputation hash: ", reputationHash);

  console.log("\nPosting first oracle price on devnet...");
  const { txHash: oracleTxHash } = await postPrice(
    { oracleAddress, validityWindowMs: 60 * 60 * 1000 },
    {
      wallet: admin,
      fetcher: provider,
      submitter: provider,
    },
  );
  console.log("Oracle price tx:", oracleTxHash);

  writeFileSync(
    OUT_PATH,
    JSON.stringify(
      {
        network: "devnet",
        borrowerAddr,
        borrowerVkh,
        adminAddr,
        adminVkh,
        tusdmPolicy,
        tusdmAssetNameHex: CONFIG.tUSDM.assetNameHex,
        oracleHash,
        oracleAddress,
        reputationHash,
        firstOraclePriceTxHash: oracleTxHash,
        deployedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  console.log(`\nRecorded to ${OUT_PATH}`);
}

main().catch((error) => {
  console.error("Setup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
