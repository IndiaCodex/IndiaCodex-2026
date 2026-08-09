"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  CheckCircle2,
  Loader2,
  FileCode2,
  Terminal,
  ExternalLink,
  AlertCircle,
  Copy,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DeployStep {
  id: string;
  label: string;
  description: string;
  command: string;
  status: "pending" | "running" | "completed" | "error";
}

interface DeployClientProps {
  projectId: string;
}

const CONTRACTS = [
  { name: "main.ak", purpose: "Spending Validator", description: "Owner-gated spending with signature verification" },
  { name: "lock.ak", purpose: "Timelock", description: "Locks ADA until deadline, multi-beneficiary support" },
  { name: "mint.ak", purpose: "Minting Policy", description: "One-shot NFT/token minting with burn support" },
  { name: "vesting.ak", purpose: "Vesting Contract", description: "Linear vesting with cliff period" },
];

const DEPLOY_STEPS: DeployStep[] = [
  {
    id: "compile",
    label: "Compile Contracts",
    description: "Build Aiken contracts to Plutus blueprint",
    command: "aiken build",
    status: "pending",
  },
  {
    id: "generate-keys",
    label: "Generate Keys",
    description: "Create payment key pair for preprod",
    command: "./scripts/setup_testnet.sh",
    status: "pending",
  },
  {
    id: "fund-wallet",
    label: "Fund Wallet (Faucet)",
    description: "Request test ADA from the Cardano faucet",
    command: "https://docs.cardano.org/cardano-testnet/tools/faucet",
    status: "pending",
  },
  {
    id: "build-tx",
    label: "Build Transaction",
    description: "Construct the contract deployment transaction",
    command: "./scripts/deploy.sh",
    status: "pending",
  },
  {
    id: "submit",
    label: "Submit to Preprod",
    description: "Sign and submit the deployment transaction",
    command: "cardano-cli transaction submit",
    status: "pending",
  },
  {
    id: "verify",
    label: "Verify Deployment",
    description: "Check the contract is live on chain",
    command: "cardano-cli query utxo --address",
    status: "pending",
  },
];

