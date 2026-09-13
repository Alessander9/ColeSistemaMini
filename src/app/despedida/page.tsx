'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, 
  ShieldCheck, 
  Lock, 
  LogIn, 
  Home, 
  CheckCircle2, 
  Heart, 
  Sparkles 
} from 'lucide-react';

export default function DespedidaPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(8);
  const [autoReturn, setAutoReturn] = useState(true);

  useEffect(() => {
    if (!autoReturn) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoReturn, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden px-4 py-8 select-none">
      {/* Ambient glowing backdrop */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-none">
              Cole<span className="text-emerald-400">Sistema</span> Mini
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Plataforma Escolar 2026</p>
          </div>
        </Link>

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-900/60 px-3.5 py-1 rounded-full border border-slate-800">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          Sesión Segura Cerrada
        </span>
      </div>

      {/* Center Goodbye Card */}
      <div className="max-w-md w-full mx-auto my-auto z-10 py-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl relative overflow-hidden text-center">
          
          {/* Top highlight gradient */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

          {/* Secure Shield Icon */}
          <div className="relative inline-block mb-4">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
              <ShieldCheck className="w-10 h-10 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white mb-2">
            ¡Hasta pronto!
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 font-medium">
            Has cerrado tu sesión de manera exitosa y segura. Toda tu información y registros del día se encuentran sincronizados.
          </p>

          {/* Reassuring Safety Badge Box */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-left mb-6 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-200">Seguridad Garantizada:</strong> Tus credenciales y datos académicos permanecen encriptados y protegidos según los estándares educativos.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión Nuevamente</span>
            </Link>

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Volver a la Página Principal</span>
            </Link>

            {autoReturn && (
              <p className="text-[11px] text-slate-500 font-medium pt-2">
                Redirigiendo automáticamente a inicio de sesión en <span className="text-slate-300 font-bold">{countdown}s</span>...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl w-full mx-auto text-center z-10">
        <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
          Gracias por usar <span className="text-slate-400 font-bold">ColeSistema Mini</span> • Educación con Excelencia
        </p>
      </div>
    </div>
  );
}
