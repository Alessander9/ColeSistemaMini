'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { logoutUser } from '@/lib/services/authService';
import { School, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { initialsAvatarUrl } from '@/lib/avatar';

export default function DespedidaPage() {
  const router = useRouter();
  const { currentUser, brandingConfig } = useApp();
  const [userName, setUserName] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string>('');

  const schoolName = brandingConfig?.nombreInstitucion || 'Colegio San Martín de Porres';

  useEffect(() => {
    if (currentUser?.nombres) {
      setUserName(currentUser.nombres.split(' ')[0]);
      setUserAvatar(currentUser.avatar_url || initialsAvatarUrl(currentUser.nombres));
    }

    logoutUser();

    const timeout = setTimeout(() => {
      router.replace('/login');
    }, 2800);

    return () => {
      clearTimeout(timeout);
    };
  }, [router, currentUser]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      
      {/* Sutil halo ambiental minimalista */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-slate-700/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Tarjeta Horizontal Minimalista con efecto de caída suave (curtain-drop) */}
      <div className="relative z-10 max-w-2xl w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/70 animate-curtain-drop">
        
        {/* Cabecera horizontal institucional */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide uppercase">
                {schoolName}
              </h2>
              <p className="text-[11px] text-slate-400">
                Cierre de Sesión Seguro
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/60 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Sesión Finalizada
            </span>
          </div>
        </div>

        {/* Cuerpo Bento horizontal */}
        <div className="pt-5 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          
          {/* Columna Izquierda: Avatar y Estado */}
          <div className="flex flex-col items-center flex-shrink-0 text-center">
            <div className="relative mb-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-2 ring-slate-700/80 bg-slate-950 p-1 shadow-md">
                <img
                  src={userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={userName || 'Usuario'}
                  className="w-full h-full rounded-xl object-cover grayscale opacity-90"
                />
              </div>
              <div 
                title="Sesión cerrada correctamente"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Datos Protegidos
            </span>
          </div>

          {/* Columna Derecha: Mensaje y Redirección */}
          <div className="flex-1 min-w-0 flex flex-col justify-between w-full text-center sm:text-left">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Jornada Concluida
              </span>

              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug">
                ¡Hasta luego{userName ? `, ${userName}` : ''}!
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 mt-1 line-relaxed">
                Tu sesión ha sido cerrada correctamente. Todas tus modificaciones y registros institucionales quedaron sincronizados de forma segura.
              </p>
            </div>

            {/* Progreso hacia el Login */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span>Redirigiendo a la pantalla de ingreso...</span>
                <span className="text-slate-500 font-mono">Seguro</span>
              </div>

              {/* Barra de progreso pulsante */}
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full animate-pulse w-full" />
              </div>

              {/* Botón de acceso inmediato */}
              <div className="flex items-center justify-end pt-1">
                <button
                  onClick={() => router.replace('/login')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 hover:text-white font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700/60"
                >
                  <span>Iniciar con otra cuenta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

