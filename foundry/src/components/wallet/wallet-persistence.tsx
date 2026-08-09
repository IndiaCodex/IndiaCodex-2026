"use client";

import { useEffect } from "react";
import { useWallet } from "@meshsdk/react";
import { sanitizePersistedWallet } from "@/lib/cardano-wallets";

/** Enables Mesh SDK session restore for previously connected Cardano wallets. */
export function WalletPersistence() {
  const { setPersist } = useWallet();

  useEffect(() => {
    sanitizePersistedWallet();
    setPersist(true);
  }, [setPersist]);

  return null;
}