import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  addToast: (kind: ToastKind, message: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((kind: ToastKind, message: string) => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

// ── Toast Item ────────────────────────────────────────────────────────────────

const TOAST_DURATION_MS = 4000;

const kindStyles: Record<ToastKind, string> = {
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  info: 'border-primary/30 bg-primary/10 text-primary',
};

const kindIcons: Record<ToastKind, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const ToastItem = ({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, onDismiss]);

  return (
    <div
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg min-w-64 max-w-sm',
        kindStyles[toast.kind],
      ].join(' ')}
      role="alert"
    >
      <span className="shrink-0 font-bold">{kindIcons[toast.kind]}</span>
      <span className="flex-1 leading-relaxed">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
};

// ── Container ─────────────────────────────────────────────────────────────────

const ToastContainer = ({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
