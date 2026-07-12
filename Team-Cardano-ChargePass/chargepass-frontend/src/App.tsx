import React, { useState } from 'react';
import { WalletConnectButton } from './components/WalletConnectButton';
import { Zap, MapPin, CalendarClock, ShieldCheck, ArrowRight, ExternalLink, CheckCircle2 } from 'lucide-react';
import { TripForm, TripData } from './components/TripForm';
import { RecommendationCard, Recommendation } from './components/RecommendationCard';
import { VerificationScreen } from './components/VerificationScreen';
import { useCardanoWallet } from './hooks/useCardanoWallet';

function App() {
  const walletState = useCardanoWallet();
  const { isConnected, address } = walletState;
  
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [mintedPass, setMintedPass] = useState<Recommendation | null>(null);

  const handleTripSubmit = async (data: TripData) => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);
    setMintTxHash(null);
    setMintedPass(null);
    
    try {
      const response = await fetch('http://localhost:3001/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI recommendation');
      }

      const result = await response.json();
      setRecommendations(Array.isArray(result) ? result : [result]);
      
      setTimeout(() => {
        document.getElementById('recommendation-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching the route.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintSuccess = (txHash: string, selectedCharger: Recommendation) => {
    setMintTxHash(txHash);
    setMintedPass(selectedCharger);
    
    setTimeout(() => {
      document.getElementById('success-banner')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cardano/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-[100px]"></div>
      </div>

      <header className="relative z-10 glass-panel border-b-0 rounded-b-3xl px-6 py-4 mx-4 mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cardano to-indigo-600 flex items-center justify-center shadow-lg shadow-cardano/30">
            <Zap className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
            Cardano <span className="text-cardano-light">ChargePass</span>
          </h1>
        </div>
        <WalletConnectButton {...walletState} />
      </header>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-start px-4 py-12 text-center w-full max-w-6xl mx-auto">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cardano-dark/30 border border-cardano/20 text-cardano-light text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-cardano animate-pulse"></span>
            AI-Powered EV Charging on Cardano
          </div>
          
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto">
            Reserve your charger. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cardano to-purple-400">
              Power your journey.
            </span>
          </h2>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Secure, seamless EV charging reservations powered by Gemini AI and Cardano Smart Contracts. 
            Plan your route below to get an optimized charging recommendation.
          </p>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-8 items-start justify-center relative border-b border-slate-800/50 pb-24">
          <div className="w-full lg:w-1/2 flex justify-end">
            <TripForm onSubmit={handleTripSubmit} isLoading={isLoading} />
          </div>

          <div className="hidden lg:flex items-center justify-center w-16 h-full mt-32 text-slate-600 opacity-50">
             <ArrowRight size={32} />
          </div>

          <div id="recommendation-section" className="w-full lg:w-1/2 flex flex-col justify-start">
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-6 py-4 rounded-2xl w-full max-w-md mx-auto text-left mb-6">
                <p className="font-semibold text-red-400 mb-1">Error processing request</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!recommendations && !error && !isLoading && (
              <div className="glass-panel p-10 rounded-3xl w-full max-w-md mx-auto border-dashed border-2 border-slate-700/50 flex flex-col items-center justify-center text-slate-500 min-h-[350px]">
                <Zap size={48} className="mb-4 opacity-20" />
                <p>Awaiting Trip Details...</p>
                <p className="text-sm mt-2 text-center px-4">Enter your destination and battery level to let AI find the optimal charger.</p>
              </div>
            )}

            {recommendations && !mintTxHash && (
              <RecommendationCard 
                recommendations={recommendations} 
                isWalletConnected={isConnected || !!address}
                onMintSuccess={handleMintSuccess}
              />
            )}

            {/* Success Banner */}
            {mintTxHash && (
              <div id="success-banner" className="glass-panel p-8 rounded-3xl w-full max-w-md mx-auto border-emerald-500/30 bg-emerald-950/20 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Reservation Minted!</h3>
                <p className="text-emerald-200/80 mb-4 text-sm">
                  Your ChargePass for {mintedPass?.chargerName || "Your Selected Charger"} has been successfully minted on the Cardano network as a native token.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-slate-300">
                  <div className="bg-dark-900/50 p-3 rounded-xl border border-emerald-500/20">
                    <span className="block text-emerald-400/70 text-xs uppercase mb-1">Arrival Time</span>
                    {mintedPass?.arrivalTime || "TBD"}
                  </div>
                  <div className="bg-dark-900/50 p-3 rounded-xl border border-emerald-500/20">
                    <span className="block text-emerald-400/70 text-xs uppercase mb-1">Slot</span>
                    {mintedPass?.availableSlot || "Any Slot"}
                  </div>
                </div>

                <div className="bg-dark-950/80 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider font-semibold">Transaction Hash</p>
                  <a 
                    href={`https://preprod.cardanoscan.io/transaction/${mintTxHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-cardano-light text-sm truncate block w-full hover:text-white transition-colors flex items-center justify-center gap-1 group"
                  >
                    <span className="truncate max-w-[200px]">{mintTxHash}</span>
                    <ExternalLink size={14} className="opacity-50 group-hover:opacity-100" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification Screen Section */}
        <div className="w-full relative z-20 bg-dark-900/40 backdrop-blur-3xl -mx-4 px-4 py-8 mt-12 border-t border-slate-800/50 shadow-2xl rounded-[3rem]">
          <VerificationScreen lastMintedPass={mintTxHash ? mintedPass : null} />
        </div>

      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-6 text-center border-t border-slate-800/50 text-slate-500 text-sm mt-auto">
        <p>Built for India Codex Hackathon 2026. Powered by Cardano, Lace & Gemini AI.</p>
      </footer>
    </div>
  );
}

export default App;
