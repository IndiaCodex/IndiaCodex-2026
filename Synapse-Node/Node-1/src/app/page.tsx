"use client";

import Link from "next/link";
import {
  Shield,
  Database,
  UserCheck,
  ArrowRight,
  Blocks,
  Fingerprint,
  Globe,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ━━━ Hero Section ━━━ */}
      <section className="relative overflow-hidden border-b-2 border-black">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 40px),
                           repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 40px)`,
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-4xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-8 animate-fade-in-up stagger-1">
              <Blocks className="w-4 h-4" strokeWidth={3} />
              <span className="text-xs font-black uppercase tracking-widest">
                Built on Cardano · Powered by Nucast
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-black leading-[0.9] tracking-tighter mb-6 animate-fade-in-up stagger-2">
              Own Your
              <br />
              Health
              <br />
              <span className="relative inline-block">
                Data
                <span className="absolute bottom-2 left-0 w-full h-4 bg-yellow-400 -z-10" />
              </span>
              <span className="text-yellow-500">.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mb-12 animate-fade-in-up stagger-3">
              Decentralized, immutable medical records powered by{" "}
              <span className="font-black text-black">Cardano</span> and{" "}
              <span className="font-black text-black">Lace</span>. Your data, your keys, your
              control.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up stagger-4">
              <Link
                href="/patient"
                className="group inline-flex items-center justify-center gap-3 px-8 py-5 bg-yellow-400 border-2 border-black text-black font-black text-lg uppercase tracking-wider shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] transition-all"
              >
                <UserCheck className="w-6 h-6" strokeWidth={2.5} />
                Enter as Patient
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </Link>
              <Link
                href="/doctor"
                className="group inline-flex items-center justify-center gap-3 px-8 py-5 bg-black border-2 border-black text-white font-black text-lg uppercase tracking-wider shadow-[6px_6px_0px_0px_rgba(250,204,21,1)] hover:shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_rgba(250,204,21,1)] active:translate-x-[4px] active:translate-y-[4px] transition-all"
              >
                <Fingerprint className="w-6 h-6" strokeWidth={2.5} />
                Enter as Doctor
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </Link>
            </div>
          </div>

          {/* Decorative element */}
          <div className="hidden lg:block absolute top-20 right-12 w-48 h-48 border-2 border-black bg-yellow-400 opacity-20 rotate-12 animate-float" />
          <div className="hidden lg:block absolute bottom-20 right-32 w-32 h-32 border-2 border-black opacity-10 -rotate-6 animate-float" style={{ animationDelay: "1s" }} />
        </div>
      </section>

      {/* ━━━ Features Section ━━━ */}
      <section className="border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight mb-4">
              Why MediChain DAO?
            </h2>
            <p className="text-gray-500 font-medium max-w-xl mx-auto">
              Traditional medical records are siloed, insecure, and inaccessible. We fix that.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black">
            {[
              {
                icon: Shield,
                title: "Patient-Owned",
                description:
                  "You hold the keys. No hospital, insurer, or government can access your data without your cryptographic consent.",
                accent: "bg-yellow-400",
              },
              {
                icon: Database,
                title: "Immutable Ledger",
                description:
                  "Every access request, approval, and record update is logged on Cardano. Tamper-proof, auditable, forever.",
                accent: "bg-black text-white",
              },
              {
                icon: Globe,
                title: "Decentralized",
                description:
                  "No single point of failure. Your records live on-chain and are accessible from anywhere in the world, 24/7.",
                accent: "bg-yellow-400",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`p-8 ${
                    i < 2 ? "md:border-r-2 border-b-2 md:border-b-0 border-black" : ""
                  } group hover:bg-gray-50 transition-colors`}
                >
                  <div
                    className={`w-14 h-14 ${feature.accent} border-2 border-black flex items-center justify-center mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-all`}
                  >
                    <Icon
                      className={`w-7 h-7 ${
                        feature.accent.includes("text-white") ? "text-white" : "text-black"
                      }`}
                      strokeWidth={2.5}
                    />
                  </div>
                  <h3 className="text-xl font-black text-black mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━ How It Works ━━━ */}
      <section className="bg-black text-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-12 text-center">
            How It <span className="text-yellow-400">Works</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Connect Wallet", desc: "Link your Lace or Nami wallet to authenticate on Cardano." },
              { step: "02", title: "Upload Records", desc: "Medical records are encrypted and stored with on-chain metadata." },
              { step: "03", title: "Grant Access", desc: "Doctors request access. You sign the transaction to approve." },
              { step: "04", title: "Audit Trail", desc: "Every interaction is immutably logged. Full transparency." },
            ].map((item) => (
              <div key={item.step} className="border-2 border-white/20 p-6 hover:border-yellow-400 transition-colors group">
                <span className="text-4xl font-black text-yellow-400 block mb-4">{item.step}</span>
                <h3 className="text-lg font-black mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ Footer ━━━ */}
      <footer className="border-t-2 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-bold text-gray-500">
              © 2026 MediChain DAO · Built by Synapse Node for IndiaCodex&apos;26
            </p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-yellow-400 border-2 border-black text-xs font-black">
                HACKATHON PoC
              </span>
              <span className="px-3 py-1 bg-black text-white border-2 border-black text-xs font-black">
                CARDANO
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
