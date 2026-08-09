"use client";

import { Lightbulb, Hammer, Play, Rocket } from "lucide-react";

const steps = [
  {
    icon: Lightbulb,
    label: "Step 1",
    title: "Describe",
    description:
      "Name your project and explain what you want to build on Cardano. No feature checkboxes — AI reads the brief.",
  },
  {
    icon: Hammer,
    label: "Step 2",
    title: "Scope",
    description:
      "Foundry analyzes your idea, estimates runtime, and selects the agent team required for delivery.",
  },
  {
    icon: Play,
    label: "Step 3",
    title: "Execute",
    description:
      "Agents run in parallel where possible. Follow the DAG, logs, and cost breakdown in real time.",
  },
  {
    icon: Rocket,
    label: "Step 4",
    title: "Deliver",
    description:
      "Download contracts, frontend, docs, and deployment artifacts. Push to Cardano preprod when ready.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="foundry-section border-t border-border">
      <div className="foundry-section-inner">
        <header className="foundry-section-header">
          <h2 className="foundry-section-title">How it works</h2>
          <p className="foundry-section-lead">
            Four steps from idea to deployable output on Cardano preprod.
          </p>
        </header>

        <div className="foundry-steps">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="foundry-step-card">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="foundry-step-label">{step.label}</span>
                </div>
                <h3 className="foundry-card-title text-lg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}