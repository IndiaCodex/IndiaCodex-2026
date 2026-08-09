"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore";

interface WalletData {
  walletId: string;
  address: string;
  provider: string;
  network: number;
  nickname: string;
  createdAt: string;
  lastUsed: string;
  verified: boolean;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  googleToken: string | null;
  wallets: WalletData[];
  currentWalletId: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  linkWallet: (address: string, provider: string, network: number, nickname: string) => Promise<void>;
  switchActiveWallet: (walletId: string) => Promise<void>;
  renameWallet: (walletId: string, nickname: string) => Promise<void>;
  deleteWallet: (walletId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  googleToken: null,
  wallets: [],
  currentWalletId: null,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
  linkWallet: async () => {},
  switchActiveWallet: async () => {},
  renameWallet: async () => {},
  deleteWallet: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [currentWalletId, setCurrentWalletId] = useState<string | null>(null);

  // Fetch linked wallets from Firestore
  const fetchWallets = async (userId: string) => {
    if (!db) return;
    try {
      const walletsRef = collection(db, "users", userId, "wallets");
      const snap = await getDocs(walletsRef);
      const list = snap.docs.map(doc => ({ walletId: doc.id, ...doc.data() } as WalletData));
      setWallets(list);
      
      // Also fetch user document to check currentWalletId
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setCurrentWalletId(userData.currentWalletId || null);
      } else {
        // Initialize user doc
        await setDoc(userRef, { currentWalletId: null, email: user?.email || null }, { merge: true });
        setCurrentWalletId(null);
      }
    } catch (err) {
      console.error("Error fetching wallets:", err);
    }
  };

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth is not initialized. Check your .env.local file.");
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchWallets(currentUser.uid);
      } else {
        setWallets([]);
        setCurrentWalletId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      alert("Firebase is not configured! Please add your API keys to .env.local");
      return;
    }
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/calendar.events");
    provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
    provider.addScope("https://www.googleapis.com/auth/drive.readonly");
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleToken(credential.accessToken);
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!auth) return;
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    if (!auth) return;
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setGoogleToken(null);
      setWallets([]);
      setCurrentWalletId(null);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  // Link a new Cardano wallet
  const linkWallet = async (address: string, provider: string, network: number, nickname: string) => {
    if (!user || !db) return;
    try {
      const walletsRef = collection(db, "users", user.uid, "wallets");
      
      // Check if wallet already exists
      const q = query(walletsRef, where("address", "==", address));
      const existing = await getDocs(q);
      
      let walletId = "";
      if (!existing.empty) {
        walletId = existing.docs[0].id;
        // Update existing wallet info
        const wDoc = doc(db, "users", user.uid, "wallets", walletId);
        await updateDoc(wDoc, {
          provider,
          network,
          lastUsed: new Date().toISOString(),
        });
      } else {
        // Create new wallet doc
        const newWalletRef = doc(walletsRef);
        walletId = newWalletRef.id;
        await setDoc(newWalletRef, {
          walletId,
          address,
          provider,
          network,
          nickname,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          verified: true,
          isActive: wallets.length === 0 // Active by default if it's the first wallet
        });
      }

      // If this is the first wallet, set it as currentWalletId in user document
      if (wallets.length === 0) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { currentWalletId: walletId });
        setCurrentWalletId(walletId);
      }

      await fetchWallets(user.uid);
    } catch (err) {
      console.error("Error linking wallet:", err);
      throw err;
    }
  };

  // Switch active wallet
  const switchActiveWallet = async (walletId: string) => {
    if (!user || !db) return;
    try {
      const batch = writeBatch(db);
      
      // Update all wallets to inactive except the selected one
      wallets.forEach(w => {
        const wDoc = doc(db, "users", user.uid, "wallets", w.walletId);
        batch.update(wDoc, { isActive: w.walletId === walletId });
      });

      // Update user doc
      const userRef = doc(db, "users", user.uid);
      batch.update(userRef, { currentWalletId: walletId });

      await batch.commit();
      setCurrentWalletId(walletId);
      await fetchWallets(user.uid);
    } catch (err) {
      console.error("Error switching active wallet:", err);
      throw err;
    }
  };

  // Rename a wallet
  const renameWallet = async (walletId: string, nickname: string) => {
    if (!user || !db) return;
    try {
      const wDoc = doc(db, "users", user.uid, "wallets", walletId);
      await updateDoc(wDoc, { nickname });
      await fetchWallets(user.uid);
    } catch (err) {
      console.error("Error renaming wallet:", err);
      throw err;
    }
  };

  // Delete a wallet link
  const deleteWallet = async (walletId: string) => {
    if (!user || !db) return;
    try {
      const wDoc = doc(db, "users", user.uid, "wallets", walletId);
      await deleteDoc(wDoc);

      // If we deleted the active wallet, select another one if available
      if (currentWalletId === walletId) {
        const userRef = doc(db, "users", user.uid);
        const remaining = wallets.filter(w => w.walletId !== walletId);
        const nextActiveId = remaining.length > 0 ? remaining[0].walletId : null;
        
        await updateDoc(userRef, { currentWalletId: nextActiveId });
        setCurrentWalletId(nextActiveId);
        
        if (nextActiveId) {
          const nextWDoc = doc(db, "users", user.uid, "wallets", nextActiveId);
          await updateDoc(nextWDoc, { isActive: true });
        }
      }

      await fetchWallets(user.uid);
    } catch (err) {
      console.error("Error deleting wallet:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      googleToken, 
      wallets, 
      currentWalletId, 
      signInWithGoogle, 
      signInWithEmail, 
      signUpWithEmail, 
      logout,
      linkWallet,
      switchActiveWallet,
      renameWallet,
      deleteWallet
    }}>
      {children}
    </AuthContext.Provider>
  );
};
