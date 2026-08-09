// A Plutus script spend needs a collateral UTxO that is SEPARATE from the
// fee-paying input, but a freshly-derived wallet often holds a single large
// UTxO. This one-off splits off a small pure-ADA UTxO to use as collateral.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { MeshTxBuilder, MeshWallet } from "@meshsdk/core";
import { getPreprodProvider } from "../src/preprod-provider";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const WALLET_PATH = resolve(__dirname, "../.secrets/admin-wallet.json");
const COLLATERAL_LOVELACE = "5000000"; // 5 ADA collateral UTxO

async function main() {
  const saved = JSON.parse(readFileSync(WALLET_PATH, "utf-8")) as { mnemonic: string[] };
  const provider = getPreprodProvider();
  const wallet = new MeshWallet({
    networkId: 0,
    fetcher: provider,
    submitter: provider,
    key: { type: "mnemonic", words: saved.mnemonic },
  });
  await wallet.init();

  const address = await wallet.getChangeAddress();
  const utxos = await wallet.getUtxos();

  const unsignedTx = await new MeshTxBuilder({ fetcher: provider, submitter: provider })
    .txOut(address, [{ unit: "lovelace", quantity: COLLATERAL_LOVELACE }])
    .changeAddress(address)
    .selectUtxosFrom(utxos)
    .complete();

  const signedTx = await wallet.signTx(unsignedTx, false);
  const txHash = await provider.submitTx(signedTx);
  console.log("Split tx submitted:", txHash);
  console.log(`https://preprod.cardanoscan.io/transaction/${txHash}`);
}

main().catch((e) => {
  console.error("Split failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
