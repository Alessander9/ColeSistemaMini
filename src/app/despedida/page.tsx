'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { logoutUser } from '@/lib/services/authService';
import { Sparkles, Heart } from 'lucide-react';
import { initialsAvatarUrl } from '@/lib/avatar';

export default function DespedidaPage() {
  const router = useRouter();
  const { currentUser } = useApp();
  const [userName, setUserName] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string>('');

  useEffect(() => {
    // 1. Obtener datos del usuario antes de limpiar la sesión
    if (currentUser?.nombres) {
      setUserName(currentUser.nombres.split(' ')[0]);
      setUserAvatar(currentUser.avatar_url || initialsAvatarUrl(currentUser.nombres));
    }

    // 2. Limpieza de sesión
    logoutUser();

    // 3. Redirección automática a /login al culminar
    const timeout = setTimeout(() => {
      router.replace('/login');
    }, 2200);

    return () => {
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden px-4 select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Farewell Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6 animate-scale-up">
        
        {/* Foto de perfil en tamaño circular */}
        <div className="relative">
          <img
            src={userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={userName || 'Usuario'}
            className="w-28 h-28 rounded-full object-cover ring-4 ring-purple-500/30 shadow-2xl shadow-purple-500/20 mx-auto"
          />
          <div className="absolute bottom-0 right-1 w-6 h-6 rounded-full bg-purple-500 border-2 border-slate-950 flex items-center justify-center">
            <Heart className="w-3 h-3 text-white fill-white" />
          </div>
        </div>

        {/* Mensaje de despedida */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-950/60 border border-purple-800/60 text-purple-300 mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sesión Finalizada</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ¡Hasta luego{userName ? `, ${userName}` : ''}!
          </h1>

          <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            Gracias por tu dedicación y esfuerzo hoy. ¡Esperamos verte pronto en ColeSistema!
          </p>
        </div>

        {/* Indicador de cierre */}
        <div className="pt-2 w-full max-w-xs space-y-2">
          <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse w-full" />
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Cerrando sesión de forma segura...
          </p>
        </div>

      </div>
    </div>
  );
}
