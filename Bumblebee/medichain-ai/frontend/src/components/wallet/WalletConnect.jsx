/**
 * WalletConnect — MeshJS powered CIP-30 wallet connector
 * Detects ALL installed wallets automatically
 * Supports: Lace, Eternl, VESPR, Nami, Flint, Typhon, and any CIP-30 wallet
 */
import { useState, useEffect } from 'react';
import { Wallet, Shield, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getInstalledWallets,
  connectCardanoWallet,
  signChallenge,
  getWalletBalance,
  CARDANOSCAN_BASE,
} from '../../services/cardano';
import toast from 'react-hot-toast';

// Fallback logos for known wallets
const WALLET_LOGOS = {
  lace: 'https://lace.io/favicon.ico',
  eternl: 'https://eternl.io/app/favicon.ico',
  nami: 'https://namiwallet.io/favicon.ico',
  vespr: 'https://vespr.xyz/favicon.ico',
  typhon: 'https://typhonwallet.io/favicon.ico',
  flint: 'https://flint-wallet.com/favicon.ico',
};

export default function WalletConnect({ onSuccess, className = '' }) {
  const { connectWallet } = useAuth();
  const [installedWallets, setInstalledWallets] = useState([]);
  const [connecting, setConnecting] = useState(null);
  const [connected, setConnected] = useState(null);
  const [detecting, setDetecting] = useState(true);

  // Detect installed wallets — retry 3 times (Lace needs up to 1.5s to inject)
  useEffect(() => {
    let attempts = 0;
    const tryDetect = async () => {
      const wallets = await getInstalledWallets();
      if (wallets.length > 0 || attempts >= 3) {
        setInstalledWallets(wallets);
        setDetecting(false);
      } else {
        attempts++;
        setTimeout(tryDetect, 500 * attempts); // 500ms, 1000ms, 1500ms
      }
    };
    setTimeout(tryDetect, 300);
  }, []);

  const connect = async (walletId) => {
    setConnecting(walletId);
    try {
      // 1. Connect wallet via MeshJS (CIP-30)
      const walletInfo = await connectCardanoWallet(walletId);

      // 2. Sign a challenge to prove ownership
      const challenge = `MediChain AI Login: ${Date.now()}`;
      const { signature, key } = await signChallenge(walletInfo.address, challenge);

      // 3. Authenticate with backend
      await connectWallet(walletInfo.address, signature, key);

      setConnected({ ...walletInfo, balance: walletInfo.balanceAda });
      toast.success(`✅ ${walletId} connected — ₳${walletInfo.balanceAda} on ${walletInfo.networkName}`);
      onSuccess?.({ ...walletInfo });
    } catch (err) {
      if (err?.message?.includes('user rejected') || err?.message?.includes('cancelled')) {
        toast.error('Connection cancelled');
      } else {
        toast.error(err.message || `Failed to connect ${walletId}`);
      }
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Connected state */}
      {connected && (
        <div className="p-4 bg-green-900/30 border border-green-700 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-medium capitalize">{connected.walletName} Connected</span>
          </div>
          <p className="text-green-400/70 text-xs font-mono truncate">{connected.address}</p>
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-white text-xl font-bold">₳ {connected.balance}</span>
              <span className="text-slate-400 text-xs ml-1">tADA</span>
            </div>
            <a
              href={`${CARDANOSCAN_BASE}/address/${connected.address}`}
              target="_blank" rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View on CardanoScan <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              connected.networkId === 0
                ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                : 'bg-green-900/50 text-green-400 border border-green-700'
            }`}>
              {connected.networkName}
            </span>
          </div>
        </div>
      )}

      {/* Wallet list — auto-detected by MeshJS */}
      {detecting ? (
        <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Detecting wallets...
        </div>
      ) : installedWallets.length > 0 ? (
        installedWallets.map((w) => (
          <button key={w.id} onClick={() => connect(w.id)}
            disabled={!!connecting || !!connected}
            className="w-full flex items-center gap-4 p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-blue-500 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            <img
              src={w.icon || WALLET_LOGOS[w.id]}
              alt={w.name}
              className="w-8 h-8 rounded-lg"
              onError={e => { e.target.src = ''; e.target.style.display = 'none'; }}
            />
            <span className="text-white font-medium flex-1 text-left">{w.name}</span>
            {connecting === w.id
              ? <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              : <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">Installed</span>
            }
          </button>
        ))
      ) : (
        // No wallets installed — show install links
        <div className="space-y-2">
          <p className="text-slate-400 text-sm text-center">No Cardano wallet detected</p>
          {[
            { name: 'Lace', url: 'https://www.lace.io/', desc: 'By IOG — Cardano official wallet' },
            { name: 'Eternl', url: 'https://eternl.io/', desc: 'Power-user wallet' },
            { name: 'VESPR', url: 'https://vespr.xyz/', desc: 'Beginner-friendly' },
          ].map(w => (
            <a key={w.name} href={w.url} target="_blank" rel="noreferrer"
              className="w-full flex items-center gap-4 p-4 bg-slate-800/50 border border-dashed border-slate-600 hover:border-blue-500 rounded-xl transition-all">
              <Wallet className="w-6 h-6 text-slate-400" />
              <div className="flex-1 text-left">
                <p className="text-white text-sm font-medium">Install {w.name}</p>
                <p className="text-slate-500 text-xs">{w.desc}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500" />
            </a>
          ))}
        </div>
      )}

      {/* Security note */}
      <div className="flex items-center gap-2 text-slate-500 text-xs mt-4">
        <Shield className="w-3.5 h-3.5 text-purple-400" />
        CIP-30 standard · Identity verified via ZKP · No keys stored
      </div>
    </div>
  );
}
