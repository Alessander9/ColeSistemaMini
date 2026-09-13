'use client';

import React from 'react';
import { ToastMessage } from '@/types';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        let bgClass = 'bg-slate-900/95 border-slate-700 text-white shadow-xl shadow-slate-950/20';
        let icon = <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />;
        let accentColor = 'bg-sky-500';

        if (toast.tipo === 'success') {
          bgClass = 'bg-emerald-950/95 border-emerald-700/60 text-emerald-50 shadow-xl shadow-emerald-950/25';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
          accentColor = 'bg-emerald-500';
        } else if (toast.tipo === 'error') {
          bgClass = 'bg-rose-950/95 border-rose-700/60 text-rose-50 shadow-xl shadow-rose-950/25';
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />;
          accentColor = 'bg-rose-500';
        } else if (toast.tipo === 'warning') {
          bgClass = 'bg-amber-950/95 border-amber-700/60 text-amber-50 shadow-xl shadow-amber-950/25';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
          accentColor = 'bg-amber-500';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-5 ${bgClass}`}
            role="alert"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />
            {icon}
            <div className="flex-1 min-w-0 pr-1">
              {toast.titulo && (
                <h4 className="text-sm font-semibold leading-tight tracking-tight mb-0.5">
                  {toast.titulo}
                </h4>
              )}
              <p className="text-xs opacity-90 leading-relaxed break-words font-medium">
                {toast.mensaje}
              </p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 -mr-1 -mt-1"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
