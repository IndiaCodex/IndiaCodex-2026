// One-off setup script: generates a fresh preprod wallet for Ouro's
// admin/deployer role (co-signs every Borrow per reserve.ak's admin_vkh
// check; also submits the initial oracle/deploy setup transactions).
//
// The mnemonic is written ONLY to a local, gitignored file - never printed
// to stdout/chat, never committed. Only the public address (safe to share,
// needed to fund it from a faucet) and the payment key hash (needed as the
// admin_vkh contract parameter) are printed.
import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MeshWallet, generateMnemonic, resolvePaymentKeyHash } from "@meshsdk/core";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const OUT_PATH = resolve(__dirname, "../.secrets/admin-wallet.json");

async function main() {
  if (existsSync(OUT_PATH)) {
    console.error(
      `Refusing to overwrite existing wallet at ${OUT_PATH}. Delete it first if you really want a new one.`,
    );
    process.exit(1);
  }

  const mnemonic = generateMnemonic().split(" ");
  const wallet = new MeshWallet({ networkId: 0, key: { type: "mnemonic", words: mnemonic } });
  await wallet.init();

  const addresses = wallet.getAddresses();
  const address = addresses.baseAddressBech32 ?? addresses.enterpriseAddressBech32;
  if (!address) throw new Error("Failed to derive an address from the new wallet.");

  const adminVkh = resolvePaymentKeyHash(address);

  writeFileSync(
    OUT_PATH,
    JSON.stringify({ mnemonic, address, adminVkh, networkId: 0, createdAt: new Date().toISOString() }, null, 2),
    { mode: 0o600 },
  );

  console.log("Admin wallet generated.");
  console.log(`Mnemonic saved locally (never printed) to: ${OUT_PATH}`);
  console.log(`Preprod address (fund this from the faucet): ${address}`);
  console.log(`Payment key hash (admin_vkh contract param):  ${adminVkh}`);
}

main();
