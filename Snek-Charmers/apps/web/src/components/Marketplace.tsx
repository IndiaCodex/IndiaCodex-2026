"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@meshsdk/react";
import { fetchPools, type Pool } from "@/lib/pool";
import { buyTokens, sellTokens, graduatePool } from "@/lib/trade";
import { ownerKeyHash } from "@/lib/contract";

const ada = (lovelace: bigint) =>
  (Number(lovelace) / 1_000_000).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });

const bigNum = (n: bigint) => Number(n).toLocaleString();

export function Marketplace({ refreshKey }: { refreshKey: number }) {
  const { wallet, connected } = useWallet();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPools(await fetchPools());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load, refreshKey]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-end">
        <button onClick={load} className="font-mono text-xs text-muted transition hover:text-lime">
          ↻ refresh
        </button>
      </div>

      {loading && pools.length === 0 && (
        <p className="py-10 text-center text-sm text-muted">Loading coins…</p>
      )}
      {error && (
        <p className="rounded-2xl border border-magenta/40 bg-magenta/10 p-4 text-sm text-magenta">{error}</p>
      )}
      {!loading && !error && pools.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line bg-surface/40 p-10 text-center">
          <p className="font-display text-lg font-bold">No coins yet 👀</p>
          <p className="mt-1 text-sm text-muted">Be the first to launch one above.</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {pools.map((p) => (
          <PoolCard
            key={p.utxo.input.txHash + p.utxo.input.outputIndex}
            pool={p}
            wallet={wallet}
            connected={connected}
            onTraded={load}
          />
        ))}
      </div>
    </div>
  );
}

function PoolCard({
  pool,
  wallet,
  connected,
  onTraded,
}: {
  pool: Pool;
  wallet: ReturnType<typeof useWallet>["wallet"];
  connected: boolean;
  onTraded: () => void;
}) {
  const [amount, setAmount] = useState("1000");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!connected) return setIsOwner(false);
      try {
        const addr = await wallet.getChangeAddress();
        if (alive) setIsOwner(ownerKeyHash(addr) === pool.owner);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [connected, wallet, pool.owner]);

  async function run(action: "buy" | "sell" | "graduate") {
    setBusy(true);
    setMsg(null);
    try {
      const amt = BigInt(amount || "0");
      const txHash =
        action === "buy"
          ? await buyTokens(wallet, pool, amt)
          : action === "sell"
            ? await sellTokens(wallet, pool, amt)
            : await graduatePool(wallet, pool);
      setMsg({ ok: true, text: txHash });
      onTraded();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  const pct = Math.max(0, Math.min(100, Math.round(pool.progress * 100)));
  const ticker = (pool.ticker || "?").toUpperCase();

  return (
    <div className="group flex flex-col gap-4 rounded-3xl border border-line bg-surface/70 p-5 transition duration-200 hover:-translate-y-1 hover:border-violet/60 hover:shadow-pop">
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet to-magenta font-display text-lg font-black text-void">
          {ticker.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-xl font-extrabold leading-none text-ink">
            ${ticker}
          </h3>
          <p className="mt-1 font-mono text-xs text-muted">bonding curve</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-semibold text-lime">{ada(pool.price)}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">ADA / token</p>
        </div>
      </div>

      {/* pump meter — the signature */}
      <div className="flex flex-col gap-1.5">
        <div className="relative h-3 w-full rounded-full bg-surface2">
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${pool.graduated ? "bg-gold" : "pump-fill"}`}
            style={{ width: `${Math.max(pct, 3)}%` }}
          />
          <span
            aria-hidden
            className="absolute -top-2 text-base"
            style={{ left: `calc(${pct}% - 10px)` }}
          >
            {pool.graduated ? "🌕" : "🚀"}
          </span>
        </div>
        <div className="flex justify-between font-mono text-[11px] text-muted">
          <span className={pool.graduated ? "text-gold" : "text-lime"}>
            {pct}% to graduation
          </span>
          <span>reserve {ada(pool.reserve)} ADA</span>
        </div>
      </div>

      {/* trade */}
      {pool.graduated ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-gold/40 bg-gold/10 p-3">
          <p className="font-display text-sm font-bold text-gold">🌕 Mooned — ready to graduate to Minswap</p>
          {isOwner ? (
            <button onClick={() => run("graduate")} disabled={busy || !connected} className="rounded-full bg-gold px-4 py-2.5 font-display text-sm font-bold text-void transition hover:brightness-110 disabled:opacity-40">
              {busy ? "Working…" : "Graduate → release liquidity"}
            </button>
          ) : (
            <p className="font-mono text-xs text-muted">Only the creator can graduate this coin.</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            className="w-24 rounded-xl border border-line bg-surface2 px-3 py-2.5 font-mono text-sm text-ink outline-none focus:border-lime/70"
            placeholder="tokens"
          />
          <button onClick={() => run("buy")} disabled={busy || !connected} className="flex-1 rounded-full bg-lime px-4 py-2.5 font-display text-sm font-extrabold text-void transition hover:shadow-glow disabled:bg-surface2 disabled:text-muted">
            {busy ? "…" : "Buy"}
          </button>
          <button onClick={() => run("sell")} disabled={busy || !connected} className="flex-1 rounded-full border border-magenta/50 px-4 py-2.5 font-display text-sm font-bold text-magenta transition hover:bg-magenta/10 disabled:border-line disabled:text-muted">
            {busy ? "…" : "Sell"}
          </button>
        </div>
      )}

      <div className="flex justify-between font-mono text-[11px] text-muted">
        <span>sold {bigNum(pool.sold)}</span>
        <span>of 1B</span>
      </div>

      {msg && (
        <div className={`break-all rounded-xl border p-2.5 text-xs ${msg.ok ? "border-lime/40 text-lime" : "border-magenta/40 text-magenta"}`}>
          {msg.ok ? (
            <a href={`https://preprod.cardanoscan.io/transaction/${msg.text}`} target="_blank" rel="noreferrer" className="font-mono underline">
              tx: {msg.text.slice(0, 12)}… ↗
            </a>
          ) : (
            msg.text
          )}
        </div>
      )}
    </div>
  );
}
