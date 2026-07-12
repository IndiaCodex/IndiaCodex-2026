"use client";

import Link from "next/link";

// Representative data — the Social Farming engine (apps/social-farming) is a
// standalone event-driven service; this page showcases what it produces.

const FLOW = [
  { k: "1", t: "Launchpad event", d: "buy / sell / LP / hold arrives (signed)", c: "text-violet" },
  { k: "2", t: "Activity record", d: "immutable, per user + project", c: "text-ink" },
  { k: "3", t: "AI verify", d: "scores content quality — never sets rewards", c: "text-magenta" },
  { k: "4", t: "Reward engine", d: "deterministic → PCP + Reputation", c: "text-lime" },
];

const CAMPAIGNS = [
  { icon: "💎", name: "Diamond Hands", type: "Hold", pcp: "500 / week", tag: "active" },
  { icon: "🔗", name: "Refer a Snek", type: "Referral", pcp: "250 / invite", tag: "active" },
  { icon: "🎨", name: "Meme Contest", type: "Content", pcp: "up to 2,000", tag: "AI-judged" },
  { icon: "📚", name: "Explain the Curve", type: "Education", pcp: "up to 1,500", tag: "AI-judged" },
  { icon: "🌊", name: "LP Booster", type: "Liquidity", pcp: "800 / week", tag: "active" },
  { icon: "🗳️", name: "Governance Vote", type: "Community", pcp: "300 / vote", tag: "active" },
];

const MILESTONES = [
  { label: "1,000 holders", cur: 742, target: 1000 },
  { label: "500 liquidity providers", cur: 318, target: 500 },
  { label: "100 quality submissions", cur: 87, target: 100 },
];

const LEADERBOARD = [
  { rank: 1, user: "addr…hhzk65", pcp: 18420, tier: "Verified Builder", trust: 0.97 },
  { rank: 2, user: "addr…9f2a1c", pcp: 15310, tier: "Contributor", trust: 0.94 },
  { rank: 3, user: "addr…7bd4e0", pcp: 12905, tier: "Contributor", trust: 0.91 },
  { rank: 4, user: "addr…21aa8f", pcp: 9840, tier: "Rising", trust: 0.88 },
  { rank: 5, user: "addr…c0ffee", pcp: 7615, tier: "Rising", trust: 0.85 },
];

export default function SocialFarming() {
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-30 border-b border-line/60 bg-void/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
            <span aria-hidden className="rocket-bob inline-block">🐍</span>
            <span className="text-gradient-2">SNEKPAD</span>
          </Link>
          <Link href="/" className="rounded-full border border-line bg-surface px-4 py-2 font-mono text-xs text-muted transition hover:text-lime">
            ← launchpad
          </Link>
        </div>
      </nav>

      <header className="mx-auto max-w-5xl px-5 pb-8 pt-14 text-center sm:pt-20">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-violet">
          Social Farming & Community Growth
        </p>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl">
          Reward the <span className="text-gradient">community</span>, not the speculation.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          Every coin launched on Snekpad becomes a growth campaign. A standalone,
          event-driven engine turns holding, referrals, memes, education and
          liquidity into on-chain-backed rewards — verified by AI, decided by rules.
        </p>
      </header>

      {/* pipeline */}
      <div className="mx-auto max-w-5xl px-5">
        <div className="grid gap-3 sm:grid-cols-4">
          {FLOW.map((s, i) => (
            <div key={s.k} className="relative rounded-2xl border border-line bg-surface/70 p-4">
              <span className="font-mono text-xs text-muted">step {s.k}</span>
              <p className={`mt-1 font-display text-sm font-bold ${s.c}`}>{s.t}</p>
              <p className="mt-1 text-xs text-muted">{s.d}</p>
              {i < FLOW.length - 1 && (
                <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-line sm:block">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="mx-auto flex max-w-5xl flex-col gap-12 px-5 py-12">
        {/* campaigns */}
        <section>
          <SectionLabel>Active campaigns</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPAIGNS.map((c) => (
              <div key={c.name} className="flex flex-col gap-2 rounded-3xl border border-line bg-surface/70 p-5 transition hover:-translate-y-1 hover:border-violet/60 hover:shadow-pop">
                <div className="flex items-center justify-between">
                  <span className="text-2xl" aria-hidden>{c.icon}</span>
                  <span className="rounded-full border border-lime/40 bg-lime/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime">{c.tag}</span>
                </div>
                <h3 className="font-display text-lg font-extrabold">{c.name}</h3>
                <p className="font-mono text-xs text-muted">{c.type}</p>
                <p className="mt-auto font-mono text-sm text-ink">
                  <span className="text-lime">+{c.pcp}</span> PCP
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* milestones */}
        <section>
          <SectionLabel>Community milestones</SectionLabel>
          <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface/70 p-6">
            {MILESTONES.map((m) => {
              const pct = Math.round((m.cur / m.target) * 100);
              return (
                <div key={m.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-ink">{m.label}</span>
                    <span className="text-muted">{m.cur} / {m.target}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface2">
                    <div className="pump-fill h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <p className="mt-1 font-mono text-xs text-muted">
              Hitting a milestone unlocks bonus PCP, reputation, and achievement badges for every contributor.
            </p>
          </div>
        </section>

        {/* leaderboard + rewards */}
        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionLabel>Top contributors</SectionLabel>
            <div className="overflow-hidden rounded-3xl border border-line bg-surface/70">
              {LEADERBOARD.map((r) => (
                <div key={r.rank} className="flex items-center gap-4 border-b border-line/60 px-5 py-3 last:border-0">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl font-display text-sm font-black ${r.rank === 1 ? "bg-gold text-void" : "bg-surface2 text-muted"}`}>{r.rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm text-ink">{r.user}</p>
                    <p className="font-mono text-[11px] text-muted">{r.tier} · trust {r.trust}</p>
                  </div>
                  <span className="font-mono text-sm text-lime">{r.pcp.toLocaleString()} PCP</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Your standing</SectionLabel>
            <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface/70 p-6">
              <Stat label="Project points (PCP)" value="4,120" hint="share of $PEPE reward pool" color="text-lime" />
              <Stat label="Platform reputation" value="Verified Builder" hint="global · non-redeemable · unlocks perks" color="text-violet" />
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted">Achievements</span>
                <div className="flex flex-wrap gap-2">
                  {["🏆 First Launch", "💎 30-day Hold", "🎨 Meme Winner", "🔗 10 Referrals"].map((b) => (
                    <span key={b} className="rounded-full border border-line bg-surface2 px-3 py-1 text-xs">{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-5 py-10 text-center font-mono text-xs text-muted">
        Independent event-driven service (NestJS · Postgres) · consumes launchpad events · AI scores content, deterministic rules decide rewards · representative data shown
      </footer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <h2 className="font-display text-xl font-extrabold tracking-tight text-ink">{children}</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
    </div>
  );
}

function Stat({ label, value, hint, color }: { label: string; value: string; hint: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</span>
      <span className={`font-display text-xl font-extrabold ${color}`}>{value}</span>
      <span className="font-mono text-[11px] text-muted">{hint}</span>
    </div>
  );
}
