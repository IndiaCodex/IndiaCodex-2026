"use client";

import { useMediChain } from "@/context/MediChainContext";
import { AlertTriangle, X } from "lucide-react";

export default function NucastAlert() {
  const { alertVisible, dismissAlert } = useMediChain();

  if (!alertVisible) return null;

  return (
    <div className="fixed top-[68px] left-0 right-0 z-40 animate-slide-down">
      <div className="bg-yellow-400 border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-none flex items-center justify-center flex-shrink-0 animate-pulse-slow">
                <AlertTriangle className="w-6 h-6 text-yellow-400" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-black text-black uppercase tracking-wider">
                  ⚠️ High-Priority Health Alert
                </p>
                <p className="text-sm font-bold text-black/80">
                  Penicillin Allergy Flagged! — Patient has confirmed anaphylaxis risk. Do NOT administer beta-lactam antibiotics.
                </p>
              </div>
            </div>
            <button
              onClick={dismissAlert}
              className="flex-shrink-0 w-8 h-8 bg-black text-yellow-400 flex items-center justify-center hover:bg-gray-800 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
            >
              <X className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
