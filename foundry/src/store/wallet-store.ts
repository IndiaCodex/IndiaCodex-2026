import { create } from "zustand";

interface WalletSpendState {
  reservedByAddress: Record<string, number>;
  reserveSpend: (address: string, lovelace: number) => void;
  clearReservation: (address: string) => void;
  getReservedSpend: (address?: string | null) => number;
}

export const useWalletStore = create<WalletSpendState>((set, get) => ({
  reservedByAddress: {},

  reserveSpend: (address, lovelace) =>
    set((state) => ({
      reservedByAddress: {
        ...state.reservedByAddress,
        [address]: (state.reservedByAddress[address] || 0) + lovelace,
      },
    })),

  clearReservation: (address) =>
    set((state) => {
      if (!(address in state.reservedByAddress)) return state;
      const next = { ...state.reservedByAddress };
      delete next[address];
      return { reservedByAddress: next };
    }),

  getReservedSpend: (address) => {
    if (!address) return 0;
    return get().reservedByAddress[address] || 0;
  },
}));
