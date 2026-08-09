'use client';

import React, { useState, useEffect } from 'react';
import {
  Printer,
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  ClipboardCheck,
  Building,
  Link2,
  ShieldAlert,
} from 'lucide-react';
import { Idea, BlockchainRecord, Profile } from '@/lib/demoData';

interface BlockchainCertificateProps {
  idea: Idea;
  record: BlockchainRecord;
  owner: Profile;
}

// Determines if the tx hash is a real Cardano hash (not demo/fake)
function isRealTxHash(hash: string): boolean {
  return /^[0-9a-f]{64}$/i.test(hash) && !hash.startsWith('demo_');
}

type ConfirmationState = 'loading' | 'confirmed' | 'pending' | 'demo';

export default function BlockchainCertificate({ idea, record, owner }: BlockchainCertificateProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmationState>('loading');
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);

  // On mount, check the real confirmation status via Blockfrost server route
  useEffect(() => {
    async function checkConfirmation() {
      // If demo hash or no real tx — immediately mark as Demo
      if (!isRealTxHash(record.transaction_hash)) {
        setConfirmState('demo');
        return;
      }

      // If already confirmed in the database record
      if (record.confirmation_status === 'Confirmed' && record.block_height) {
        setConfirmState('confirmed');
        setBlockHeight(record.block_height);
        return;
      }

      // Check via the server-side Blockfrost API route
      try {
        const res = await fetch(`/api/cardano/transaction/${record.transaction_hash}`);
        if (!res.ok) {
          setConfirmState('pending');
          return;
        }
        const data = await res.json();
        if (data.status === 'confirmed') {
          setConfirmState('confirmed');
          setBlockHeight(data.blockHeight ?? null);
          setConfirmedAt(data.confirmedAt ?? null);
        } else {
          setConfirmState('pending');
        }
      } catch {
        setConfirmState('pending');
      }
    }

    checkConfirmation();
  }, [record.transaction_hash, record.confirmation_status, record.block_height]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleCopy = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const getVerificationUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/verify-idea?id=${idea.id}`;
    }
    return `https://launchnest.dev/verify-idea?id=${idea.id}`;
  };

  // ── Status badge ─────────────────────────────────────────────────────────
  const StatusBadge = () => {
    if (confirmState === 'loading') {
      return (
        <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs px-3 py-1.5 rounded-full font-bold w-fit">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          Checking Blockchain...
        </div>
      );
    }

    if (confirmState === 'confirmed') {
      return (
        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-bold w-fit">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verified on Cardano
        </div>
      );
    }

    if (confirmState === 'pending') {
      return (
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-3 py-1.5 rounded-full font-bold w-fit">
          <Clock className="w-3.5 h-3.5" />
          Pending Confirmation
        </div>
      );
    }

    // Demo mode
    return (
      <div className="flex items-center gap-1.5 bg-gray-500/10 border border-gray-500/30 text-gray-400 text-xs px-3 py-1.5 rounded-full font-bold w-fit">
        <AlertCircle className="w-3.5 h-3.5" />
        Demo Mode
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* ── Pending / Demo notice banner ─────────────────────────────────── */}
      {confirmState === 'pending' && (
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-0.5">Transaction Submitted — Awaiting Confirmation</p>
            <p>Your transaction is propagating across the Cardano network. Block confirmation usually takes 1–3 minutes. Refresh this page to check status.</p>
          </div>
        </div>
      )}

      {confirmState === 'demo' && (
        <div className="p-4 rounded-xl bg-gray-500/5 border border-gray-500/30 text-gray-400 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-0.5 text-gray-300">Demo Mode Certificate</p>
            <p>This certificate was generated in Demo Mode. No real Cardano transaction was submitted. To create a verifiable proof, connect a wallet and complete the registration with Blockfrost configured.</p>
          </div>
        </div>
      )}

      {/* ── Certificate ──────────────────────────────────────────────────── */}
      <div
        id="certificate-print-area"
        className="relative bg-surface border-2 border-purple-glow rounded-3xl p-6 md:p-12 overflow-hidden shadow-2xl text-gray-100 max-w-4xl mx-auto border-double bg-opacity-70 backdrop-blur-md"
      >
        {/* Ambient decorations */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-primary/5 pointer-events-none flex items-center justify-center">
          <div className="w-[280px] h-[280px] rounded-full border-2 border-dashed border-secondary/5 flex items-center justify-center">
            <Building className="w-20 h-20 text-primary/5" />
          </div>
        </div>
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-lg pointer-events-none" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-primary/40 rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-primary/40 rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-lg pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-3.5 relative z-10">
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white text-sm shadow">
              LN
            </div>
            <span className="font-bold tracking-wider text-xs uppercase text-gray-400">LaunchNest Platform Registry</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl md:text-4xl tracking-tight text-gradient-purple-cyan uppercase">
            Blockchain Proof Certificate
          </h1>
          <p className="text-xs md:text-sm text-gray-400 font-medium max-w-lg mx-auto">
            Cryptographic timestamped record of intellectual property submission registered on the Cardano Blockchain ledger.
          </p>
        </div>

        <div className="w-24 h-0.5 bg-gradient-to-r from-primary to-secondary mx-auto my-8 relative z-10" />

        {/* Body */}
        <div className="space-y-6 relative z-10">
          <div className="text-center space-y-1">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">This certifies that startup idea</span>
            <h2 className="text-xl md:text-2xl font-bold text-gradient-cyan-emerald py-1">{idea.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Submitted By</span>
                <p className="font-semibold text-gray-100 text-sm md:text-base mt-0.5">{owner.full_name}</p>
              </div>

              <div>
                <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Idea ID</span>
                <code className="text-xs text-gray-300 font-mono select-all bg-background/50 border border-translucent px-2 py-1 rounded block truncate mt-1">
                  {idea.id}
                </code>
              </div>

              <div>
                <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Cryptographic Hash (SHA-256)</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs text-secondary font-mono bg-background/50 border border-translucent px-2 py-1 rounded flex-1 truncate select-all">
                    {idea.idea_hash}
                  </code>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Cardano Ledger Network</span>
                <p className="text-sm font-semibold capitalize text-gray-100 mt-0.5">
                  Cardano Preview Testnet
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Registration Date</span>
                <p className="font-semibold text-gray-100 text-sm md:text-base mt-0.5">
                  {new Date(record.registered_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
                </p>
              </div>

              <div>
                <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Transaction ID</span>
                <code className="text-xs text-gray-300 font-mono select-all bg-background/50 border border-translucent px-2 py-1 rounded block truncate mt-1">
                  {record.transaction_hash}
                </code>
              </div>

              <div>
                <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Script Registry Reference</span>
                <code className="text-xs text-gray-300 font-mono select-all bg-background/50 border border-translucent px-2 py-1 rounded block truncate mt-1">
                  {record.utxo_reference}
                </code>
              </div>

              {/* Block height — only shown when confirmed */}
              {confirmState === 'confirmed' && (blockHeight ?? record.block_height) && (
                <div>
                  <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Block Height</span>
                  <p className="font-mono text-sm text-gray-100 mt-0.5">
                    {(blockHeight ?? record.block_height)?.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Status stamp */}
              <div className="flex items-center justify-between gap-4 pt-1.5">
                <div>
                  <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Validation State</span>
                  <div className="mt-1">
                    <StatusBadge />
                  </div>
                </div>

                {/* QR Code SVG */}
                <div className="bg-white p-2 rounded-lg w-16 h-16 flex items-center justify-center shadow flex-shrink-0">
                  <svg viewBox="0 0 29 29" className="w-12 h-12 text-black" shapeRendering="crispEdges">
                    <path fill="black" d="M0 0h9v9H0zm1 1v7h7V1zm19-1h9v9h-9zm1 1v7h7V1zM0 20h9v9H0zm1 1v7h7V1zm13-17h2v2h-2zm4 2h2v2h-2zm-4 4h4v2h-4zm6-2h2v4h-2zm-6-2h2v2h-2zm3 8h2v2h-2zm-3-3h2v2h-2zm5 5h3v2h-3zm5-5h2v4h-2zm-2 2h2v2h-2zm3 3h2v2h-2zm-5 1h2v3h-2zm2 2h3v1h-3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-translucent pt-6 mt-10 text-center relative z-10 space-y-1">
          <p className="text-[10px] text-gray-500 leading-relaxed max-w-xl mx-auto font-medium">
            <strong>Disclaimer:</strong> This certificate provides timestamped cryptographic evidence that an idea hash was registered on Cardano. It is not a patent, copyright certificate or legal ownership document.
          </p>
          {confirmedAt && (
            <p className="text-[10px] text-gray-600 font-mono">
              Confirmed on-chain: {new Date(confirmedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
            </p>
          )}
        </div>
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 print:hidden">

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-translucent text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition"
        >
          <Printer className="w-4 h-4" />
          Print Certificate
        </button>

        <button
          onClick={() => handleCopy(idea.idea_hash, setCopiedHash)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-translucent text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition"
        >
          {copiedHash ? <ClipboardCheck className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
          {copiedHash ? 'Hash Copied!' : 'Copy SHA-256 Hash'}
        </button>

        {isRealTxHash(record.transaction_hash) && (
          <button
            onClick={() => handleCopy(record.transaction_hash, setCopiedTx)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-translucent text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition"
          >
            {copiedTx ? <ClipboardCheck className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            {copiedTx ? 'Tx ID Copied!' : 'Copy Transaction ID'}
          </button>
        )}

        {isRealTxHash(record.transaction_hash) && (
          <a
            href={`https://preview.cardanoscan.io/transaction/${record.transaction_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-primary/10"
          >
            <Link2 className="w-4 h-4" />
            View on CardanoScan Preview
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        <a
          href={getVerificationUrl()}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-translucent text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition"
        >
          Verify This Certificate
        </a>
      </div>
    </div>
  );
}
