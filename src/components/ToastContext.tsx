import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X, Wifi, WifiOff } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'sync';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  toastSuccess: (title: string, message?: string) => void;
  toastInfo: (title: string, message?: string) => void;
  toastWarning: (title: string, message?: string) => void;
  toastError: (title: string, message?: string) => void;
  toastSync: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4000);

    const newToast: ToastMessage = { ...toast, id, duration };

    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toastSuccess = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const toastInfo = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  const toastWarning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const toastError = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  const toastSync = useCallback((title: string, message?: string) => {
    addToast({ type: 'sync', title, message, duration: 3500 });
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        addToast,
        removeToast,
        toastSuccess,
        toastInfo,
        toastWarning,
        toastError,
        toastSync,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${getToastStyles(
              toast.type
            )}`}
          >
            <div className="flex-shrink-0 mt-0.5">{getToastIcon(toast.type)}</div>
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-bold leading-tight tracking-tight">{toast.title}</h4>
              {toast.message && (
                <p className="text-[11px] opacity-90 mt-1 leading-snug break-words">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 transition hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

function getToastIcon(type: ToastType) {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'info':
      return <Info className="w-4 h-4 text-sky-400" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-rose-400" />;
    case 'sync':
      return <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />;
  }
}

function getToastStyles(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'bg-[#121915]/95 border-emerald-500/40 text-emerald-200';
    case 'info':
      return 'bg-[#101924]/95 border-sky-500/40 text-sky-200';
    case 'warning':
      return 'bg-[#1A1810]/95 border-amber-500/40 text-amber-200';
    case 'error':
      return 'bg-[#1A1214]/95 border-rose-500/40 text-rose-200';
    case 'sync':
      return 'bg-[#002B7F]/90 border-[#FFC72C]/50 text-amber-100 shadow-amber-500/10';
  }
}
