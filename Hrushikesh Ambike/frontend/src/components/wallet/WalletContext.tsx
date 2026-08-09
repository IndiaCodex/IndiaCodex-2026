"use client";

import { BrowserWallet } from "@meshsdk/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * App-owned wallet context built directly on @meshsdk/core's stable
 * `BrowserWallet` (CIP-30), instead of @meshsdk/react's connect layer.
 *
 * Why: the installed @meshsdk/react (2.0.0-beta.2) is a major version ahead of
 * @meshsdk/core (1.9.1). Its connect path requested CIP-30 extensions during
 * `enable()`, which Eternl and Lace refuse (APIError -3, "user canceled"),
 * while more lenient wallets (e.g. Vespr) tolerated it. Enabling through
 * `BrowserWallet.enable(id)` with NO extensions is the plain CIP-30 handshake
 * every wallet supports, and returns a fully typed wallet (parsed UTxOs, not
 * raw CBOR) for the tx builders.
 */
export interface InstalledWallet {
  id: string;
  name: string;
  icon: string;
}

interface OuroWalletValue {
  connected: boolean;
  connecting: boolean;
  name: string | null;
  wallet: BrowserWallet | null;
  availableWallets: InstalledWallet[];
  error: string | null;
  connect: (id: string) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<OuroWalletValue | null>(null);

export function useOuroWallet(): OuroWalletValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useOuroWallet must be used within an OuroWalletProvider");
  }
  return ctx;
}

const PREPROD_NETWORK_ID = 0; // 0 = any testnet (preprod/preview/local), 1 = mainnet

/** Turns a CIP-30 wallet error (`{ code, info }`) or thrown Error into a
 * message that tells the user what to actually do. */
function friendlyWalletError(error: unknown, walletName: string): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: number }).code
      : undefined;
  const info =
    typeof error === "object" && error !== null && "info" in error
      ? String((error as { info?: unknown }).info ?? "")
      : error instanceof Error
        ? error.message
        : String(error);

  if (code === -2 || /no account/i.test(info)) {
    return `${walletName} has no usable account. Unlock it, create or restore a wallet, switch it to the Preprod testnet, then reconnect.`;
  }
  if (code === -3 || /refus|cancel|declin/i.test(info)) {
    return `${walletName} declined the connection. Approve the request in the ${walletName} popup and try again.`;
  }
  return info || `Could not connect to ${walletName}.`;
}

function listInstalledWallets(): InstalledWallet[] {
  if (typeof window === "undefined") return [];
  try {
    return BrowserWallet.getInstalledWallets().map((w) => ({
      id: w.id,
      name: w.name,
      icon: w.icon,
    }));
  } catch {
    return [];
  }
}

export function OuroWalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<BrowserWallet | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<InstalledWallet[]>([]);

  useEffect(() => {
    setAvailableWallets(listInstalledWallets());
  }, []);

  const connect = useCallback(async (id: string) => {
    setConnecting(true);
    setError(null);
    try {
      const enabled = await BrowserWallet.enable(id);
      const networkId = await enabled.getNetworkId();
      if (networkId !== PREPROD_NETWORK_ID) {
        throw new Error(
          `${id} is on Mainnet. Switch ${id} to the Preprod testnet, then reconnect.`,
        );
      }
      setWallet(enabled);
      setName(id);
    } catch (e: unknown) {
      const friendly = friendlyWalletError(e, id);
      setWallet(null);
      setName(null);
      setError(friendly);
      throw new Error(friendly);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setName(null);
    setError(null);
  }, []);

  const value = useMemo<OuroWalletValue>(
    () => ({
      connected: wallet !== null,
      connecting,
      name,
      wallet,
      availableWallets,
      error,
      connect,
      disconnect,
    }),
    [wallet, connecting, name, availableWallets, error, connect, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
