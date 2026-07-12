/**
 * Doctor Credential NFT Page
 * Mint an on-chain verifiable credential as a Cardano NFT (CIP-25)
 * Proves doctor identity, specialization, and hospital affiliation
 * without exposing private medical data.
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  mintDoctorCredentialNFT,
  getMediChainNFTs,
  getConnectedMeshWallet,
  getConnectedAddress,
  CARDANOSCAN_BASE,
} from '../../services/cardano';
import {
  ShieldCheck, Award, ExternalLink, Loader2, CheckCircle2,
  Wallet, AlertTriangle, Copy, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';

export default function DoctorCredentialPage() {
  const { user } = useAuth();
  const [minting, setMinting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    doctorName: user?.name || '',
    specialization: '',
    licenseNumber: '',
    hospital: 'Apollo MediChain Hospital, Hyderabad',
  });

  const walletAddress = getConnectedAddress();
  const meshWallet = getConnectedMeshWallet();

  // Load existing credential NFTs from wallet
  const { data: existingNFTs, refetch: refetchNFTs, isFetching } = useQuery({
    queryKey: ['doctor-credential-nfts', walletAddress],
    queryFn: () => getMediChainNFTs(walletAddress),
    enabled: !!walletAddress,
  });

  const credentialNFTs = (existingNFTs || []).filter(nft =>
    nft.assetName?.includes('MCCRED') || nft.metadata?.type === 'DOCTOR_CREDENTIAL'
  );

  const handleMint = async () => {
    if (!form.specialization) { toast.error('Enter your specialization'); return; }
    if (!form.licenseNumber) { toast.error('Enter your license number'); return; }

    if (!meshWallet) {
      toast.error('Connect a Cardano wallet first (use the Wallet Connect button on Login page)');
      return;
    }

    setMinting(true);
    try {
      const res = await mintDoctorCredentialNFT({
        doctorName: form.doctorName || `Dr. ${user?.id}`,
        doctorId: user?.id,
        specialization: form.specialization,
        licenseNumber: form.licenseNumber,
        hospital: form.hospital,
      });
      setResult(res);
      if (res.real) {
        toast.success('✅ Doctor Credential NFT minted on Cardano!');
        refetchNFTs();
      } else {
        toast('Demo mode — connect wallet + get test ADA from faucet', { icon: '⚠️' });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMinting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-green-900/50 rounded-xl">
          <ShieldCheck className="w-7 h-7 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Doctor Credential NFT</h1>
          <p className="text-slate-400 mt-1">
            Mint a verifiable on-chain credential as a Cardano NFT (CIP-25).
            Proves your identity and qualifications without revealing private data.
          </p>
        </div>
      </div>

      {/* Track badges */}
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-900/30 text-blue-300 border border-blue-700 rounded-full text-xs">
          🔷 Track 1: Cardano Preprod
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-900/30 text-green-300 border border-green-700 rounded-full text-xs">
          CIP-25 NFT Standard
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-900/30 text-purple-300 border border-purple-700 rounded-full text-xs">
          MeshJS BrowserWallet
        </span>
      </div>

      {/* Wallet status */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
        meshWallet
          ? 'bg-green-900/20 border-green-700'
          : 'bg-yellow-900/20 border-yellow-700'
      }`}>
        <Wallet className={`w-5 h-5 ${meshWallet ? 'text-green-400' : 'text-yellow-400'}`} />
        {meshWallet ? (
          <div>
            <p className="text-green-300 text-sm font-medium">Wallet Connected</p>
            <p className="text-green-400/60 font-mono text-xs truncate max-w-xs">{walletAddress}</p>
          </div>
        ) : (
          <div>
            <p className="text-yellow-300 text-sm font-medium">No Wallet Connected</p>
            <p className="text-yellow-400/60 text-xs">
              Go to Login and connect Lace / Eternl / Nami to mint real NFTs
            </p>
          </div>
        )}
        {walletAddress && (
          <a
            href={`${CARDANOSCAN_BASE}/address/${walletAddress}`}
            target="_blank" rel="noreferrer"
            className="ml-auto text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 flex-shrink-0"
          >
            CardanoScan <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Mint form */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          Credential Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="doctorName" className="block text-slate-400 text-xs mb-1.5">Doctor Name</label>
            <input
              id="doctorName"
              value={form.doctorName}
              onChange={e => setForm(f => ({ ...f, doctorName: e.target.value }))}
              placeholder="Dr. Rajesh Kumar"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label htmlFor="specialization" className="block text-slate-400 text-xs mb-1.5">Specialization *</label>
            <select
              id="specialization"
              value={form.specialization}
              onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            >
              <option value="">Select specialization</option>
              {['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Pediatrics',
                'Psychiatry', 'Radiology', 'General Medicine', 'Surgery', 'Dermatology',
                'Ophthalmology', 'ENT', 'Gynecology'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="licenseNumber" className="block text-slate-400 text-xs mb-1.5">Medical License Number *</label>
            <input
              id="licenseNumber"
              value={form.licenseNumber}
              onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))}
              placeholder="MCI-AP-2019-45678"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label htmlFor="hospital" className="block text-slate-400 text-xs mb-1.5">Hospital / Institution</label>
            <input
              id="hospital"
              value={form.hospital}
              onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))}
              placeholder="Apollo MediChain Hospital"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        {/* What gets stored on-chain */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-xs font-medium mb-2">📦 On-chain NFT metadata (CIP-25):</p>
          <pre className="text-green-300 text-xs overflow-x-auto whitespace-pre-wrap">
{JSON.stringify({
  name: 'MediChain Doctor Credential',
  doctor: form.doctorName || 'Dr. Name',
  specialization: form.specialization || 'Specialization',
  licenseNumber: form.licenseNumber || 'LICENSE-NO',
  hospital: form.hospital,
  verifiedAt: new Date().toISOString(),
  type: 'DOCTOR_CREDENTIAL',
  platform: 'MediChain AI',
  standard: 'CIP-25',
}, null, 2)}
          </pre>
        </div>

        <button
          onClick={handleMint}
          disabled={minting}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {minting
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Minting on Cardano...</>
            : <><Award className="w-5 h-5" /> Mint Credential NFT on Cardano</>
          }
        </button>

        {!meshWallet && (
          <p className="text-center text-yellow-400/70 text-xs">
            ⚠️ No wallet detected — will mint in demo mode.{' '}
            <a href="https://docs.cardano.org/cardano-testnets/tools/faucet/" target="_blank" rel="noreferrer" className="text-blue-400 underline">
              Get test ADA
            </a>
          </p>
        )}
      </div>

      {/* Mint result */}
      {result && (
        <div className={`rounded-2xl p-5 border ${
          result.real
            ? 'bg-green-900/20 border-green-700'
            : 'bg-yellow-900/20 border-yellow-700'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {result.real
              ? <CheckCircle2 className="w-5 h-5 text-green-400" />
              : <AlertTriangle className="w-5 h-5 text-yellow-400" />
            }
            <span className={`font-semibold ${result.real ? 'text-green-300' : 'text-yellow-300'}`}>
              {result.real ? 'NFT Minted on Cardano!' : 'Demo Mode'}
            </span>
            {result.real && (
              <span className="ml-auto text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full border border-green-700">
                REAL TX
              </span>
            )}
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 w-20 flex-shrink-0">TX Hash:</span>
              <span className="text-white truncate flex-1">{result.txHash}</span>
              <button onClick={() => copyToClipboard(result.txHash)} className="text-slate-400 hover:text-white flex-shrink-0">
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {result.policyId && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-20 flex-shrink-0">Policy ID:</span>
                <span className="text-blue-300 truncate flex-1">{result.policyId}</span>
              </div>
            )}
            {result.assetName && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-20 flex-shrink-0">Asset:</span>
                <span className="text-purple-300">{result.assetName}</span>
              </div>
            )}
          </div>

          <a
            href={result.cardanoScanUrl}
            target="_blank" rel="noreferrer"
            className="mt-3 flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            View on CardanoScan
          </a>

          {result.message && (
            <p className="mt-2 text-slate-400 text-xs">{result.message}</p>
          )}
        </div>
      )}

      {/* Existing credentials */}
      {walletAddress && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              Your On-Chain Credentials
            </h3>
            <button
              onClick={refetchNFTs}
              disabled={isFetching}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {credentialNFTs.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">
              No credential NFTs found yet. Mint one above!
            </p>
          ) : (
            <div className="space-y-3">
              {credentialNFTs.map((nft, i) => (
                <div key={nft.unit || i} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{nft.assetName}</p>
                    <p className="text-slate-400 text-xs font-mono mt-0.5 truncate max-w-xs">{nft.unit}</p>
                  </div>
                  <a
                    href={nft.cardanoScanUrl}
                    target="_blank" rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs flex-shrink-0"
                  >
                    CardanoScan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
