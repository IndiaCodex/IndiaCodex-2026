"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { CardanoWallet, useWallet } from "@meshsdk/react";
import { ShieldCheck, ArrowLeft, CheckCircle, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VerifyDocument() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { connected, wallet } = useWallet();
  
  const [isHashing, setIsHashing] = useState(false);
  const [hashResult, setHashResult] = useState<any>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const documentId = params.id as string;

  const handleVerify = async () => {
    if (!user || !connected) return;
    
    setIsHashing(true);
    try {
      // Step 1: Call backend to generate hash and mock Tx CBOR
      const res = await fetch("http://localhost:8000/verify/hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId, user_id: user.uid })
      });
      
      const data = await res.json();
      setHashResult(data);
      
      // Step 2: Simulate User Signing Tx with Wallet
      setIsSigning(true);
      // In reality: await wallet.signTx(data.transaction_cbor);
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      
      // Step 3: Simulate Submitting Tx
      // In reality: await wallet.submitTx(signedTx);
      const mockTxHash = "tx_" + Math.random().toString(16).substr(2, 64);
      setTxHash(mockTxHash);
      
    } catch (error) {
      console.error(error);
      alert("Verification failed");
    } finally {
      setIsHashing(false);
      setIsSigning(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Please login first.</div>;

  return (
    <div className="min-h-screen bg-brand-black text-text-primary p-6 md:p-12">
      <button 
        onClick={() => router.push("/dashboard")}
        className="flex items-center text-text-muted hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
      </button>

      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center">
          <div className="w-16 h-16 rounded-full bg-brand-primary-dark/20 flex items-center justify-center text-brand-primary-light mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-display font-bold">Cryptographic Proof</h1>
          <p className="text-text-secondary mt-2">Anchor your document immutably on the Cardano blockchain.</p>
        </header>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center p-4 bg-white/5 rounded-lg border border-white/10 mb-6">
            <FileText className="text-brand-secondary mr-4" size={24} />
            <div>
              <p className="font-medium">Document ID: {documentId}</p>
              <p className="text-sm text-text-muted">Ready for on-chain verification</p>
            </div>
          </div>

          {!connected ? (
            <div className="text-center py-6 border-2 border-dashed border-white/10 rounded-xl">
              <p className="mb-4 text-text-secondary">Connect your Cardano wallet to generate cryptographic proof.</p>
              <div className="flex justify-center">
                <CardanoWallet />
              </div>
            </div>
          ) : !txHash ? (
            <div className="flex flex-col items-center py-6">
              <p className="mb-4 text-text-secondary">Wallet Connected. Ready to sign proof.</p>
              <button
                onClick={handleVerify}
                disabled={isHashing || isSigning}
                className="px-8 py-3 bg-brand-primary-dark hover:bg-brand-primary-dark/80 text-white rounded-full font-medium transition-colors disabled:opacity-50 flex items-center"
              >
                {isHashing ? (
                  <><Loader2 className="animate-spin mr-2" size={18} /> Generating Hash...</>
                ) : isSigning ? (
                  <><Loader2 className="animate-spin mr-2" size={18} /> Awaiting Signature...</>
                ) : (
                  "Generate Proof"
                )}
              </button>
            </div>
          ) : null}
          
          <AnimatePresence>
            {txHash && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 p-6 border border-brand-success/30 bg-brand-success/10 rounded-xl"
              >
                <div className="flex items-center text-brand-success mb-4">
                  <CheckCircle size={24} className="mr-2" />
                  <h3 className="text-lg font-semibold">Document Verified On-Chain</h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-text-muted">Document Hash (SHA-256):</span>
                    <p className="font-mono text-brand-secondary break-all">{hashResult?.document_hash}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Transaction Hash:</span>
                    <p className="font-mono text-white break-all">{txHash}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Timestamp:</span>
                    <p>{new Date(hashResult?.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
