/**
 * CardanoLiveStats — Real-time Cardano blockchain stats panel
 * Fetches live data from Blockfrost API
 * Shows: current block, epoch, network health, and connected wallet
 */
import { useState, useEffect } from 'react';
import { Activity, Blocks, Clock, ExternalLink, RefreshCw, Wallet, Globe } from 'lucide-react';
import {
  getLatestBlock,
  getCurrentEpoch,
  getWalletBalance,
  getConnectedAddress,
  CARDANOSCAN_BASE,
} from '../../services/cardano';

export default function CardanoLiveStats({ className = '' }) {
  const [block, setBlock] = useState(null);
  const [epoch, setEpoch] = useState(null);
  const [walletAddr, setWalletAddr] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [b, e] = await Promise.all([getLatestBlock(), getCurrentEpoch()]);
      setBlock(b);
      setEpoch(e);

      const addr = getConnectedAddress();
      if (addr) {
        setWalletAddr(addr);
        const bal = await getWalletBalance(addr);
        setBalance(bal);
      }
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds (Cardano produces a block ~every 20s)
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []);

  const isDemoMode = block?.mode === 'demo';

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-2xl p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`} />
          <span className="text-white font-semibold">Cardano Preprod</span>
          {isDemoMode && (
            <span className="text-xs bg-yellow-900/50 text-yellow-400 border border-yellow-700 px-2 py-0.5 rounded-full">
              Demo
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-slate-500 text-xs">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          icon={Blocks}
          label="Latest Block"
          value={block ? `#${block.height?.toLocaleString()}` : '—'}
          sub={block ? `Epoch ${block.epoch}` : 'Loading...'}
          href={block?.cardanoScanUrl}
          color="blue"
        />
        <StatCard
          icon={Activity}
          label="Block Txns"
          value={block ? block.txCount ?? '—' : '—'}
          sub="in this block"
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Epoch"
          value={epoch ? `#${epoch.epoch}` : '—'}
          sub={epoch ? `${epoch.txCount?.toLocaleString()} txns` : 'Loading...'}
          color="purple"
        />
        <StatCard
          icon={Globe}
          label="Network"
          value="Preprod"
          sub="Cardano Testnet"
          color="orange"
        />
      </div>

      {/* Connected Wallet */}
      {walletAddr ? (
        <div className="p-3 bg-blue-950/50 border border-blue-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Wallet Connected</span>
            </div>
            <span className="text-white font-bold text-sm">₳ {balance ?? '...'}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-slate-400 text-xs font-mono truncate max-w-[180px]">{walletAddr}</span>
            <a
              href={`${CARDANOSCAN_BASE}/address/${walletAddr}`}
              target="_blank" rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              CardanoScan <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-700/30 border border-slate-600 border-dashed rounded-xl text-center">
          <p className="text-slate-400 text-xs">Connect Lace/Eternl wallet to see balance</p>
          <a
            href="https://www.lace.io/"
            target="_blank" rel="noreferrer"
            className="text-blue-400 hover:text-blue-300 text-xs mt-1 flex items-center gap-1 justify-center"
          >
            Get Lace Wallet <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Cardano links */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700">
        <a href={CARDANOSCAN_BASE} target="_blank" rel="noreferrer"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> CardanoScan
        </a>
        <a href="https://docs.cardano.org/cardano-testnets/tools/faucet/" target="_blank" rel="noreferrer"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Get Test ADA
        </a>
        <a href="https://meshjs.dev/" target="_blank" rel="noreferrer"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> MeshJS SDK
        </a>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, href, color = 'blue' }) {
  const colors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
  };

  const content = (
    <div className="p-3 bg-slate-700/40 rounded-xl hover:bg-slate-700/60 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${colors[color]}`} />
        <span className="text-slate-400 text-xs">{label}</span>
      </div>
      <p className="text-white font-bold text-lg leading-tight">{value}</p>
      <p className="text-slate-500 text-xs">{sub}</p>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }
  return content;
}
