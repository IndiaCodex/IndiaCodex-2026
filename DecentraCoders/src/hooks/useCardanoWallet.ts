'use client';
/**
 * src/hooks/useCardanoWallet.ts
 *
 * A custom React hook for CIP-30 browser wallet connection.
 * Detects installed wallets via window.cardano, connects, reads address,
 * validates the network (Preview Testnet), and persists wallet selection.
 *
 * Does NOT use Mesh's useWallet — builds directly on CIP-30 APIs for
 * full control over network validation and error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import { CIP30_NETWORK_PREVIEW } from '@/lib/cardano/network';
import { getWalletPaymentKeyHash } from '@/lib/cardano';

// ─── types ────────────────────────────────────────────────────────────────────

export interface DetectedWallet {
  id: string;        // e.g. "lace", "eternl", "nami"
  name: string;      // Display name
  icon?: string;     // SVG or PNG data URL from the wallet extension
  apiVersion?: string;
}

export type WalletConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'wrong_network'
  | 'error';

export interface CardanoWalletState {
  status: WalletConnectionStatus;
  walletApi: any | null;            // CIP-30 wallet API (enabled wallet)
  connectedWalletId: string | null;
  connectedWalletName: string | null;
  address: string | null;           // Bech32 change address
  paymentKeyHash: string | null;    // 56-char hex (28 bytes)
  networkId: number | null;         // 0 = testnet, 1 = mainnet
  balanceLovelace: string | null;
  detectedWallets: DetectedWallet[];
  error: string | null;
}

// ─── known CIP-30 wallet IDs ──────────────────────────────────────────────────

const KNOWN_WALLETS: Array<{ id: string; name: string }> = [
  { id: 'lace', name: 'Lace' },
  { id: 'eternl', name: 'Eternl' },
  { id: 'nami', name: 'Nami' },
  { id: 'vespr', name: 'Vespr' },
  { id: 'flint', name: 'Flint' },
  { id: 'gerowallet', name: 'GeroWallet' },
  { id: 'yoroi', name: 'Yoroi' },
  { id: 'typhon', name: 'Typhon' },
];

const STORAGE_KEY = 'launchnest_wallet_id';

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useCardanoWallet() {
  const [state, setState] = useState<CardanoWalletState>({
    status: 'disconnected',
    walletApi: null,
    connectedWalletId: null,
    connectedWalletName: null,
    address: null,
    paymentKeyHash: null,
    networkId: null,
    balanceLovelace: null,
    detectedWallets: [],
    error: null,
  });

  // ── detect installed wallets ──────────────────────────────────────────────
  const detectWallets = useCallback((): DetectedWallet[] => {
    if (typeof window === 'undefined' || !window.cardano) return [];
    const found: DetectedWallet[] = [];
    for (const known of KNOWN_WALLETS) {
      const ext = (window.cardano as any)[known.id];
      if (ext && typeof ext.enable === 'function') {
        found.push({
          id: known.id,
          name: ext.name ?? known.name,
          icon: ext.icon,
          apiVersion: ext.apiVersion,
        });
      }
    }
    // Also discover any non-standard wallets injected into window.cardano
    for (const key of Object.keys((window.cardano as any) || {})) {
      if (KNOWN_WALLETS.some(k => k.id === key)) continue;
      const ext = (window.cardano as any)[key];
      if (ext && typeof ext.enable === 'function') {
        found.push({
          id: key,
          name: ext.name ?? key,
          icon: ext.icon,
          apiVersion: ext.apiVersion,
        });
      }
    }
    return found;
  }, []);

  // ── initialise detected wallets on mount ─────────────────────────────────
  useEffect(() => {
    const detected = detectWallets();
    setState(s => ({ ...s, detectedWallets: detected }));

    // Attempt to restore previously connected wallet
    const savedId = typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY)
      : null;
    if (savedId && detected.some(w => w.id === savedId)) {
      // Silently reconnect
      connectWallet(savedId, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── connect ───────────────────────────────────────────────────────────────
  const connectWallet = useCallback(async (walletId: string, silent = false) => {
    if (typeof window === 'undefined') return;
    const ext = (window.cardano as any)?.[walletId];
    if (!ext || typeof ext.enable !== 'function') {
      setState(s => ({ ...s, error: `Wallet "${walletId}" not found. Please install the extension.` }));
      return;
    }

    setState(s => ({ ...s, status: 'connecting', error: null }));

    try {
      console.log("[CARDANO] Lace provider:", window.cardano?.lace);
      console.log("[CARDANO] Enabling Lace...");
      // CIP-30: enable() returns the full wallet API
      const api = await ext.enable();
      console.log("[CARDANO] Lace enabled:", Boolean(api));

      // Read network ID
      const networkId: number = await api.getNetworkId();
      console.log("[CARDANO] Network ID:", networkId);

      const usedAddresses = await api.getUsedAddresses();
      console.log("[CARDANO] Used addresses:", usedAddresses);

      const unusedAddresses = await api.getUnusedAddresses();
      console.log("[CARDANO] Unused addresses:", unusedAddresses);

      const changeAddress = await api.getChangeAddress();
      console.log("[CARDANO] Change address:", changeAddress);

      // Validate we are on Preview Testnet (network ID 0)
      if (networkId !== CIP30_NETWORK_PREVIEW) {
        setState(s => ({
          ...s,
          status: 'wrong_network',
          error: `Switch ${ext.name || 'Lace'} to Preview Testnet`,
        }));
        return;
      }

      const { paymentKeyHash, addressBech32 } = await getWalletPaymentKeyHash(api);
      const bech32Address = addressBech32;
      const pkh = paymentKeyHash;

      // Get balance — just check if the wallet has funds (non-critical for tx flow)
      let balanceLovelace: string | null = null;
      try {
        const balanceCbor: string = await api.getBalance();
        // Mark as 'available' — exact lovelace parsing is non-critical for the hackathon demo.
        // The tx builder will fail with a clear error if funds are insufficient.
        balanceLovelace = balanceCbor ? 'available' : null;
      } catch {
        balanceLovelace = null;
      }

      // Persist wallet selection
      localStorage.setItem(STORAGE_KEY, walletId);

      setState(s => ({
        ...s,
        status: 'connected',
        walletApi: api,
        connectedWalletId: walletId,
        connectedWalletName: ext.name ?? walletId,
        address: bech32Address,
        paymentKeyHash: pkh,
        networkId,
        balanceLovelace,
        error: null,
      }));
    } catch (error: any) {
      console.error("[CARDANO REGISTRATION ERROR]", error);
      console.error(
        "[CARDANO REGISTRATION ERROR MESSAGE]",
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        "[CARDANO REGISTRATION ERROR STACK]",
        error instanceof Error ? error.stack : "No stack available"
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unknown Cardano registration error";

      if (!silent) {
        setState(s => ({
          ...s,
          status: 'error',
          error: message,
        }));
      } else {
        setState(s => ({ ...s, status: 'disconnected' }));
      }
    }
  }, []);

  // ── disconnect ────────────────────────────────────────────────────────────
  const disconnectWallet = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setState(s => ({
      ...s,
      status: 'disconnected',
      walletApi: null,
      connectedWalletId: null,
      connectedWalletName: null,
      address: null,
      paymentKeyHash: null,
      networkId: null,
      balanceLovelace: null,
      error: null,
    }));
  }, []);

  // ── refresh balance ───────────────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    if (!state.walletApi) return;
    try {
      const balanceCbor = await state.walletApi.getBalance();
      setState(s => ({ ...s, balanceLovelace: balanceCbor ? 'available' : null }));
    } catch {
      // ignore
    }
  }, [state.walletApi]);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    detectWallets,
  };
}
