'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  tipo: 'success' | 'error' | 'info' | 'warning';
  titulo?: string;
  mensaje: string;
  duracionMs?: number;
}

interface Props {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

const CONFIG = {
  success: {
    bg: 'from-emerald-600 to-teal-600',
    border: 'border-emerald-400/40',
    icon: CheckCircle2,
    iconColor: 'text-emerald-100',
    bar: 'bg-emerald-300/60',
    shadow: 'shadow-emerald-900/50',
    glow: 'rgba(16,185,129,0.35)',
  },
  error: {
    bg: 'from-rose-600 to-pink-700',
    border: 'border-rose-400/40',
    icon: AlertCircle,
    iconColor: 'text-rose-100',
    bar: 'bg-rose-300/60',
    shadow: 'shadow-rose-900/50',
    glow: 'rgba(244,63,94,0.35)',
  },
  warning: {
    bg: 'from-amber-500 to-orange-600',
    border: 'border-amber-400/40',
    icon: AlertTriangle,
    iconColor: 'text-amber-100',
    bar: 'bg-amber-200/60',
    shadow: 'shadow-amber-900/50',
    glow: 'rgba(245,158,11,0.35)',
  },
  info: {
    bg: 'from-blue-600 to-indigo-600',
    border: 'border-blue-400/40',
    icon: Info,
    iconColor: 'text-blue-100',
    bar: 'bg-blue-300/60',
    shadow: 'shadow-blue-900/50',
    glow: 'rgba(59,130,246,0.35)',
  },
} as const;

function Toast({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const cfg = CONFIG[toast.tipo];
  const Icon = cfg.icon;
  const duration = toast.duracionMs ?? 4500;

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 30);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 350);
    }, duration);
    return () => {
      cancelAnimationFrame(t);
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [toast.id, duration, onRemove]);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 350);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        relative w-full max-w-sm pointer-events-auto
        transition-all duration-350 ease-out
        ${visible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
      `}
    >
      <div
        className={`relative rounded-2xl overflow-hidden border ${cfg.border} bg-gradient-to-br ${cfg.bg} shadow-2xl ${cfg.shadow} backdrop-blur-xl`}
        style={{ boxShadow: `0 8px 32px ${cfg.glow}, 0 0 0 1px rgba(255,255,255,0.08)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/8 to-white/0 pointer-events-none" />
        <div className="relative flex items-start gap-3 px-4 pt-4 pb-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mt-0.5">
            <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            {toast.titulo && (
              <p className="font-extrabold text-white text-sm leading-tight mb-0.5 tracking-tight">
                {toast.titulo}
              </p>
            )}
            <p className="text-white/85 text-xs leading-relaxed line-clamp-3">{toast.mensaje}</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 -mt-0.5 -mr-1 w-7 h-7 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white/70 hover:text-white"
            aria-label="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="h-0.5 w-full bg-white/10">
          <div className={`h-full ${cfg.bar} rounded-full`} style={{ width: `${progress}%`, transition: 'width 30ms linear' }} />
        </div>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-label="Notificaciones"
      className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
      style={{ maxWidth: 'min(calc(100vw - 24px), 380px)' }}
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
