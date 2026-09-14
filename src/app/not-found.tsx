'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-amber-500/5 animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Error 404
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Página No Encontrada
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            El enlace al que intentas acceder no existe, ha sido movido o no tienes permisos asignados.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
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
