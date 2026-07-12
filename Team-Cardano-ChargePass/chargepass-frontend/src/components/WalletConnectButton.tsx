import React from 'react';
import { Wallet, LogOut, Code, Coins } from 'lucide-react';
import { WalletState } from '../hooks/useCardanoWallet';

interface WalletConnectButtonProps extends WalletState {
  connectWallet: () => void;
  simulateConnect: () => void;
  disconnectWallet: () => void;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ 
  isConnected, address, balance, isConnecting, error, connectWallet, simulateConnect, disconnectWallet 
}) => {
  const formatAddress = (addr: string) => {
    if (addr.length < 12) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {balance && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-dark-800/80 rounded-xl border border-slate-700/50 text-slate-300 text-sm">
            <Coins size={14} className="text-cardano" />
            <span className="font-mono">{balance} ADA</span>
          </div>
        )}
        <div className="bg-cardano-dark/40 border border-cardano/30 px-4 py-2 rounded-xl text-cardano-light flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></div>
          <span className="font-mono text-sm">{formatAddress(address)}</span>
        </div>
        <button 
          onClick={disconnectWallet}
          className="p-2 hover:bg-dark-700 rounded-xl transition-colors text-slate-400 hover:text-white"
          title="Disconnect Wallet"
        >
          <LogOut size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end relative">
      <div className="flex gap-2">
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cardano to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Wallet size={18} />
          {isConnecting ? 'Connecting...' : 'Connect Lace'}
        </button>
        <button
          onClick={simulateConnect}
          className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 hover:bg-dark-700 border border-slate-700 text-slate-300 rounded-xl transition-all text-sm font-medium hover:border-slate-500"
          title="Simulate Connection (Dev)"
        >
          <Code size={18} />
          Simulate
        </button>
      </div>
      {error && (
        <div className="absolute top-full mt-2 right-0 text-red-400 text-xs bg-red-950/80 border border-red-900/50 px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
          {error}
        </div>
      )}
    </div>
  );
};
