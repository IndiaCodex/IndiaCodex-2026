import dotenv from 'dotenv';
dotenv.config();

import { WalletService } from '../src/services/WalletService';
import { MeshWallet, BlockfrostProvider, Transaction } from '@meshsdk/core';
import fs from 'fs';
import path from 'path';

async function sweep() {
  const faucetMnemonic = process.env.FAUCET_WALLET_MNEMONIC?.split(' ');
  if (!faucetMnemonic) {
    throw new Error('FAUCET_WALLET_MNEMONIC is not defined in .env');
  }

  // Get faucet address
  const provider = WalletService.getProvider();
  const faucetWallet = new MeshWallet({
    networkId: 0,
    fetcher: provider,
    submitter: provider,
    key: {
      type: 'mnemonic',
      words: faucetMnemonic,
    },
  });
  
  const unused = await faucetWallet.getUnusedAddresses();
  const used = await faucetWallet.getUsedAddresses();
  const faucetAddress = unused[0] || used[0];
  console.log(`Faucet Address: ${faucetAddress}`);

  // Read wallets
  const walletsPath = path.join(__dirname, '../data/wallets.json');
  if (!fs.existsSync(walletsPath)) {
    console.log('No wallets.json found');
    return;
  }
  
  const wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
  
  let totalRecovered = 0;

  for (const wallet of wallets) {
    console.log(`\nChecking wallet: ${wallet.address}`);
    try {
      const balance = await WalletService.getBalance(wallet.address);
      if (balance > 2) {
        // Leave 2 ADA behind to cover fees and the minimum UTxO ADA requirement (change output)
        const amountToSend = Math.floor(balance - 2);
        console.log(`Sending ${amountToSend} ADA back to faucet...`);
        
        const txHash = await WalletService.sendADA(wallet.mnemonic, faucetAddress, amountToSend);
        console.log(`Success! TX: ${txHash}`);
        totalRecovered += amountToSend;
        
        // Wait 5 seconds before next one just in case
        await new Promise(r => setTimeout(r, 5000));
      } else {
        console.log(`Balance too low to sweep: ${balance} ADA`);
      }
    } catch (e: any) {
      console.error(`Failed to sweep ${wallet.address}: ${e.message}`);
    }
  }
  
  console.log(`\nSweep complete! Recovered ~${totalRecovered} ADA back to the faucet.`);
}

sweep();
