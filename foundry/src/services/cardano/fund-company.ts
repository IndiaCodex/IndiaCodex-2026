import type { MeshCardanoBrowserWallet } from "@meshsdk/react";
import {
  CARDANO_MOCK_FUNDING,
  CARDANO_NETWORK,
  isTreasuryConfigured,
  TREASURY_ADDRESS,
} from "@/lib/constants";

export interface FundingResult {
  txHash: string;
  amount: number;
  treasuryAddress: string;
  simulated: boolean;
}

interface WalletInitiator {
  getChangeAddress(): Promise<string>;
  getUtxos(): Promise<unknown[]>;
  getCollateral(): Promise<unknown[]>;
}

function createInitiator(wallet: MeshCardanoBrowserWallet): WalletInitiator {
  return {
    // Mesh wallet v2: getChangeAddress() returns hex; Transaction builder needs bech32.
    getChangeAddress: () => wallet.getChangeAddressBech32(),
    getUtxos: () => wallet.getUtxosMesh(),
    getCollateral: () => wallet.getCollateralMesh(),
  };
}

function isMeshWallet(wallet: unknown): wallet is MeshCardanoBrowserWallet {
  if (!wallet || typeof wallet !== "object") return false;
  const api = wallet as Record<string, unknown>;
  return (
    typeof api.getUtxosMesh === "function" &&
    typeof api.getCollateralMesh === "function" &&
    typeof api.signTxReturnFullTx === "function" &&
    typeof api.submitTx === "function" &&
    typeof api.getNetworkId === "function"
  );
}

async function assertWalletReady(
  wallet: MeshCardanoBrowserWallet,
  lovelace: number,
): Promise<void> {
  const utxos = await wallet.getUtxosMesh();
  if (!utxos.length) {
    throw new Error(
      "Wallet has no UTxOs. Fund your Preprod wallet via the Cardano faucet, then try again.",
    );
  }

  const balance = await wallet.getBalanceMesh();
  const lovelaceBalance = Number(balance.find((a) => a.unit === "lovelace")?.quantity ?? "0");
  if (lovelaceBalance < lovelace) {
    throw new Error(
      `Insufficient balance. Need ${(lovelace / 1_000_000).toFixed(2)} ₳ but wallet has ${(lovelaceBalance / 1_000_000).toFixed(2)} ₳.`,
    );
  }
}

export async function fundCompanyExecution(
  wallet: unknown,
  lovelace: number,
): Promise<FundingResult> {
  if (CARDANO_NETWORK !== "preprod") {
    throw new Error("Funding is enabled for Cardano preprod only.");
  }

  if (!isMeshWallet(wallet)) {
    throw new Error("Wallet is not connected.");
  }

  const networkId = await wallet.getNetworkId();
  if (networkId !== 0) {
    throw new Error("Wallet must be connected to Cardano Preprod (network id 0).");
  }

  if (CARDANO_MOCK_FUNDING) {
    return {
      txHash: `demo_${Date.now().toString(16)}`,
      amount: lovelace,
      treasuryAddress: "demo-mode",
      simulated: true,
    };
  }

  await assertWalletReady(wallet, lovelace);

  if (!isTreasuryConfigured()) {
    throw new Error("Treasury address is not configured. Set NEXT_PUBLIC_TREASURY_ADDRESS in .env.local.");
  }

  const { Transaction } = await import("@meshsdk/transaction");
  const tx = new Transaction({
    initiator: createInitiator(wallet) as ConstructorParameters<typeof Transaction>[0]["initiator"],
  });

  let unsignedTx: string;
  try {
    unsignedTx = await tx
      .sendLovelace(TREASURY_ADDRESS, lovelace.toString())
      .setNetwork("preprod")
      .build();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to build funding transaction: ${detail}`);
  }

  const signedTx = await wallet.signTxReturnFullTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);

  return { txHash, amount: lovelace, treasuryAddress: TREASURY_ADDRESS, simulated: false };
}