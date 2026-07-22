"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

type ToastType = "success" | "error";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = 0;

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        aria-live="polite"
        aria-label="通知"
      >
        {toasts.map((t) => (
          <ToastBar key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastBar({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon = toast.type === "success" ? CheckCircle : XCircle;

  return (
    <div
      role="status"
      className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-xs shadow-[0_4px_16px_rgb(0_0_0/8%)] animate-in"
    >
      <Icon
        className={`size-3.5 shrink-0 ${
          toast.type === "success" ? "text-emerald-500" : "text-destructive"
        }`}
      />
      <span className="max-w-80">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-1 grid size-5 place-items-center rounded text-muted-foreground hover:text-foreground"
        aria-label="关闭通知"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
