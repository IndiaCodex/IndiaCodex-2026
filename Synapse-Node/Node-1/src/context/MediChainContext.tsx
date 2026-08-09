"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useWallet } from "@meshsdk/react";
import {
  MedicalRecord,
  AccessRequest,
  initialRecords,
  initialAccessRequests,
  mockPatient,
  PatientProfile,
} from "@/data/mockData";

export interface Notification {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
}

interface MediChainState {
  records: MedicalRecord[];
  accessRequests: AccessRequest[];
  notifications: Notification[];
  alertVisible: boolean;
  patientSearched: boolean;
  searchedPatient: PatientProfile | null;
  paymentLoading: boolean;
  approvingId: string | null;
}

interface MediChainActions {
  requestAccess: (recordId: string) => void;
  approveAccess: (requestId: string) => Promise<void>;
  denyAccess: (requestId: string) => void;
  searchPatient: (address: string) => void;
  clearSearch: () => void;
  triggerPayment: () => Promise<void>;
  showAlert: () => void;
  dismissAlert: () => void;
  addNotification: (message: string, type?: Notification["type"]) => void;
  removeNotification: (id: string) => void;
}

type MediChainContextType = MediChainState & MediChainActions;

const MediChainContext = createContext<MediChainContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// DEMO_MODE: Forces the UI to show "Approved" regardless of signature outcome.
// Flip to `false` for production to require a real wallet signature.
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_MODE = true;

