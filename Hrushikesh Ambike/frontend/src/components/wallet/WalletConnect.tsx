"use client";

import { useEffect, useRef, useState } from "react";
import { useOuroWallet } from "@/components/wallet/WalletContext";
import { formatLovelaceAsTAda, truncateAddress } from "@/lib/format";
import styles from "./wallet-connect.module.css";

/**
 * Cardano wallet connector built on the app-owned wallet context (CIP-30 via
 * @meshsdk/core BrowserWallet — see WalletContext.tsx). Real wallet-injection
 * detection, not a mock. Once connected, the change address is fetched via
 * `wallet.getChangeAddress()`.
 */
export function WalletConnect() {
  const {
    connected,
    connecting,
    connect,
    disconnect,
    wallet,
    name,
    availableWallets: installedWallets,
    error: connectError,
  } = useOuroWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [changeAddress, setChangeAddress] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [lovelace, setLovelace] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    if (!connected || !wallet) {
      return () => {
        cancelled = true;
      };
    }

    wallet
      .getChangeAddress()
      .then((address) => {
        if (!cancelled) {
          setChangeAddress(address);
          setAddressError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Unable to read address";
          setAddressError(message);
        }
      });

    // Balance is display-only; on failure the pill simply omits it rather
    // than blocking the address or the session.
    wallet
      .getLovelace()
      .then((amount) => {
        if (!cancelled) {
          setLovelace(amount);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLovelace(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connected, wallet]);

  // Derived, not stored: once disconnected there is no address or balance to
  // show, regardless of whatever the last successful fetch produced.
  const resolvedAddress = connected ? changeAddress : null;
  const resolvedLovelace = connected ? lovelace : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleConnect(walletId: string) {
    try {
      await connect(walletId);
      setIsMenuOpen(false);
    } catch {
      // The actionable message is surfaced via the context's `error`; keep the
      // menu open so the user can read it and retry.
    }
  }

  if (connected) {
    return (
      <div className={styles.connected}>
        <span className={styles.statusDot} aria-hidden="true" />
        <div className={styles.identity}>
          <span className={styles.walletName}>{name}</span>
          <span className={`${styles.address} mono-figure`}>
            {addressError
              ? "address unavailable"
              : resolvedAddress
                ? truncateAddress(resolvedAddress)
                : "resolving…"}
          </span>
        </div>
        {resolvedLovelace !== null && (
          <span className={`${styles.balance} mono-figure`}>
            {formatLovelaceAsTAda(resolvedLovelace)}
          </span>
        )}
        <button
          type="button"
          className={styles.disconnectButton}
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button
        type="button"
        className={styles.connectButton}
        onClick={() => setIsMenuOpen((open) => !open)}
        disabled={connecting}
        aria-expanded={isMenuOpen}
        aria-haspopup="listbox"
      >
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>

      {isMenuOpen && (
        <div className={styles.menu} role="listbox">
          {installedWallets.length === 0 ? (
            <p className={styles.emptyState}>
              No CIP-30 wallet extensions detected. Install Eternl, Lace, or
              Nami to connect.
            </p>
          ) : (
            installedWallets.map((installedWallet) => (
              <button
                key={installedWallet.id}
                type="button"
                className={styles.menuItem}
                onClick={() => handleConnect(installedWallet.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- wallet icons are data: URIs supplied at runtime by the extension */}
                <img
                  src={installedWallet.icon}
                  alt=""
                  width={20}
                  height={20}
                  className={styles.menuIcon}
                />
                <span>{installedWallet.name}</span>
              </button>
            ))
          )}
          {connectError && (
            <p className={styles.connectError} role="alert">
              {connectError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
