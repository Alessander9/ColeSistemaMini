'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Runtime Error]', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-rose-200/80 dark:border-rose-900/40 shadow-xl">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-rose-500/5">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
            Error Inesperado
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Algo no funcionó como se esperaba
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ha ocurrido un problema temporal al cargar esta sección. Puedes reintentar o volver al inicio seguro.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-slate-400">ID: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reintentar
          </button>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
