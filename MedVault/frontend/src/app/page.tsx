"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/logo";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Coins,
  EyeOff,
  Fingerprint,
  Landmark,
  Lock,
  Menu,
  ShieldCheck,
  Sparkles,
  Vault,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55 },
};

const features = [
  {
    icon: EyeOff,
    title: "Zero-knowledge claims",
    body: "Prove you're covered without revealing a single medical record. Claims verify eligibility cryptographically — never by disclosure.",
  },
  {
    icon: Vault,
    title: "Private premium vaults",
    body: "Premiums flow into shielded Midnight vaults. Identity, balances, and policy status stay invisible to everyone — including us.",
  },
  {
    icon: Sparkles,
    title: "Yield-bearing treasury",
    body: "Up to 80% of idle pool capital works in approved Cardano strategies, strengthening the pool instead of sitting still.",
  },
  {
    icon: Zap,
    title: "Fast private payouts",
    body: "Valid proof in, payout out. Approved claims settle to your vault without exposing amounts or reasons on-chain.",
  },
  {
    icon: Landmark,
    title: "Transparent solvency",
    body: "Aggregate pool health is publicly auditable while individual positions remain private. Both can be true.",
  },
  {
    icon: Fingerprint,
    title: "Self-sovereign identity",
    body: "Your wallet is your identity. No KYC honeypots, no centralized database of patients waiting to be breached.",
  },
];

