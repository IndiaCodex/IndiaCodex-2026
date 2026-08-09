// Re-posts a fresh ADA/USD oracle price UTxO on preprod. The price posted at
// deploy time expires (deploy used a 7-day window) and vault.ak blocks every
// Borrow/Harvest against a stale price, so this must be re-run periodically
// until a real keeper exists. Old price UTxOs are NOT consumed — the web
// server picks the freshest datum by deadline, so no deployment-record update
// is needed.
//
// Run with: npx tsx --env-file=.env scripts/repost-oracle-price.ts [--hours N]
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { MeshWallet } from "@meshsdk/core";
import { getPreprodProvider } from "../src/preprod-provider";
import { postPrice } from "../src/oracle-poster";
import { loadDeployment } from "../src/deployment";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const WALLET_PATH = resolve(__dirname, "../.secrets/admin-wallet.json");

// Same ~1-week window the deploy used: long enough for demo days without a
// keeper, short enough to still bound staleness on a testnet prototype.
const DEFAULT_WINDOW_HOURS = 7 * 24;

function windowHoursFromArgv(argv: string[]): number {
  const flagIndex = argv.indexOf("--hours");
  if (flagIndex === -1) return DEFAULT_WINDOW_HOURS;
  const hours = Number(argv[flagIndex + 1]);
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error(`--hours expects a positive number, got: ${argv[flagIndex + 1]}`);
  }
  return hours;
}

async function main() {
  const windowHours = windowHoursFromArgv(process.argv);
  const windowMs = windowHours * 60 * 60 * 1000;

  const saved = JSON.parse(readFileSync(WALLET_PATH, "utf-8")) as {
    mnemonic: string[];
  };
  const deployment = loadDeployment("preprod");
  const provider = getPreprodProvider();
  const wallet = new MeshWallet({
    networkId: 0,
    fetcher: provider,
    submitter: provider,
    key: { type: "mnemonic", words: saved.mnemonic },
  });
  await wallet.init();

  const validUntil = new Date(Date.now() + windowMs).toISOString();
  console.log(
    `Posting fresh oracle price to ${deployment.oracleAddress} (valid ~${windowHours}h, until ${validUntil})...`,
  );

  const { txHash } = await postPrice(
    { oracleAddress: deployment.oracleAddress, validityWindowMs: windowMs },
    { wallet, fetcher: provider, submitter: provider },
  );

  console.log(`Posted: https://preprod.cardanoscan.io/transaction/${txHash}`);
  console.log(
    "Borrows unblock once the tx confirms (~a block or two). The server auto-picks the freshest price.",
  );
}

main().catch((error) => {
  console.error(
    "Repost failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
