"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { OuroWalletProvider } from "@/components/wallet/WalletContext";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Root client-side provider boundary. Wraps the app in the app-owned wallet
 * context (built on @meshsdk/core's CIP-30 BrowserWallet — see
 * WalletContext.tsx for why we don't use @meshsdk/react's connect layer). No
 * chain provider or network call happens here.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <OuroWalletProvider>
      <ToastProvider>{children}</ToastProvider>
    </OuroWalletProvider>
  );
}
