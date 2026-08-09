import { MeshTxBuilder, MeshWallet, conStr0, integer } from "@meshsdk/core";
import { getDevnetProvider } from "../src/devnet-provider";

const TEST_MNEMONIC =
  "test test test test test test test test test test test test test test test test test test test test test test test sauce".split(
    " ",
  );

async function main() {
  const provider = getDevnetProvider();
  const admin = new MeshWallet({
    networkId: 0,
    fetcher: provider,
    submitter: provider,
    key: { type: "mnemonic", words: TEST_MNEMONIC },
    accountIndex: 1,
  });
  await admin.init();

  const changeAddress = await admin.getChangeAddress();
  const utxos = await admin.getUtxos();
  console.log("utxo count:", utxos.length);

  const txBuilder = new MeshTxBuilder({ fetcher: provider, submitter: provider, verbose: true });
  const unsignedTx = await txBuilder
    .txOut(changeAddress, [{ unit: "lovelace", quantity: "3000000" }])
    .txOutInlineDatumValue(conStr0([integer(1), integer(2)]), "JSON")
    .changeAddress(changeAddress)
    .selectUtxosFrom(utxos)
    .complete();

  console.log("unsigned tx length:", unsignedTx.length);
  const signedTx = await admin.signTx(unsignedTx);
  console.log("signed tx length:", signedTx.length);

  try {
    const txHash = await provider.submitTx(signedTx);
    console.log("SUBMIT RESULT:", txHash);
  } catch (error) {
    console.error("SUBMIT ERROR (raw):", error);
  }

  // Also try raw fetch directly against the submit endpoint, bypassing Mesh.
  const bytes = Buffer.from(signedTx, "hex");
  const res = await fetch("http://localhost:8080/api/v1/tx/submit", {
    method: "POST",
    headers: { "Content-Type": "application/cbor" },
    body: bytes,
  });
  console.log("raw fetch status:", res.status);
  console.log("raw fetch body:", await res.text());
}

main().catch((e) => console.error("FATAL:", e));
