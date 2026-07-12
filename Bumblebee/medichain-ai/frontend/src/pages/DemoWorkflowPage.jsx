/**
 * Demo Workflow Page — The 9-Scenario guided demo for judges
 * Shows all 3 tracks in one cohesive story
 * Judges can follow along and see exactly what's happening on each blockchain
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck, Calendar, Stethoscope, Pill, ShieldCheck,
  CreditCard, Shield, Zap, Activity, ChevronRight,
  CheckCircle2, Circle, ExternalLink, ArrowRight
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 1,
    icon: UserCheck,
    title: 'Patient Registration',
    subtitle: 'Wallet connect + identity verification',
    tracks: ['Midnight ZKP', 'Cardano'],
    color: 'blue',
    description: 'Patient registers with Cardano wallet (Lace/Eternl). Identity verified using Midnight ZKP — proves the patient is real without revealing Aadhaar or personal data.',
    cardanoAction: 'Identity NFT minted on Cardano Preprod',
    route: '/patient/dashboard',
    demoSteps: [
      'Click "Connect Wallet" → select Lace',
      'Wallet signs challenge — proves ownership',
      'Midnight ZKP verifies identity privately',
      'Identity NFT minted on Cardano',
    ],
  },
  {
    id: 2,
    icon: Calendar,
    title: 'Book Appointment',
    subtitle: 'AI suggests available doctors',
    tracks: ['Masumi AI', 'Platform'],
    color: 'teal',
    description: 'Patient describes symptoms. AI agent suggests the most relevant specialist and available time slots.',
    cardanoAction: 'Appointment confirmation logged',
    route: '/patient/appointments',
    demoSteps: [
      'Enter symptoms: "chest pain, fatigue"',
      'AI suggests Dr. Rajesh — Cardiology',
      'Select date and time',
      'Appointment confirmed',
    ],
  },
  {
    id: 3,
    icon: Stethoscope,
    title: 'Doctor Consultation',
    subtitle: 'AI history summary + diagnosis',
    tracks: ['Masumi AI'],
    color: 'green',
    description: 'Doctor logs in. AI instantly summarizes patient history, allergies, and current medications. AI suggests possible diagnoses based on symptoms.',
    cardanoAction: '₳0.5 ADA charged via Masumi for diagnosis',
    route: '/doctor/dashboard',
    demoSteps: [
      'Doctor opens patient profile',
      'AI reads medical history (Ollama qwen2.5)',
      'AI suggests diagnosis with confidence score',
      '₳0.5 ADA charged automatically via Masumi',
    ],
  },
  {
    id: 4,
    icon: Pill,
    title: 'Prescription NFT',
    subtitle: 'Tamper-proof prescription on Cardano',
    tracks: ['Cardano'],
    color: 'purple',
    description: 'Doctor issues a prescription. System mints a CIP-25 NFT on Cardano — the prescription becomes tamper-evident and permanently verifiable.',
    cardanoAction: 'CIP-25 NFT minted — prescription is immutable',
    route: '/doctor/escrow',
    demoSteps: [
      'Doctor fills prescription details',
      'MeshJS mints CIP-25 NFT on Preprod',
      'TX hash recorded in medical record',
      'Patient can verify on CardanoScan',
    ],
  },
  {
    id: 5,
    icon: ShieldCheck,
    title: 'Patient Consent',
    subtitle: '"Share my prescription with insurance?"',
    tracks: ['Cardano', 'Midnight ZKP'],
    color: 'yellow',
    description: 'Patient receives: "Dr. Rajesh wants to share your prescription with StarHealth Insurance." Patient approves — consent is anchored as Cardano metadata (CIP-674).',
    cardanoAction: 'Consent recorded on-chain — immutable proof of permission',
    route: '/patient/consent',
    demoSteps: [
      'Patient sees consent request notification',
      'Reviews what data will be shared',
      'Clicks "Approve & Record on Cardano"',
      'CIP-674 metadata TX submitted',
    ],
  },
  {
    id: 6,
    icon: CreditCard,
    title: 'Insurance Claim',
    subtitle: 'AI reads prescription, checks policy',
    tracks: ['Masumi AI'],
    color: 'orange',
    description: 'Patient submits insurance claim. AI agent reads the prescription NFT, verifies coverage, detects missing documents, and estimates eligibility. Charges ₳2 ADA via Masumi.',
    cardanoAction: '₳2 ADA charged via Masumi for claim processing',
    route: '/patient/claims',
    demoSteps: [
      'Patient submits claim with prescription NFT hash',
      'AI reads policy and prescription',
      'Fraud detection runs automatically',
      '₳2 ADA charged — decision in < 30 seconds',
    ],
  },
  {
    id: 7,
    icon: Shield,
    title: 'ZKP Verification',
    subtitle: 'Insurance verifies without seeing private data',
    tracks: ['Midnight ZKP'],
    color: 'indigo',
    description: 'Insurance officer verifies: ✔ Identity is real ✔ Doctor is licensed ✔ Policy is valid — all without seeing the patient\'s Aadhaar, DOB, or full medical history. Privacy preserved.',
    cardanoAction: 'ZKP proof verified on Midnight Network',
    route: '/insurance/claims',
    demoSteps: [
      'Insurance verifies patient identity (ZKP)',
      'Doctor license verified without seeing PII',
      'Policy validity confirmed',
      'All verified — no sensitive data exposed',
    ],
  },
  {
    id: 8,
    icon: Zap,
    title: 'ADA Payment Release',
    subtitle: 'Smart contract releases payment',
    tracks: ['Cardano', 'Aiken Contract'],
    color: 'green',
    description: 'Insurance approves the claim. Aiken smart contract on Cardano automatically releases the ADA payment to the hospital. No manual bank transfer. Fully transparent.',
    cardanoAction: 'Aiken escrow contract releases ADA to hospital wallet',
    route: '/insurance/claims',
    demoSteps: [
      'Insurance officer clicks "Approve"',
      'Aiken smart contract triggered',
      'ADA released from escrow to hospital',
      'TX hash recorded — verifiable on CardanoScan',
    ],
  },
  {
    id: 9,
    icon: Activity,
    title: 'Audit Trail',
    subtitle: 'Every event verifiable on blockchain',
    tracks: ['Cardano', 'Masumi AI', 'Midnight ZKP'],
    color: 'slate',
    description: 'Show the complete timeline: Registration → Consultation → Prescription → Consent → Claim → Verification → Payment. Every important event has a Cardano transaction hash.',
    cardanoAction: 'Full immutable audit trail on Cardano',
    route: '/patient/audit-trail',
    demoSteps: [
      'Open Audit Trail page',
      'Show all 9 events with TX hashes',
      'Click any TX → opens CardanoScan (live)',
      'Judges can verify independently',
    ],
  },
];

const TRACK_COLORS = {
  'Cardano':       'bg-blue-900/30 text-blue-300 border-blue-700',
  'Masumi AI':     'bg-green-900/30 text-green-300 border-green-700',
  'Midnight ZKP':  'bg-purple-900/30 text-purple-300 border-purple-700',
  'Aiken Contract':'bg-teal-900/30 text-teal-300 border-teal-700',
  'Platform':      'bg-slate-700 text-slate-300 border-slate-600',
};

export default function DemoWorkflowPage() {
  const [activeScenario, setActiveScenario] = useState(1);
  const scenario = SCENARIOS.find(s => s.id === activeScenario);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/60 via-purple-900/40 to-green-900/40 border border-blue-800/50 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">MediTrust AI — Demo Workflow</h1>
            <p className="text-blue-300 mt-1">9 scenarios · All 3 Hackathon Tracks · 5-minute story</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 border border-green-700 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">Live on Cardano Preprod</span>
          </div>
        </div>

        {/* Track coverage */}
        <div className="flex gap-3 mt-4 flex-wrap">
          {[
            { label: 'Track 1: Cardano', color: 'blue', icon: '🔷' },
            { label: 'Track 2: Masumi AI', color: 'green', icon: '🤖' },
            { label: 'Track 3: Midnight ZKP', color: 'purple', icon: '🛡' },
          ].map(({ label, color, icon }) => (
            <span key={label} className={`flex items-center gap-1.5 px-3 py-1.5 bg-${color}-900/30 text-${color}-300 border border-${color}-700 rounded-xl text-sm font-medium`}>
              {icon} {label} ✅
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario list */}
        <div className="space-y-1">
          {SCENARIOS.map(s => {
            const Icon = s.icon;
            const isActive = activeScenario === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveScenario(s.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-blue-900/40 border border-blue-600'
                    : 'hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  {s.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>{s.title}</p>
                  <p className="text-slate-500 text-xs truncate">{s.subtitle}</p>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Scenario detail */}
        {scenario && (
          <div className="lg:col-span-2 space-y-4">
            <div className={`bg-${scenario.color}-900/20 border border-${scenario.color}-800/50 rounded-2xl p-6`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 bg-${scenario.color}-900/50 rounded-xl flex-shrink-0`}>
                  <scenario.icon className={`w-6 h-6 text-${scenario.color}-400`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Scenario {scenario.id} — {scenario.title}
                  </h2>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {scenario.tracks.map(t => (
                      <span key={t} className={`text-xs px-2 py-0.5 border rounded-full ${TRACK_COLORS[t] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed">{scenario.description}</p>

              {/* Cardano action highlight */}
              <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-blue-900/30 border border-blue-700/50 rounded-xl">
                <div className="text-2xl">🔷</div>
                <div>
                  <p className="text-blue-300 text-xs font-medium uppercase tracking-wide">Cardano Action</p>
                  <p className="text-white text-sm font-medium">{scenario.cardanoAction}</p>
                </div>
              </div>
            </div>

            {/* Demo steps */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Demo Steps (show judges these)
              </h3>
              <div className="space-y-2">
                {scenario.demoSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-400 text-xs flex items-center justify-center flex-shrink-0 font-medium">
                      {i + 1}
                    </div>
                    <span className="text-slate-300 text-sm">{step}</span>
                  </div>
                ))}
              </div>

              <Link
                to={scenario.route}
                className={`mt-4 flex items-center justify-center gap-2 py-2.5 bg-${scenario.color}-600 hover:bg-${scenario.color}-700 text-white font-medium rounded-xl transition-colors`}
              >
                Open {scenario.title} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              {activeScenario > 1 && (
                <button
                  onClick={() => setActiveScenario(s => s - 1)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl transition-colors text-sm"
                >
                  ← Previous
                </button>
              )}
              {activeScenario < 9 && (
                <button
                  onClick={() => setActiveScenario(s => s + 1)}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm"
                >
                  Next Scenario →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Architecture summary */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4 text-center">Architecture</h3>
        <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
          {[
            { label: 'React', color: 'blue' },
            { label: '→', color: 'slate' },
            { label: 'Spring Boot', color: 'green' },
            { label: '→', color: 'slate' },
            { label: 'Ollama AI', color: 'yellow' },
            { label: '→', color: 'slate' },
            { label: 'Cardano', color: 'blue' },
            { label: '+', color: 'slate' },
            { label: 'Midnight', color: 'purple' },
            { label: '→', color: 'slate' },
            { label: 'PostgreSQL', color: 'teal' },
            { label: '+', color: 'slate' },
            { label: 'Valkey', color: 'red' },
          ].map((item, i) => (
            item.label === '→' || item.label === '+' ? (
              <span key={i} className="text-slate-500 font-bold">{item.label}</span>
            ) : (
              <span key={i} className={`px-2.5 py-1 bg-${item.color}-900/40 text-${item.color}-300 border border-${item.color}-800 rounded-lg font-medium`}>
                {item.label}
              </span>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
