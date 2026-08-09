import dotenv from 'dotenv';
dotenv.config();

import { WalletService } from '../src/services/WalletService';

async function main() {
  try {
    console.log('1. Creating a wallet...');
    const { address, mnemonic } = await WalletService.createAgentWallet();

    console.log('2. Wallet Address:', address);

    console.log('3. Funding it with 10 ADA from Faucet...');
    const faucetMnemonic = process.env.FAUCET_WALLET_MNEMONIC?.split(' ');
    
    if (!faucetMnemonic) {
      throw new Error('FAUCET_WALLET_MNEMONIC is not defined in .env');
    }

    // Fund the new wallet with 10 ADA
    const txHash = await WalletService.sendADA(faucetMnemonic, address, 10);
    console.log('4. Transaction Hash:', txHash);

    console.log('Waiting for transaction to be confirmed... (This may take a minute)');
    // Wait for a little bit before checking balance (optional, but realistic)
    await new Promise((resolve) => setTimeout(resolve, 15000));

    console.log('5. Querying balance...');
    const balance = await WalletService.getBalance(address);
    console.log(`6. Final Balance: ${balance} ADA`);

  } catch (error) {
    console.error('Error during fundAgent script:', error);
  }
}

main();
