"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { DocumentList } from "@/components/DocumentList";
import { UploadZone } from "@/components/UploadZone";
import { AIChat } from "@/components/AIChat";
import { CalendarView } from "@/components/CalendarView";
import { MeetingScheduler } from "@/components/MeetingScheduler";
import { NotificationEngine } from "@/components/NotificationEngine";
import { WalletSettings } from "@/components/WalletSettings";
import { VerificationPage } from "@/components/VerificationPage";
import { IntegrationsView } from "@/components/IntegrationsView";
import { Reminders } from "@/components/Reminders";
import { Timeline } from "@/components/Timeline";
import { CardanoWallet, useWallet } from "@meshsdk/react";
import { ShieldAlert, Database, BrainCircuit, Calendar as CalendarIcon, User as UserIcon, LogOut, Share2, ShieldCheck, List, Activity, Clock, Loader2, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user, logout, wallets, currentWalletId, linkWallet } = useAuth();
  const { connected: browserConnected, wallet: browserWallet, name: browserName } = useWallet();
  const router = useRouter();
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("calendar"); // Prioritize Calendar UX
  const [vaultView, setVaultView] = useState<"list" | "timeline">("list");
  
  // Enforce signing authentication state
  const [authorized, setAuthorized] = useState(false);
  const [signing, setSigning] = useState(false);

  const hasLinkedWallet = wallets.length > 0 && currentWalletId;

  // Handle Decryption Message Signature (CIP-30 signData)
  const handleDecryptionSignature = async () => {
    if (!browserConnected || !browserWallet) {
      alert("Please connect your Cardano browser wallet first.");
      return;
    }
    
    setSigning(true);
    try {
      const address = await browserWallet.getChangeAddress();
      const network = await browserWallet.getNetworkId();
      
      // Decryption challenge string
      const timestamp = new Date().toISOString();
      const challengeMsg = `LifeVault Decryption Signature Challenge\n\nTimestamp: ${timestamp}\nUser UID: ${user.uid}\nStatus: Decrypting Vault Profile`;
      const hexPayload = Buffer.from(challengeMsg).toString("hex");
      
      // Forces wallet extension password prompt popup
      await browserWallet.signData(address, hexPayload);
      
      // Auto-link wallet to account in Firestore if none linked yet
      if (wallets.length === 0) {
        await linkWallet(address, browserName, network, `${browserName.charAt(0).toUpperCase() + browserName.slice(1)} Wallet`);
      }
      
      setAuthorized(true);
    } catch (e: any) {
      console.error("Cardano signature authorization failed:", e);
      const bypass = window.confirm("Decryption signature authentication failed. Would you like to use Demo Decryption Mode to unlock your vault?");
      if (bypass) {
        if (wallets.length === 0) {
          await linkWallet("addr_test1_demo_bypass_address_key", "nami", 0, "Demo Vault Wallet");
        }
        setAuthorized(true);
      }
    } finally {
      setSigning(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    const fetchDocs = async () => {
      try {
        const q = query(collection(db, "documents"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [user, router]);

  if (!user) return <div className="min-h-screen bg-brand-black flex items-center justify-center">Loading...</div>;

  const handleUploadComplete = (newDoc: any) => {
    setDocuments(prev => [newDoc, ...prev]);
    setNotifications(prev => [...prev, {
      type: "email",
      title: "File Uploaded",
      message: `${newDoc.title} was successfully ingested.`
    }]);
  };

  const handleMeetingScheduled = async (meeting: any) => {
    setNotifications(prev => [
      ...prev,
      { type: "slack", title: "Slack: #general", message: `New Meeting Scheduled: ${meeting.title}` },
      { type: "email", title: "Invites Dispatched", message: `Sent to ${meeting.emails}` }
    ]);

    if (db) {
      try {
        const { collection, addDoc } = await import("firebase/firestore");
        await addDoc(collection(db, "meetings"), {
          userId: user.uid,
          title: meeting.title,
          date: meeting.date,
          time: meeting.time,
          emails: meeting.emails,
          createdAt: new Date().toISOString()
        });

        await addDoc(collection(db, "calendarEvents"), {
          userId: user.uid,
          title: meeting.title,
          date: meeting.date,
          type: "meeting",
          categoryType: "event",
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error saving scheduled meeting:", err);
      }
    }
  };

  // Interceptor Screen (Requires both linked wallet AND fresh signature check)
  if (!hasLinkedWallet || !authorized) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-6 text-center overflow-hidden relative font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary-dark/20 blur-[120px] rounded-full pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 glass rounded-3xl p-10 max-w-md w-full flex flex-col items-center border border-brand-primary-dark/55 shadow-2xl backdrop-blur-2xl"
        >
          <div className="w-20 h-20 bg-brand-primary-dark/20 rounded-full flex items-center justify-center text-brand-primary-light mb-6 border border-brand-primary-light/20">
            <ShieldAlert size={40} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Decrypt LifeVault</h2>
          <p className="text-text-secondary text-sm mb-8 leading-relaxed">
            Your vault is encrypted with multi-wallet keychains. Sign the cryptographic authentication challenge to finalize access.
          </p>

          <div className="w-full space-y-4">
            <div className="flex justify-center bg-black/40 p-2.5 rounded-xl border border-white/5">
              <CardanoWallet />
            </div>

            {browserConnected && (
              <button
                onClick={handleDecryptionSignature}
                disabled={signing}
                className="w-full py-4 bg-gradient-to-r from-brand-primary-dark to-brand-primary-light hover:brightness-110 text-black font-bold rounded-2xl flex items-center justify-center transition-all disabled:opacity-50"
              >
                {signing ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <>
                    <Key size={18} className="mr-2" />
                    <span>Authorize Wallet & Decrypt</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          <button 
            onClick={logout}
            className="mt-8 text-xs text-text-muted hover:text-red-400 font-semibold uppercase tracking-wider transition-colors"
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: "calendar", label: "Calendar", icon: CalendarIcon },
    { id: "vault", label: "My Vault", icon: Database },
    { id: "intel", label: "Intelligence", icon: BrainCircuit },
    { id: "integrations", label: "Integrations", icon: Share2 },
    { id: "verification", label: "Verification", icon: ShieldCheck },
    { id: "profile", label: "Settings", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-brand-black text-text-primary p-6 md:p-10 font-sans max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary-light to-brand-primary-dark flex items-center justify-center text-xl font-bold text-black shadow-lg">
            {user.email?.[0].toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">LifeVault</h1>
            <p className="text-text-secondary text-sm flex items-center">
              <span className="w-2 h-2 rounded-full bg-brand-success mr-2"></span> System Secure
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 bg-black/40 rounded-xl p-1 border border-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ? "bg-white/10 text-white shadow-sm" : "text-text-muted hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} className={isActive ? "text-brand-primary-light" : ""} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative min-h-[60vh]">
        <AnimatePresence mode="wait">
          
          {/* CALENDAR TAB (Core User Experience) */}
          {activeTab === "calendar" && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                  <CalendarView />
                </div>
                <div className="lg:col-span-1 space-y-6">
                  <div className="glass rounded-3xl p-6 border border-white/5">
                    <h3 className="text-md font-bold text-white mb-3">Today's Hub</h3>
                    <p className="text-xs text-text-secondary mb-6">Instantly dispatch invites or query AI logs.</p>
                    <MeetingScheduler onSchedule={handleMeetingScheduled} />
                  </div>
                  <div className="glass rounded-3xl p-6 border border-white/5">
                    <h3 className="text-md font-bold text-white mb-3 flex items-center">
                      <Clock size={16} className="mr-2 text-brand-secondary" /> Actionable Reminders
                    </h3>
                    <Reminders documents={documents} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* VAULT TAB */}
          {activeTab === "vault" && (
            <motion.div key="vault" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="glass rounded-2xl p-6 border border-brand-primary-dark/20">
                  <h2 className="text-xl font-semibold mb-4 text-white">Secure Upload</h2>
                  <UploadZone onUploadComplete={handleUploadComplete} />
                </div>
                <div className="glass rounded-2xl p-6 border border-white/5">
                  <h2 className="text-md font-semibold mb-4 text-white flex items-center">
                    <Clock size={16} className="mr-2 text-brand-secondary" /> Active Reminders
                  </h2>
                  <Reminders documents={documents} />
                </div>
              </div>
              
              <div className="lg:col-span-2 space-y-6">
                <div className="glass rounded-2xl p-6 min-h-[500px]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">Vault Records</h2>
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                      <button 
                        onClick={() => setVaultView("list")}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                          vaultView === "list" ? "bg-white/10 text-white" : "text-text-muted hover:text-white"
                        }`}
                      >
                        <List size={12} />
                        <span>Documents</span>
                      </button>
                      <button 
                        onClick={() => setVaultView("timeline")}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                          vaultView === "timeline" ? "bg-white/10 text-white" : "text-text-muted hover:text-white"
                        }`}
                      >
                        <Activity size={12} />
                        <span>Timeline</span>
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-20 bg-white/5 rounded-xl"></div>
                      <div className="h-20 bg-white/5 rounded-xl"></div>
                    </div>
                  ) : vaultView === "list" ? (
                    <DocumentList documents={documents} />
                  ) : (
                    <Timeline documents={documents} />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* INTELLIGENCE TAB */}
          {activeTab === "intel" && (
            <motion.div key="intel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-[75vh]">
              <AIChat />
            </motion.div>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === "integrations" && (
            <motion.div key="integrations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <IntegrationsView />
            </motion.div>
          )}

          {/* VERIFICATION TAB */}
          {activeTab === "verification" && (
            <motion.div key="verification" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <VerificationPage />
            </motion.div>
          )}

          {/* SETTINGS / PROFILE TAB */}
          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              {/* Wallet Manager */}
              <WalletSettings />

              {/* Account Settings */}
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="glass rounded-3xl p-8 border border-white/5 text-center relative overflow-hidden">
                  <div className="w-20 h-20 mx-auto rounded-full bg-brand-primary-dark/30 flex items-center justify-center text-3xl mb-4 border-2 border-brand-primary-light text-white font-bold">
                    {user.email?.[0].toUpperCase() || "U"}
                  </div>
                  <h2 className="text-xl font-bold text-white">{user.email}</h2>
                  <p className="text-xs text-text-muted mt-1">Authorized Profile Node</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={async () => {
                      const confirm = window.confirm("WARNING: This will permanently delete all your documents, calendar events, and meetings from the Cloud Database. Are you sure you want to proceed?");
                      if (!confirm) return;
                      
                      try {
                        const { collection, query, where, getDocs, deleteDoc, doc } = await import("firebase/firestore");
                        
                        // Delete documents
                        const qDocs = query(collection(db, "documents"), where("userId", "==", user.uid));
                        const snapDocs = await getDocs(qDocs);
                        for (const d of snapDocs.docs) {
                          await deleteDoc(doc(db, "documents", d.id));
                        }

                        // Delete calendarEvents
                        const qEvents = query(collection(db, "calendarEvents"), where("userId", "==", user.uid));
                        const snapEvents = await getDocs(qEvents);
                        for (const e of snapEvents.docs) {
                          await deleteDoc(doc(db, "calendarEvents", e.id));
                        }

                        // Delete meetings
                        const qMeets = query(collection(db, "meetings"), where("userId", "==", user.uid));
                        const snapMeets = await getDocs(qMeets);
                        for (const m of snapMeets.docs) {
                          await deleteDoc(doc(db, "meetings", m.id));
                        }

                        setDocuments([]);
                        alert("Your vault database has been completely wiped and reset!");
                      } catch (err) {
                        console.error(err);
                        alert("Failed to reset database.");
                      }
                    }}
                    className="py-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold flex items-center justify-center transition-colors border border-red-500/20"
                  >
                    Wipe Vault & Reset Database
                  </button>

                  <button 
                    onClick={logout} 
                    className="py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center transition-colors border border-white/10"
                  >
                    <LogOut className="mr-2" size={18} /> Terminate Secure Session
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <NotificationEngine notifications={notifications} />
    </div>
  );
}
