'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/services/authService';
import { GraduationCap, ShieldCheck, Loader2 } from 'lucide-react';

export default function DespedidaPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // 1. Limpieza total e incondicional de credenciales, tokens y cookies
    logoutUser();

    // 2. Animación de barra de progreso fluida
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 280);

    // 3. Redirección automática a /login al culminar
    const timeout = setTimeout(() => {
      router.replace('/login');
    }, 1400);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden px-4 select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Loading Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Animated Brand Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-indigo-500/20 animate-ping pointer-events-none" />
        </div>

        {/* Status Text */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>Cerrando sesión</span>
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Finalizando sesión segura y limpiando credenciales...
          </p>
        </div>

        {/* Smooth Progress Bar */}
        <div className="w-full space-y-2">
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-sm shadow-emerald-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold px-0.5">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              ColeSistema Mini
            </span>
            <span>{progress}%</span>
          </div>
        </div>

      </div>
    </div>
  );
}
