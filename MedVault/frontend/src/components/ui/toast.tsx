"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

type ToastKind = "success" | "error" | "info" | "warning";
type Toast = { id: number; kind: ToastKind; title: string; message?: string };

const ToastContext = React.createContext<{
  toast: (kind: ToastKind, title: string, message?: string) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const icons: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="h-4.5 w-4.5 text-emerald" />,
  error: <XCircle className="h-4.5 w-4.5 text-danger" />,
  warning: <AlertTriangle className="h-4.5 w-4.5 text-amber" />,
  info: <Info className="h-4.5 w-4.5 text-cyan" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((kind: ToastKind, title: string, message?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, title, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="glass-strong pointer-events-auto flex items-start gap-3 rounded-xl p-4"
            >
              {icons[t.kind]}
              <div className="flex-1">
                <p className="text-sm font-medium">{t.title}</p>
                {t.message && <p className="mt-0.5 text-xs text-muted">{t.message}</p>}
              </div>
              <button
                onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                className="text-subtle hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
