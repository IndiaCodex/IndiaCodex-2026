/**
 * TRACK 1: General — Built on Cardano
 * CIP-30 wallet connect + Blockfrost REST API
 * No heavy MeshJS imports at module level — prevents white screen
 */

const BLOCKFROST_KEY = import.meta.env.VITE_BLOCKFROST_API_KEY || '';
const BLOCKFROST_BASE = 'https://cardano-preprod.blockfrost.io/api/v0';
export const CARDANOSCAN_BASE = 'https://preprod.cardanoscan.io';
export const NETWORK = 0; // 0 = testnet/preprod, 1 = mainnet

// CIP metadata labels
const NFT_METADATA_LABEL = 721;       // CIP-25 NFT metadata
const MEDICHAIN_METADATA_LABEL = 674; // MediChain AI label

// ────────────────────────────────────────────
// Wallet Detection — checks window.cardano for all CIP-30 wallets
// ────────────────────────────────────────────
export async function getInstalledWallets() {
  if (typeof window === 'undefined' || !window.cardano) return [];
  const wallets = Object.entries(window.cardano)
    .filter(([, w]) => w && typeof w.enable === 'function')
    .map(([id, w]) => ({ id, name: w.name || id, icon: w.icon || '' }));
  // Also try MeshJS for additional detection
  try {
    const { BrowserWallet } = await import('@meshsdk/core');
    const meshWallets = BrowserWallet.getInstalledWallets();
    meshWallets.forEach(mw => {
      if (!wallets.find(w => w.id === mw.id)) {
        wallets.push({ id: mw.id, name: mw.name, icon: mw.icon || '' });
      }
    });
  } catch { /* MeshJS detection optional */ }
  return wallets;
}

// ────────────────────────────────────────────
// Wallet State
// ────────────────────────────────────────────
let _wallet = null;        // raw CIP-30 API (for signData)
let _meshWallet = null;    // MeshJS BrowserWallet (for balance + minting)
let _walletName = null;
let _walletAddress = null;

export async function connectCardanoWallet(walletName = 'lace') {
  if (!window.cardano?.[walletName]) {
    throw new Error(`${walletName} not installed. Install it from ${walletName}.io`);
  }
  try {
    // Raw CIP-30 for signData (challenge signing)
    _wallet = await window.cardano[walletName].enable();
    _walletName = walletName;

    // MeshJS BrowserWallet — properly decodes CBOR balance + builds txs
    const { BrowserWallet } = await import('@meshsdk/core');
    _meshWallet = await BrowserWallet.enable(walletName);

    _walletAddress = await _meshWallet.getChangeAddress();
    const networkId = await _wallet.getNetworkId().catch(() => 0);

    // MeshJS correctly parses CIP-30 CBOR balance (no more '?')
    let balanceAda = '0';
    try {
      const lovelace = await _meshWallet.getLovelace();
      balanceAda = (Number.parseInt(lovelace || '0', 10) / 1_000_000).toFixed(2);
    } catch {
      balanceAda = '0';
    }

    return {
      connected: true,
      address: _walletAddress,
      walletName,
      networkId,
      networkName: networkId === 0 ? 'Preprod Testnet' : 'Mainnet',
      balanceAda,
    };
  } catch (err) {
    _wallet = null;
    _meshWallet = null;
    throw new Error(`Failed to connect ${walletName}: ${err.message}`);
  }
}

export async function disconnectWallet() {
  _wallet = null;
  _meshWallet = null;
  _walletName = null;
  _walletAddress = null;
}

export function getConnectedWallet() { return _wallet; }
export function getConnectedMeshWallet() { return _meshWallet; }
export function getConnectedAddress() { return _walletAddress; }
export function getConnectedWalletName() { return _walletName; }

// ────────────────────────────────────────────
// Sign Challenge — proves wallet ownership (login)
// ────────────────────────────────────────────
export async function signChallenge(address, message) {
  if (!_wallet) throw new Error('Wallet not connected');
  const hexMessage = Array.from(new TextEncoder().encode(message))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return _wallet.signData(address || _walletAddress, hexMessage);
}

