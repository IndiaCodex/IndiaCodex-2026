"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CardanoWallet, useWallet } from "@meshsdk/react";
import { Shield, Trash2, Edit2, CheckCircle2, Link2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export const WalletSettings = () => {
  const { wallets, currentWalletId, linkWallet, switchActiveWallet, renameWallet, deleteWallet } = useAuth();
  const { connected, wallet, name } = useWallet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);

  // Automatically link connected wallet if it's not already linked
  useEffect(() => {
    if (connected && wallet && name) {
      const syncWallet = async () => {
        try {
          const address = await wallet.getChangeAddress();
          const network = await wallet.getNetworkId();
          
          // Check if already in list
          const exists = wallets.some(w => w.address === address);
          if (!exists) {
            setLoading(true);
            await linkWallet(address, name, network, `${name.charAt(0).toUpperCase() + name.slice(1)} Wallet`);
            setLoading(false);
          }
        } catch (err) {
          console.error("Error auto-linking wallet:", err);
          setLoading(false);
        }
      };
      syncWallet();
    }
  }, [connected, wallet, name, wallets]);

  const handleRename = async (walletId: string) => {
    if (!editName.trim()) return;
    try {
      await renameWallet(walletId, editName.trim());
      setEditingId(null);
      setEditName("");
    } catch (e) {
      console.error(e);
    }
  };

  const getNetworkName = (id: number) => {
    return id === 1 ? "Mainnet" : "Preview Testnet";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Active Wallet Header */}
      <div className="glass rounded-3xl p-6 md:p-8 border border-white/5 shadow-lg flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-brand-primary-dark/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex items-center space-x-4 mb-4 md:mb-0 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary-dark/20 border border-brand-primary-light/30 flex items-center justify-center text-brand-primary-light">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Active Signing Profile</h2>
            <p className="text-xs text-text-secondary mt-0.5">This wallet signs verification hashes to the Cardano blockchain.</p>
          </div>
        </div>

        <div className="relative z-10">
          <CardanoWallet />
        </div>
      </div>

      {/* Linked Wallets List */}
      <div className="glass rounded-3xl p-6 md:p-8 border border-white/5 shadow-md">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center">
          <Link2 className="mr-2 text-brand-secondary" size={20} /> Linked Wallets
        </h3>

        {loading && (
          <div className="text-center py-4 text-brand-primary-light text-sm animate-pulse">
            Syncing wallet state with Firestore...
          </div>
        )}

        <div className="space-y-4">
          {wallets.map((w) => {
            const isActive = w.walletId === currentWalletId;
            const isEditing = editingId === w.walletId;

            return (
              <motion.div 
                key={w.walletId}
                layout
                className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center ${
                  isActive ? "bg-brand-primary-dark/10 border-brand-primary-light/40" : "bg-white/5 border-white/5 hover:border-white/10"
                }`}
              >
                <div className="space-y-1 w-full md:w-auto">
                  <div className="flex items-center space-x-3">
                    {isEditing ? (
                      <div className="flex items-center space-x-2 w-full md:w-auto">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-black/40 border border-white/15 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none focus:border-brand-primary-light"
                          placeholder={w.nickname}
                        />
                        <button onClick={() => handleRename(w.walletId)} className="text-xs bg-brand-primary-light text-black font-semibold px-2.5 py-1 rounded-md hover:bg-brand-primary-light/80">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-text-secondary hover:text-white">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-bold text-white">{w.nickname}</h4>
                        <button onClick={() => { setEditingId(w.walletId); setEditName(w.nickname); }} className="text-text-muted hover:text-white transition-colors">
                          <Edit2 size={12} />
                        </button>
                      </>
                    )}

                    {isActive && (
                      <span className="text-[10px] bg-brand-success/20 text-brand-success px-2 py-0.5 rounded-full font-bold uppercase flex items-center">
                        <CheckCircle2 size={10} className="mr-1" /> Active
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-text-secondary truncate max-w-[280px] md:max-w-md">{w.address}</p>
                  <div className="flex items-center space-x-4 text-xs text-text-muted pt-1">
                    <span className="capitalize">Provider: <strong className="text-text-secondary">{w.provider}</strong></span>
                    <span>•</span>
                    <span>Network: <strong className="text-text-secondary">{getNetworkName(w.network)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mt-4 md:mt-0 w-full md:w-auto justify-end">
                  {!isActive && (
                    <button 
                      onClick={() => switchActiveWallet(w.walletId)}
                      className="px-4 py-2 text-xs bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white font-semibold transition-colors"
                    >
                      Make Active
                    </button>
                  )}
                  <button 
                    onClick={() => deleteWallet(w.walletId)}
                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-colors"
                    title="Remove Wallet"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {wallets.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted">
              <AlertCircle size={36} className="mb-3 text-brand-secondary/40" />
              <p className="text-sm">No linked wallets. Use the button above to connect your first Cardano profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