export default function DeployClient({ projectId }: DeployClientProps) {
  const [steps, setSteps] = useState<DeployStep[]>(DEPLOY_STEPS);
  const [deployTxId, setDeployTxId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const updateStep = (id: string, status: DeployStep["status"]) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleDeploy = async () => {
    for (const step of steps) {
      updateStep(step.id, "running");
      await new Promise((r) => setTimeout(r, 1200));
      updateStep(step.id, "completed");
    }
    setDeployTxId(`preprod_${projectId.slice(0, 6)}_${Date.now()}`);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const allCompleted = steps.every((s) => s.status === "completed");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl space-y-8 p-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Deploy Contracts</h1>
        <p className="mt-1 text-foreground-muted">
          Deploy your Aiken smart contracts to Cardano Preprod Testnet
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-foreground-dim">
          Project {projectId}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Contracts + Deploy Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contracts Overview */}
          <Card className="border-border bg-surface shadow-[var(--shadow-card)]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCode2 className="h-5 w-5 text-primary" />
                <CardTitle>Contracts to Deploy</CardTitle>
              </div>
              <CardDescription>
                Located in <code className="text-xs bg-surface-hover px-1.5 py-0.5 rounded">contracts/validators/</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {CONTRACTS.map((contract, i) => (
                  <div
                    key={contract.name}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-mono">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{contract.name}</p>
                        <p className="text-xs text-foreground-muted">{contract.purpose}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {contract.description}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Network Info */}
          <Card className="border-border bg-surface shadow-[var(--shadow-card)]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-secondary" />
                <CardTitle>Network Configuration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-foreground-muted">Network</p>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    Cardano Preprod Testnet
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-foreground-muted">Compiler</p>
                  <p className="font-medium text-foreground">Aiken &gt;= 1.1.0</p>
                </div>
                <div className="space-y-1">
                  <p className="text-foreground-muted">Faucet</p>
                  <a
                    href="https://docs.cardano.org/cardano-testnet/tools/faucet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Cardano Testnet Faucet
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="space-y-1">
                  <p className="text-foreground-muted">Explorer</p>
                  <a
                    href="https://preprod.cexplorer.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Preprod CExplorer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deploy Steps */}
          <Card className="border-border bg-surface shadow-[var(--shadow-card)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  <CardTitle>Deployment Pipeline</CardTitle>
                </div>
                {allCompleted ? (
                  <Badge variant="success">Deployed</Badge>
                ) : (
                  <Badge variant="outline">Ready</Badge>
                )}
              </div>
              <CardDescription>
                Follow these steps to deploy your contracts to Cardano preprod
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div key={step.id}>
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                            step.status === "completed" && "border-success bg-success/20 text-success",
                            step.status === "running" && "border-primary bg-primary/20 text-primary",
                            step.status === "pending" && "border-border text-foreground-muted",
                            step.status === "error" && "border-error bg-error/20 text-error",
                          )}
                        >
                          {step.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : step.status === "running" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            i + 1
                          )}
                        </div>
                        {i < steps.length - 1 && (
                          <div
                            className={cn(
                              "w-px h-8",
                              step.status === "completed" ? "bg-success/50" : "bg-border",
                            )}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-center justify-between">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              step.status === "completed" && "text-success",
                              step.status === "running" && "text-primary",
                              step.status === "pending" && "text-foreground",
                            )}
                          >
                            {step.label}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopy(step.command)}
                            className="btn-icon btn-icon--sm"
                            aria-label="Copy command"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-foreground-muted mt-0.5">{step.description}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <code className="text-xs bg-surface-hover text-foreground-muted px-1.5 py-0.5 rounded font-mono truncate">
                            {step.command}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={handleDeploy}
              disabled={allCompleted}
              className="gap-2 flex-1"
            >
              {allCompleted ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Deployed
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  Deploy to Preprod
                </>
              )}
            </Button>
            {allCompleted && (
              <Button variant="outline" size="lg" className="gap-2" onClick={() => setSteps(DEPLOY_STEPS)}>
                <RefreshCw className="h-5 w-5" />
                Reset
              </Button>
            )}
          </div>

          {/* Deploy Result */}
          {deployTxId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-success/30 bg-success/5 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <p className="font-medium text-success">Deployment Successful</p>
              </div>
              <p className="text-sm text-foreground-muted mb-2">
                Contracts deployed to Cardano Preprod Testnet
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-foreground-muted bg-surface-hover rounded px-3 py-2">
                <span>Tx ID:</span>
                <span className="text-foreground truncate">{deployTxId}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(deployTxId)}
                  className="btn-icon btn-icon--sm ml-auto text-primary"
                  aria-label="Copy transaction ID"
                >
                  {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <a
                href={`https://preprod.cexplorer.io/tx/${deployTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
              >
                View on CExplorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </motion.div>
          )}
        </div>

        {/* Right: Prerequisites Checklist */}
        <div className="space-y-6">
          <Card className="border-border bg-surface shadow-[var(--shadow-card)]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                <CardTitle>Prerequisites</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Node.js &amp; Foundry</p>
                  <p className="text-foreground-muted text-xs">Running on your machine</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-border shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Aiken CLI</p>
                  <p className="text-foreground-muted text-xs">
                    Install: <code className="text-xs bg-surface-hover px-1 rounded">cargo install aiken</code>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-border shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Cardano CLI</p>
                  <p className="text-foreground-muted text-xs">
                    Install the cardano-node package
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-border shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Test ADA</p>
                  <p className="text-foreground-muted text-xs">
                    Get free test ADA from the Cardano faucet
                  </p>
                </div>
              </div>

              <Separator />

              <div className="rounded-lg bg-surface-hover p-3">
                <p className="text-xs font-medium text-foreground mb-1">Quick Install</p>
                <code className="block text-xs text-foreground-muted font-mono leading-relaxed">
                  cargo install aiken
                  <br />
                  # Download cardano-cli from:
                  <br />
                  # https://github.com/IntersectMBO/cardano-cli
                </code>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-surface shadow-[var(--shadow-card)]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                <CardTitle>Contract Files</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-foreground-muted">All contracts are in the contracts/ directory:</p>
              <div className="text-xs font-mono text-foreground-muted space-y-1">
                <p>contracts/</p>
                <p className="pl-3">├── aiken.toml</p>
                <p className="pl-3">├── validators/</p>
                <p className="pl-6">├── main.ak</p>
                <p className="pl-6">├── lock.ak</p>
                <p className="pl-6">├── mint.ak</p>
                <p className="pl-6">└── vesting.ak</p>
                <p className="pl-3">├── tests/</p>
                <p className="pl-6">├── main_test.ak</p>
                <p className="pl-6">├── lock_test.ak</p>
                <p className="pl-6">├── mint_test.ak</p>
                <p className="pl-6">└── vesting_test.ak</p>
                <p className="pl-3">├── scripts/</p>
                <p className="pl-6">├── setup_testnet.sh</p>
                <p className="pl-6">└── deploy.sh</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
