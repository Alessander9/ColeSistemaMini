'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';
import { Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BienvenidaPage() {
  const { currentUser } = useApp();
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  const getDashboardUrl = (rol: UserRole) => {
    switch (rol) {
      case 'admin':
        return '/admin';
      case 'docente':
        return '/docente';
      case 'estudiante':
        return '/estudiante';
      case 'apoderado':
        return '/apoderado';
      case 'asistencia':
        return '/asistencia';
      default:
        return '/';
    }
  };

  useEffect(() => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
    });

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(getDashboardUrl(currentUser.rol));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser.rol, router]);

  const firstName = currentUser?.nombres ? currentUser.nombres.split(' ')[0] : 'Usuario';
  const avatarUrl = currentUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=6366f1&color=fff&size=200`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden px-4 select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6 animate-scale-up">
        {/* Foto de perfil en tamaño circular */}
        <div className="relative">
          <img
            src={avatarUrl}
            alt={firstName}
            className="w-28 h-28 rounded-full object-cover ring-4 ring-indigo-500/30 shadow-2xl shadow-indigo-500/20 mx-auto"
          />
          <div className="absolute bottom-0 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          </div>
        </div>

        {/* Mensaje de bienvenida */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ColeSistema Mini</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ¡Bienvenido, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400">{firstName}</span>!
          </h1>

          <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            Que tengas una excelente y productiva jornada académica hoy.
          </p>
        </div>

        {/* Botón simple o redirección automática */}
        <div className="pt-2 w-full max-w-xs space-y-3">
          <button
            onClick={() => router.push(getDashboardUrl(currentUser.rol))}
            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <span>Ingresar al Sistema</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-slate-500 font-medium">
            Redirigiendo automáticamente en {countdown}s...
          </p>
        </div>
      </div>
    </div>
  );
}
