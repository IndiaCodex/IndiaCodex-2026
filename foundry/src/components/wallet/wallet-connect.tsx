"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getCardanoWallets } from "@/lib/cardano-wallets";
import {
  Wallet as WalletIcon,
  Unplug,
  Copy,
  Check,
  ChevronDown,
  Loader2,
  X,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";

function truncateAddress(addr: string): string {
  if (addr.length < 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function adaFromLovelace(lovelace: string): string {
  const num = Number(lovelace) || 0;
  return (num / 1_000_000).toFixed(2);
}

function formatWalletError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Failed to connect wallet. Check that your wallet is unlocked and set to Preprod.";
}

export function WalletConnect() {
  const { connected, connecting, disconnect, connect, info, name, error, state } = useWallet();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [wallets, setWallets] = useState(getCardanoWallets);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const isRestoring = state === "CONNECTING" && !connectingId;

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const refreshWallets = useCallback(() => {
    setWallets(getCardanoWallets());
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    refreshWallets();
    const timer = window.setInterval(refreshWallets, 1000);
    return () => window.clearInterval(timer);
  }, [modalOpen, refreshWallets]);

  useEffect(() => {
    if (connected) {
      setModalOpen(false);
      setConnectingId(null);
      setLocalError(null);
    }
  }, [connected]);

  useEffect(() => {
    if (error) {
      setLocalError(formatWalletError(error));
      setConnectingId(null);
    }
  }, [error]);

  const handleCopy = async () => {
    if (!info?.address) return;
    await navigator.clipboard.writeText(info.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async (walletId: string) => {
    setLocalError(null);
    setConnectingId(walletId);
    try {
      await connect(walletId, true);
    } catch (err) {
      setLocalError(formatWalletError(err));
      setConnectingId(null);
    }
  };

  if (!mounted) {
    return <div className="h-9 w-[140px]" />;
  }

  if (isRestoring || (connecting && !modalOpen)) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="btn--pill"
        loading
        disabled
      >
        <WalletIcon className="mr-2 h-4 w-4" />
        Restoring wallet…
      </Button>
    );
  }

  if (!connected) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className="btn--pill"
          onClick={() => setModalOpen(true)}
          loading={connecting}
        >
          <WalletIcon className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>

        <AnimatePresence>
          {modalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              onClick={() => !connecting && setModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.15 }}
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Connect Wallet</h3>
                    <p className="text-xs text-foreground-muted">Choose a CIP-30 wallet on Cardano Preprod</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => !connecting && setModalOpen(false)}
                    className="btn-icon btn-icon--sm"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-5">
                  {localError && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-3 py-2.5 text-xs text-error">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{localError}</span>
                    </div>
                  )}

                  {wallets.length === 0 ? (
                    <div className="space-y-4 py-2 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface">
                        <WalletIcon className="h-5 w-5 text-foreground-dim" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">No Cardano wallets detected</p>
                        <p className="text-xs leading-5 text-foreground-muted">
                          Install a CIP-30 extension (Vesper, Eternl, Nami, Lace) and switch it to Preprod testnet.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => window.open("https://developers.cardano.org/showcase/?tags=wallet", "_blank")}
                      >
                        Browse wallets
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {wallets.map((wallet) => {
                        const isConnecting = connectingId === wallet.id;
                        return (
                          <button
                            key={wallet.id}
                            type="button"
                            disabled={connecting}
                            onClick={() => handleConnect(wallet.id)}
                            className="btn-wallet-tile"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={wallet.icon}
                              alt={wallet.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-lg"
                            />
                            <span className="text-xs font-medium text-foreground">{wallet.name}</span>
                            {isConnecting && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn-pill-trigger"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 h-full w-full animate-ping rounded-full bg-primary/40" />
          <span className="relative h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="text-sm font-medium text-foreground">
          {name ?? (info?.spendableBalance ? `${adaFromLovelace(info.spendableBalance)} ₳` : "Connected")}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-foreground-dim transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface">
                  <WalletIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Wallet Connected</p>
                  <p className="text-xs text-foreground-dim">Cardano Preprod</p>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground-dim">Spendable</span>
                  <span className="text-sm font-semibold text-foreground">
                    {info?.spendableBalance ? `${adaFromLovelace(info.spendableBalance)} ₳` : "—"}
                  </span>
                </div>
                {info?.address && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground-dim">Address</span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 font-mono text-xs text-foreground-muted transition-colors hover:text-foreground"
                    >
                      {truncateAddress(info.address)}
                      {copied ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="btn--block"
                onClick={disconnect}
              >
                <Unplug className="h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}