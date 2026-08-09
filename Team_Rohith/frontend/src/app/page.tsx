"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Brain, Shield, Database, Mail, Lock, ArrowRight, Loader2, Sparkles, HelpCircle, Activity, Key } from "lucide-react";

export default function Home() {
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginSectionRef = useRef<HTMLDivElement>(null);
  const featuresSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !authLoading) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary-light w-12 h-12 mb-4" />
        <p className="text-text-muted font-mono tracking-widest uppercase text-sm">Initializing Vault...</p>
      </div>
    );
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (elementRef: React.RefObject<HTMLDivElement | null>) => {
    if (elementRef.current) {
      elementRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-brand-black text-text-primary overflow-x-hidden selection:bg-brand-primary-light/30 selection:text-white">
      {/* Sticky Top Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-brand-black/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-9 h-9 rounded-xl bg-brand-primary-light/20 border border-brand-primary-light/40 flex items-center justify-center">
              <Brain className="text-brand-primary-light" size={18} />
            </div>
            <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-text-secondary">LifeVault</span>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={() => scrollToSection(featuresSectionRef)} className="text-sm font-medium text-text-secondary hover:text-white transition-colors">Features</button>
            <button 
              onClick={() => scrollToSection(loginSectionRef)} 
              className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm font-semibold transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-6 pt-24 text-center overflow-hidden">
        {/* Breathing background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-primary-light/10 blur-[130px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-secondary/10 blur-[130px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.01] bg-[size:60px_60px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl space-y-8 relative z-10"
        >
          <div className="inline-flex items-center space-x-2 bg-brand-primary-light/10 border border-brand-primary-light/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-brand-primary-light">
            <Sparkles size={12} />
            <span>NVIDIA LLaMA 3.1 & Cardano 2FA Integrated</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-display font-bold leading-[1.05] tracking-tight text-white">
            Your Digital Life, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-primary-light via-brand-primary-dark to-brand-secondary">
              Cryptographically Secure.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            LifeVault is an AI-powered second brain that digests invoices, warranties, and identity documents, compiles them into a Master Calendar, and imprints cryptographic verification seals directly on Cardano.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => scrollToSection(loginSectionRef)}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-primary-dark to-brand-primary-light text-black font-bold text-lg rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary-light/20 hover:brightness-110 transition-all"
            >
              <span>Access Your Vault</span>
              <ArrowRight className="ml-2" size={20} />
            </motion.button>
            
            <button
              onClick={() => scrollToSection(featuresSectionRef)}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-lg font-semibold transition-colors"
            >
              Learn More
            </button>
          </div>
        </motion.div>
      </section>

      {/* 2. FEATURES SECTIONS (Spacious Grid) */}
      <section ref={featuresSectionRef} className="py-24 border-t border-white/5 bg-brand-obsidian/30 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">Engineered For Completeness</h2>
            <p className="text-sm text-text-secondary mt-2">Integrating advanced large language models with decentralized ledger verification.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass rounded-3xl p-8 border border-white/5 hover:border-brand-primary-light/20 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary-light/10 border border-brand-primary-light/20 flex items-center justify-center text-brand-primary-light">
                  <Brain size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">LLaMA 3.1 Document Ingestion</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Upload receipts, PDFs, and receipts. NVIDIA's LLaMA 3.1 70B model analyzes documents, generates structured summaries, and automatically extracts expiration dates.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="glass rounded-3xl p-8 border border-white/5 hover:border-brand-primary-dark/20 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary-dark/10 border border-brand-primary-dark/20 flex items-center justify-center text-brand-primary-dark">
                  <Key size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">Multi-Wallet Cardano 2FA</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Decentralized Web3 authorization. Connect Lace, Nami, or Eternl. Link multiple signing profiles, switch active wallets, and secure document entries cryptographically.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="glass rounded-3xl p-8 border border-white/5 hover:border-brand-secondary/20 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center text-brand-secondary">
                  <Activity size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">Master Timeline Calendar</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  All extracted deadlines, warranties, subscriptions, and renewal checkpoints populate a unified, color-coded calendar automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ACCESS PORTAL (Sign In Section - Wide and Spaced) */}
      <section ref={loginSectionRef} className="py-24 border-t border-white/5 relative flex justify-center items-center px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary-light/5 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="w-full max-w-lg z-10">
          <div className="glass rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary-light/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2">
                {isSignUp ? "Initialize Vault" : "Decrypt Vault"}
              </h2>
              <p className="text-text-secondary text-sm">
                {isSignUp ? "Create your secure second brain account." : "Enter credentials to unlock your digital ledger."}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-semibold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Transmission Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-brand-primary-light focus:ring-1 focus:ring-brand-primary-light transition-all text-sm"
                    placeholder="user@cardana.network"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Encryption Key (Password)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-brand-primary-light focus:ring-1 focus:ring-brand-primary-light transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-primary-dark to-brand-primary-light hover:brightness-110 text-black font-bold text-md py-4 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 mt-6 shadow-md shadow-brand-primary-light/10"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>{isSignUp ? "Initialize" : "Decrypt"}</span>
                    <ArrowRight className="ml-2" size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center space-x-4">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Or</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <button
              onClick={signInWithGoogle}
              className="mt-6 w-full bg-white/5 hover:bg-white/10 border border-white/5 text-white font-semibold py-4 rounded-xl flex items-center justify-center transition-all text-sm"
            >
              <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="mt-8 text-center">
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm font-medium text-text-secondary hover:text-brand-primary-light transition-colors"
              >
                {isSignUp ? "Already have a vault? Access here." : "No vault yet? Initialize one here."}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-xs text-text-muted">
        <p>© 2026 LifeVault. Powered by Cardano Ledger & NVIDIA Nemotron AI.</p>
      </footer>
    </div>
  );
}
