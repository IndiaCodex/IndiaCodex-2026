/**
 * CardanoNFTMinter — Mint medical records as real NFTs on Cardano
 * Uses MeshJS ForgeScript + CIP-25 metadata standard
 * Works in demo mode when wallet not connected
 */
import { useState } from 'react';
import { Cuboid as NftIcon, Loader2, CheckCircle2, ExternalLink, Info, Wallet } from 'lucide-react';
import { mintMedicalRecordNFT, mintPrescriptionNFT, getTxUrl, CARDANOSCAN_BASE } from '../../services/cardano';
import toast from 'react-hot-toast';

export default function CardanoNFTMinter({
  type = 'CONSULTATION', // CONSULTATION | PRESCRIPTION | LAB_RESULT | DIAGNOSIS
  patientName,
  patientId,
  doctorName,
  recordId,
  onMinted,
  className = '',
}) {
  const [minting, setMinting] = useState(false);
  const [result, setResult] = useState(null);

  const handleMint = async () => {
    setMinting(true);
    try {
      const mintResult = await mintMedicalRecordNFT({
        patientName: patientName || 'Patient',
        patientId: patientId || 'P001',
        recordType: type,
        doctorName: doctorName || 'Dr. Unknown',
        hospitalName: 'Apollo MediChain Hospital',
        recordHash: null,
        recordId,
      });
      setResult(mintResult);
      onMinted?.(mintResult);

      if (mintResult.real) {
        toast.success(`NFT minted on Cardano! TxHash: ${mintResult.txHash.slice(0, 16)}...`);
      } else {
        toast(`Demo NFT created (connect Lace wallet for real minting)`, { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error('Minting failed: ' + err.message);
    } finally {
      setMinting(false);
    }
  };

  if (result) {
    return (
      <div className={`p-4 bg-green-900/20 border border-green-700/50 rounded-xl ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-green-300 font-medium">
            {result.real ? 'NFT Minted on Cardano!' : 'Demo NFT Created'}
          </span>
          {!result.real && (
            <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-700">
              Demo Mode
            </span>
          )}
        </div>

        <div className="space-y-1 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Asset:</span>
            <span className="text-white">{result.assetName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">TxHash:</span>
            <span className="text-blue-300 truncate max-w-[200px]">{result.txHash}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <a
            href={result.cardanoScanUrl}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
          >
            <ExternalLink className="w-3 h-3" />
            View on CardanoScan {result.real ? '↗' : '(Demo)'}
          </a>
          {!result.real && (
            <a
              href="https://docs.cardano.org/cardano-testnets/tools/faucet/"
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300"
            >
              Get Test ADA <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleMint}
      disabled={minting}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors ${className}`}
    >
      {minting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <NftIcon className="w-4 h-4" />
      )}
      {minting ? 'Minting NFT...' : `Mint ${type} NFT on Cardano`}
    </button>
  );
}
