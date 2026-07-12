import { useState, useCallback } from 'react';
import { Lucid, Blockfrost } from '@lucid-evolution/lucid';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
}

export function useCardanoWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    isConnecting: false,
    error: null,
  });

  const connectWallet = useCallback(async () => {
    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      if (typeof window === 'undefined' || typeof window.cardano === 'undefined' || !window.cardano.lace) {
        throw new Error('Lace wallet not found. Please install the Lace browser extension.');
      }

      const blockfrostKey = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
      if (!blockfrostKey) {
        console.error("VITE_BLOCKFROST_PROJECT_ID is missing. Cannot initialize Blockfrost provider.");
        throw new Error("Missing Blockfrost API Key. Please add VITE_BLOCKFROST_PROJECT_ID to your .env file or use Simulate.");
      }

      const laceApi = await window.cardano.lace.enable();
      
      const provider = new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", blockfrostKey);
      const lucid = await Lucid(provider, "Preprod");
      lucid.selectWallet.fromAPI(laceApi);
      
      const address = await lucid.wallet().address();
      
      const utxos = await lucid.wallet().getUtxos();
      const lovelace = utxos.reduce((acc, utxo) => acc + BigInt(utxo.assets.lovelace || 0n), 0n);
      const balanceAda = (Number(lovelace) / 1_000_000).toFixed(2);

      setWalletState({
        isConnected: true,
        address,
        balance: balanceAda,
        isConnecting: false,
        error: null,
      });
    } catch (err: any) {
      console.error(err);
      setWalletState({
        isConnected: false,
        address: null,
        balance: null,
        isConnecting: false,
        error: err.message || 'Failed to connect to Lace wallet',
      });
    }
  }, []);

  const simulateConnect = useCallback(() => {
    setWalletState({
      isConnected: true,
      address: 'addr_test1qpe06y3p0hskn2c3hsqg2p3qskvmockaddrcardanofallback9x',
      balance: '1500.50',
      isConnecting: false,
      error: null,
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletState({
      isConnected: false,
      address: null,
      balance: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  return { ...walletState, connectWallet, simulateConnect, disconnectWallet };
}
