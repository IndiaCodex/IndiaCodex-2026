"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useOuroWallet } from "@/components/wallet/WalletContext";

/**
 * Shared live-data layer for the dashboard: one poller for the oracle price
 * and one for the caller's vault state, consumed by BorrowPanel, DebtGauge,
 * Passport and the onboarding strip. Previously BorrowPanel owned this
 * fetching privately, which left the other panels stuck on mock data.
 *
 * Also tracks "a tx was just submitted": the vault UTxO takes ~20-60s to
 * confirm on preprod, so `pendingTx` stays set until a poll observes the
 * vault actually change (or a timeout gives up). The UI uses it to show a
 * "confirming on-chain" chip instead of appearing to do nothing.
 */

const VAULT_POLL_MS = 15_000;
const PRICE_POLL_MS = 60_000;
/** Preprod normally confirms in ~20-60s; past this, stop claiming pending. */
const PENDING_TIMEOUT_MS = 5 * 60_000;
/** A quote older than this gets a visible "stale" warning. */
export const PRICE_STALE_MS = 3 * 60_000;

export interface LivePrice {
  priceMicroUsd: number;
  source: string;
  /** Server clock at fetch time (optional for older responses). */
  fetchedAt?: number;
}

export interface VaultStateView {
  hasVault: boolean;
  collateralLovelace: number;
  principalTusdm: number;
  tierAtOpen: string;
  priceMicroUsd: number;
  maxBorrowMicro: number;
  maxDrawMicro: number;
  /** tUSDM asset unit (policy + name hex); lets the client read held balance. */
  tusdmUnit?: string;
}

export type PendingTxKind = "deposit" | "borrow" | "repay";

export interface PendingTx {
  kind: PendingTxKind;
  since: number;
}

interface VaultSnapshot {
  hasVault: boolean;
  collateralLovelace: number;
  principalTusdm: number;
}

interface VaultDataValue {
  price: LivePrice | null;
  priceError: string | null;
  /** Client clock when the current price landed (for "updated Xs ago"). */
  priceReceivedAt: number | null;
  vaultState: VaultStateView | null;
  /** True once the first vault-state response has arrived. */
  vaultLoaded: boolean;
  refreshVaultState: () => Promise<void>;
  pendingTx: PendingTx | null;
  /** Call right after submitTx succeeds so the UI can track confirmation. */
  markTxPending: (kind: PendingTxKind) => void;
}

const VaultDataContext = createContext<VaultDataValue | null>(null);

export function useVaultData(): VaultDataValue {
  const ctx = useContext(VaultDataContext);
  if (!ctx) {
    throw new Error("useVaultData must be used within a VaultDataProvider");
  }
  return ctx;
}

function snapshotOf(state: VaultStateView | null): VaultSnapshot {
  return {
    hasVault: state?.hasVault ?? false,
    collateralLovelace: state?.collateralLovelace ?? 0,
    principalTusdm: state?.principalTusdm ?? 0,
  };
}

function snapshotsDiffer(a: VaultSnapshot, b: VaultSnapshot): boolean {
  return (
    a.hasVault !== b.hasVault ||
    a.collateralLovelace !== b.collateralLovelace ||
    a.principalTusdm !== b.principalTusdm
  );
}

export function VaultDataProvider({ children }: { children: ReactNode }) {
  const { wallet } = useOuroWallet();
  const [price, setPrice] = useState<LivePrice | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [priceReceivedAt, setPriceReceivedAt] = useState<number | null>(null);
  const [vaultState, setVaultState] = useState<VaultStateView | null>(null);
  const [vaultLoaded, setVaultLoaded] = useState(false);
  const [pendingTx, setPendingTx] = useState<PendingTx | null>(null);

  // Refs so the poll callback sees the current pending marker without
  // re-subscribing the interval on every tx.
  const pendingRef = useRef<PendingTx | null>(null);
  const pendingSnapshotRef = useRef<VaultSnapshot | null>(null);
  const vaultStateRef = useRef<VaultStateView | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch("/api/price");
      const body = (await res.json()) as LivePrice & { error?: string };
      if (!res.ok || body.error) {
        setPriceError(body.error ?? "Price fetch failed");
        return;
      }
      setPrice(body);
      setPriceReceivedAt(Date.now());
      setPriceError(null);
    } catch (error: unknown) {
      setPriceError(
        error instanceof Error ? error.message : "Price fetch failed",
      );
    }
  }, []);

  useEffect(() => {
    void fetchPrice();
    const id = setInterval(() => {
      void fetchPrice();
    }, PRICE_POLL_MS);
    return () => clearInterval(id);
  }, [fetchPrice]);

  const clearPendingIfSettled = useCallback((next: VaultStateView | null) => {
    const pending = pendingRef.current;
    if (!pending) return;
    const timedOut = Date.now() - pending.since > PENDING_TIMEOUT_MS;
    const settled =
      pendingSnapshotRef.current !== null &&
      snapshotsDiffer(pendingSnapshotRef.current, snapshotOf(next));
    if (settled || timedOut) {
      pendingRef.current = null;
      pendingSnapshotRef.current = null;
      setPendingTx(null);
    }
  }, []);

  const refreshVaultState = useCallback(async () => {
    if (!wallet) {
      vaultStateRef.current = null;
      setVaultState(null);
      setVaultLoaded(false);
      return;
    }
    try {
      const address = await wallet.getChangeAddress();
      const res = await fetch("/api/vault/state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const body = (await res.json()) as VaultStateView & { error?: string };
      if (res.ok) {
        vaultStateRef.current = body;
        setVaultState(body);
        setVaultLoaded(true);
        clearPendingIfSettled(body);
      }
    } catch {
      // Non-fatal: panels keep their last-known state until the next poll.
    }
  }, [wallet, clearPendingIfSettled]);

  useEffect(() => {
    void refreshVaultState();
    const id = setInterval(() => {
      void refreshVaultState();
    }, VAULT_POLL_MS);
    return () => clearInterval(id);
  }, [refreshVaultState]);

  const markTxPending = useCallback((kind: PendingTxKind) => {
    const marker: PendingTx = { kind, since: Date.now() };
    pendingRef.current = marker;
    pendingSnapshotRef.current = snapshotOf(vaultStateRef.current);
    setPendingTx(marker);
  }, []);

  const value = useMemo<VaultDataValue>(
    () => ({
      price,
      priceError,
      priceReceivedAt,
      vaultState,
      vaultLoaded,
      refreshVaultState,
      pendingTx,
      markTxPending,
    }),
    [
      price,
      priceError,
      priceReceivedAt,
      vaultState,
      vaultLoaded,
      refreshVaultState,
      pendingTx,
      markTxPending,
    ],
  );

  return (
    <VaultDataContext.Provider value={value}>
      {children}
    </VaultDataContext.Provider>
  );
}
