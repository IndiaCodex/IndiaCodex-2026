import { MeshWallet, BlockfrostProvider, Transaction } from '@meshsdk/core';
import type { UTxO } from '@meshsdk/core';
import fs from 'fs';
import path from 'path';

const WALLETS_FILE_PATH = path.join(__dirname, '../../data/wallets.json');

export class WalletService {
  private static providerInstance: BlockfrostProvider | null = null;

  /**
   * Singleton pattern for BlockfrostProvider to avoid recreating it
   */
  static getProvider(): BlockfrostProvider {
    if (!this.providerInstance) {
      const apiKey = process.env.BLOCKFROST_API_KEY;
      if (!apiKey) {
        throw new Error('BLOCKFROST_API_KEY is not defined in the environment variables');
      }
      if (!apiKey.startsWith('preprod')) {
        throw new Error(`Invalid BLOCKFROST_API_KEY: Expected a 'preprod' key for the testnet, but got '${apiKey.substring(0, 7)}...'. Please create a Preprod project in Blockfrost.`);
      }
      this.providerInstance = new BlockfrostProvider(apiKey);
    }
    return this.providerInstance;
  }

  /**
   * Generates a Cardano PREPROD wallet.
   * Returns address and mnemonic.
   * Appends the wallet to data/wallets.json with a createdAt timestamp.
   */
  static async createAgentWallet(): Promise<{ address: string; mnemonic: string[] }> {
    // Brew mnemonic synchronously then proceed with async operations if any
    const mnemonic = MeshWallet.brew();
    
    // MeshSDK brew returns a string or string[] depending on the exact version,
    // so we normalize it to an array of words
    const words = typeof mnemonic === 'string' ? mnemonic.split(' ') : mnemonic;

    const provider = this.getProvider();

    const wallet = new MeshWallet({
      networkId: 0, // 0 for Preprod/Testnet
      fetcher: provider,
      submitter: provider,
      key: {
        type: 'mnemonic',
        words: words,
      },
    });

    const unused = await wallet.getUnusedAddresses();
    const used = await wallet.getUsedAddresses();
    const address = unused[0] || used[0];
    const createdAt = new Date().toISOString();

    const walletData = { address, mnemonic: words, createdAt };

    // Append to data/wallets.json
    let wallets: Array<{ address: string; mnemonic: string[]; createdAt: string }> = [];
    if (fs.existsSync(WALLETS_FILE_PATH)) {
      const fileData = fs.readFileSync(WALLETS_FILE_PATH, 'utf-8');
      try {
        wallets = JSON.parse(fileData);
      } catch (e) {
        wallets = [];
      }
    }
    wallets.push(walletData);
    fs.writeFileSync(WALLETS_FILE_PATH, JSON.stringify(wallets, null, 2), 'utf-8');

    console.log(JSON.stringify({ 
      event: 'WALLET_CREATED', 
      address, 
      timestamp: createdAt 
    }));

    return walletData;
  }

  /**
   * Return ADA balance from Blockfrost using correct Provider implementation
   * Removes unsupported `key.type="address"` hallucinated API.
   */
  static async getBalance(address: string): Promise<number> {
    const provider = this.getProvider();
    
    console.log(`[DEBUG] Address queried: ${address}`);
    
    // fetchAddressUTxOs without the 'lovelace' parameter correctly fetches all unspent transaction outputs
    const utxos: UTxO[] = await provider.fetchAddressUTxOs(address);
    
    console.log(`[DEBUG] Raw Blockfrost response (UTxOs): ${JSON.stringify(utxos, null, 2)}`);
    
    let lovelace = 0;
    for (const utxo of utxos) {
      // Find the lovelace asset within the UTxO outputs
      const asset = utxo.output.amount.find((a) => a.unit === 'lovelace');
      if (asset) {
        lovelace += Number(asset.quantity);
      }
    }
    
    console.log(`[DEBUG] Lovelace total: ${lovelace}`);
    
    const balance = lovelace / 1000000; // Convert Lovelace to ADA

    console.log(`[DEBUG] ADA total: ${balance}`);

    console.log(JSON.stringify({ 
      event: 'BALANCE_CHECK', 
      address, 
      balance 
    }));

    return balance;
  }

  /**
   * Build, sign, and submit transaction
   */
  static async sendADA(
    fromMnemonic: string[],
    toAddress: string,
    amount: number,
    metadata?: string | Record<string, unknown>
  ): Promise<string> {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const provider = this.getProvider();
    const wallet = new MeshWallet({
      networkId: 0,
      fetcher: provider,
      submitter: provider,
      key: {
        type: 'mnemonic',
        words: fromMnemonic,
      },
    });

    const tx = new Transaction({ initiator: wallet });
    tx.sendLovelace(toAddress, (amount * 1000000).toString());

    if (metadata) {
      // Using standard application metadata label (1001) instead of 0
      tx.setMetadata(1001, metadata);
    }

    const unsignedTx = await tx.build();
    const signedTx = await wallet.signTx(unsignedTx);
    const txHash = await wallet.submitTx(signedTx);
    
    console.log(JSON.stringify({ 
      event: 'TX_SUBMITTED', 
      txHash, 
      toAddress, 
      amount 
    }));

    return txHash;
  }
}