const steps = [
  { n: "01", title: "Connect & enroll", body: "Link your Cardano wallet, pick a coverage tier, and receive a private policy commitment on Midnight." },
  { n: "02", title: "Pay premiums privately", body: "Premiums settle into the shielded pool. Your contribution history lives in your vault — not on a public ledger." },
  { n: "03", title: "Treasury generates yield", body: "Idle capital is deployed into vetted Cardano DeFi strategies with an enforced liquidity floor for claims." },
  { n: "04", title: "Claim with a proof", body: "Generate a ZK proof of eligibility. If it verifies, you're paid — and your diagnosis never leaves your device." },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div className="relative overflow-hidden">
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[640px]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-violet/20 blur-[140px]" />
      <div className="pointer-events-none absolute -top-20 left-[15%] h-[380px] w-[380px] rounded-full bg-cyan/15 blur-[120px]" />

      {/* Nav */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <a href="#how" className="transition-colors hover:text-white">How it works</a>
          <a href="#privacy" className="transition-colors hover:text-white">Privacy</a>
          <a href="#tech" className="transition-colors hover:text-white">Technology</a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link href="/auth/register"><Button size="sm">Get covered <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
        </div>
        <button className="md:hidden text-muted" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {menuOpen && (
        <div className="glass-strong relative z-20 mx-4 rounded-2xl p-4 md:hidden">
          <nav className="flex flex-col gap-1 text-sm">
            {[["#features", "Features"], ["#how", "How it works"], ["#privacy", "Privacy"], ["#tech", "Technology"]].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-muted hover:bg-white/5 hover:text-white">{label}</a>
            ))}
            <div className="mt-2 flex gap-2">
              <Link href="/auth/login" className="flex-1"><Button variant="secondary" className="w-full" size="sm">Sign in</Button></Link>
              <Link href="/auth/register" className="flex-1"><Button className="w-full" size="sm">Get covered</Button></Link>
            </div>
          </nav>
        </div>
      )}

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-16 text-center sm:pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Badge variant="cyan" dot className="mx-auto">Live on Cardano preprod · Powered by Midnight</Badge>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            The future of insurance is <span className="text-gradient">private.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg">
            MedVault shields your identity, records, and claims with zero-knowledge proofs — while your
            premiums earn real yield in a productive Cardano treasury.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/auth/register"><Button size="lg" className="glow-cyan">Start private coverage <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link href="/auth/login"><Button variant="secondary" size="lg">Explore the app</Button></Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="glass-strong mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 rounded-3xl p-8 sm:grid-cols-4"
        >
          {[
            ["₳3.87M", "Pool treasury"],
            ["9.4%", "Current APY"],
            ["9,631", "Active policies"],
            ["0", "Records exposed"],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="text-2xl font-semibold text-gradient">{v}</p>
              <p className="mt-1 text-xs text-subtle">{l}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="violet">Features</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Confidential by architecture</h2>
          <p className="mt-3 text-muted">Not privacy by policy — privacy by mathematics.</p>
        </motion.div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.05 }}>
              <div className="glass group h-full rounded-2xl p-6 transition-all duration-300 hover:border-cyan/25 hover:bg-white/[0.06]">
                <span className="inline-flex rounded-xl bg-gradient-to-br from-cyan/15 to-violet/15 p-3">
                  <f.icon className="h-5 w-5 text-cyan transition-transform duration-300 group-hover:scale-110" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="cyan">How it works</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Four steps to private coverage</h2>
        </motion.div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div key={s.n} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <div className="glass relative h-full overflow-hidden rounded-2xl p-6">
                <span className="text-gradient absolute -top-3 right-4 text-6xl font-bold opacity-30">{s.n}</span>
                <h3 className="text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <Badge variant="success">Why privacy matters</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Public blockchains and private lives don&apos;t mix — until now.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Traditional on-chain insurance would broadcast your diagnoses, your wealth, and your claim
              history to the world, forever. Traditional off-chain insurers hoard that same data in breachable
              silos — 133 million health records were exposed in 2023 alone.
            </p>
            <p className="mt-4 leading-relaxed text-muted">
              MedVault takes a third path: Midnight&apos;s zero-knowledge layer verifies everything while
              revealing nothing. Eligibility is proven, not shown. Payouts settle, amounts stay shielded.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Medical records never leave your device",
                "Wallet balances and premiums stay shielded",
                "Claims verified without disclosure",
                "Aggregate solvency remains publicly auditable",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-emerald" /> {t}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.15 }}>
            <div className="glass-strong glow-violet relative rounded-3xl p-8">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted">Claim verification</p>
                <Badge variant="success" dot>ZK proof valid</Badge>
              </div>
              <div className="mt-6 space-y-3 font-mono text-xs">
                {[
                  ["policy_commitment", "0x8f4e…d2e3", true],
                  ["coverage_eligible", "proven", true],
                  ["diagnosis", "██████████", false],
                  ["medical_history", "██████████", false],
                  ["claim_amount", "shielded", false],
                  ["payout_status", "settled ✓", true],
                ].map(([k, v, visible]) => (
                  <div key={k as string} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-4 py-2.5">
                    <span className="text-subtle">{k}</span>
                    <span className={visible ? "text-emerald" : "text-violet"}>
                      {visible ? (v as string) : (<span className="flex items-center gap-1.5"><Lock className="h-3 w-3" />{v}</span>)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tech */}
      <section id="tech" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="violet">Technology</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Midnight privacy. Cardano liquidity.</h2>
          <p className="mt-3 text-muted">Two chains, one architecture — each doing what it does best.</p>
        </motion.div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <motion.div {...fadeUp}>
            <div className="glass h-full rounded-3xl p-8">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-violet/15 p-3"><EyeOff className="h-5 w-5 text-violet" /></span>
                <h3 className="text-xl font-semibold">Midnight</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                The privacy layer. Shielded vaults hold policy commitments; zero-knowledge circuits verify
                claim eligibility. Data protection meets programmability — rational privacy for regulated
                industries.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Shielded vaults", "ZK circuits", "Compact contracts", "Selective disclosure"].map((t) => (
                  <Badge key={t} variant="violet">{t}</Badge>
                ))}
              </div>
            </div>
          </motion.div>
          <motion.div {...fadeUp} transition={{ duration: 0.55, delay: 0.1 }}>
            <div className="glass h-full rounded-3xl p-8">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-cyan/15 p-3"><Coins className="h-5 w-5 text-cyan" /></span>
                <h3 className="text-xl font-semibold">Cardano</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                The liquidity layer. Pooled premiums become productive capital — staking, collateralized
                lending, and stable LPs generate yield with an enforced 20% liquid floor for instant claims.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["DeFi strategies", "Native staking", "Blockfrost", "eUTxO settlement"].map((t) => (
                  <Badge key={t} variant="cyan">{t}</Badge>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-24">
        <motion.div {...fadeUp}>
          <div className="glass-strong glow-cyan relative overflow-hidden rounded-3xl p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[480px] -translate-x-1/2 rounded-full bg-cyan/15 blur-[100px]" />
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your health is yours. <span className="text-gradient">Keep it that way.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              Join thousands protecting their medical privacy while their premiums quietly compound.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/auth/register"><Button size="lg">Create private account <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/hospital-auth/register"><Button variant="outline" size="lg"><Building2 className="h-4 w-4" /> Partner as a hospital</Button></Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo />
          <p className="text-xs text-subtle">© 2026 MedVault. Hackathon build — Cardano preprod testnet.</p>
          <div className="flex gap-4 text-xs text-subtle">
            <Link href="/hospital-auth/login" className="hover:text-white">Hospital portal</Link>
            <Link href="/admin-auth/login" className="hover:text-white">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
