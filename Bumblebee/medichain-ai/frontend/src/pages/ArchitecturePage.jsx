/**
 * Architecture Diagram Page — shows MediChain AI system architecture
 * For hackathon judges — explains how all 3 tracks connect
 */
import { useState } from 'react';
import { ExternalLink, Zap, Shield, Heart, Database, Cpu, Globe, Lock } from 'lucide-react';

const TRACKS = [
  {
    id: 1, emoji: '🔷', name: 'Track 1: Cardano (General)',
    color: 'blue', items: ['CIP-30 Wallet Connect', 'CIP-25 NFT Minting', 'CIP-674 Metadata', 'Aiken Smart Contracts', 'MeshJS SDK', 'Blockfrost API'],
    desc: 'Every critical event — identity, prescription, consent, payment — is anchored on Cardano as an immutable transaction.',
  },
  {
    id: 2, emoji: '🤖', name: 'Track 2: Masumi (AI Agents)',
    color: 'green', items: ['Diagnosis Agent (₳0.5)', 'Claims Agent (₳2)', 'KYC Agent (₳1)', 'Support Agent (₳0.1)', 'Ollama qwen2.5:3b', 'MIP-003 Protocol'],
    desc: 'AI agents are monetized via Masumi — every query charges real ADA, creating a sustainable AI economy on Cardano.',
  },
  {
    id: 3, emoji: '🛡', name: 'Track 3: Midnight (ZKP)',
    color: 'purple', items: ['Patient KYC (no Aadhaar stored)', 'Insurance eligibility proof', 'Doctor license verification', 'Privacy-first design', 'Zero-knowledge proofs'],
    desc: 'Midnight ZKP lets patients prove identity without revealing Aadhaar. Insurance verifies eligibility without seeing diagnosis.',
  },
];

const FLOW_STEPS = [
  { n: 1, icon: '👤', label: 'Patient registers', track: 'Midnight ZKP', color: 'purple', tx: 'Identity NFT minted' },
  { n: 2, icon: '📅', label: 'Books appointment', track: 'Platform', color: 'slate', tx: 'Logged in DB' },
  { n: 3, icon: '🧠', label: 'AI Diagnosis', track: 'Masumi ₳0.5', color: 'green', tx: 'AgentLog saved + ADA deducted' },
  { n: 4, icon: '💊', label: 'Prescription NFT', track: 'Cardano CIP-25', color: 'blue', tx: 'NFT minted on preprod' },
  { n: 5, icon: '🛡', label: 'Patient Consent', track: 'Cardano CIP-674', color: 'blue', tx: 'Consent TX on-chain' },
  { n: 6, icon: '📋', label: 'Insurance Claim', track: 'Masumi ₳2', color: 'green', tx: 'AI processes claim' },
  { n: 7, icon: '🔒', label: 'ZKP Verify', track: 'Midnight', color: 'purple', tx: 'Privacy proof verified' },
  { n: 8, icon: '⚡', label: 'ADA Payment', track: 'Aiken Contract', color: 'teal', tx: 'Escrow releases ADA' },
  { n: 9, icon: '📊', label: 'Audit Trail', track: 'Cardano', color: 'blue', tx: 'All events verifiable' },
];

const STACK = [
  { layer: 'Frontend', tech: 'React + Vite + TailwindCSS + MeshJS SDK', color: 'blue' },
  { layer: 'Backend', tech: 'Spring Boot 3 + PostgreSQL + Valkey Cache', color: 'green' },
  { layer: 'AI Layer', tech: 'Ollama qwen2.5:3b (local LLM) + Masumi Protocol', color: 'yellow' },
  { layer: 'Blockchain', tech: 'Cardano Preprod + Blockfrost + Aiken Smart Contracts', color: 'blue' },
  { layer: 'Privacy', tech: 'Midnight Network ZKP + CIP-674 metadata', color: 'purple' },
  { layer: 'Monitoring', tech: 'Prometheus + Grafana + OpenTelemetry', color: 'orange' },
];

