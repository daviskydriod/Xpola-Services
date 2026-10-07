// src/components/ui/Toast.tsx — Global toast notification system (NEW)
//
// Usage:
//   import { toast } from '@/components/ui/Toast';
//   toast.success('Order placed!');
//   toast.error('Payment failed.');
//   toast.info('Email verification sent.');
//   toast.warning('Low stock!');
//
// Mount <Toaster /> once in App.tsx.

import { useState, useEffect, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastProps = { open?: boolean; onOpenChange?: (open: boolean) => void; className?: string; children?: ReactNode };
export type ToastActionElement = React.ReactElement;

interface ToastItem {
  id:       string;
  type:     ToastType;
  message:  string;
  duration: number;
}

// Global event bus
const TOAST_EVENT = 'xpola:toast';

function emit(type: ToastType, message: string, duration = 4000) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { type, message, duration } }));
}

export const toast = {
  success: (msg: string, ms = 4000) => emit('success', msg, ms),
  error:   (msg: string, ms = 5000) => emit('error',   msg, ms),
  info:    (msg: string, ms = 4000) => emit('info',    msg, ms),
  warning: (msg: string, ms = 4500) => emit('warning', msg, ms),
};

const STYLES: Record<ToastType, { bar: string; icon: string; text: string; bg: string }> = {
  success: { bar: 'bg-emerald-500', icon: '✓', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  error:   { bar: 'bg-[#E02020]',   icon: '✕', text: 'text-red-700',     bg: 'bg-red-50   border-red-200'     },
  info:    { bar: 'bg-blue-500',    icon: 'i', text: 'text-blue-700',    bg: 'bg-blue-50  border-blue-200'    },
  warning: { bar: 'bg-amber-500',   icon: '!', text: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200'   },
};

export const Toaster = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { type, message, duration } = (e as CustomEvent).detail as { type: ToastType; message: string; duration: number };
      const id = `${Date.now()}-${Math.random()}`;
      setToasts(prev => [...prev.slice(-4), { id, type, message, duration }]); // max 5
      setTimeout(() => remove(id), duration);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, [remove]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-24 right-4 z-[9999] space-y-2 pointer-events-none lg:bottom-6"
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      {toasts.map(t => {
        const s = STYLES[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 w-full max-w-sm border ${s.bg} shadow-lg animate-slide-up`}
            style={{ animation: 'slideUp 0.2s ease-out' }}
          >
            <div className={`${s.bar} w-1 self-stretch flex-shrink-0`} />
            <div className={`flex items-start gap-2 py-3 pr-3 flex-1 min-w-0`}>
              <span className={`text-sm font-bold flex-shrink-0 w-5 h-5 flex items-center justify-center ${s.text}`}>
                {s.icon}
              </span>
              <p className="text-sm text-gray-800 font-medium leading-snug">{t.message}</p>
            </div>
            <button
              onClick={() => remove(t.id)}
              className="text-gray-400 hover:text-gray-600 p-3 flex-shrink-0 text-xs"
            >
              ✕
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