export function MediChainProvider({ children }: { children: ReactNode }) {
  const { wallet, connected } = useWallet();

  const [records, setRecords] = useState<MedicalRecord[]>(initialRecords);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(initialAccessRequests);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [patientSearched, setPatientSearched] = useState(false);
  const [searchedPatient, setSearchedPatient] = useState<PatientProfile | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const addNotification = useCallback((message: string, type: Notification["type"] = "success") => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const requestAccess = useCallback(
    (recordId: string) => {
      const record = records.find((r) => r.id === recordId);
      if (!record || record.accessRequested || !record.locked) return;

      setRecords((prev) =>
        prev.map((r) =>
          r.id === recordId
            ? { ...r, accessRequested: true, requestedBy: "Dr. Priya Sharma" }
            : r
        )
      );

      const newRequest: AccessRequest = {
        id: `areq-${Date.now()}`,
        recordId,
        recordName: record.name,
        doctorName: "Dr. Priya Sharma",
        doctorAddress: "addr1q9h8vf3...k4x7nz",
        timestamp: new Date().toISOString(),
        status: "pending",
      };

      setAccessRequests((prev) => [...prev, newRequest]);
      addNotification(`Access requested for "${record.name}"`, "info");
    },
    [records, addNotification]
  );

  const approveAccess = useCallback(
    async (requestId: string) => {
      setApprovingId(requestId);

      const request = accessRequests.find((r) => r.id === requestId);
      if (!request) {
        setApprovingId(null);
        return;
      }

      // ── Step 1: Build & hex-encode the CIP-8 payload ──────────────────────
      console.log("⛓️  [MediChain] Step 1: Building GRANT_ACCESS payload...", {
        recordId: request.recordId,
        grantedTo: request.doctorAddress,
      });
      const payload = JSON.stringify({
        action: "GRANT_ACCESS",
        recordId: request.recordId,
        recordName: request.recordName,
        grantedTo: request.doctorAddress,
        grantedBy: "patient",
        timestamp: new Date().toISOString(),
      });
      // Explicit UTF-8 → hex conversion (avoids encoding-related checksum errors)
      const hexPayload = Buffer.from(payload, "utf8").toString("hex");
      console.log("⛓️  [MediChain] Step 2: Payload hex-encoded ✓", hexPayload.slice(0, 32) + "...");

      let signatureHex = "DEMO_SIM_NO_WALLET";
      let signingSucceeded = false;

      if (connected && wallet) {
        // ── Step 2: Normalize address — always use getUsedAddresses()[0] ────
        let address = "";
        try {
          console.log("⛓️  [MediChain] Step 3: Fetching normalized address via getUsedAddresses()...");
          const usedAddresses = await wallet.getUsedAddresses();
          address = usedAddresses[0] ?? "";
          if (!address) {
            // Edge-case: brand-new wallet with no used addresses yet
            address = await wallet.getChangeAddress();
          }
          console.log("⛓️  [MediChain] Step 3: Address resolved ✓", address.slice(0, 20) + "...");
        } catch (addrErr) {
          console.warn("⛓️  [MediChain] Step 3: Address fetch failed, proceeding in DEMO_MODE.", addrErr);
        }

        // ── Step 3: Attempt 1 — Standard CIP-8 signData(address, payload) ──
        try {
          console.log("⛓️  [MediChain] Step 4: Triggering CIP-8 Signature [Attempt 1 — with address]...");
          const sig = await wallet.signData(address, hexPayload);
          signatureHex = typeof sig === "string" ? sig : JSON.stringify(sig);
          signingSucceeded = true;
          console.log("⛓️  [MediChain] Step 4: CIP-8 Signature captured ✓", signatureHex.slice(0, 32) + "...");
          addNotification("🔐 Lace wallet signature captured!", "info");
        } catch (err1: unknown) {
          const msg1 = err1 instanceof Error ? err1.message : String(err1);
          console.warn("⛓️  [MediChain] Step 4: Attempt 1 failed:", msg1, "→ falling back to simplified signData...");

          // Check if user explicitly rejected (don't retry)
          const isUserRejection = /user|declined|cancel|rejected|refused/i.test(msg1);

          if (!isUserRejection) {
            // ── Step 4: Attempt 2 — Simplified signData(hexPayload) only ───
            try {
              console.log("⛓️  [MediChain] Step 5: Triggering CIP-8 Signature [Attempt 2 — payload-only]...");
              const sig2 = await (wallet as unknown as { signData: (p: string) => Promise<unknown> }).signData(hexPayload);
              signatureHex = typeof sig2 === "string" ? sig2 : JSON.stringify(sig2);
              signingSucceeded = true;
              console.log("⛓️  [MediChain] Step 5: Simplified signature captured ✓", signatureHex.slice(0, 32) + "...");
              addNotification("🔐 Wallet signature captured (simplified)!", "info");
            } catch (err2: unknown) {
              const msg2 = err2 instanceof Error ? err2.message : String(err2);
              console.warn("⛓️  [MediChain] Step 5: Attempt 2 also failed:", msg2);
            }
          } else {
            console.log("⛓️  [MediChain] User rejected the signature prompt.");
          }
        }
      } else {
        // No wallet connected at all
        console.log("⛓️  [MediChain] No wallet connected — running in DEMO_MODE simulation.");
        addNotification("🔑 No wallet connected — DEMO_MODE active, simulating on-chain TX...", "warning");
      }

      // ── DEMO_MODE Bypass ──────────────────────────────────────────────────
      // In DEMO_MODE the UI always proceeds to "Approved" regardless of
      // signature outcome. Flip `DEMO_MODE = false` for production.
      if (!signingSucceeded) {
        if (DEMO_MODE) {
          console.log("⛓️  [MediChain] DEMO_MODE: Signature bypassed — forcing approved state after 1s delay.");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          signatureHex = `DEMO_${Date.now().toString(16).toUpperCase()}`;
        } else {
          // Production: abort if no real signature
          console.error("⛓️  [MediChain] PRODUCTION: Signing failed — aborting state update.");
          addNotification("❌ Signature failed — access NOT granted.", "error");
          setApprovingId(null);
          return;
        }
      }

      // ── Commit state: Locked → Unlocked ──────────────────────────────────
      console.log("⛓️  [MediChain] Step 6: Committing state update — record unlocked ✓");
      setRecords((prev) =>
        prev.map((r) =>
          r.id === request.recordId
            ? { ...r, locked: false, accessRequested: false, requestedBy: request.doctorName }
            : r
        )
      );

      setAccessRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "approved" as const } : r))
      );

      setApprovingId(null);
      addNotification(
        `✅ Access approved! "${request.recordName}" unlocked for ${request.doctorName}. [TX: ${signatureHex.slice(0, 14)}...]`,
        "success"
      );
      console.log("⛓️  [MediChain] ✅ Flow complete. Signature:", signatureHex.slice(0, 32) + "...");

      // Trigger Nucast allergy alert for the critical record
      if (request.recordId === "rec-005") {
        setTimeout(() => setAlertVisible(true), 500);
      }
    },
    [accessRequests, addNotification, connected, wallet]
  );

  const denyAccess = useCallback(
    (requestId: string) => {
      const request = accessRequests.find((r) => r.id === requestId);
      if (!request) return;

      setRecords((prev) =>
        prev.map((r) =>
          r.id === request.recordId
            ? { ...r, accessRequested: false, requestedBy: null }
            : r
        )
      );

      setAccessRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "denied" as const } : r))
      );

      addNotification(`Access denied for "${request.recordName}"`, "warning");
    },
    [accessRequests, addNotification]
  );

  const searchPatient = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (address: string) => {
      // In production, this would query the blockchain with the address
      setPatientSearched(true);
      setSearchedPatient(mockPatient);
      addNotification("Patient record found on-chain ✓", "info");
    },
    [addNotification]
  );

  const clearSearch = useCallback(() => {
    setPatientSearched(false);
    setSearchedPatient(null);
  }, []);

  const triggerPayment = useCallback(async () => {
    setPaymentLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setPaymentLoading(false);
    addNotification("💰 Consultation payment of 15 ₳ processed! TX#7c3f1...e829", "success");
  }, [addNotification]);

  const showAlert = useCallback(() => setAlertVisible(true), []);
  const dismissAlert = useCallback(() => setAlertVisible(false), []);

  const value: MediChainContextType = {
    records,
    accessRequests,
    notifications,
    alertVisible,
    patientSearched,
    searchedPatient,
    paymentLoading,
    approvingId,
    requestAccess,
    approveAccess,
    denyAccess,
    searchPatient,
    clearSearch,
    triggerPayment,
    showAlert,
    dismissAlert,
    addNotification,
    removeNotification,
  };

  return <MediChainContext.Provider value={value}>{children}</MediChainContext.Provider>;
}

export function useMediChain() {
  const context = useContext(MediChainContext);
  if (!context) {
    throw new Error("useMediChain must be used within a MediChainProvider");
  }
  return context;
}
