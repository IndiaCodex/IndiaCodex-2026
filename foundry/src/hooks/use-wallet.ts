"use client";

import { useMemo } from "react";
import { useWallet as useMeshWallet, useLovelace, useAddress, useNetwork } from "@meshsdk/react";
import { useWalletStore } from "@/store/wallet-store";

export function useWallet() {
  const {
    wallet,
    connected,
    connecting,
    connect: meshConnect,
    disconnect: meshDisconnect,
    error,
    address: meshAddress,
    name,
    state,
  } = useMeshWallet();
  const lovelace = useLovelace();
  const address = useAddress();
  const networkId = useNetwork();
  const resolvedAddress = meshAddress || address;
  const reservedSpend = useWalletStore((s) => s.getReservedSpend(resolvedAddress));
  const clearReservation = useWalletStore((s) => s.clearReservation);

  const balance = lovelace ?? "0";
  const spendableBalance = useMemo(() => {
    const actual = Number(balance) || 0;
    return Math.max(0, actual - reservedSpend).toString();
  }, [balance, reservedSpend]);

  return {
    available: true,
    wallet,
    connected,
    connecting,
    name,
    state,
    info: resolvedAddress
      ? {
          address: resolvedAddress,
          network: networkId,
          balance,
          spendableBalance,
          reservedSpend: reservedSpend.toString(),
        }
      : null,
    connect: (walletName: string, persist = true) => meshConnect(walletName, persist),
    disconnect: meshDisconnect,
    clearReservation,
    signTx: async (tx: string) => {
      if (!wallet) throw new Error("Wallet not connected");
      return wallet.signTx(tx, false);
    },
    submitTx: async (tx: string) => {
      if (!wallet) throw new Error("Wallet not connected");
      return wallet.submitTx(tx);
    },
    error,
  };
}
