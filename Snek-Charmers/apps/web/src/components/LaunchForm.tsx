"use client";

import { useState } from "react";
import { useWallet } from "@meshsdk/react";
import { launchToken } from "@/lib/launch";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "done"; txHash: string }
  | { kind: "error"; message: string };

const field =
  "rounded-xl border border-line bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-lime/70";
const label = "font-mono text-[11px] uppercase tracking-widest text-muted";

export function LaunchForm({ onLaunched }: { onLaunched: () => void }) {
  const { wallet, connected } = useWallet();
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const disabled = !connected || status.kind === "submitting";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "submitting" });
    try {
      const result = await launchToken(wallet, {
        name: name.trim(),
        ticker: ticker.trim(),
        description: description.trim(),
        image: image.trim(),
      });
      setStatus({ kind: "done", txHash: result.txHash });
      onLaunched();
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-3xl border border-line bg-surface/70 p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={label}>Coin name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Pepe Coin" className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label}>Ticker</label>
          <input required value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="PEPE" className={`${field} font-mono uppercase`} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Description</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="The frog is back and he's not leaving." className={field} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Image URL</label>
        <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="ipfs://Qm… or https://…" className={field} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-muted">
          <span className="text-ink">1,000,000,000</span> supply · starts at 0.00005 ADA · graduates to Minswap at 80% sold
        </p>
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-display text-sm font-extrabold text-void transition hover:shadow-glow disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-muted disabled:shadow-none"
        >
          {status.kind === "submitting"
            ? "Launching…"
            : connected
              ? "Launch it 🚀"
              : "Connect wallet first"}
        </button>
      </div>

      {status.kind === "done" && (
        <div className="rounded-2xl border border-lime/40 bg-lime/10 p-4 text-sm">
          <p className="font-display font-bold text-lime">Launched! Appears below in ~30s once indexed.</p>
          <a href={`https://preprod.cardanoscan.io/transaction/${status.txHash}`} target="_blank" rel="noreferrer" className="mt-1 block break-all font-mono text-xs text-muted underline">
            {status.txHash}
          </a>
        </div>
      )}
      {status.kind === "error" && (
        <div className="rounded-2xl border border-magenta/40 bg-magenta/10 p-4 text-sm text-magenta">
          {status.message}
        </div>
      )}
    </form>
  );
}
