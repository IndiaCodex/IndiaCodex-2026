"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet, useWalletList } from "@meshsdk/react";

export function WalletButton() {
  const { wallet, connected, connect, disconnect, connecting, name } =
    useWallet();
  const wallets = useWalletList();
  const [open, setOpen] = useState(false);
  const [addr, setAddr] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!connected) return setAddr("");
      try {
        const a = await wallet.getChangeAddress();
        if (alive) setAddr(a);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [connected, wallet]);

  const short = addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : name;

  if (connected) {
    return (
      <button
        onClick={() => disconnect()}
        className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface2 px-4 py-2 font-mono text-sm text-ink transition hover:border-magenta/60"
        title="Disconnect"
      >
        <span className="h-2 w-2 rounded-full bg-lime shadow-glow" />
        <span className="max-w-[9rem] truncate">{short}</span>
        <span className="text-muted transition group-hover:text-magenta">✕</span>
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={connecting}
        className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 font-display text-sm font-bold text-void transition hover:shadow-glow disabled:opacity-50"
      >
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-pop">
          {wallets.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">
              No Cardano wallet found. Install{" "}
              <a href="https://www.lace.io" target="_blank" rel="noreferrer" className="text-lime underline">
                Lace
              </a>{" "}
              or{" "}
              <a href="https://eternl.io" target="_blank" rel="noreferrer" className="text-lime underline">
                Eternl
              </a>{" "}
              (set to Preprod).
            </p>
          ) : (
            wallets.map((w) => (
              <button
                key={w.name}
                onClick={() => {
                  connect(w.name);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition hover:bg-surface2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.icon} alt="" className="h-6 w-6 rounded-md" />
                <span className="font-medium capitalize">{w.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
