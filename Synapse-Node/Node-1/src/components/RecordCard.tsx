"use client";

import { useState } from "react";
import { MedicalRecord } from "@/data/mockData";
import ZKProofModal from "./ZKProofModal";
import {
  FileText,
  Syringe,
  Pill,
  ScanLine,
  Stethoscope,
  AlertTriangle,
  Lock,
  Unlock,
  Clock,
  ShieldCheck,
} from "lucide-react";

const typeIconMap = {
  lab: FileText,
  vaccination: Syringe,
  prescription: Pill,
  imaging: ScanLine,
  consultation: Stethoscope,
  allergy: AlertTriangle,
};

const typeColorMap = {
  lab: "bg-blue-100 text-blue-700",
  vaccination: "bg-green-100 text-green-700",
  prescription: "bg-purple-100 text-purple-700",
  imaging: "bg-cyan-100 text-cyan-700",
  consultation: "bg-orange-100 text-orange-700",
  allergy: "bg-red-100 text-red-700",
};

interface RecordCardProps {
  record: MedicalRecord;
  variant: "patient" | "doctor";
  onRequestAccess?: () => void;
  onViewContent?: () => void;
  isRequesting?: boolean;
}

export default function RecordCard({
  record,
  variant,
  onRequestAccess,
  onViewContent,
  isRequesting,
}: RecordCardProps) {
  const [showZkModal, setShowZkModal] = useState(false);
  const Icon = typeIconMap[record.type];
  const colorClass = typeColorMap[record.type];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all group">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b-2 border-black">
        <div
          className={`w-10 h-10 flex items-center justify-center border-2 border-black flex-shrink-0 ${colorClass}`}
        >
          <Icon className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-sm text-black leading-tight truncate">
            {record.name}
          </h3>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            {formatDate(record.date)}
          </p>
        </div>
        <div className="flex-shrink-0">
          {record.locked ? (
            record.accessRequested ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 border-2 border-yellow-400 text-xs font-bold text-yellow-700">
                <Clock className="w-3 h-3" />
                Pending
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 border-2 border-black text-xs font-bold text-black">
                <Lock className="w-3 h-3" />
                Locked
              </div>
            )
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 border-2 border-green-600 text-xs font-bold text-green-700">
              <Unlock className="w-3 h-3" />
              Open
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-xs text-gray-600 font-medium">{record.summary}</p>

        {/* Actions for Doctor view */}
        {variant === "doctor" && (
          <div className="mt-3">
            {record.locked && !record.accessRequested && (
              <button
                onClick={onRequestAccess}
                disabled={isRequesting}
                className="w-full py-2 px-4 bg-yellow-400 border-2 border-black text-black text-xs font-black uppercase tracking-wider hover:bg-yellow-500 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50"
              >
                Request Access
              </button>
            )}
            {record.locked && record.accessRequested && (
              <div className="w-full py-2 px-4 bg-yellow-50 border-2 border-yellow-400 text-yellow-700 text-xs font-black uppercase tracking-wider text-center">
                ⏳ Awaiting Patient Approval
              </div>
            )}
            {!record.locked && (
              <button
                onClick={onViewContent}
                className="w-full py-2 px-4 bg-black border-2 border-black text-white text-xs font-black uppercase tracking-wider hover:bg-gray-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                View Record →
              </button>
            )}
          </div>
        )}

        {/* Patient view — show lock status info */}
        {variant === "patient" && !record.locked && (
          <div className="mt-3 py-2 px-3 bg-green-50 border-2 border-green-500 text-green-700 text-xs font-bold">
            ✓ Shared with {record.requestedBy || "authorized provider"}
          </div>
        )}
        {variant === "patient" && record.accessRequested && (
          <div className="mt-3 py-2 px-3 bg-yellow-50 border-2 border-yellow-400 text-yellow-700 text-xs font-bold">
            ⏳ {record.requestedBy} has requested access
          </div>
        )}

        {/* ── USP 2: Midnight ZK-Proof Generator ── */}
        {variant === "patient" && (
          <div className="mt-3 pt-3 border-t-2 border-dashed border-gray-300">
            <button
              onClick={() => setShowZkModal(true)}
              className="w-full py-2 px-3 bg-white border-2 border-black text-black text-xs font-black uppercase tracking-wider hover:bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
              Generate ZK-Proof
            </button>
          </div>
        )}
      </div>

      {showZkModal && (
        <ZKProofModal record={record} onClose={() => setShowZkModal(false)} />
      )}
    </div>
  );
}
