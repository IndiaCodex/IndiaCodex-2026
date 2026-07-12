import { useState } from 'react';
import { Lucid, Blockfrost, fromText } from '@lucid-evolution/lucid';
import { Recommendation } from '../components/RecommendationCard';

export interface MintResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export function useChargePassMint() {
  const [isMinting, setIsMinting] = useState(false);

  const mintChargePass = async (recommendation: Recommendation): Promise<MintResult> => {
    setIsMinting(true);
    try {
      const blockfrostKey = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;

      // Fallback condition for hackathon demo safety
      if (!blockfrostKey || typeof window === 'undefined' || !window.cardano?.lace) {
        console.warn("Using simulation mode: Either Blockfrost key or Lace wallet is missing.");
        await new Promise(r => setTimeout(r, 2000));
        return {
          success: true,
          txHash: "mock_tx_" + Date.now().toString(16) + Math.random().toString(16).substring(2),
        };
      }

      const laceApi = await window.cardano.lace.enable();
      const lucid = await Lucid(
        new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", blockfrostKey),
        "Preprod"
      );
      lucid.selectWallet.fromAPI(laceApi);

      const address = await lucid.wallet().address();
      const { paymentCredential } = lucid.utils.getAddressDetails(address);
      if (!paymentCredential) {
        throw new Error("Could not extract payment credential from the connected wallet.");
      }

      const mintingPolicy = lucid.utils.nativeScriptFromJson({
        type: "all",
        scripts: [{ type: "sig", keyHash: paymentCredential.hash }],
      });
      const policyId = lucid.utils.mintingPolicyToId(mintingPolicy);

      const assetName = "ChargePass";
      const hexAssetName = fromText(assetName);
      
      const metadata = {
        [policyId]: {
          [assetName]: {
            name: "ChargePass Reservation",
            image: "ipfs://QmRyJqfG8n8W3iWe4M5n79WkYgM4uYvGZ1uVj1Kx3iV3m7", 
            reservationId: "CP-" + Date.now(),
            chargerName: recommendation?.chargerName || "Selected Charger",
            arrivalTime: recommendation?.arrivalTime || "TBD",
            slot: recommendation?.availableSlot || "Any Slot",
            pricing: recommendation?.pricing || "Standard Rate",
            gridLoad: recommendation?.gridLoad || "Unknown",
            carbonSaved: recommendation?.carbonSaved || "0 kg",
            status: "RESERVED",
            timestamp: new Date().toISOString(),
          }
        }
      };

      const tx = await lucid
        .newTx()
        .mintAssets({ [policyId + hexAssetName]: 1n })
        .attachMetadata(721, metadata)
        .validTo(Date.now() + 100000)
        .attach.MintingPolicy(mintingPolicy)
        .pay.ToAddress(address, { [policyId + hexAssetName]: 1n })
        .complete();

      const signedTx = await tx.sign.withWallet().complete();
      const txHash = await signedTx.submit();

      return { success: true, txHash };

    } catch (err: any) {
      console.error("Minting Error:", err);
      return { success: false, error: err.message || "An unknown error occurred during minting." };
    } finally {
      setIsMinting(false);
    }
  };

  return { mintChargePass, isMinting };
}
