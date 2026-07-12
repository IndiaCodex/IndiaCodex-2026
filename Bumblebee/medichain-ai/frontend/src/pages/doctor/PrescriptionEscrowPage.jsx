/**
 * Prescription Escrow Page — Real Aiken Smart Contract on Cardano
 * Doctor locks ADA → Patient signs to collect → Pharmacist dispenses
 * Contract compiled with Aiken v1.1.23 (Cardano maintainer pick)
 */
import { useState, useEffect } from 'react';
import {
  Lock, Unlock, ExternalLink, CheckCircle2, Loader2,
  Code2, ShieldCheck, FileText, Wallet, Info
} from 'lucide-react';
import {
  getContractInfo,
  lockPrescriptionEscrow,
  ESCROW_SCRIPT_HASH,
  NFT_POLICY_ID,
  getPrescriptionEscrowAddress,
} from '../../services/aikenContracts';
import { getConnectedWallet, CARDANOSCAN_BASE } from '../../services/cardano';
import toast from 'react-hot-toast';

export default function PrescriptionEscrowPage() {
  const [contractInfo] = useState(getContractInfo());
  const [locking, setLocking] = useState(false);
  const [result, setResult] = useState(null);
  const [scriptAddress, setScriptAddress] = useState(null);

  const [form, setForm] = useState({
    patientPkh: '',
    prescriptionId: `RX${Date.now().toString(36).toUpperCase()}`,
    prescriptionHash: '',
    adaAmount: '2',
  });

  useEffect(() => {
    const addr = getPrescriptionEscrowAddress();
    setScriptAddress(addr);
  }, []);

  const handleLock = async () => {
    if (!form.patientPkh) {
      toast.error('Enter patient public key hash');
      return;
    }
    setLocking(true);
    try {
      const wallet = getConnectedWallet();
      const res = await lockPrescriptionEscrow({
        wallet,
        patientPkh: form.patientPkh,
        doctorPkh: form.patientPkh, // demo: same for simplicity
        pharmacistPkh: form.patientPkh,
        prescriptionHash: form.prescriptionHash || `sha256:${Date.now().toString(16)}`,
        prescriptionId: form.prescriptionId,
        adaAmount: String(parseFloat(form.adaAmount) * 1_000_000),
      });
      setResult(res);
      if (res.real) {
        toast.success('Prescription locked on Cardano!');
      } else {
        toast('Demo mode — connect wallet for real contract', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-blue-900/50 rounded-xl">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          Prescription Escrow
        </h1>
        <p className="text-slate-400 mt-1">
          Real Aiken smart contract on Cardano Preprod — trustless prescription dispensing
        </p>
      </div>

      {/* Contract Info */}
      <div className="bg-slate-800/50 border border-blue-900/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Deployed Smart Contract</h3>
          <span className="text-xs bg-green-900/50 text-green-400 border border-green-700 px-2 py-0.5 rounded-full">
            Compiled ✓
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <InfoRow label="Language" value="Aiken v1.1.23" link="https://aiken-lang.org" />
          <InfoRow label="Plutus Version" value="V3 (latest)" />
          <InfoRow
            label="Script Hash"
            value={ESCROW_SCRIPT_HASH}
            link={`${CARDANOSCAN_BASE}/address/${scriptAddress}`}
            truncate
          />
          <InfoRow
            label="Script Address"
            value={scriptAddress || 'Calculating...'}
            link={scriptAddress ? `${CARDANOSCAN_BASE}/address/${scriptAddress}` : null}
            truncate
          />
          <InfoRow
            label="NFT Policy ID"
            value={NFT_POLICY_ID}
            link={`${CARDANOSCAN_BASE}/tokenPolicy/${NFT_POLICY_ID}`}
            truncate
          />
          <InfoRow label="Network" value="Cardano Preprod Testnet" />
          <InfoRow
            label="Tool Used"
            value="Aiken (developers.cardano.org/tools/aiken)"
            link="https://developers.cardano.org/tools/aiken/"
          />
        </div>
      </div>

      {/* How It Works */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { step: '1', icon: '👨‍⚕️', title: 'Doctor Issues', desc: 'Locks 2 ADA in contract with prescription datum on-chain', color: 'blue' },
          { step: '2', icon: '💊', title: 'Pharmacist Prepares', desc: 'Sees locked prescription on Cardano, prepares medicine', color: 'purple' },
          { step: '3', icon: '🧑‍💼', title: 'Patient Collects', desc: 'Signs transaction to release ADA and collect prescription', color: 'green' },
        ].map(s => (
          <div key={s.step} className={`p-4 bg-${s.color}-900/20 border border-${s.color}-900/40 rounded-xl`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-xs text-${s.color}-400 font-bold mb-1`}>STEP {s.step}</div>
            <p className="text-white text-sm font-semibold">{s.title}</p>
            <p className="text-slate-400 text-xs mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Lock Form */}
      {!result ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" />
            Lock Prescription in Escrow
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Prescription ID</label>
              <input
                value={form.prescriptionId}
                onChange={e => setForm(f => ({ ...f, prescriptionId: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">
                Patient Public Key Hash (hex) — from their Cardano address
              </label>
              <input
                value={form.patientPkh}
                onChange={e => setForm(f => ({ ...f, patientPkh: e.target.value }))}
                placeholder="e.g. a1b2c3d4e5f6..."
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm font-mono focus:border-blue-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">ADA Bond Amount</label>
              <div className="flex items-center gap-2">
                <input
                  value={form.adaAmount}
                  onChange={e => setForm(f => ({ ...f, adaAmount: e.target.value }))}
                  type="number"
                  min="2"
                  className="w-32 bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                />
                <span className="text-slate-400 text-sm">₳ (min 2 ADA required by Cardano protocol)</span>
              </div>
            </div>

            <button
              onClick={handleLock}
              disabled={locking}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
            >
              {locking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              {locking ? 'Locking on Cardano...' : 'Lock Prescription in Aiken Escrow'}
            </button>

            <p className="text-slate-500 text-xs text-center">
              Requires Lace/Eternl wallet with test ADA •{' '}
              <a href="https://docs.cardano.org/cardano-testnets/tools/faucet/" target="_blank" rel="noreferrer" className="text-blue-400">
                Get test ADA
              </a>
            </p>
          </div>
        </div>
      ) : (
        /* Result */
        <div className="bg-green-900/20 border border-green-700 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <h3 className="text-green-300 font-semibold text-lg">
              {result.real ? 'Prescription Locked on Cardano!' : 'Demo: Escrow Simulated'}
            </h3>
            {!result.real && (
              <span className="text-xs bg-yellow-900/50 text-yellow-400 border border-yellow-700 px-2 py-0.5 rounded-full">
                Demo Mode
              </span>
            )}
          </div>

          <div className="space-y-2 font-mono text-xs mb-4">
            <InfoRow label="Tx Hash" value={result.txHash} truncate />
            <InfoRow label="Action" value={result.action} />
            <InfoRow label="Script Hash" value={ESCROW_SCRIPT_HASH} truncate />
          </div>

          <div className="flex gap-3">
            <a
              href={result.cardanoScanUrl}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on CardanoScan {result.real ? '' : '(Demo)'}
            </a>
            <button
              onClick={() => setResult(null)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors"
            >
              New Prescription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, link, truncate }) {
  const display = truncate && value?.length > 40 ? value.slice(0, 40) + '...' : value;
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-500 w-28 flex-shrink-0">{label}:</span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer"
          className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
          {display} <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      ) : (
        <span className="text-white">{display}</span>
      )}
    </div>
  );
}
