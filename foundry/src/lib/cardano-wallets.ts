import { MeshCardanoBrowserWallet } from "@meshsdk/react";

export const MESH_WALLET_PERSIST_KEY = "mesh-wallet-persist";

/** Wallet bridges that conflict with MetaMask or are not native CIP-30 extensions. */
const BLOCKED_WALLET_IDS = new Set([
  "nufiSnap", // NuFi MetaMask snap — surfaces as "MetaMask" in Mesh
  "utxos", // Mesh Web3 / social login wallet
]);

export interface InstalledCardanoWallet {
  id: string;
  name: string;
  icon: string;
  version: string;
}

function isBlockedWallet(id: string, name: string): boolean {
  const normalizedId = id.toLowerCase();
  const normalizedName = name.toLowerCase();
  return (
    BLOCKED_WALLET_IDS.has(id) ||
    normalizedId.includes("metamask") ||
    normalizedName.includes("metamask")
  );
}

export function getCardanoWallets(): InstalledCardanoWallet[] {
  if (typeof window === "undefined") return [];
  return MeshCardanoBrowserWallet.getInstalledWallets().filter(
    (wallet) => !isBlockedWallet(wallet.id, wallet.name),
  );
}

/** Drop persisted sessions that would route through MetaMask or other blocked bridges. */
export function sanitizePersistedWallet(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(MESH_WALLET_PERSIST_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as { walletName?: string };
    const walletName = data?.walletName;
    if (!walletName || isBlockedWallet(walletName, walletName)) {
      localStorage.removeItem(MESH_WALLET_PERSIST_KEY);
    }
  } catch {
    localStorage.removeItem(MESH_WALLET_PERSIST_KEY);
  }
}