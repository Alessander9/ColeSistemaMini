'use client';

import React from 'react';
import { GraduationCap, Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white select-none px-4">
      {/* Background ambient lighting */}
      <div className="absolute w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none -top-10 -left-10 animate-pulse" />
      <div className="absolute w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none -bottom-10 -right-10 animate-pulse" />

      {/* Center Animated Emblem */}
      <div className="relative flex flex-col items-center gap-6 max-w-sm w-full text-center z-10">
        
        {/* Glowing Logo Icon */}
        <div className="relative">
          <div className="absolute -inset-3 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600 rounded-3xl blur-xl opacity-70 animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center shadow-2xl border border-white/20 transform transition-transform duration-500 hover:scale-105">
            <GraduationCap className="w-10 h-10 text-white animate-bounce" />
          </div>
        </div>

        {/* Brand & Loading Status */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Cole<span className="text-emerald-400">Sistema</span>
            <span className="text-slate-400 text-sm font-semibold">Mini</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Gestión Escolar CNEB & Asistencia QR en Tiempo Real
          </p>
        </div>

        {/* Sleek Animated Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-slate-700/50 shadow-inner">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full w-full animate-pulse transform -translate-x-full transition-transform duration-1000" 
               style={{ animation: 'shimmer 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold bg-slate-900/60 px-3.5 py-1.5 rounded-full border border-slate-800 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Sincronizando información académica...</span>
        </div>
      </div>
    </div>
  );
}
