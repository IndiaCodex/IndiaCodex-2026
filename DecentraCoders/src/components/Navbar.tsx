'use client';

import React from 'react';
import { Menu, AlertTriangle, Cpu } from 'lucide-react';
import dynamic from 'next/dynamic';

const WalletConnect = dynamic(
  () => import('./WalletConnect').then((mod) => mod.WalletConnect),
  { ssr: false }
);
import { isDemoBlockchain } from '@/lib/cardano';

interface NavbarProps {
  onMenuClick: () => void;
  title: string;
}

export default function Navbar({ onMenuClick, title }: NavbarProps) {
  return (
    <header className="h-16 border-b border-translucent bg-surface/50 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 lg:hidden transition"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title */}
        <h2 className="font-bold text-lg md:text-xl text-gray-100 hidden sm:block">
          {title}
        </h2>
      </div>

      {/* Network Badge & Wallet Connector */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Demo Mode Notice / Active Network Badge */}
        {isDemoBlockchain ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cardano:</span> Demo Mode
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Cardano Preview Testnet</span>
          </div>
        )}

        {/* Wallet connection */}
        <WalletConnect />
      </div>
    </header>
  );
}
