import React, { useState } from 'react';
import { Zap, Clock, Bookmark, ChevronRight, Loader2, AlertCircle, Leaf, Activity, Coins } from 'lucide-react';
import { useChargePassMint } from '../hooks/useChargePassMint';

export interface Recommendation {
  chargerName: string;
  arrivalTime: string;
  availableSlot: string;
  pricing: string;
  gridLoad: string;
  carbonSaved: string;
  reasoning: string;
}

interface RecommendationCardProps {
  recommendations: Recommendation[];
  isWalletConnected: boolean;
  onMintSuccess: (txHash: string, charger: Recommendation) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendations, isWalletConnected, onMintSuccess }) => {
  const { mintChargePass, isMinting } = useChargePassMint();
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleMint = async () => {
    const selectedCharger = recommendations && recommendations[selectedIndex];
    if (!isWalletConnected || !selectedCharger) return;
    
    setError(null);
    const result = await mintChargePass(selectedCharger);
    
    if (result.success && result.txHash) {
      onMintSuccess(result.txHash, selectedCharger);
    } else {
      setError(result.error || "Minting transaction failed.");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 relative">
      <div className="flex flex-col gap-4">
        {recommendations && recommendations.length > 0 && recommendations.map((charger, index) => {
          const isSelected = selectedIndex === index;
          return (
            <div 
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`glass-panel p-5 rounded-3xl cursor-pointer transition-all duration-300 border-2 overflow-hidden relative group ${
                isSelected ? 'border-cardano bg-dark-800/80 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]' : 'border-slate-700/50 hover:border-slate-500/50 opacity-70 hover:opacity-100'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-cardano/20 rounded-full blur-[40px] pointer-events-none"></div>
              )}
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex flex-col text-left">
                  <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <Zap className={isSelected ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'} size={18} />
                    {charger?.chargerName || 'Unknown Charger'}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-slate-400 font-mono mt-1">
                    <span className="flex items-center gap-1"><Clock size={14}/> {charger?.arrivalTime || 'TBD'}</span>
                    <span className="flex items-center gap-1"><Bookmark size={14}/> {charger?.availableSlot || 'Any Slot'}</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="bg-cardano/20 text-cardano-light px-3 py-1 rounded-full text-xs font-bold border border-cardano/30">
                    SELECTED
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
                <div className="bg-dark-900/60 p-2 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center">
                  <Coins size={14} className="text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-white">{charger?.pricing || 'Standard Rate'}</span>
                </div>
                <div className="bg-dark-900/60 p-2 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center">
                  <Activity size={14} className={charger?.gridLoad === 'High' ? 'text-red-400' : 'text-emerald-400'} mb-1 />
                  <span className="text-xs font-semibold text-white">{charger?.gridLoad || 'Unknown'} Load</span>
                </div>
                <div className="bg-dark-900/60 p-2 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center">
                  <Leaf size={14} className="text-green-400 mb-1" />
                  <span className="text-xs font-semibold text-white">{charger?.carbonSaved || '0 kg'}</span>
                </div>
              </div>

              {isSelected && (
                <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-3 text-left relative z-10">
                  <p className="text-xs text-indigo-200 leading-relaxed italic">
                    "{charger?.reasoning || 'Optimal charging location.'}"
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <button
        onClick={handleMint}
        disabled={!isWalletConnected || isMinting}
        className="w-full py-4 px-4 bg-gradient-to-r from-cardano to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl shadow-cardano/25 flex items-center justify-between group relative z-10"
      >
        <span className="flex-1 text-center pl-6 text-lg tracking-wide flex items-center justify-center gap-2">
          {isMinting ? <Loader2 className="animate-spin" size={20} /> : null}
          {isMinting ? "Minting on Cardano..." : "Reserve & Mint ChargePass"}
        </span>
        {!isMinting && <ChevronRight className="opacity-70 group-hover:opacity-100 transition-opacity" />}
      </button>

      {!isWalletConnected && (
        <p className="text-center text-xs text-red-400 mt-2 relative z-10 bg-red-900/20 py-2 rounded-lg border border-red-900/30">
          Please connect your Lace wallet to reserve this charger.
        </p>
      )}
    </div>
  );
};