export default function ArchitecturePage() {
  const [activeTrack, setActiveTrack] = useState(1);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/60 via-purple-900/40 to-green-900/40 border border-blue-700/50 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">MediTrust AI Architecture</h1>
            <p className="text-blue-300 mt-1 text-lg">Decentralized Healthcare Trust Platform</p>
            <p className="text-slate-400 text-sm mt-2">
              Healthcare Trust Platform built on Cardano — where every critical event is
              blockchain-verified, AI-powered, and privacy-preserved.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="px-3 py-1 bg-blue-900/40 text-blue-300 border border-blue-700 rounded-full text-xs text-center">🔷 Track 1 ✅</span>
            <span className="px-3 py-1 bg-green-900/40 text-green-300 border border-green-700 rounded-full text-xs text-center">🤖 Track 2 ✅</span>
            <span className="px-3 py-1 bg-purple-900/40 text-purple-300 border border-purple-700 rounded-full text-xs text-center">🛡 Track 3 ✅</span>
          </div>
        </div>
      </div>

      {/* Why Cardano */}
      <div className="bg-slate-800/50 border border-blue-800/50 rounded-2xl p-5">
        <h2 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" /> Why Cardano for Healthcare?
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          Healthcare requires <strong className="text-white">trust</strong>. Critical events — patient consent, prescriptions,
          insurance approvals, payment authorizations — must be <strong className="text-white">independently verifiable</strong>.
          Cardano provides an immutable, transparent audit layer, while patient data remains private in secure storage.
          <strong className="text-blue-300"> We use Cardano not because it's the hackathon platform, but because healthcare
          genuinely needs what Cardano provides.</strong>
        </p>
      </div>

      {/* 3 Track Cards */}
      <div>
        <h2 className="text-white font-bold text-lg mb-4">All 3 Hackathon Tracks</h2>
        <div className="flex gap-3 mb-4">
          {TRACKS.map(t => (
            <button key={t.id} onClick={() => setActiveTrack(t.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                activeTrack === t.id
                  ? `bg-${t.color}-900/50 border-${t.color}-600 text-${t.color}-300`
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}>
              {t.emoji} {t.name.split(':')[1].trim()}
            </button>
          ))}
        </div>
        {TRACKS.filter(t => t.id === activeTrack).map(t => (
          <div key={t.id} className={`bg-${t.color}-900/20 border border-${t.color}-800/50 rounded-2xl p-5`}>
            <h3 className="text-white font-bold text-lg mb-2">{t.emoji} {t.name}</h3>
            <p className="text-slate-300 text-sm mb-4">{t.desc}</p>
            <div className="flex flex-wrap gap-2">
              {t.items.map(item => (
                <span key={item} className={`px-3 py-1.5 bg-${t.color}-900/40 text-${t.color}-300 border border-${t.color}-700 rounded-lg text-sm`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 9-Step Demo Flow */}
      <div>
        <h2 className="text-white font-bold text-lg mb-4">9-Scenario Demo Flow</h2>
        <div className="relative">
          <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-slate-700" />
          <div className="space-y-2">
            {FLOW_STEPS.map((s, i) => (
              <div key={s.n} className="relative flex items-center gap-4 pl-4">
                <div className={`relative z-10 w-6 h-6 rounded-full border-2 border-${s.color}-500 bg-slate-900 flex items-center justify-center text-xs font-bold text-${s.color}-400 flex-shrink-0`}>
                  {s.n}
                </div>
                <div className={`flex-1 flex items-center justify-between py-2.5 px-4 bg-${s.color}-900/15 border border-${s.color}-800/40 rounded-xl`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-white text-sm font-medium">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 bg-${s.color}-900/40 text-${s.color}-400 border border-${s.color}-800 rounded-full`}>
                      {s.track}
                    </span>
                    <span className="text-slate-500 text-xs hidden sm:block">{s.tx}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div>
        <h2 className="text-white font-bold text-lg mb-4">Technology Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STACK.map(s => (
            <div key={s.layer} className={`bg-${s.color}-900/15 border border-${s.color}-800/40 rounded-xl p-4`}>
              <p className={`text-${s.color}-400 text-xs font-bold uppercase tracking-wider mb-1`}>{s.layer}</p>
              <p className="text-white text-sm">{s.tech}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture Diagram as text art */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5">
        <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" /> System Architecture
        </h2>
        <pre className="text-green-300 text-xs overflow-x-auto leading-relaxed font-mono">
{`
  ┌─────────────────────────────────────────────────────────────────┐
  │                    MediChain AI — Frontend                       │
  │         React + Vite + TailwindCSS + MeshJS SDK (CIP-30)        │
  └──────────────────────┬────────────────────────────┬─────────────┘
                         │ REST API                   │ Direct (MeshJS)
                         ▼                            ▼
  ┌─────────────────────────────────┐   ┌────────────────────────────┐
  │    Spring Boot 3 Backend        │   │   Cardano Preprod Network   │
  │                                 │   │                            │
  │  ┌─────────────────────────┐   │   │  ┌──────────────────────┐  │
  │  │   AI Orchestrator       │   │   │  │  CIP-25 NFT Minting  │  │
  │  │   Ollama qwen2.5:3b     │──────▶│  │  CIP-674 Metadata    │  │
  │  │   Masumi Protocol       │   │   │  │  Aiken Contracts     │  │
  │  └─────────────────────────┘   │   │  │  Blockfrost API      │  │
  │                                 │   │  └──────────────────────┘  │
  │  ┌─────────────────────────┐   │   └────────────────────────────┘
  │  │  PostgreSQL + Valkey    │   │
  │  │  Audit Logs + Cache     │   │   ┌────────────────────────────┐
  │  └─────────────────────────┘   │   │   Midnight Network (ZKP)   │
  │                                 │──▶│  Patient KYC (no Aadhaar)  │
  │  ┌─────────────────────────┐   │   │  Insurance Eligibility     │
  │  │  Prometheus + Grafana   │   │   │  Doctor License Proof      │
  │  │  Money Flow Dashboard   │   │   └────────────────────────────┘
  │  └─────────────────────────┘   │
  └─────────────────────────────────┘

  ADA MONEY FLOW:
  Patient Wallet ──₳0.5──▶ Masumi AI Diagnosis
  Patient Wallet ──₳0.1──▶ Masumi AI Support Chat
  Insurance Wallet ──₳2──▶ Masumi Claims Processing
  Insurance Wallet ──₳X──▶ Aiken Escrow ──▶ Hospital Wallet (on approval)
`}
        </pre>
      </div>

      {/* Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'CardanoScan', url: 'https://preprod.cardanoscan.io', color: 'blue' },
          { label: 'MeshJS Docs', url: 'https://meshjs.dev', color: 'green' },
          { label: 'Masumi Network', url: 'https://masumi.network', color: 'yellow' },
          { label: 'Midnight Docs', url: 'https://midnight.network', color: 'purple' },
        ].map(l => (
          <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
            className={`flex items-center justify-center gap-2 py-2.5 bg-${l.color}-900/20 hover:bg-${l.color}-900/40 border border-${l.color}-800 rounded-xl text-${l.color}-400 text-sm transition-colors`}>
            {l.label} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ))}
      </div>
    </div>
  );
}
