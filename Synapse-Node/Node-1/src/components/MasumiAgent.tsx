"use client";

import { useState } from "react";
import { Brain, AlertTriangle, Lightbulb, ChevronRight, Activity } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface MasumiAgentProps {
  recordId: string;
}

const AI_FINDINGS: Record<string, { alert: string; recommendation: string; confidence: number; model: string }> = {
  "rec-001": {
    alert: "CBC values suggest mild microcytic anemia pattern consistent with iron deficiency. Hemoglobin trending 8% below optimal baseline for demographic profile.",
    recommendation: "Order serum ferritin and TIBC before initiating treatment. Consider oral iron supplementation.",
    confidence: 91,
    model: "MasumiDx-v2.1",
  },
  "rec-002": {
    alert: "Vaccination schedule cross-referenced with WHO 2026 immunization calendar. No gaps detected. Booster efficacy window intact for 14 more months.",
    recommendation: "No immediate action required. Flag for next annual review in Jan 2027.",
    confidence: 97,
    model: "MasumiDx-v2.1",
  },
  "rec-003": {
    alert: "Chest radiograph analysis indicates costophrenic angle sharpness consistent with no pleural effusion. Cardiac silhouette within normal limits.",
    recommendation: "No follow-up imaging required. Schedule next chest X-ray in 24 months per standard protocol.",
    confidence: 94,
    model: "MasumiDx-v2.1",
  },
  "rec-004": {
    alert: "Prescription cross-matched against patient's full record. Montelukast + Cetirizine combination flagged — potential mild sedation interaction documented in 12% of cases.",
    recommendation: "Advise patient against operating heavy machinery. Consider non-sedating antihistamine if symptoms persist.",
    confidence: 88,
    model: "MasumiDx-v2.1",
  },
  "rec-005": {
    alert: "⚠️ CRITICAL: Patient history indicates an 85% probability of adverse reaction to standard anesthesia (halothane group) due to confirmed Penicillin hypersensitivity and genetic marker overlap.",
    recommendation: "Consult alternate pain management protocols. Do NOT administer halothane-class agents. Flag for pre-surgical review by senior anesthesiologist.",
    confidence: 85,
    model: "MasumiDx-v2.1",
  },
  "rec-006": {
    alert: "Annual health metrics analyzed. BMI 23.4 and SpO2 98% within optimal range. BP 120/80 is at upper threshold of normal — monitor for hypertensive trend.",
    recommendation: "Lifestyle intervention: reduce sodium intake. Re-evaluate BP in 6 months. No pharmacological intervention required at this time.",
    confidence: 93,
    model: "MasumiDx-v2.1",
  },
};

const DEFAULT_FINDING = {
  alert: "⚠️ AI Alert: Patient history indicates an 85% probability of adverse reaction to standard anesthesia.",
  recommendation: "💡 Consult alternate pain management protocols. Do NOT administer halothane-class agents.",
  confidence: 85,
  model: "MasumiDx-v2.1",
};

type AgentState = "idle" | "loading" | "done";

export default function MasumiAgent({ recordId }: MasumiAgentProps) {
  const [state, setState] = useState<AgentState>("idle");
  const [runCount, setRunCount] = useState(0);

  const finding = AI_FINDINGS[recordId] ?? DEFAULT_FINDING;
  const isCritical = finding.confidence < 90 || recordId === "rec-005";

  const handleRun = async () => {
    setState("loading");
    await new Promise((r) => setTimeout(r, 2000));
    setState("done");
    setRunCount((c) => c + 1);
  };

  return (
    <div className="mt-3 border-t-2 border-dashed border-black pt-3">
      {state === "idle" && (
        <button
          onClick={handleRun}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-black border-2 border-black text-yellow-400 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(250,204,21,1)] hover:shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_0px_rgba(250,204,21,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
        >
          <Brain className="w-3.5 h-3.5" strokeWidth={2.5} />
          ✨ Run Masumi AI Analysis
        </button>
      )}

      {state === "loading" && (
        <div className="flex items-center justify-center gap-3 py-3 px-4 bg-black border-2 border-black">
          <LoadingSpinner size="sm" />
          <span className="text-xs font-black text-yellow-400 uppercase tracking-wider animate-pulse">
            Agent analyzing on-chain data...
          </span>
        </div>
      )}

      {state === "done" && (
        <div className={`border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${isCritical ? "bg-red-50" : "bg-yellow-50"}`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-3 py-2 border-b-2 border-black ${isCritical ? "bg-red-500" : "bg-black"}`}>
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                Masumi AI · {finding.model}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] font-black text-yellow-400">{finding.confidence}% confidence</span>
            </div>
          </div>

          {/* Alert */}
          <div className="p-3 border-b-2 border-black">
            <div className="flex items-start gap-2">
              <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isCritical ? "text-red-600" : "text-yellow-600"}`} strokeWidth={2.5} />
              <p className="text-[11px] font-bold text-black leading-snug">
                {finding.alert}
              </p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-3 border-b-2 border-black">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-600" strokeWidth={2.5} />
              <p className="text-[11px] font-semibold text-black leading-snug">
                <span className="font-black">Recommendation: </span>
                {finding.recommendation}
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Analysis #{runCount} · {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={handleRun}
              className="flex items-center gap-1 text-[10px] font-black text-black uppercase underline underline-offset-2 hover:text-gray-600 transition-colors"
            >
              Re-run <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
