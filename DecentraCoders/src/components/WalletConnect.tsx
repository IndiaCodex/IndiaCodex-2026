'use client';

/**
 * src/components/WalletConnect.tsx
 *
 * Navbar wallet button that uses our custom CIP-30 hook.
 * Detects installed wallets from window.cardano and validates Preview Testnet.
 * Falls back gracefully if no wallet is installed.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Wallet, LogOut, CheckCircle, ChevronDown, AlertTriangle, Loader2 } from 'lucide-react';
import { useCardanoWallet } from '@/hooks/useCardanoWallet';

export function WalletConnect() {
  const {
    status,
    connectedWalletName,
    detectedWallets,
    address,
    connectWallet,
    disconnectWallet,
    error,
  } = useCardanoWallet();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const shortAddr = address
    ? `${address.substring(0, 10)}...${address.slice(-6)}`
    : null;

  // ── Wrong network ─────────────────────────────────────────────────────────
  if (status === 'wrong_network') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
        <AlertTriangle className="w-4 h-4" />
        Switch to Preview Testnet
      </div>
    );
  }

  // ── Connected ─────────────────────────────────────────────────────────────
  if (status === 'connected') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-surface border border-purple-glow text-primary hover:bg-white/5 transition btn-transition"
        >
          <CheckCircle className="w-4 h-4 text-success" />
          <span className="font-medium text-xs md:text-sm capitalize">
            {connectedWalletName ?? 'Wallet'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-52 rounded-lg bg-surface border border-translucent shadow-xl py-2 z-50 animate-fade-in">
            {shortAddr && (
              <p className="px-4 py-1.5 text-xs text-gray-400 font-mono border-b border-translucent pb-2 truncate">
                {shortAddr}
              </p>
            )}
            <button
              onClick={() => { disconnectWallet(); setShowDropdown(false); }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 w-full text-left transition"
            >
              <LogOut className="w-4 h-4" />
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Connecting ────────────────────────────────────────────────────────────
  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-primary/80 to-secondary/80 text-white rounded-lg text-xs md:text-sm font-medium opacity-80">
        <Loader2 className="w-4 h-4 animate-spin" />
        Connecting...
      </div>
    );
  }

  // ── Disconnected / Error — show wallet picker ─────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg text-xs md:text-sm font-medium hover:opacity-90 transition btn-transition shadow-lg shadow-purple-500/10"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-52 rounded-lg bg-surface border border-translucent shadow-xl py-2 z-50 animate-fade-in">
          <p className="px-4 py-1 text-xs text-gray-400 font-medium border-b border-translucent pb-2">
            Connect Cardano Wallet
          </p>

          {detectedWallets.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-400">
              <p className="font-semibold text-amber-400 mb-1">No wallet detected.</p>
              <p>Install Lace, Eternl, or Nami and refresh.</p>
            </div>
          ) : (
            <div className="mt-1 space-y-1">
              {detectedWallets.map((w) => (
                <button
                  key={w.id}
                  onClick={async () => {
                    setShowDropdown(false);
                    await connectWallet(w.id);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 hover:text-white w-full text-left transition"
                >
                  {w.icon ? (
                    <img src={w.icon} alt={w.name} className="w-5 h-5 rounded" />
                  ) : (
                    <Wallet className="w-4 h-4 text-primary" />
                  )}
                  {w.name}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="px-4 py-2 text-xs text-red-400 border-t border-translucent mt-1">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
