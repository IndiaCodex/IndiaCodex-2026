"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Key,
  Zap,
  Save,
  Eye,
  EyeOff,
  Network,
  Server,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SectionProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  delay?: number;
}

function Section({ icon: Icon, title, description, children, delay = 0 }: SectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-xl border border-border bg-surface shadow-[var(--shadow-card)] p-6 space-y-4"
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-xs text-foreground-muted">{description}</p>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground-muted">{label}</label>
      {children}
    </div>
  );
}

export default function SettingsClient() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    openaiKey: "sk-or-...",
    model: "openai/gpt-4o-mini",
    temperature: "0.7",
    maxTokens: "4096",
    network: "preprod",
    providerUrl: "https://preprod.cexplorer.io",
    masumiUrl: "https://api.masumi.io",
    mockMode: false,
    speed: "normal",
  });

  const update = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const speedOptions = [
    { value: "slow", label: "Slow", icon: Zap, color: "text-red-400" },
    { value: "normal", label: "Normal", icon: Zap, color: "text-yellow-400" },
    { value: "fast", label: "Fast", icon: Zap, color: "text-green-400" },
    { value: "instant", label: "Instant", icon: Rocket, color: "text-primary" },
  ];

  return (
    <main className="page-gradient mx-auto max-w-3xl space-y-8 px-6 py-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[1.5rem] border border-border bg-card p-6 shadow-[var(--shadow-card)]"
      >
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
        </div>
        <p className="text-sm text-foreground-muted">
          Configure your agents, execution environment, and integrations.
        </p>
      </motion.div>

      <div className="space-y-4">
        <Section icon={Key} title="OpenAI" description="Configure your OpenAI API access" delay={0.05}>
          <Field label="API Key">
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={settings.openaiKey}
                onChange={(e) => update("openaiKey", e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="btn-icon btn-icon--sm absolute right-1 top-1/2 -translate-y-1/2"
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Model">
              <select
                value={settings.model}
                onChange={(e) => update("model", e.target.value)}
                className="form-control"
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option disabled>──────────</option>
                <option value="openai/gpt-4o-mini">OpenRouter: GPT-4o Mini</option>
                <option value="google/gemini-2.0-flash-exp:free">OpenRouter: Gemini Flash (free)</option>
                <option value="meta-llama/llama-3.2-3b-instruct:free">OpenRouter: Llama 3.2 3B (free)</option>
                <option value="anthropic/claude-3.5-haiku">OpenRouter: Claude 3.5 Haiku</option>
              </select>
            </Field>
            <Field label="Temperature">
              <Input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => update("temperature", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Max Tokens">
            <Input
              type="number"
              min="256"
              max="32768"
              step="256"
              value={settings.maxTokens}
              onChange={(e) => update("maxTokens", e.target.value)}
            />
          </Field>
        </Section>

        <Section icon={Network} title="Cardano" description="Blockchain network configuration" delay={0.1}>
          <Field label="Network">
            <select
              value={settings.network}
              onChange={(e) => update("network", e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-[var(--shadow-card)] focus:border-primary/40 focus:outline-none"
            >
              <option value="preprod">Preprod</option>
              <option value="mainnet">Mainnet</option>
            </select>
          </Field>
          <Field label="Provider URL">
            <Input
              value={settings.providerUrl}
              onChange={(e) => update("providerUrl", e.target.value)}
            />
          </Field>
        </Section>

        <Section icon={Server} title="Masumi" description="Agent identity and payment service" delay={0.15}>
          <Field label="API URL">
            <Input
              value={settings.masumiUrl}
              onChange={(e) => update("masumiUrl", e.target.value)}
            />
          </Field>
          <Field label="Mock Mode">
            <button
              onClick={() => update("mockMode", !settings.mockMode)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                settings.mockMode ? "bg-primary" : "bg-surface-hover",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-primary-foreground transition-transform",
                  settings.mockMode ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </Field>
        </Section>

        <Section icon={Zap} title="Execution" description="Agent execution speed and behavior" delay={0.2}>
          <Field label="Speed">
            <div className="grid grid-cols-4 gap-2">
              {speedOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("speed", opt.value)}
                    className={cn(
                      "btn-card btn-card--center",
                      settings.speed === opt.value && "btn-card--selected",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", opt.color)} />
                    <span className="text-xs capitalize font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </Field>
        </Section>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="flex justify-end"
        >
          <Button variant="default" size="lg" className="gap-2">
            <Save className="h-5 w-5" />
            Save Settings
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
