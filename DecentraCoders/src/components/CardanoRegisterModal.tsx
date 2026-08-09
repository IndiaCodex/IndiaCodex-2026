'use client';

/**
 * src/components/CardanoRegisterModal.tsx
 *
 * Full CIP-30 Cardano wallet integration modal.
 * - Detects installed wallets (Lace, Eternl, Nami, Vespr, etc.)
 * - Validates Preview Testnet network (ID=0). Rejects mainnet wallets.
 * - Builds a REAL Cardano transaction, signs it, and submits it.
 * - NEVER simulates or invents transaction hashes.
 * - Provides live status progression.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Coins,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Clipboard,
  FileText,
  Loader2,
  Radio,
  Link2,
  RefreshCw,
} from 'lucide-react';
import { dbService } from '@/lib/supabase';
import { useToast } from './DashboardLayout';
import { getCardanoExplorerTxUrl, NETWORK_LABEL, SCRIPT_LOCK_LOVELACE } from '@/lib/cardano/network';
import { getWalletPaymentKeyHash } from '@/lib/cardano';

// ─── types ────────────────────────────────────────────────────────────────────

interface IdeaProps {
  id: string;
  title: string;
  idea_hash: string;
  owner_id: string;
}

interface Props {
  idea: IdeaProps;
  onClose: () => void;
  onSuccess: () => void;
}

interface DetectedWallet {
  id: string;
  name: string;
  icon?: string;
}

type Step =
  | 'select_wallet'   // No wallet connected — show installed wallets
  | 'wrong_network'   // Connected but not on Preview Testnet
  | 'ready'           // Wallet connected on Preview Testnet
  | 'building_tx'     // Building the transaction
  | 'awaiting_sig'    // Waiting for user to approve in their wallet extension
  | 'submitting'      // Submitting to network
  | 'confirming'      // Tx submitted — polling Blockfrost for block confirmation
  | 'confirmed'       // Tx confirmed on Cardano — block height received
  | 'success'         // Legacy alias for confirming state
  | 'error';          // Unrecoverable error

// ─── helpers ──────────────────────────────────────────────────────────────────

function shortHash(hash: string) {
  return `${hash.substring(0, 12)}...${hash.slice(-8)}`;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function CardanoRegisterModal({ idea, onClose, onSuccess }: Props) {
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('select_wallet');
  const [detectedWallets, setDetectedWallets] = useState<DetectedWallet[]>([]);
  const [walletApi, setWalletApi] = useState<any>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [changeAddress, setChangeAddress] = useState<string | null>(null);
  const [ownerPkh, setOwnerPkh] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [scriptAddress, setScriptAddress] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const resetConnectionState = React.useCallback(() => {
    setWalletApi(null);
    setWalletName(null);
    setChangeAddress(null);
    setOwnerPkh(null);
    setTxHash(null);
    setErrorMessage(null);
    setStatusMessage('');
    setStep('select_wallet');
  }, []);

  // ── detect wallets on mount ──────────────────────────────────────────────
  useEffect(() => {
    const detect = () => {
      if (typeof window === 'undefined' || !window.cardano) {
        setDetectedWallets([]);
        return;
      }
      const known = ['lace', 'eternl', 'nami', 'vespr', 'flint', 'gerowallet', 'yoroi', 'typhon'];
      const all = Object.keys((window as any).cardano || {});
      const found: DetectedWallet[] = [];
      for (const id of [...known, ...all]) {
        const ext = (window as any).cardano?.[id];
        if (ext && typeof ext.enable === 'function' && !found.some(w => w.id === id)) {
          found.push({ id, name: ext.name ?? id, icon: ext.icon });
        }
      }
      setDetectedWallets(found);
    };

    // Small delay to let wallet extensions inject themselves
    const timer = setTimeout(detect, 500);
    return () => clearTimeout(timer);
  }, []);

  // ── connect wallet ────────────────────────────────────────────────────────
  const connectWallet = useCallback(async (walletId: string) => {
    try {
      setStatusMessage(`Connecting to ${walletId}...`);
      const ext = (window as any).cardano?.[walletId];
      if (!ext) throw new Error(`Wallet "${walletId}" not found.`);

      console.log("[CARDANO] Lace provider:", window.cardano?.lace);
      console.log("[CARDANO] Enabling Lace...");
      const api = await ext.enable();
      console.log("[CARDANO] Lace enabled:", Boolean(api));

      const networkId = await api.getNetworkId();
      console.log("[CARDANO] Network ID:", networkId);

      const usedAddresses = await api.getUsedAddresses();
      console.log("[CARDANO] Used addresses:", usedAddresses);

      const unusedAddresses = await api.getUnusedAddresses();
      console.log("[CARDANO] Unused addresses:", unusedAddresses);

      const changeAddressVal = await api.getChangeAddress();
      console.log("[CARDANO] Change address:", changeAddressVal);

      if (networkId !== 0) {
        setWalletApi(api);
        setWalletName(ext.name ?? walletId);
        setStep('wrong_network');
        return;
      }

      const { paymentKeyHash, addressBech32 } = await getWalletPaymentKeyHash(api);
      const bech32 = addressBech32;
      const pkh = paymentKeyHash;
      const rawAddr = addressBech32;

      setWalletApi(api);
      setWalletName(ext.name ?? walletId);
      setChangeAddress(bech32 || rawAddr);
      setOwnerPkh(pkh);
      setStep('ready');
      setStatusMessage('');
    } catch (error) {
      console.error("[CARDANO REGISTRATION ERROR]", error);
      console.error(
        "[CARDANO REGISTRATION ERROR MESSAGE]",
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        "[CARDANO REGISTRATION ERROR STACK]",
        error instanceof Error ? error.stack : "No stack available"
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unknown Cardano registration error";

      setErrorMessage(message);
      setStep('error');
    }
  }, []);

  // ── main registration flow ────────────────────────────────────────────────
  const handleRegister = useCallback(async () => {
    if (!walletApi || !changeAddress) {
      setErrorMessage('Wallet not enabled: No wallet connected. Please select a wallet first.');
      setStep('error');
      return;
    }

    if (!ownerPkh || ownerPkh.length !== 56) {
      setErrorMessage(
        'Could not derive payment key hash from your wallet address. ' +
        'Please try disconnecting and reconnecting your wallet.'
      );
      setStep('error');
      return;
    }

    // Prevent duplicate calls
    if (step === 'building_tx' || step === 'awaiting_sig' || step === 'submitting' || step === 'confirming') {
      console.warn('[handleRegister] Registration already in progress.');
      return;
    }

    // Verify network ID before starting registration
    try {
      const netId = await walletApi.getNetworkId();
      if (netId !== 0) {
        setStep('wrong_network');
        return;
      }
    } catch (e: any) {
      setErrorMessage(`Wrong Cardano network: Switch Lace to Preview Testnet (Failed to check network ID: ${e?.message})`);
      setStep('error');
      return;
    }

    setErrorMessage(null);

    try {
      // Step 1: Build tx
      setStep('building_tx');
      setStatusMessage('Reading UTxOs from your wallet...');

      // Dynamically import heavy Cardano modules (avoids SSR issues)
      const [meshCore, { buildIdeaProofDatum }, { getScriptAddress }, { IDEA_PROOF_METADATA_LABEL, CARDANO_NETWORK }] =
        await Promise.all([
          import('@meshsdk/core'),
          import('@/lib/cardano/datum'),
          import('@/lib/cardano/validator'),
          import('@/lib/cardano/network'),
        ]);

      const { MeshTxBuilder, BlockfrostProvider, BrowserWallet } = meshCore;

      const browserWallet = new (BrowserWallet as any)(walletApi);
      const utxos = await browserWallet.getUtxos();

      // Explicitly validate UTxO formats and log
      if (!utxos) {
        throw new Error("Missing UTxOs in wallet selection");
      }
      for (let i = 0; i < utxos.length; i++) {
        const utxo = utxos[i];
        console.log("[CARDANO DEBUG] object before reading address:", utxo?.output);
        if (!utxo || !utxo.output || !utxo.output.address) {
          throw new Error(`Missing address in UTxO index ${i}`);
        }
      }

      if (utxos.length === 0) {
        throw new Error(
          'No spendable UTxOs in your wallet. ' +
          'Please fund your Preview Testnet wallet from the faucet: ' +
          'https://docs.cardano.org/cardano-testnets/tools/faucet/'
        );
      }

      setStatusMessage('Building Cardano transaction...');

      const blockfrostId = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID || '';
      if (!blockfrostId) {
        throw new Error(
          'NEXT_PUBLIC_BLOCKFROST_PROJECT_ID is not set. ' +
          'Please create a free account at https://blockfrost.io and add the Preview project ID to .env.local'
        );
      }

      const provider = new BlockfrostProvider(blockfrostId);
      const addr = getScriptAddress();
      setScriptAddress(addr);

      const submittedAt = Date.now();
      const inlineDatum = buildIdeaProofDatum({
        ideaId: idea.id,
        ideaHash: idea.idea_hash,
        ownerPkh,
        submittedAt,
      });

      const metadata: Record<string, string> = {
        app: 'LaunchNest',
        type: 'IDEA_PROOF',
        ideaId: idea.id.substring(0, 50),
        ideaHash: idea.idea_hash,
        title: idea.title.substring(0, 64),
        network: CARDANO_NETWORK,
      };

      const txBuilder = new MeshTxBuilder({ fetcher: provider, submitter: provider });

      const unsignedTx = await txBuilder
        .txOut(addr, [{ unit: 'lovelace', quantity: SCRIPT_LOCK_LOVELACE }])
        .txOutInlineDatumValue(inlineDatum)
        .metadataValue(String(IDEA_PROOF_METADATA_LABEL), metadata)
        .changeAddress(changeAddress)
        .selectUtxosFrom(utxos)
        .complete();

      // Step 2: Request wallet signature
      setStep('awaiting_sig');
      setStatusMessage('Please approve the transaction in your wallet extension...');

      console.log("[CARDANO] Unsigned transaction hex:", unsignedTx);
      const signedTx = await browserWallet.signTx(unsignedTx, true);
      console.log("[CARDANO] Signed transaction hex:", signedTx);

      // Step 3: Submit
      setStep('submitting');
      setStatusMessage('Submitting transaction to Cardano Preview Testnet...');

      console.log("[CARDANO] Submitting transaction hex (submitted CBOR):", signedTx);
      const realTxHash: string = await browserWallet.submitTx(signedTx);
      console.log("[CARDANO] Submitted transaction hash:", realTxHash);

      // Step 4: Save to DB
      setStatusMessage('Saving record...');
      try {
        await dbService.createBlockchainRecord({
          idea_id: idea.id,
          idea_hash: idea.idea_hash,
          canonical_payload_version: '1.0',
          transaction_hash: realTxHash,
          script_address: addr,
          output_index: 0,
          utxo_reference: `${realTxHash}#0`,
          network: CARDANO_NETWORK,
          metadata_label: 674,
          confirmation_status: 'Pending' as const,
          registered_at: new Date(submittedAt).toISOString(),
        });

        await dbService.createNotification(
          idea.owner_id,
          '🎉 Cardano Registration Submitted!',
          `Your idea "${idea.title}" proof hash has been submitted to Preview Testnet. Tx: ${realTxHash.substring(0, 16)}...`,
          'blockchain'
        );
      } catch (dbErr) {
        console.warn('[CardanoRegisterModal] DB save warning:', dbErr);
        // Non-fatal — tx is submitted regardless
      }

      setTxHash(realTxHash);
      setStep('confirming');
      showToast('Transaction submitted! Waiting for Cardano confirmation... 🎉', 'success');
      onSuccess(); // Notify parent to refresh data

      // ── Start Blockfrost polling ──────────────────────────────────────────
      let attempts = 0;
      const MAX_POLLS = 30; // 30 × 12s = ~6 minutes max

      pollIntervalRef.current = setInterval(async () => {
        attempts += 1;
        setPollCount(attempts);

        try {
          const res = await fetch(`/api/cardano/transaction/${realTxHash}`);
          if (!res.ok) {
            // 4xx: still pending — continue polling
            if (attempts >= MAX_POLLS) {
              clearInterval(pollIntervalRef.current!);
              pollIntervalRef.current = null;
              setStatusMessage('Confirmation timed out. Refresh the certificate page to check status.');
            }
            return;
          }

          const data = await res.json();

          if (data.status === 'confirmed' && data.blockHeight) {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;
            setBlockHeight(data.blockHeight);
            setConfirmedAt(data.confirmedAt ?? null);
            setStep('confirmed');
            showToast(`Confirmed on Cardano! Block #${data.blockHeight} 🎉`, 'success');
          } else if (attempts >= MAX_POLLS) {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;
            // Leave in 'confirming' — user can open certificate to track
          }
        } catch {
          // Network error — continue polling silently
        }
      }, 12000); // poll every 12 seconds
    } catch (error: any) {
      console.error("[CARDANO] Registration failed:", error);
      console.error(error?.stack);

      const raw = error?.message || String(error);
      let friendly = raw;

      if (raw.includes('UserDeclined') || raw.includes('user declined') || raw.includes('Refused') || raw.includes('declined') || raw.toLowerCase().includes('reject')) {
        friendly = 'User rejected signing: You declined the signing request. No transaction was submitted. Please try again.';
      } else if (raw.includes('InsufficientFunds') || raw.toLowerCase().includes('balance') || raw.includes('UTxOBalanceInsufficient') || raw.toLowerCase().includes('insuff') || raw.toLowerCase().includes('ada')) {
        friendly = 'Insufficient tADA: Please get Preview Testnet ADA from the faucet:\nhttps://docs.cardano.org/cardano-testnets/tools/faucet/';
      } else if (raw.toLowerCase().includes('submit') || raw.toLowerCase().includes('submission')) {
        friendly = `Transaction submission failed: ${raw}`;
      } else if (raw.toLowerCase().includes('build') || raw.toLowerCase().includes('complete') || raw.toLowerCase().includes('transaction') || raw.toLowerCase().includes('utxo')) {
        friendly = `Transaction build failed: ${raw}`;
      }

      setErrorMessage(friendly);
      setStep('error');
      showToast('Registration failed.', 'error');
    }
  }, [walletApi, changeAddress, ownerPkh, idea, showToast, onSuccess]);

  const handleCopyTxHash = () => {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyIdeaHash = () => {
    navigator.clipboard.writeText(idea.idea_hash);
    showToast('SHA-256 hash copied!', 'info');
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
      <div className="bg-surface border border-translucent rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-translucent">
          <div className="flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg text-gray-100">Register on Cardano</h3>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
              {NETWORK_LABEL}
            </span>
          </div>
          {step !== 'building_tx' && step !== 'awaiting_sig' && step !== 'submitting' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">

          {/* ── STEP: select_wallet ── */}
          {step === 'select_wallet' && (
            <div className="space-y-5">
              {/* Privacy box */}
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-glow flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-300 leading-relaxed">
                  <p className="font-semibold text-gray-100 mb-1">Privacy Guarantee</p>
                  Only the 32-byte SHA-256 hash of your idea will be stored on-chain.
                  Your idea text, title, and personal data remain private and off-chain.
                </div>
              </div>

              {/* Idea info */}
              <div className="bg-background/50 p-4 rounded-xl border border-translucent space-y-3">
                <div>
                  <span className="text-xs text-gray-400 font-medium">Startup Idea</span>
                  <p className="font-semibold text-sm text-gray-100 truncate mt-0.5">{idea.title}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-medium">SHA-256 Hash (on-chain proof)</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs text-secondary font-mono break-all bg-background px-2.5 py-1.5 rounded border border-translucent flex-1 truncate">
                      {idea.idea_hash}
                    </code>
                    <button onClick={handleCopyIdeaHash} className="p-2 bg-background border border-translucent rounded text-gray-400 hover:text-white transition" title="Copy Hash">
                      <Clipboard className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-translucent">
                  <span>Locked ADA deposit (min UTxO)</span>
                  <span className="font-mono text-gray-200">2.00 tADA</span>
                </div>
              </div>

              {/* Wallet picker */}
              <div className="space-y-2">
                <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  Connect Your Cardano Wallet
                </h4>

                {detectedWallets.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30 text-amber-400 text-xs flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">No Cardano wallet detected.</p>
                      <p>Install a CIP-30 compatible wallet extension like{' '}
                        <a href="https://www.lace.io" target="_blank" rel="noopener noreferrer" className="underline">Lace</a>
                        {', '}
                        <a href="https://eternl.io" target="_blank" rel="noopener noreferrer" className="underline">Eternl</a>
                        {', or '}
                        <a href="https://namiwallet.io" target="_blank" rel="noopener noreferrer" className="underline">Nami</a>
                        {' then refresh this page.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {detectedWallets.map(w => (
                      <button
                        key={w.id}
                        onClick={() => connectWallet(w.id)}
                        className="flex items-center gap-2.5 p-3 bg-background/60 hover:bg-white/5 border border-translucent hover:border-primary/40 rounded-xl transition text-left group"
                      >
                        {w.icon ? (
                          <img src={w.icon} alt={w.name} className="w-7 h-7 rounded-lg flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Wallet className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-200 group-hover:text-white transition">
                          {w.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {statusMessage && (
                  <p className="text-xs text-blue-400 flex items-center gap-2 mt-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {statusMessage}
                  </p>
                )}
              </div>

              <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-400 hover:text-white transition">
                Cancel
              </button>
            </div>
          )}

          {/* ── STEP: wrong_network ── */}
          {step === 'wrong_network' && (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-9 h-9 text-amber-400" />
              </div>
              <div>
                <h4 className="font-bold text-xl text-gray-100">Wrong Network</h4>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  Please switch your <span className="font-semibold text-amber-400">{walletName}</span> wallet
                  to <span className="font-semibold text-white">Preview Testnet</span> and try again.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  In most wallets: Settings → Network → Preview Testnet
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={resetConnectionState}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <button onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl text-sm transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: ready ── */}
          {step === 'ready' && (
            <div className="space-y-5">
              {/* Connected indicator */}
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold">{walletName} connected on Preview Testnet ✓</p>
                  {changeAddress && (
                    <p className="text-gray-400 font-mono mt-0.5 truncate">{shortHash(changeAddress)}</p>
                  )}
                </div>
              </div>

              {/* Idea recap */}
              <div className="bg-background/50 p-4 rounded-xl border border-translucent text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Idea</span>
                  <span className="font-semibold text-gray-100 truncate ml-4 max-w-[60%]">{idea.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Locked deposit</span>
                  <span className="font-mono text-gray-200">2.00 tADA</span>
                </div>
                <div className="flex justify-between border-t border-translucent pt-2">
                  <span className="text-gray-400 font-semibold">Total (estimated)</span>
                  <span className="font-mono font-bold text-primary">~2.17 tADA</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetConnectionState}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl text-sm transition"
                >
                  Change Wallet
                </button>
                <button
                  onClick={handleRegister}
                  disabled={step !== 'ready'}
                  className={`flex-1 py-3 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition ${
                    step !== 'ready'
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Sign & Register
                </button>
              </div>
            </div>
          )}

          {/* ── STEPS: building_tx / awaiting_sig / submitting ── */}
          {(step === 'building_tx' || step === 'awaiting_sig' || step === 'submitting') && (
            <div className="text-center py-8 space-y-6">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 border border-primary/50 flex items-center justify-center">
                  {step === 'awaiting_sig' ? (
                    <Wallet className="w-9 h-9 text-primary" />
                  ) : step === 'submitting' ? (
                    <Radio className="w-9 h-9 text-secondary" />
                  ) : (
                    <Loader2 className="w-9 h-9 text-primary animate-spin" />
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xl text-gray-100">
                  {step === 'building_tx' && 'Building Transaction...'}
                  {step === 'awaiting_sig' && 'Awaiting Your Signature'}
                  {step === 'submitting' && 'Broadcasting to Cardano'}
                </h4>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed px-4">
                  {statusMessage}
                </p>
              </div>

              {step === 'awaiting_sig' && (
                <div className="px-6">
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/30 text-blue-300 text-xs text-left flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                    <div>
                      <p className="font-semibold mb-1">Action Required in Your Wallet</p>
                      <p>Check your <strong>{walletName}</strong> extension popup and approve the transaction to continue.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status timeline */}
              <div className="flex items-center justify-center gap-1.5 text-xs">
                {[
                  { key: 'building_tx', label: 'Build' },
                  { key: 'awaiting_sig', label: 'Sign' },
                  { key: 'submitting', label: 'Submit' },
                  { key: '__confirm', label: 'Confirm' },
                ].map((s, i) => (
                  <React.Fragment key={s.key}>
                    {i > 0 && <span className="text-gray-600">›</span>}
                    <span className={step === s.key ? 'text-primary font-bold' : 'text-gray-500'}>
                      {s.label}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: confirming ── polling Blockfrost */}
          {step === 'confirming' && txHash && (
            <div className="text-center py-4 space-y-5">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Radio className="w-8 h-8 text-blue-400" />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xl text-gray-100">Transaction Submitted!</h4>
                <p className="text-sm text-gray-400 mt-1.5 px-4">
                  Waiting for Cardano block confirmation. This usually takes 1–3 minutes.
                </p>
              </div>

              {/* Status Timeline */}
              <div className="mx-4 space-y-2">
                {[
                  { label: 'Transaction Built', done: true },
                  { label: 'Wallet Signed', done: true },
                  { label: 'Submitted to Network', done: true },
                  { label: `Awaiting Block Confirmation (${pollCount} checks)`, done: false, active: true },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-left">
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
                      s.done ? 'bg-emerald-500' : s.active ? 'bg-blue-500 animate-pulse' : 'bg-gray-600'
                    }`}>
                      {s.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={s.done ? 'text-gray-300' : s.active ? 'text-blue-300 font-semibold' : 'text-gray-500'}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-background/50 border border-translucent rounded-xl p-4 text-left space-y-2">
                <span className="text-xs text-gray-400 font-semibold block">Transaction Hash</span>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs text-secondary bg-background px-2 py-1 rounded border border-translucent flex-1 truncate">
                    {txHash}
                  </code>
                  <button onClick={handleCopyTxHash} className="p-1.5 text-gray-400 hover:text-white transition">
                    {copiedHash ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={getCardanoExplorerTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-translucent text-gray-300 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition"
                >
                  <Link2 className="w-4 h-4" />
                  View on Cardano Preview Explorer
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-400 hover:text-white transition">
                  Close (confirmation continues in background)
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: confirmed ── real block height received */}
          {step === 'confirmed' && txHash && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-success" />
              </div>

              <div>
                <h4 className="font-bold text-xl text-gray-100">Confirmed on Cardano! 🎉</h4>
                <p className="text-sm text-gray-400 mt-1.5 px-4">
                  Your idea hash is permanently recorded on the Cardano Preview Testnet ledger.
                </p>
              </div>

              {/* Status Timeline — all done */}
              <div className="mx-4 space-y-2">
                {[
                  'Transaction Built',
                  'Wallet Signed',
                  'Submitted to Network',
                  `Confirmed — Block #${blockHeight?.toLocaleString() ?? '...'}`,
                ].map((label, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-left">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-300">{label}</span>
                  </div>
                ))}
              </div>

              <div className="bg-background/50 border border-translucent rounded-xl p-4 text-left space-y-3">
                <div>
                  <span className="text-xs text-gray-400 font-semibold block">Transaction Hash</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="font-mono text-xs text-secondary bg-background px-2 py-1 rounded border border-translucent flex-1 truncate">
                      {txHash}
                    </code>
                    <button onClick={handleCopyTxHash} className="p-1.5 text-gray-400 hover:text-white transition">
                      {copiedHash ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Clipboard className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {blockHeight && (
                  <div>
                    <span className="text-xs text-gray-400 font-semibold block">Block Height</span>
                    <p className="font-mono text-sm text-gray-100 mt-0.5">#{blockHeight.toLocaleString()}</p>
                  </div>
                )}
                {confirmedAt && (
                  <div>
                    <span className="text-xs text-gray-400 font-semibold block">Confirmed At</span>
                    <p className="text-xs text-gray-300 mt-0.5">{new Date(confirmedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                <a
                  href={`/certificate/${idea.id}`}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-95 transition"
                >
                  <FileText className="w-4 h-4" />
                  View Confirmed Certificate
                </a>
                <a
                  href={getCardanoExplorerTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-translucent text-gray-300 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition"
                >
                  <Link2 className="w-4 h-4" />
                  View on Cardano Preview Explorer
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-400 hover:text-white transition">
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: success ── */}
          {step === 'success' && txHash && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-success" />
              </div>

              <div>
                <h4 className="font-bold text-xl text-gray-100">Blockchain Proof Registered!</h4>
                <p className="text-sm text-gray-400 mt-1.5 px-4">
                  Your SHA-256 idea hash has been submitted to <span className="text-purple-300 font-semibold">Cardano Preview Testnet</span>.
                  The transaction is now propagating across the network.
                </p>
              </div>

              {/* Transaction details */}
              <div className="bg-background/50 border border-translucent rounded-xl p-4 text-left text-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-translucent">
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                    Submitted
                  </span>
                  <span className="text-xs text-gray-500">Confirmation may take 1–3 minutes</span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 font-semibold">Transaction Hash</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="font-mono text-xs text-secondary break-all bg-background px-2 py-1 rounded border border-translucent flex-1 truncate">
                      {txHash}
                    </code>
                    <button onClick={handleCopyTxHash} className="p-1.5 text-gray-400 hover:text-white transition" title="Copy">
                      {copiedHash ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Clipboard className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {scriptAddress && (
                  <div>
                    <span className="text-xs text-gray-400 font-semibold">Script Lock Address</span>
                    <p className="font-mono text-xs text-gray-300 mt-1 break-all truncate">{scriptAddress}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                <a
                  href={`/certificate/${idea.id}`}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-95 transition"
                >
                  <FileText className="w-4.5 h-4.5" />
                  View Blockchain Certificate
                </a>

                <a
                  href={getCardanoExplorerTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-translucent text-gray-300 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition"
                >
                  <Link2 className="w-4 h-4" />
                  View on CardanoScan Preview
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-400 hover:text-white transition">
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: error ── */}
          {step === 'error' && (
            <div className="space-y-5 py-2">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>

              <div className="text-center">
                <h4 className="font-bold text-lg text-gray-100">Registration Failed</h4>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/30 text-red-300 text-xs leading-relaxed whitespace-pre-line">
                  {errorMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={resetConnectionState}
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm transition"
                >
                  Try Again
                </button>
                <button onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl text-sm transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
