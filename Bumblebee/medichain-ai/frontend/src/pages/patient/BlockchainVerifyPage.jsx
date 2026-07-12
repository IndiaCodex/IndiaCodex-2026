/**
 * Blockchain Verify Page — Patient can verify any record/tx on Cardano
 * Checks Blockfrost API + links to CardanoScan for independent verification
 */
import { useState } from 'react';
import {
  verifyMedicalRecordNFT,
  getTransactionDetails,
  getMediChainNFTs,
  getConnectedAddress,
} from '../../services/cardano';
import {
  Search, ShieldCheck, ShieldX, ExternalLink, Loader2,
  FileText, Wallet, Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';

export default function BlockchainVerifyPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('tx'); // 'tx' | 'nft'
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  const walletAddress = getConnectedAddress();
  const { data: myNFTs } = useQuery({
    queryKey: ['my-nfts', walletAddress],
    queryFn: () => getMediChainNFTs(walletAddress),
    enabled: !!walletAddress,
  });

  const handleVerify = async () => {
    if (!input.trim()) { toast.error('Enter a TX hash or NFT unit'); return; }
    setVerifying(true);
    setResult(null);
    try {
      const data = mode === 'nft'
        ? await verifyMedicalRecordNFT(input.trim())
        : await getTransactionDetails(input.trim());
      setResult(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-900/50 rounded-xl">
          <ShieldCheck className="w-7 h-7 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Blockchain Verify</h1>
          <p className="text-slate-400 mt-1">
            Independently verify your medical records are real and unchanged on Cardano
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { step: '1', text: 'Doctor creates record', icon: FileText, color: 'blue' },
          { step: '2', text: 'NFT minted on Cardano', icon: Hash, color: 'green' },
          { step: '3', text: 'You verify independently', icon: ShieldCheck, color: 'purple' },
        ].map(({ step, text, icon: Icon, color }) => (
          <div key={step} className={`bg-${color}-900/20 border border-${color}-800 rounded-xl p-3 text-center`}>
            <div className={`w-7 h-7 rounded-full bg-${color}-900/50 flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-4 h-4 text-${color}-400`} />
            </div>
            <p className="text-white text-xs font-medium">{step}. {text}</p>
          </div>
        ))}
      </div>

      {/* Verify input */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-4">
        {/* Mode selector */}
        <div className="flex gap-2">
          {[
            { id: 'tx', label: 'Transaction Hash', icon: Hash },
            { id: 'nft', label: 'NFT Unit/Asset ID', icon: Wallet },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setMode(id); setResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleVerify()}
          placeholder={mode === 'tx'
            ? 'Enter transaction hash (64 hex chars)...'
            : 'Enter NFT unit (policyId + assetName hex)...'}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 font-mono text-sm focus:outline-none focus:border-blue-500"
        />

        <button
          onClick={handleVerify}
          disabled={verifying || !input.trim()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {verifying
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Checking on Cardano...</>
            : <><Search className="w-5 h-5" /> Verify on Cardano</>
          }
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl border p-5 ${
          (result.valid || result.status === 'confirmed' || result.real !== false)
            ? 'bg-green-900/20 border-green-700'
            : 'bg-red-900/20 border-red-700'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {(() => {
              const isValid = result.valid || result.status === 'confirmed';
              let label;
              if (result.valid) {
                label = 'NFT is real on Cardano ✅';
              } else if (result.status === 'confirmed') {
                label = 'Transaction confirmed on Cardano ✅';
              } else if (result.mode === 'demo') {
                label = 'Demo mode — add Blockfrost API key to verify for real';
              } else {
                label = 'Not found on Cardano';
              }
              return (
                <>
                  {isValid
                    ? <ShieldCheck className="w-5 h-5 text-green-400" />
                    : <ShieldX className="w-5 h-5 text-red-400" />
                  }
                  <span className={`font-semibold ${isValid ? 'text-green-300' : 'text-red-300'}`}>
                    {label}
                  </span>
                </>
              );
            })()}
          </div>

          <div className="space-y-2 text-xs font-mono">
            {result.txHash && (
              <Row label="TX Hash" value={result.txHash} />
            )}
            {result.block && (
              <Row label="Block" value={result.block} />
            )}
            {result.fees !== undefined && (
              <Row label="Fees" value={`₳${result.fees}`} />
            )}
            {result.metadata && (
              <div className="mt-3">
                <p className="text-slate-400 mb-1 text-xs">On-chain metadata:</p>
                <pre className="text-green-300 text-xs overflow-x-auto whitespace-pre-wrap bg-slate-900/50 rounded-lg p-3">
                  {JSON.stringify(result.metadata, null, 2)}
                </pre>
              </div>
            )}
            {result.message && (
              <p className="text-slate-400 mt-2">{result.message}</p>
            )}
          </div>

          {result.cardanoScanUrl && (
            <a
              href={result.cardanoScanUrl}
              target="_blank" rel="noreferrer"
              className="mt-4 flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              View on CardanoScan (independent verification)
            </a>
          )}
        </div>
      )}

      {/* My on-chain records */}
      {myNFTs && myNFTs.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-400" />
            My On-Chain Records ({myNFTs.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {myNFTs.map((nft, i) => (
              <button
                key={nft.unit || i}
                onClick={() => { setInput(nft.unit); setMode('nft'); }}
                className="w-full text-left bg-slate-900/50 border border-slate-700 hover:border-blue-600 rounded-xl p-3 flex items-center justify-between transition-colors"
              >
                <div>
                  <p className="text-white text-sm">{nft.assetName || 'NFT'}</p>
                  <p className="text-slate-400 font-mono text-xs truncate max-w-xs">{nft.unit}</p>
                </div>
                <a
                  href={nft.cardanoScanUrl}
                  target="_blank" rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 w-16 flex-shrink-0">{label}:</span>
      <span className="text-white truncate">{value}</span>
    </div>
  );
}
