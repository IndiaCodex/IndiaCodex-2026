import React, { useState } from 'react';
import { Search, QrCode, Zap, CheckCircle2, ChevronRight, Hash } from 'lucide-react';
import { Recommendation } from './RecommendationCard';

interface VerificationScreenProps {
  lastMintedPass?: Recommendation | null;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({ lastMintedPass }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [passData, setPassData] = useState<Recommendation | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setIsSearching(true);
    setPassData(null);
    
    // Simulate network verification
    setTimeout(() => {
      // If we have a recently minted pass and they search, show it. Otherwise show mock data.
      setPassData(lastMintedPass || {
        chargerName: "Cardano SuperCharger Alpha",
        arrivalTime: "14:30",
        availableSlot: "Slot A2",
        reasoning: "Verified on-chain reservation."
      });
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-white mb-4">Verify ChargePass</h2>
        <p className="text-slate-400">Search by Wallet Address or TxHash to validate your on-chain reservation.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-12 items-start justify-center">
        {/* Search Column */}
        <div className="w-full md:w-1/2 max-w-md">
          <form onSubmit={handleSearch} className="glass-panel p-6 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Search className="text-cardano" /> Lookup Pass
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Wallet Address / TxHash</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash size={18} className="text-slate-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-cardano outline-none"
                  placeholder="addr_test1..."
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching || !searchQuery}
              className="w-full py-3 px-4 bg-dark-800 hover:bg-dark-700 border border-slate-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
            >
              {isSearching ? 'Verifying on Cardano...' : 'Verify on Blockchain'}
            </button>
          </form>
        </div>

        {/* Apple Wallet Style Digital Pass */}
        <div className="w-full md:w-1/2 flex justify-center perspective-[1000px]">
          {passData ? (
            <div className="w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-900 to-dark-900 border border-indigo-500/30 transform transition-all duration-700 animate-in fade-in slide-in-from-bottom-8">
              
              {/* Pass Header */}
              <div className="bg-gradient-to-r from-cardano to-indigo-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Zap size={16} className="text-white" />
                  </div>
                  <span className="text-white font-bold tracking-wide">ChargePass</span>
                </div>
                <div className="px-2.5 py-1 bg-white/20 rounded-full text-white text-xs font-bold uppercase tracking-widest backdrop-blur-sm border border-white/30">
                  RESERVED
                </div>
              </div>

              {/* Pass Body */}
              <div className="px-8 py-8">
                <div className="mb-6">
                  <p className="text-indigo-200/60 text-xs uppercase font-bold tracking-wider mb-1">Charger Location</p>
                  <h4 className="text-2xl font-black text-white">{passData.chargerName}</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-8 border-t border-b border-indigo-500/20 py-6">
                  <div>
                    <p className="text-indigo-200/60 text-xs uppercase font-bold tracking-wider mb-1">Arrival Time</p>
                    <p className="text-xl font-mono text-white">{passData.arrivalTime}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200/60 text-xs uppercase font-bold tracking-wider mb-1">Slot Assigned</p>
                    <p className="text-xl font-mono text-cardano-light">{passData.availableSlot}</p>
                  </div>
                </div>

                {/* QR Code Mock */}
                <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl w-48 h-48 mx-auto relative group cursor-pointer border-4 border-indigo-500/20">
                  <QrCode size={120} className="text-dark-900" />
                  <div className="absolute inset-0 bg-cardano/90 rounded-xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <CheckCircle2 size={32} className="text-white mb-2" />
                    <span className="text-white font-bold">Valid Check-In</span>
                  </div>
                </div>
                <p className="text-center text-indigo-200/50 text-[10px] mt-4 font-mono tracking-widest">
                  {Math.random().toString(36).substring(2, 15).toUpperCase()} - CIP-25 NFT
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-sm h-[500px] rounded-[32px] border-2 border-dashed border-slate-700/50 flex flex-col items-center justify-center text-slate-500">
              <QrCode size={48} className="mb-4 opacity-20" />
              <p>Pass will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
