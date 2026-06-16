"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

type ToastVariant = "info" | "success" | "warning" | "error";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const ToastContext = createContext<(message: string, variant?: ToastVariant) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 300,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: "rgba(0,0,0,0.92)",
              border: "1px solid rgba(252,163,17,0.4)",
              borderRadius: "var(--r-md)",
              padding: "14px 20px",
              maxWidth: 360,
              fontSize: 14,
              color: "var(--white)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
