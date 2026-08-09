// Loads the protocol admin wallet server-side so a backend (CLI scripts or the
// web app's borrow route) can co-sign the tUSDM mint that reserve.ak gates on
// admin_vkh (see onchain/validators/reserve.ak). SERVER-ONLY: reads the
// gitignored admin mnemonic; this key must never reach the browser.
//
// The admin key can mint tUSDM, so in production it belongs in a signing
// service / HSM, not a JSON file — acceptable here only because this is a
// preprod (testnet) hackathon demo with no real value at stake.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MeshWallet, type IFetcher, type ISubmitter } from "@meshsdk/core";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_ADMIN_WALLET_PATH = resolve(
  __dirname,
  "../.secrets/admin-wallet.json",
);

interface SavedWallet {
  mnemonic: string[];
  adminVkh?: string;
}

/**
 * Builds an initialized MeshWallet for the admin key. Prefers the
 * OURO_ADMIN_MNEMONIC env var (space-separated words) when set, otherwise
 * falls back to the gitignored .secrets/admin-wallet.json used by the deploy
 * scripts. Use `wallet.signTx(tx, true)` to add the admin's partial signature.
 */
export async function loadAdminWallet(
  fetcher: IFetcher,
  submitter: ISubmitter,
): Promise<MeshWallet> {
  const words = readAdminMnemonic();
  const wallet = new MeshWallet({
    networkId: 0,
    fetcher,
    submitter,
    key: { type: "mnemonic", words },
  });
  await wallet.init();
  return wallet;
}

function readAdminMnemonic(): string[] {
  const fromEnv = process.env.OURO_ADMIN_MNEMONIC?.trim();
  if (fromEnv) {
    return fromEnv.split(/\s+/);
  }
  const saved = JSON.parse(
    readFileSync(DEFAULT_ADMIN_WALLET_PATH, "utf-8"),
  ) as SavedWallet;
  if (!Array.isArray(saved.mnemonic) || saved.mnemonic.length === 0) {
    throw new Error(
      "Admin wallet has no mnemonic (set OURO_ADMIN_MNEMONIC or provide .secrets/admin-wallet.json).",
    );
  }
  return saved.mnemonic;
}
