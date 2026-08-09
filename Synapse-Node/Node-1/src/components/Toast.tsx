"use client";

import { useMediChain } from "@/context/MediChainContext";
import { X, CheckCircle, Info, AlertTriangle, AlertOctagon } from "lucide-react";

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: AlertOctagon,
};

const colorMap = {
  success: "border-green-500 bg-green-50",
  info: "border-yellow-400 bg-yellow-50",
  warning: "border-orange-400 bg-orange-50",
  error: "border-red-500 bg-red-50",
};

const iconColorMap = {
  success: "text-green-600",
  info: "text-yellow-600",
  warning: "text-orange-600",
  error: "text-red-600",
};

export default function Toast() {
  const { notifications, removeNotification } = useMediChain();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full">
      {notifications.map((notif) => {
        const Icon = iconMap[notif.type];
        return (
          <div
            key={notif.id}
            className={`flex items-start gap-3 p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-toast-in ${colorMap[notif.type]}`}
          >
            <div className={`mt-0.5 ${iconColorMap[notif.type]}`}>
              <Icon className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <p className="flex-1 text-sm font-semibold text-black leading-snug">
              {notif.message}
            </p>
            <button
              onClick={() => removeNotification(notif.id)}
              className="text-black hover:text-gray-600 transition-colors mt-0.5"
            >
              <X className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
