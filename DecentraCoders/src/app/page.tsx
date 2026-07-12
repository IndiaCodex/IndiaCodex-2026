'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Cpu, 
  TrendingUp, 
  CheckCircle, 
  HelpCircle,
  Code,
  FileText,
  Lock,
  Layers,
  GraduationCap
} from 'lucide-react';
import { isDemoBlockchain } from '@/lib/cardano';

export default function LandingPage() {
  const stats = [
    { value: '500+', label: 'Student Startup Ideas' },
    { value: '1,200+', label: 'Developers Engaged' },
    { value: '150+', label: 'Verified Mentors' },
    { value: '3,200+', label: 'Cardano Proof Records' },
  ];

  const problemPoints = [
    {
      title: 'IP Theft Risk',
      description: 'Students fear sharing startup concepts with potential developers or peers, worried they might be copied before launch.',
    },
    {
      title: 'Credential & Skill Gaps',
      description: 'Solo student founders struggle to locate matching developers or business students within their universities.',
    },
    {
      title: 'Lack of Structure',
      description: 'Eighty percent of student ideas fail due to missing roadmaps, lack of accountability, and zero milestone feedback.',
    },
  ];

  const solutionPoints = [
    {
      title: 'Tamper-Proof Ledger Proofs',
      description: 'Register cryptographic hashes of your startup ideas on the Cardano Preview Testnet with inline datums for indisputable proof-of-existence.',
    },
    {
      title: 'Verified Skill Matchmaking',
      description: 'Match with developers looking for projects, apply to teams, and build multidisciplinary squads backed by university profiles.',
    },
    {
      title: 'Structured Milestone Tracking',
      description: 'Organize ideas into roadmap steps, receive reviews and scores from industry mentors, and claim startup readiness badges.',
    },
  ];

  const whyCardano = [
    {
      title: 'Security and Permanence',
      description: 'The Cardano blockchain utilizes the UTxO model, ensuring high security and deterministic transaction fees for student budgets.',
    },
    {
      title: 'Decentralized IP Evidence',
      description: 'Instead of trusting centralized databases, Cardano smart contracts store the proof of your idea permanently and verifiably.',
    },
    {
      title: 'India Codex Ready',
      description: 'Fully built utilizing Cardano’s Preview Testnet, using modern Mesh SDK, Blockfrost data, and Aiken smart contract compilers.',
    },
  ];

  const faqs = [
    {
      q: 'Does LaunchNest store my startup idea on the blockchain?',
      a: 'No. To ensure absolute privacy, we normalize your idea data and generate a SHA-256 hash. Only the hash is registered on Cardano. The text and full details are kept securely in our database and visible only to people you authorize.',
    },
    {
      q: 'Do I need real money or ADA to register my ideas?',
      a: 'Absolutely not! LaunchNest runs on the Cardano Preview Testnet. We use simulated test-ADA (tADA) that you can obtain for free from a testnet faucet. In addition, when wallets are unavailable, our Demo Mode lets you simulate the whole flow.',
    },
    {
      q: 'What is the role of the Aiken Smart Contract?',
      a: 'The contract (IdeaProofRegistry) acts as a cryptographic escrow. It locks a small amount of test ADA alongside your idea hash, and guarantees that only your verified wallet signature can later release or update that registry reference.',
    },
    {
      q: 'How does the verification certificate work?',
      a: 'Once registered, we compile a certificate showing the founder, hash, block height, and Cardano transaction hash. Anyone can upload the original idea payload to recalculate the hash and compare it with the blockchain record to check for tamper-evidence.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-gray-100 relative overflow-hidden flex flex-col">
      {/* Mesh Background Blobs */}
      <div className="mesh-bg-blob bg-primary -top-40 -right-40" />
      <div className="mesh-bg-blob bg-secondary top-1/2 -left-60" />

      {/* Header / Nav */}
      <header className="h-20 max-w-6xl mx-auto w-full px-6 flex items-center justify-between border-b border-translucent relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-primary/20">
            LN
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">LaunchNest</h1>
            <span className="text-xs text-secondary font-medium tracking-wide">Powered by Cardano</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/verify-idea" className="text-sm font-semibold text-gray-300 hover:text-white transition hidden md:inline">
            Verify Idea
          </Link>
          <Link 
            href="/login" 
            className="px-5 py-2 rounded-lg bg-white/5 border border-translucent text-gray-200 hover:text-white hover:bg-white/10 text-sm font-semibold transition"
          >
            Sign In
          </Link>
          <Link 
            href="/register" 
            className="px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-primary/25"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto w-full px-6 pt-16 md:pt-24 text-center space-y-8 relative z-10 flex-1">
        
        {/* Network Badge */}
        <div className="mx-auto w-fit flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5" />
          India Codex '26 Hackathon Special
        </div>

        {/* Heading */}
        <h1 className="font-sans font-extrabold text-4xl sm:text-6xl tracking-tight leading-tight max-w-4xl mx-auto">
          Turn Student Ideas <br />
          <span className="text-gradient-purple-cyan">Into Real Startups.</span>
        </h1>

        {/* Description */}
        <p className="text-gray-400 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
          LaunchNest connects students with mentors, developers and startup resources while Cardano provides tamper-resistant proof of idea submission.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link 
            href="/register" 
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl text-base flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-primary/20"
          >
            Launch Your Idea
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link 
            href="/verify-idea" 
            className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-translucent text-gray-200 font-bold rounded-xl text-base flex items-center justify-center gap-2 transition"
          >
            Verify an Idea
          </Link>

          <Link 
            href="/explore" 
            className="w-full sm:w-auto px-8 py-3.5 bg-surface hover:bg-gray-800 border border-purple-glow text-primary font-bold rounded-xl text-base flex items-center justify-center gap-2 transition"
          >
            View Cardano Proof
          </Link>
        </div>
      </section>

      {/* Platform Statistics */}
      <section className="bg-surface/30 border-y border-translucent py-10 relative z-10 mt-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, idx) => (
            <div key={idx} className="text-center">
              <p className="text-2xl md:text-4xl font-extrabold text-gradient-purple-cyan">{s.value}</p>
              <p className="text-xs md:text-sm text-gray-400 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Problem Section */}
      <section className="max-w-6xl mx-auto w-full px-6 py-20 relative z-10 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs uppercase font-bold text-secondary tracking-widest">The Problem</h2>
          <h3 className="text-2xl md:text-3xl font-bold">Why Student Startups Struggle</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problemPoints.map((p, idx) => (
            <div key={idx} className="glass-panel p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold">
                0{idx + 1}
              </div>
              <h4 className="font-bold text-lg text-gray-200">{p.title}</h4>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Solution Section */}
      <section className="max-w-6xl mx-auto w-full px-6 py-10 relative z-10 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs uppercase font-bold text-primary tracking-widest">Our Solution</h2>
          <h3 className="text-2xl md:text-3xl font-bold">A Safe Haven for Young Founders</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {solutionPoints.map((s, idx) => (
            <div key={idx} className="glass-panel p-6 space-y-4 border-emerald-500/10 hover:border-emerald-500/30">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-lg text-gray-200">{s.title}</h4>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Flow */}
      <section className="max-w-6xl mx-auto w-full px-6 py-20 relative z-10 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs uppercase font-bold text-secondary tracking-widest">The Demonstration Flow</h2>
          <h3 className="text-2xl md:text-3xl font-bold">Concept to Cardano Verification</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          <div className="glass-panel p-6 space-y-3 border-l-2 border-l-primary">
            <span className="text-2xl font-black text-gray-600 block">Step 1</span>
            <h4 className="font-bold text-base text-gray-200">Register & Authenticate</h4>
            <p className="text-xs text-gray-400 font-medium">Create a student founder account and assign roles inside Supabase.</p>
          </div>

          <div className="glass-panel p-6 space-y-3 border-l-2 border-l-secondary">
            <span className="text-2xl font-black text-gray-600 block">Step 2</span>
            <h4 className="font-bold text-base text-gray-200">Hash and Save Idea</h4>
            <p className="text-xs text-gray-400 font-medium">Normalize fields canonically. Calculate the SHA-256 hash automatically.</p>
          </div>

          <div className="glass-panel p-6 space-y-3 border-l-2 border-l-primary">
            <span className="text-2xl font-black text-gray-600 block">Step 3</span>
            <h4 className="font-bold text-base text-gray-200">Register on Cardano</h4>
            <p className="text-xs text-gray-400 font-medium">Build UTxO outputs. Write inline Datum and metadata. Sign transaction.</p>
          </div>

          <div className="glass-panel p-6 space-y-3 border-l-2 border-l-success">
            <span className="text-2xl font-black text-gray-600 block">Step 4</span>
            <h4 className="font-bold text-base text-gray-200">Verify & Certificate</h4>
            <p className="text-xs text-gray-400 font-medium">Compare payloads to verify idea contents are unmodified. Generate PDFs.</p>
          </div>

        </div>
      </section>

      {/* Why Cardano Section */}
      <section className="max-w-6xl mx-auto w-full px-6 py-10 relative z-10 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs uppercase font-bold text-primary tracking-widest">Why Cardano?</h2>
          <h3 className="text-2xl md:text-3xl font-bold">Uncompromising Safety & Low Fees</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {whyCardano.map((w, idx) => (
            <div key={idx} className="glass-panel p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-lg text-gray-200">{w.title}</h4>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">{w.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features List */}
      <section className="max-w-6xl mx-auto w-full px-6 py-10 relative z-10 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs uppercase font-bold text-secondary tracking-widest">Features</h2>
          <h3 className="text-2xl md:text-3xl font-bold">Everything Student Startups Need</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-6 bg-surface/50 border border-translucent rounded-2xl flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-1">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-100">IP Escrow Registry</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">Lock idea proofs on-chain. Only owner wallet can modify or release script UTxOs.</p>
            </div>
          </div>

          <div className="p-6 bg-surface/50 border border-translucent rounded-2xl flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary mt-1">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-100">Co-founder Matchmaking</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">Find student developers and designers by skill category and coding background.</p>
            </div>
          </div>

          <div className="p-6 bg-surface/50 border border-translucent rounded-2xl flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-success/10 text-success mt-1">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-100">Printable Certificates</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">Download official proof documents with embedded QR codes linking back to validation tools.</p>
            </div>
          </div>

          <div className="p-6 bg-surface/50 border border-translucent rounded-2xl flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-1">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-100">Multi-Role Dashboards</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">Custom flows for Students (pitching), Mentors (evaluating), and Developers (applying).</p>
            </div>
          </div>

          <div className="p-6 bg-surface/50 border border-translucent rounded-2xl flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary mt-1">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-100">Milestone Roadmaps</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">Establish startup target dates, apply for reviews, and request mentor certifications.</p>
            </div>
          </div>

          <div className="p-6 bg-surface/50 border border-translucent rounded-2xl flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-success/10 text-success mt-1">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-100">India Codex Accelerator</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">Designed specifically for university incubators participating in Codex'26.</p>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto w-full px-6 py-20 relative z-10 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs uppercase font-bold text-secondary tracking-widest">FAQ</h2>
          <h3 className="text-2xl md:text-3xl font-bold font-sans">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-5 bg-surface/40 border border-translucent rounded-2xl space-y-2">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <h4 className="font-semibold text-gray-100 text-sm md:text-base leading-tight">{faq.q}</h4>
              </div>
              <p className="text-xs md:text-sm text-gray-400 pl-8 leading-relaxed font-medium">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto w-full px-6 pb-24 text-center relative z-10">
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-purple-glow rounded-3xl p-8 md:p-12 space-y-6">
          <h3 className="text-2xl md:text-3xl font-bold">Ready to secure your intellectual property?</h3>
          <p className="text-xs md:text-sm text-gray-400 max-w-lg mx-auto font-medium">
            Join the decentralized student startup ecosystem today. Generate cryptographic proofs on Cardano and match with co-founders immediately.
          </p>
          <div className="pt-2">
            <Link 
              href="/register" 
              className="px-8 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl text-base inline-flex items-center gap-2 hover:opacity-95 transition shadow-lg shadow-primary/20"
            >
              Sign Up Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-translucent bg-surface/20 py-8 relative z-10 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white text-sm shadow">
              LN
            </div>
            <span className="font-bold text-sm">LaunchNest</span>
          </div>
          
          <p className="text-xs text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} LaunchNest — India Codex '26 Submission. Open-source under MIT License.
          </p>
          
          <div className="flex gap-4 text-xs text-gray-400 font-medium">
            <Link href="/verify-idea" className="hover:text-white transition">Verify Portal</Link>
            <Link href="/explore" className="hover:text-white transition">Explore Ideas</Link>
            <a href="https://preview.cardanoscan.io" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Preview Scanner</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
