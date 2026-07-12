"use client";

import { useState } from "react";
import { useWallet } from "@meshsdk/react";
import { WalletButton } from "@/components/WalletButton";
import { LaunchForm } from "@/components/LaunchForm";
import { Marketplace } from "@/components/Marketplace";

const MARQUEE = [
  "FAIR LAUNCH",
  "NO PRESALE",
  "BOND THE CURVE",
  "PUMP IT",
  "GRADUATE TO MINSWAP",
  "DIAMOND HANDS",
  "1B SUPPLY",
  "ON CARDANO",
];

export default function LaunchpadHome() {
  const { connected } = useWallet();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-line/60 bg-void/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <a href="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
            <span aria-hidden className="rocket-bob inline-block">🐍</span>
            <span className="text-gradient-2">SNEKPAD</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/social" className="hidden font-mono text-xs text-muted transition hover:text-lime sm:inline">
              Social farming
            </a>
            <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs text-muted sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              Preprod
            </span>
            <WalletButton />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-5xl px-5 pb-8 pt-14 text-center sm:pt-20">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-violet">
          Bonding-curve launchpad · Cardano
        </p>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl">
          Launch a coin.
          <br />
          <span className="text-gradient">Let the curve cook.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          Mint a meme coin in one click. Every buy pushes the price up; every sell
          pushes it down. Once 80% sells out, it graduates to Minswap.
        </p>
      </header>

      {/* Marquee */}
      <div className="marquee border-y border-line/60 bg-surface/40 py-2.5">
        {[0, 1].map((t) => (
          <div key={t} className="marquee__track" aria-hidden={t === 1}>
            {MARQUEE.map((word, i) => (
              <span key={i} className="flex items-center whitespace-nowrap font-display text-sm font-bold uppercase tracking-wide text-ink/80">
                <span className="px-6">{word}</span>
                <span className="text-lime">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Main */}
      <main className="mx-auto flex max-w-5xl flex-col gap-12 px-5 py-12">
        <section>
          <SectionLabel>Start a coin</SectionLabel>
          {connected ? (
            <LaunchForm onLaunched={() => setRefreshKey((k) => k + 1)} />
          ) : (
            <div className="rounded-3xl border border-dashed border-line bg-surface/50 p-8 text-center">
              <p className="font-display text-lg font-bold text-ink">
                Connect a wallet to launch
              </p>
              <p className="mt-1 text-sm text-muted">
                Use Lace or Eternl set to the Preprod testnet. Grab test ADA from the faucet first.
              </p>
            </div>
          )}
        </section>

        <section>
          <SectionLabel>Live coins</SectionLabel>
          <Marketplace refreshKey={refreshKey} />
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-5 py-10 text-center font-mono text-xs text-muted">
        Preprod testnet · built with Aiken + Mesh · not financial advice, ape responsibly
      </footer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <h2 className="font-display text-xl font-extrabold tracking-tight text-ink">
        {children}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
    </div>
  );
}
