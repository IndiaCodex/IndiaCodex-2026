"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { db, storage } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

export const UploadZone = ({ onUploadComplete }: { onUploadComplete: (doc: any) => void }) => {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [consent, setConsent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!consent) {
      alert("Please check the policy consent box before uploading files.");
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!consent) {
      alert("Please check the policy consent box before uploading files.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    setSuccess(false);

    try {
      let storageUrl = "";
      
      // 1. Upload to Firebase Storage FIRST
      if (storage) {
        try {
          const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
          const storageRef = ref(storage, `users/${user.uid}/documents/${Date.now()}_${file.name}`);
          const uploadSnap = await uploadBytes(storageRef, file);
          storageUrl = await getDownloadURL(uploadSnap.ref);
        } catch (storageError) {
          console.error("Storage upload error:", storageError);
        }
      }

      // 2. Then call our FastAPI Ingestion Endpoint for AI processing
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://127.0.0.1:8000/ingestion/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      
      let firestoreDocId = Math.random().toString(36).substr(2, 9);

      if (db) {
        try {
          const { collection, addDoc } = await import("firebase/firestore");
          
          const docRef = await addDoc(collection(db, "documents"), {
            userId: user.uid,
            title: file.name,
            category: data.category || "General",
            summary: data.summary || "No summary available.",
            timeline_events: data.timeline_events || [],
            reminders: data.reminders || [],
            fileUrl: storageUrl,
            createdAt: new Date().toISOString(),
            verified: false,
            txHash: null,
            walletAddress: null
          });
          firestoreDocId = docRef.id;

          // Automatically generate Calendar Events
          if (data.timeline_events && Array.isArray(data.timeline_events)) {
            for (const ev of data.timeline_events) {
              await addDoc(collection(db, "calendarEvents"), {
                userId: user.uid,
                docId: firestoreDocId,
                title: ev.event,
                date: ev.date,
                type: "timeline",
                categoryType: "event",
                createdAt: new Date().toISOString()
              });
            }
          }

          if (data.reminders && Array.isArray(data.reminders)) {
            for (const rem of data.reminders) {
              let type = "expiration";
              const rTitle = rem.reminder.toLowerCase();
              if (rTitle.includes("warranty") || (data.category && data.category.toLowerCase().includes("warranty"))) {
                type = "warranty";
              }
              await addDoc(collection(db, "calendarEvents"), {
                userId: user.uid,
                docId: firestoreDocId,
                title: rem.reminder,
                date: rem.date,
                type: type,
                categoryType: "task",
                createdAt: new Date().toISOString()
              });
            }
          }
        } catch (dbError) {
          console.error("Firestore database write error:", dbError);
        }
      }

      const newDoc = {
        id: firestoreDocId,
        title: file.name,
        category: data.category || "General",
        summary: data.summary || "No summary available.",
        timeline_events: data.timeline_events || [],
        reminders: data.reminders || [],
        fileUrl: storageUrl,
        createdAt: new Date().toISOString(),
        verified: false,
        txHash: null,
        walletAddress: null
      };

      onUploadComplete(newDoc);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error(error);
      alert("Failed to upload document");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!consent) {
            alert("Please check the policy consent box before uploading files.");
            return;
          }
          fileInputRef.current?.click();
        }}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          !consent ? "opacity-50 cursor-not-allowed border-white/5" :
          isDragging ? "border-brand-primary-light bg-brand-primary-light/10" : "border-white/10 hover:border-brand-primary-dark/50 bg-white/5"
        }`}
      >
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg"
        />
        
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center text-brand-success"
            >
              <CheckCircle size={48} className="mb-2" />
              <p className="font-medium text-sm">Ingestion Complete!</p>
            </motion.div>
          ) : isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-10 h-10 border-4 border-brand-primary-dark border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-text-secondary text-sm">Processing & Vaulting...</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-text-muted"
            >
              <UploadCloud size={44} className="mb-3 text-brand-secondary/50" />
              <p className="font-medium text-xs text-text-primary">Click or drag document to upload</p>
              <p className="text-[10px] mt-1">PDFs, PNGs, and JPGs supported.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Policy Consent Disclaimer */}
      <div className="flex items-start space-x-2.5 bg-black/40 border border-white/5 p-3 rounded-xl text-left">
        <input 
          type="checkbox" 
          id="policy-consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 accent-brand-primary-light"
        />
        <label htmlFor="policy-consent" className="text-[10px] text-text-secondary leading-relaxed cursor-pointer select-none">
          I consent to uploading files to Firebase Storage, sending payloads to NVIDIA LLaMA models for AI analysis, and storing metadata in Firestore.
        </label>
      </div>
    </div>
  );
};
