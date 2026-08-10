/**
 * Seed N ticket UTXOs at the script address, each with inline datum { owner, item_id, status: Open }.
 * Run: npm run seed   (requires @lucid-evolution/lucid, WALLET_SEED, BLOCKFROST_*, and plutus.json).
 *
 * This is P1's deploy/reseed tool. It depends on the compiled validator, so run `aiken build` first.
 * Datum schema MUST match on-chain/lib/batcher/types.ak and lib/agent/settlement.ts.
 */

import { readFileSync } from "node:fs";
import { config } from "@/lib/agent/config";

const NUM_TICKETS = Number(process.env.SEED_TICKETS ?? 10);

async function main() {
  const { Lucid, Blockfrost, Data, fromText, validatorToAddress } = (await import(
    "@lucid-evolution/lucid"
  )) as any;

  if (!config.blockfrost.projectId || !config.walletSeed) {
    throw new Error("Set BLOCKFROST_PROJECT_ID and WALLET_SEED in .env.local first.");
  }

  const lucid = await Lucid(
    new Blockfrost(config.blockfrost.url, config.blockfrost.projectId),
    "Preprod"
  );
  lucid.selectWallet.fromSeed(config.walletSeed);

  // Load the compiled validator from plutus.json (CIP-0057 blueprint).
  const blueprint = JSON.parse(readFileSync(config.plutusJsonPath, "utf8"));
  const validator = {
    type: "PlutusV3" as const,
    script: blueprint.validators[0].compiledCode as string,
  };
  const scriptAddress = validatorToAddress("Preprod", validator);
  console.log("Script address:", scriptAddress);

  // Owner key hash — set this if you enforce owner checks on-chain; placeholder is fine for the demo.
  const owner = "00".repeat(28);

  const StatusSchema = Data.Enum([Data.Literal("Open"), Data.Literal("Claimed")]);
  const BatchDatumSchema = Data.Object({
    owner: Data.Bytes(),
    item_id: Data.Bytes(),
    status: StatusSchema,
  });

  let tx = lucid.newTx();
  for (let i = 0; i < NUM_TICKETS; i++) {
    const datum = Data.to(
      { owner, item_id: fromText(`ticket${i}`), status: "Open" },
      BatchDatumSchema as any
    );
    tx = tx.pay.ToContract(
      scriptAddress,
      { kind: "inline", value: datum },
      { lovelace: 2_000_000n } // min-ada per ticket UTXO
    );
  }

  const completed = await tx.complete();
  const signed = await completed.sign.withWallet().complete();
  const txHash = await signed.submit();
  console.log(`Seeded ${NUM_TICKETS} tickets. Tx: https://preprod.cardanoscan.io/transaction/${txHash}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
