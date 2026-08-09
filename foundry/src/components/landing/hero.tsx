"use client";

import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const agents = [
  { role: "CEO", color: "#0033ad" },
  { role: "Research", color: "#1a4fc3" },
  { role: "Contracts", color: "#0040cc" },
  { role: "Frontend", color: "#0d9668" },
  { role: "Deploy", color: "#0033ad" },
];

export default function Hero() {
  return (
    <section className="foundry-hero">
      <div className="foundry-hero-inner">
        <div className="foundry-hero-grid">
          <div className="foundry-hero-content">
            <p className="foundry-eyebrow">Foundry · MVP</p>
            <h1 className="foundry-hero-title">Autonomous software companies on Cardano</h1>
            <p className="foundry-hero-lead">
              Describe an idea in plain language. Foundry scopes the work, assigns agents, and
              runs a tailored pipeline — contracts, frontend, docs, and deployment.
            </p>
            <div className="foundry-cta-row">
              <Link
                href="/projects/new"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                Create your company
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#how-it-works"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                How it works
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <div className="relative flex h-72 w-72 items-center justify-center rounded-full border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="absolute inset-8 rounded-full border border-primary/20" />
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-input)]">
                <Bot className="h-8 w-8" />
              </div>
              {agents.map((agent, i) => {
                const angle = (i / agents.length) * Math.PI * 2 - Math.PI / 2;
                const x = 50 + Math.cos(angle) * 38;
                const y = 50 + Math.sin(angle) * 38;
                return (
                  <span
                    key={agent.role}
                    className="absolute rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: "translate(-50%, -50%)",
                      borderColor: `${agent.color}40`,
                      background: `${agent.color}12`,
                      color: agent.color,
                    }}
                  >
                    {agent.role}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}