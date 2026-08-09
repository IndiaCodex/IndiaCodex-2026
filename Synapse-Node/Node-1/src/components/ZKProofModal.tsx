"use client";

import { useState } from "react";
import { X, ShieldCheck, Fingerprint, CheckCircle2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MedicalRecord } from "@/data/mockData";

interface ZKProofModalProps {
  record: MedicalRecord;
  onClose: () => void;
}

type ZKState = "idle" | "generating" | "done";

// Mock ZK disclosure options per record type
const DISCLOSURE_OPTIONS: Record<string, { label: string; description: string }[]> = {
  vaccination: [
    { label: "Verify Vaccination Status", description: "Proves you are fully vaccinated — without revealing dates, batch numbers, or clinic locations." },
    { label: "Verify Booster Received", description: "Proves booster was administered — without revealing when or where." },
  ],
  lab: [
    { label: "Verify All Values in Normal Range", description: "Proves all CBC values are within normal limits — without revealing exact numbers." },
    { label: "Verify No Blood-Borne Pathogens", description: "Proves clean pathogen status — without revealing any specific test results." },
  ],
  allergy: [
    { label: "Verify Known Allergy Exists", description: "Proves an allergy is documented — without revealing the allergen identity." },
    { label: "Verify Not Allergic to Penicillin", description: "WARNING: This record has a CRITICAL allergy flag. Disclosure not recommended." },
  ],
  prescription: [
    { label: "Verify Active Prescription Exists", description: "Proves a valid prescription is on file — without revealing medication names or dosages." },
  ],
  imaging: [
    { label: "Verify No Malignancies Detected", description: "Proves imaging report is clear — without revealing anatomical details or imaging method." },
  ],
  consultation: [
    { label: "Verify Annual Checkup Completed", description: "Proves a consultation occurred within the last 12 months — without revealing any clinical findings." },
    { label: "Verify All Vitals Normal", description: "Proves vitals are within normal range — without revealing exact measurements." },
  ],
};

function generateMockZKProof(): string {
  const segments = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")
  );
  return `0x${segments.join("")}` +
    `\n  circuit: MidnightZK-CIP-30-v1.4\n` +
    `  merkle_root: 0x${Math.random().toString(16).slice(2, 18)}...\n` +
    `  nullifier: 0x${Math.random().toString(16).slice(2, 18)}...\n` +
    `  pi_a: [${Array.from({ length: 3 }, () => Math.random().toString(16).slice(2, 10)).join(", ")}]\n` +
    `  pi_b: [[${Array.from({ length: 2 }, () => Math.random().toString(16).slice(2, 10)).join(", ")}]]\n` +
    `  valid_until: ${new Date(Date.now() + 86400000).toISOString()}`;
}

export default function ZKProofModal({ record, onClose }: ZKProofModalProps) {
  const options = DISCLOSURE_OPTIONS[record.type] ?? DISCLOSURE_OPTIONS.consultation;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zkState, setZkState] = useState<ZKState>("idle");
  const [zkProof, setZkProof] = useState("");
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleGenerate = async () => {
    setZkState("generating");
    await new Promise((r) => setTimeout(r, 2500));
    setZkProof(generateMockZKProof());
    setZkState("done");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(zkProof);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black bg-black">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 border-2 border-yellow-400 flex items-center justify-center">
              <Fingerprint className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Selective Disclosure</h2>
              <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">
                Midnight ZK · Privacy Layer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white text-black flex items-center justify-center hover:bg-gray-100 transition-colors border-2 border-white"
          >
            <X className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Record being proved */}
          <div className="px-4 py-3 bg-gray-50 border-2 border-black">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Source Record</p>
            <p className="text-sm font-black text-black">{record.name}</p>
            <p className="text-xs font-semibold text-gray-500">{record.date} · {record.type}</p>
          </div>

          {/* Disclosure toggles */}
          <div>
            <p className="text-xs font-black text-black uppercase tracking-wider mb-3">
              Select What to Prove:
            </p>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedIndex(i); setZkState("idle"); setZkProof(""); }}
                  className={`w-full text-left p-3 border-2 transition-all ${
                    selectedIndex === i
                      ? "border-black bg-yellow-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      : "border-black bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 border-2 border-black flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      selectedIndex === i ? "bg-black" : "bg-white"
                    }`}>
                      {selectedIndex === i && (
                        <div className="w-2 h-2 bg-yellow-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-black">{opt.label}</p>
                      <p className="text-[11px] font-medium text-gray-600 mt-0.5 leading-snug">{opt.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy guarantee note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border-2 border-black">
            <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-[11px] font-semibold text-black leading-snug">
              This proof is generated <span className="font-black">locally</span> using Midnight Network&apos;s ZK circuits. No raw health data ever leaves your wallet.
            </p>
          </div>

          {/* Generate button */}
          {zkState !== "done" && (
            <button
              onClick={handleGenerate}
              disabled={zkState === "generating"}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-yellow-400 border-2 border-black text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-70"
            >
              {zkState === "generating" ? (
                <>
                  <LoadingSpinner size="sm" />
                  Generating Cryptographic Proof...
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" strokeWidth={2.5} />
                  Generate Cryptographic Proof
                </>
              )}
            </button>
          )}

          {/* ZK Proof output */}
          {zkState === "done" && zkProof && (
            <div className="space-y-3">
              {/* Success banner */}
              <div className="flex items-center gap-3 p-3 bg-green-50 border-2 border-green-600">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" strokeWidth={2.5} />
                <div>
                  <p className="text-sm font-black text-green-700">ZK-Proof Generated: Valid ✓</p>
                  <p className="text-[11px] font-semibold text-green-600">
                    Proof anchored to Midnight Network · CIP-30 compliant
                  </p>
                </div>
              </div>

              {/* Proved claim */}
              <div className="p-3 border-2 border-black bg-white">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Claim Proved</p>
                <p className="text-xs font-black text-black">{options[selectedIndex]?.label}</p>
              </div>

              {/* Proof hex collapsible */}
              <div className="border-2 border-black">
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <span className="text-[10px] font-black text-black uppercase tracking-wider">Raw Proof Data</span>
                  {showRaw ? <ChevronUp className="w-3.5 h-3.5" strokeWidth={3} /> : <ChevronDown className="w-3.5 h-3.5" strokeWidth={3} />}
                </button>
                {showRaw && (
                  <div className="relative">
                    <pre className="p-3 text-[10px] font-mono text-green-700 bg-black leading-relaxed overflow-x-auto">
                      {zkProof}
                    </pre>
                    <button
                      onClick={handleCopy}
                      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-yellow-400 border border-black text-[10px] font-black uppercase"
                    >
                      {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                )}
              </div>

              {/* Re-generate */}
              <button
                onClick={() => { setZkState("idle"); setZkProof(""); }}
                className="w-full py-2 px-4 bg-white border-2 border-black text-xs font-black uppercase tracking-wider hover:bg-gray-50 transition-colors"
              >
                Generate New Proof
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