// ────────────────────────────────────────────
// Get Wallet Balance — uses MeshJS BrowserWallet (real ADA, no CBOR parsing)
// ────────────────────────────────────────────
export async function getWalletBalance(address) {
  // Use MeshJS BrowserWallet — correctly parses CBOR, returns real lovelace
  if (_meshWallet) {
    try {
      const lovelace = await _meshWallet.getLovelace();
      return (Number.parseInt(lovelace || '0', 10) / 1_000_000).toFixed(2);
    } catch { /* fall through to Blockfrost */ }
  }
  // Fallback: Blockfrost API for wallet not connected in-browser
  const addr = address || _walletAddress;
  if (!BLOCKFROST_KEY || BLOCKFROST_KEY === 'preprodfake' || !addr) return null;
  try {
    const res = await fetch(`${BLOCKFROST_BASE}/addresses/${addr}`, {
      headers: { project_id: BLOCKFROST_KEY }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const lovelace = data.amount?.find(a => a.unit === 'lovelace')?.quantity || '0';
    return (Number.parseInt(lovelace, 10) / 1_000_000).toFixed(2);
  } catch { return null; }
}

// ────────────────────────────────────────────
// Get NFTs owned by address
// ────────────────────────────────────────────
export async function getMediChainNFTs(address) {
  if (_wallet) {
    try {
      const assets = await _wallet.getAssets();
      return assets
        .filter(a => a.quantity === '1')
        .map(a => ({
          unit: a.unit,
          policyId: a.unit.slice(0, 56),
          assetName: a.assetName,
          fingerprint: a.fingerprint,
          metadata: a.metadata,
          cardanoScanUrl: `${CARDANOSCAN_BASE}/token/${a.unit}`,
        }));
    } catch { /* fall through */ }
  }
  if (!BLOCKFROST_KEY || BLOCKFROST_KEY === 'preprodfake') return [];
  try {
    const addr = address || _walletAddress;
    const res = await fetch(`${BLOCKFROST_BASE}/addresses/${addr}/utxos`, {
      headers: { project_id: BLOCKFROST_KEY }
    });
    if (!res.ok) return [];
    const utxos = await res.json();
    const nfts = [];
    for (const utxo of utxos) {
      for (const amount of utxo.amount || []) {
        if (amount.unit !== 'lovelace' && amount.quantity === '1') {
          nfts.push({
            unit: amount.unit,
            policyId: amount.unit.slice(0, 56),
            txHash: utxo.tx_hash,
            cardanoScanUrl: `${CARDANOSCAN_BASE}/token/${amount.unit}`,
          });
        }
      }
    }
    return nfts;
  } catch { return []; }
}

// ────────────────────────────────────────────
// MINT Medical Record NFT (CIP-25 standard)
// Uses MeshJS BrowserWallet + ForgeScript native policy
// ────────────────────────────────────────────
export async function mintMedicalRecordNFT({ patientName, patientId, recordType, doctorName, hospitalName, recordHash, recordId }) {
  if (!_meshWallet) {
    return createMockNFTResult({ patientName, recordType, recordId, error: 'Connect a Cardano wallet first' });
  }
  try {
    const { Transaction, ForgeScript, resolvePaymentKeyHash, resolveScriptHash } = await import('@meshsdk/core');

    const changeAddress = await _meshWallet.getChangeAddress();
    const keyHash = resolvePaymentKeyHash(changeAddress);
    const forgingScript = ForgeScript.withOneSignature(keyHash);
    const policyId = resolveScriptHash(forgingScript);

    const timestamp = Date.now().toString(36).toUpperCase();
    const assetName = `MC${(recordType || 'REC').slice(0, 3)}${timestamp}`;
    const assetHex = Array.from(new TextEncoder().encode(assetName))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const tx = new Transaction({ initiator: _meshWallet }).mintAsset(
      forgingScript,
      {
        assetName,
        assetQuantity: '1',
        metadata: {
          name: `MediChain ${recordType || 'Medical'} Record`,
          description: `On-chain medical record for ${patientName || 'Patient'}`,
          patient: patientId || '',
          doctor: doctorName || '',
          hospital: hospitalName || 'MediChain AI Hospital',
          recordHash: recordHash || '',
          recordId: recordId || '',
          recordType: recordType || 'RECORD',
          issuedAt: new Date().toISOString(),
          standard: 'CIP-25',
          platform: 'MediChain AI',
          network: 'Cardano Preprod',
        },
        label: '721',
        recipient: changeAddress,
      }
    );

    const unsignedTx = await tx.build();
    const signedTx = await _meshWallet.signTx(unsignedTx);
    const txHash = await _meshWallet.submitTx(signedTx);

    return {
      success: true,
      real: true,
      txHash,
      policyId,
      assetName,
      unit: `${policyId}${assetHex}`,
      cardanoScanUrl: `${CARDANOSCAN_BASE}/transaction/${txHash}`,
      message: '✅ NFT minted on Cardano Preprod!',
    };
  } catch (err) {
    console.warn('Real minting failed, falling back to demo:', err.message);
    return createMockNFTResult({ patientName, recordType, recordId, error: err.message });
  }
}

export async function mintPrescriptionNFT({ patientName, patientId, doctorName, prescriptionId }) {
  if (!_meshWallet) {
    return createMockNFTResult({ patientName, recordType: 'PRESCRIPTION', recordId: prescriptionId, error: 'Connect a Cardano wallet first' });
  }
  try {
    const { Transaction, ForgeScript, resolvePaymentKeyHash, resolveScriptHash } = await import('@meshsdk/core');

    const changeAddress = await _meshWallet.getChangeAddress();
    const keyHash = resolvePaymentKeyHash(changeAddress);
    const forgingScript = ForgeScript.withOneSignature(keyHash);
    const policyId = resolveScriptHash(forgingScript);

    const timestamp = Date.now().toString(36).toUpperCase();
    const assetName = `MCRX${timestamp}`;
    const assetHex = Array.from(new TextEncoder().encode(assetName))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const tx = new Transaction({ initiator: _meshWallet }).mintAsset(
      forgingScript,
      {
        assetName,
        assetQuantity: '1',
        metadata: {
          name: `MediChain Prescription NFT`,
          description: `Prescription issued by Dr. ${doctorName || 'Doctor'} for ${patientName || 'Patient'}`,
          patient: patientId || '',
          doctor: doctorName || '',
          prescriptionId: prescriptionId || '',
          issuedAt: new Date().toISOString(),
          standard: 'CIP-25',
          type: 'PRESCRIPTION',
          platform: 'MediChain AI',
        },
        label: '721',
        recipient: changeAddress,
      }
    );

    const unsignedTx = await tx.build();
    const signedTx = await _meshWallet.signTx(unsignedTx);
    const txHash = await _meshWallet.submitTx(signedTx);

    return {
      success: true,
      real: true,
      txHash,
      policyId,
      assetName,
      unit: `${policyId}${assetHex}`,
      cardanoScanUrl: `${CARDANOSCAN_BASE}/transaction/${txHash}`,
      message: '✅ Prescription NFT minted on Cardano Preprod!',
    };
  } catch (err) {
    console.warn('Prescription NFT minting failed, demo mode:', err.message);
    return createMockNFTResult({ patientName, recordType: 'PRESCRIPTION', recordId: prescriptionId, error: err.message });
  }
}

// ────────────────────────────────────────────
// MINT Doctor Credential NFT
// Called when admin verifies a doctor
// ────────────────────────────────────────────
export async function mintDoctorCredentialNFT({ doctorName, doctorId, specialization, licenseNumber, hospital }) {
  if (!_meshWallet) {
    return createMockNFTResult({ patientName: doctorName, recordType: 'CREDENTIAL', recordId: doctorId, error: 'Connect a Cardano wallet first' });
  }
  try {
    const { Transaction, ForgeScript, resolvePaymentKeyHash, resolveScriptHash } = await import('@meshsdk/core');

    const changeAddress = await _meshWallet.getChangeAddress();
    const keyHash = resolvePaymentKeyHash(changeAddress);
    const forgingScript = ForgeScript.withOneSignature(keyHash);
    const policyId = resolveScriptHash(forgingScript);

    const timestamp = Date.now().toString(36).toUpperCase();
    const assetName = `MCCRED${timestamp}`;
    const assetHex = Array.from(new TextEncoder().encode(assetName))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const tx = new Transaction({ initiator: _meshWallet }).mintAsset(
      forgingScript,
      {
        assetName,
        assetQuantity: '1',
        metadata: {
          name: `MediChain Doctor Credential`,
          description: `Verified doctor credential for ${doctorName}`,
          doctor: doctorName || '',
          doctorId: doctorId || '',
          specialization: specialization || '',
          licenseNumber: licenseNumber || '',
          hospital: hospital || 'MediChain AI Hospital',
          verifiedAt: new Date().toISOString(),
          standard: 'CIP-25',
          type: 'DOCTOR_CREDENTIAL',
          platform: 'MediChain AI',
        },
        label: '721',
        recipient: changeAddress,
      }
    );

    const unsignedTx = await tx.build();
    const signedTx = await _meshWallet.signTx(unsignedTx);
    const txHash = await _meshWallet.submitTx(signedTx);

    return {
      success: true,
      real: true,
      txHash,
      policyId,
      assetName,
      unit: `${policyId}${assetHex}`,
      cardanoScanUrl: `${CARDANOSCAN_BASE}/transaction/${txHash}`,
      message: '✅ Doctor credential NFT minted on Cardano!',
    };
  } catch (err) {
    console.warn('Credential NFT minting failed, demo mode:', err.message);
    return createMockNFTResult({ patientName: doctorName, recordType: 'CREDENTIAL', recordId: doctorId, error: err.message });
  }
}

// ────────────────────────────────────────────
// Verify NFT on Cardano chain
// ────────────────────────────────────────────
export async function verifyMedicalRecordNFT(unit) {
  if (!BLOCKFROST_KEY || BLOCKFROST_KEY === 'preprodfake') {
    return {
      valid: true, mode: 'demo',
      message: 'Add real VITE_BLOCKFROST_API_KEY to verify on Cardano',
      cardanoScanUrl: `${CARDANOSCAN_BASE}/token/${unit}`,
    };
  }
  try {
    const res = await fetch(`${BLOCKFROST_BASE}/assets/${unit}`, {
      headers: { project_id: BLOCKFROST_KEY }
    });
    if (!res.ok) return { valid: false, reason: 'NFT not found on Cardano preprod' };
    const asset = await res.json();
    return {
      valid: true,
      metadata: asset.onchain_metadata,
      txHash: asset.initial_mint_tx_hash,
      cardanoScanUrl: `${CARDANOSCAN_BASE}/token/${unit}`,
      txUrl: `${CARDANOSCAN_BASE}/transaction/${asset.initial_mint_tx_hash}`,
    };
  } catch { return { valid: false, reason: 'Blockfrost error' }; }
}

// ────────────────────────────────────────────
// Live Cardano Chain Stats (via Blockfrost)
// ────────────────────────────────────────────
export async function getLatestBlock() {
  if (!BLOCKFROST_KEY || BLOCKFROST_KEY === 'preprodfake') {
    return { height: 2847391, epoch: 584, slot: 71234567, txCount: 12, mode: 'demo' };
  }
  try {
    const res = await fetch(`${BLOCKFROST_BASE}/blocks/latest`, {
      headers: { project_id: BLOCKFROST_KEY }
    });
    if (!res.ok) return null;
    const block = await res.json();
    return {
      height: block.height, hash: block.hash,
      epoch: block.epoch, slot: block.slot, txCount: block.tx_count,
      cardanoScanUrl: `${CARDANOSCAN_BASE}/block/${block.hash}`,
    };
  } catch { return null; }
}

export async function getCurrentEpoch() {
  if (!BLOCKFROST_KEY || BLOCKFROST_KEY === 'preprodfake') {
    return { epoch: 584, txCount: 23847, fees: '18234.5', mode: 'demo' };
  }
  try {
    const res = await fetch(`${BLOCKFROST_BASE}/epochs/latest`, {
      headers: { project_id: BLOCKFROST_KEY }
    });
    if (!res.ok) return null;
    const e = await res.json();
    return {
      epoch: e.epoch,
      txCount: e.tx_count,
      fees: (Number.parseInt(e.fees, 10) / 1_000_000).toFixed(2),
    };
  } catch { return null; }
}

export async function getTransactionDetails(txHash) {
  const url = `${CARDANOSCAN_BASE}/transaction/${txHash}`;
  if (!BLOCKFROST_KEY || BLOCKFROST_KEY === 'preprodfake') {
    return { txHash, status: 'demo', cardanoScanUrl: url };
  }
  try {
    const res = await fetch(`${BLOCKFROST_BASE}/txs/${txHash}`, {
      headers: { project_id: BLOCKFROST_KEY }
    });
    if (!res.ok) return { txHash, status: 'pending', cardanoScanUrl: url };
    const tx = await res.json();
    return {
      txHash, block: tx.block, fees: Number.parseInt(tx.fees, 10) / 1_000_000,
      status: 'confirmed', cardanoScanUrl: url,
    };
  } catch { return { txHash, status: 'unknown', cardanoScanUrl: url }; }
}

// ────────────────────────────────────────────
// URL Helpers
// ────────────────────────────────────────────
export const getTxUrl = txHash => `${CARDANOSCAN_BASE}/transaction/${txHash}`;
export const getAddressUrl = addr => `${CARDANOSCAN_BASE}/address/${addr}`;
export const getTokenUrl = unit => `${CARDANOSCAN_BASE}/token/${unit}`;

// ────────────────────────────────────────────
// PAY FOR AI SERVICE — real ADA deduction via Masumi protocol
// Sends a real Cardano transaction deducting ADA from connected wallet
// Shows up in Lace wallet transaction history
// ────────────────────────────────────────────
// Hospital/platform receiving wallet on preprod
const PLATFORM_WALLET = 'addr_test1qz3s0c370u0zzwhl4af5u5k53n5c8dkphsrcs5cz64y4w9sksqzjl2t9vcg3xjz4ezdpwq4q3cqdv5hcgtvykccxqksw0pvzh';

export async function payForAIService({ serviceType, amountAda, description, patientId, doctorId }) {
  if (!_meshWallet) {
    // Demo mode — generate fake TX for display
    const demoTx = `masumi${Date.now().toString(16)}${(Date.now() % 0xFFFFFF).toString(16)}`;
    return {
      success: true, real: false, mode: 'demo',
      txHash: demoTx,
      amountAda,
      serviceType,
      cardanoScanUrl: `${CARDANOSCAN_BASE}/transaction/${demoTx}`,
      message: `Demo: ₳${amountAda} charged for ${serviceType}. Connect Lace for real deduction.`,
    };
  }
  try {
    const { Transaction } = await import('@meshsdk/core');
    const changeAddress = await _meshWallet.getChangeAddress();

    // Send real ADA to platform wallet as payment for AI service
    const lovelace = String(Math.round(parseFloat(amountAda) * 1_000_000));

    const tx = new Transaction({ initiator: _meshWallet })
      .sendLovelace({ address: PLATFORM_WALLET }, lovelace)
      .setMetadata(674, {
        msg: [`MediChain AI — ${serviceType} Payment`],
        service: serviceType,
        amountAda: String(amountAda),
        from: changeAddress,
        to: PLATFORM_WALLET,
        description,
        patientId: patientId || '',
        doctorId: doctorId || '',
        timestamp: new Date().toISOString(),
        protocol: 'Masumi',
        platform: 'MediChain AI',
      });

    const unsignedTx = await tx.build();
    const signedTx = await _meshWallet.signTx(unsignedTx);
    const txHash = await _meshWallet.submitTx(signedTx);

    console.log(`✅ Real ADA payment: ₳${amountAda} for ${serviceType} | TX: ${txHash}`);

    return {
      success: true, real: true,
      txHash,
      amountAda,
      serviceType,
      from: changeAddress,
      to: PLATFORM_WALLET,
      cardanoScanUrl: `${CARDANOSCAN_BASE}/transaction/${txHash}`,
      message: `✅ ₳${amountAda} deducted for ${serviceType} — real Cardano TX`,
    };
  } catch (err) {
    console.warn('ADA payment failed, demo mode:', err.message);
    const demoTx = `masumi${Date.now().toString(16)}`;
    return {
      success: true, real: false, mode: 'demo', error: err.message,
      txHash: demoTx, amountAda, serviceType,
      cardanoScanUrl: `${CARDANOSCAN_BASE}/transaction/${demoTx}`,
      message: `Demo TX (${err.message?.slice(0, 40)})`,
    };
  }
}

// ────────────────────────────────────────────
// ANCHOR Record Hash On-chain (CIP-674 metadata)
// Stores SHA-256 hash of medical record as Cardano tx metadata
// Proves tamper-proof record existence WITHOUT storing medical data
// ────────────────────────────────────────────
export async function anchorRecordHashOnChain({ recordId, recordType, patientId, doctorId, dataHash }) {
  if (!_meshWallet) {
    const mockTx = `demo${Date.now().toString(16)}`;
    return {
      success: true, real: false, mode: 'demo', txHash: mockTx,
      cardanoScanUrl: `${CARDANOSCAN_BASE}/transaction/${mockTx}`,
      message: 'Connect wallet to anchor real hash on Cardano',
    };
  }
  try {
    const { Transaction } = await import('@meshsdk/core');
    const changeAddress = await _meshWallet.getChangeAddress();

    // CIP-674: custom metadata label for MediChain
    const metadata = {
      674: {
        msg: ['MediChain AI — Record Hash Anchor'],
        recordId,
        recordType,
        patientId,
        doctorId,
        dataHash: dataHash || `sha256:${Date.now().toString(16)}`,
        anchoredAt: new Date().toISOString(),
        platform: 'MediChain AI',
        network: 'Cardano Preprod',
      },
    };

    const tx = new Transaction({ initiator: _meshWallet })
      .sendLovelace({ address: changeAddress }, '1500000') // min ADA to self
      .setMetadata(674, metadata[674]);

    const unsignedTx = await tx.build();
    const signedTx = await _meshWallet.signTx(unsignedTx);
    const txHash = await _meshWallet.submitTx(signedTx);

    return {
      success: true, real: true, txHash,
      cardanoScanUrl: `${CARDANOSCAN_BASE}/transaction/${txHash}`,
      message: `✅ Record hash anchored on Cardano — immutable proof`,
    };
  } catch (err) {
    const mockTx = `demo${Date.now().toString(16)}`;
    return {
      success: true, real: false, mode: 'demo', txHash: mockTx, error: err.message,
      cardanoScanUrl: `${CARDANOSCAN_BASE}/transaction/${mockTx}`,
    };
  }
}

// ────────────────────────────────────────────
// Mock fallback for demo mode
// ────────────────────────────────────────────
function createMockNFTResult({ patientName, recordType, recordId, error }) {
  const mockTxHash = `demo${Date.now().toString(16)}${(Date.now() % 0xFFFFFF).toString(16).padStart(6,'0')}`;
  return {
    success: true, real: false, mode: 'demo',
    txHash: mockTxHash,
    assetName: `MC${(recordType || 'REC').slice(0, 3)}${Date.now().toString(36).toUpperCase()}`,
    cardanoScanUrl: `${CARDANOSCAN_BASE}/transaction/${mockTxHash}`,
    message: error
      ? `Demo mode (${error}). Install Lace wallet + get test ADA.`
      : 'Demo mode — Install Lace/Eternl + fund from faucet to mint real NFTs',
    getTestAdaUrl: 'https://docs.cardano.org/cardano-testnets/tools/faucet/',
  };
}

// Use getConnectedWallet(), getConnectedMeshWallet(), getConnectedAddress() instead of direct access
