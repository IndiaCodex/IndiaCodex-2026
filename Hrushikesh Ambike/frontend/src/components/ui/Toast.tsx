"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./toast.module.css";

/**
 * Minimal toast stack for transient feedback (mostly tx errors that would
 * otherwise be missed while a modal or scroll position hides the inline
 * message). Auto-dismisses; errors use role="alert" so screen readers
 * announce them immediately.
 */

const TOAST_TTL_MS = 6_000;

type ToastTone = "error" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "error") => {
      const id = nextIdRef.current;
      nextIdRef.current += 1;
      setToasts((current) => [...current, { id, tone, message }]);
      setTimeout(() => dismiss(id), TOAST_TTL_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.stack} aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${toast.tone === "error" ? styles.error : styles.info}`}
            // status (not alert): the inline form messages already announce
            // assertively; double role=alert would read every error twice.
            role="status"
          >
            <span className={styles.message}>{toast.message}</span>
            <button
              type="button"
              className={styles.close}
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
