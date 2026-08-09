"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  Users,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSection } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useProject } from "@/hooks/use-project";
import { DEMO_PROJECT, PROJECT_FORM_DEFAULTS } from "@/types/project";
import type { ProjectFormData, ProjectScopeAnalysis } from "@/types/project";
import { normalizeSelectedAgents } from "@/config/agent-scope";
import { AgentPicker, AgentPickerSummary } from "@/components/project/agent-picker";
import { estimateExecutionMinutes } from "@/services/execution-plan";
import type { AgentRole } from "@/types/execution";

const STEPS = [
  { title: "Describe", description: "Tell us what you want to build" },
  { title: "AI Scope", description: "Review AI analysis and pick your agents" },
  { title: "Forge", description: "Review and launch your company" },
] as const;

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

export function ProjectForm() {
  const router = useRouter();
  const { createProject, forgeCompany, isCreating, setCreating } = useProject();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState<ProjectFormData>({ ...PROJECT_FORM_DEFAULTS });
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [aiRecommendedAgents, setAiRecommendedAgents] = useState<AgentRole[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<AgentRole[]>([]);

  const loadDemo = () => setFormData({ ...DEMO_PROJECT });

  const updateField = <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field !== "scopeAnalysis") {
      setFormData((prev) => ({ ...prev, scopeAnalysis: null }));
      setAiRecommendedAgents([]);
      setSelectedAgents([]);
    }
  };

  const applyAgentSelection = (agents: AgentRole[]) => {
    const normalized = normalizeSelectedAgents(agents);
    setSelectedAgents(normalized);
    setFormData((prev) => {
      if (!prev.scopeAnalysis) return prev;
      return {
        ...prev,
        scopeAnalysis: { ...prev.scopeAnalysis, requiredAgents: normalized },
      };
    });
  };

  const runScopeAnalysis = useCallback(async (): Promise<ProjectScopeAnalysis | null> => {
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch("/api/analyze-scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          goal: formData.goal,
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Scope analysis failed");
      }
      const analysis = (await res.json()) as ProjectScopeAnalysis;
      const normalized = normalizeSelectedAgents(analysis.requiredAgents);
      const withAgents = { ...analysis, requiredAgents: normalized };
      setAiRecommendedAgents(normalized);
      setSelectedAgents(normalized);
      updateField("scopeAnalysis", withAgents);
      return withAgents;
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Scope analysis failed");
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [formData.name, formData.description, formData.goal]);

  const validateStep = (s: number): boolean => {
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {};
    if (s === 0) {
      if (!formData.name || formData.name.length < 3)
        newErrors.name = "Project name must be at least 3 characters";
      if (!formData.description || formData.description.length < 20)
        newErrors.description = "Description must be at least 20 characters";
      if (!formData.goal || formData.goal.length < 10)
        newErrors.goal = "Goal must be at least 10 characters";
    }
    if (s === 1) {
      if (!formData.scopeAnalysis) {
        newErrors.scopeAnalysis = "Run AI scope analysis before continuing";
      } else if (selectedAgents.length < 2) {
        newErrors.scopeAnalysis = "Select at least Research and Architecture";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    if (!validateStep(step)) return;

    if (step === 0) {
      setDirection(1);
      setStep(1);
      if (!formData.scopeAnalysis) {
        await runScopeAnalysis();
      }
      return;
    }

    setDirection(1);
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!formData.scopeAnalysis) return;
    setCreating(true);
    try {
      const project = createProject(formData);
      forgeCompany(project.id);
      router.push(`/projects/${project.id}/execution`);
    } finally {
      setCreating(false);
    }
  };

  const scope = formData.scopeAnalysis;
  const activeAgents = selectedAgents.length > 0 ? selectedAgents : (scope?.requiredAgents ?? []);
  const agentCount = activeAgents.length + 1;
  const estMinutes = scope ? estimateExecutionMinutes(agentCount) : 0;
  const progressValue = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 lg:space-y-8">
      <div className="forge-panel panel-card p-6 sm:p-8">
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit">Project creation</Badge>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Forge your software company
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-foreground-muted">
            Describe your idea in plain language. Foundry detects what you need and assigns only the
            right agents — faster than running the full roster every time.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadDemo} className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Load demo
          </Button>
          <div className="text-xs text-foreground-dim">
            Step {step + 1} of {STEPS.length}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Progress value={progressValue} size="sm" />
          <div className="flex flex-wrap gap-2">
            {STEPS.map((s, i) => (
              <span
                key={s.title}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                  i === step
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : i < step
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-border bg-surface text-foreground-dim"
                }`}
              >
                {s.title}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="mt-6"
          >
            <Card>
              <CardHeader className="border-b border-border px-6 py-5">
                <CardTitle>{STEPS[step].title}</CardTitle>
                <CardDescription>{STEPS[step].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-6 py-6">
                {step === 0 && (
                  <FormSection
                    title="Project brief"
                    description="Describe what you want built. Foundry infers scope — no feature checkboxes."
                  >
                    <Input
                      label="Project name"
                      required
                      hint="A short working title for your company."
                      placeholder="e.g. Cardano NFT minting portal"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      error={errors.name}
                    />
                    <Textarea
                      label="What are you building?"
                      required
                      hint="Include users, on-chain behavior, and any integrations you care about."
                      placeholder="Describe the product, users, and on-chain behavior in plain language..."
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      error={errors.description}
                      className="min-h-32"
                    />
                    <Textarea
                      label="Primary goal"
                      required
                      hint="What should exist when the autonomous company finishes?"
                      placeholder="What should exist when the company finishes?"
                      value={formData.goal}
                      onChange={(e) => updateField("goal", e.target.value)}
                      error={errors.goal}
                    />
                  </FormSection>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    {analyzing && (
                      <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-surface py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm text-foreground-muted">
                          Analyzing your idea and sizing the agent team…
                        </span>
                      </div>
                    )}

                    {analysisError && (
                      <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                        {analysisError}
                      </div>
                    )}

                    {scope && !analyzing && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                          <div className="mb-2 flex items-center gap-2 text-primary">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-sm font-medium">AI scope summary</span>
                          </div>
                          <p className="text-sm leading-6 text-foreground">{scope.summary}</p>
                          <p className="mt-2 text-xs text-foreground-dim">{scope.reasoning}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="capitalize">
                            {scope.complexity} complexity
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            {agentCount} agents
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />~{estMinutes} min
                          </Badge>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-medium text-foreground-dim">
                            Detected capabilities
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {scope.detectedCapabilities.map((cap) => (
                              <span
                                key={cap}
                                className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-foreground-muted"
                              >
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>

                        <AgentPicker
                          selected={activeAgents}
                          recommended={aiRecommendedAgents}
                          onChange={applyAgentSelection}
                          onResetToRecommended={() => applyAgentSelection(aiRecommendedAgents)}
                        />
                      </div>
                    )}

                    {!analyzing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => runScopeAnalysis()}
                      >
                        <Sparkles className="h-4 w-4" />
                        Re-analyze scope
                      </Button>
                    )}

                    {errors.scopeAnalysis && (
                      <p className="text-xs text-error">{errors.scopeAnalysis}</p>
                    )}
                  </div>
                )}

                {step === 2 && scope && (
                  <div className="space-y-6">
                    <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-foreground-muted">Project</span>
                          <p className="font-medium">{formData.name}</p>
                        </div>
                        <div>
                          <span className="text-foreground-muted">Complexity</span>
                          <p className="font-medium capitalize">{scope.complexity}</p>
                        </div>
                        <div>
                          <span className="text-foreground-muted">Agents</span>
                          <p className="font-medium">{agentCount} (tailored)</p>
                        </div>
                        <div>
                          <span className="text-foreground-muted">Est. runtime</span>
                          <p className="font-medium">~{estMinutes} minutes</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-foreground-muted">Scope</span>
                        <p className="mt-1 text-sm leading-6 text-foreground">{scope.summary}</p>
                      </div>
                      <div>
                        <span className="text-sm text-foreground-muted">Your team</span>
                        <div className="mt-2">
                          <AgentPickerSummary agents={activeAgents} />
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="default"
                      size="lg"
                      className="w-full gap-2"
                      onClick={handleSubmit}
                      loading={isCreating}
                    >
                      <FlaskConical className="h-5 w-5" />
                      Forge Company
                    </Button>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  {step > 0 ? (
                    <Button variant="ghost" onClick={prevStep} className="gap-1">
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}
                  {step < STEPS.length - 1 && (
                    <Button onClick={nextStep} className="gap-1" loading={step === 0 && analyzing}>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

