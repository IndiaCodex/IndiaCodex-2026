"use client";

import {
  Building2,
  Hexagon,
  PlayCircle,
  Store,
  Code2,
  FileText,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "AI-scoped teams",
    description: "Describe your idea — Foundry detects scope and runs only the specialists you need.",
  },
  {
    icon: Hexagon,
    title: "Cardano native",
    description: "Aiken contracts, preprod deployment, and wallet flows built for Cardano.",
  },
  {
    icon: PlayCircle,
    title: "Live execution",
    description: "Watch agents work through a DAG with streaming logs and progress tracking.",
  },
  {
    icon: Store,
    title: "Agent marketplace",
    description: "Browse and swap specialists as the agent registry grows.",
  },
  {
    icon: Code2,
    title: "Smart contracts",
    description: "Generate and validate Aiken contracts with automated test scaffolding.",
  },
  {
    icon: Shield,
    title: "Security review",
    description: "Security agent audits contract output before deployment steps run.",
  },
  {
    icon: FileText,
    title: "Documentation",
    description: "README, architecture notes, and Catalyst proposal drafts included.",
  },
  {
    icon: Zap,
    title: "Deployable output",
    description: "Download artifacts and deploy to Cardano preprod from one place.",
  },
];

export default function Features() {
  return (
    <section className="foundry-section">
      <div className="foundry-section-inner">
        <header className="foundry-section-header">
          <h2 className="foundry-section-title">Platform capabilities</h2>
          <p className="foundry-section-lead">
            Scoped agent teams, Cardano-native output, and a live execution view — without wiring
            the stack yourself.
          </p>
        </header>

        <div className="foundry-feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="foundry-feature-card">
                <div className="foundry-feature-icon">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="foundry-card-title">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-foreground-muted">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}