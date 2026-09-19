'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sparkles } from 'lucide-react';

export default function InstitutionalSplashScreen() {
  const { brandingConfig } = useApp();
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Si el splash screen está desactivado en la configuración, no mostrar
    if (brandingConfig?.splashScreenActivo === false) {
      setShouldRender(false);
      return;
    }

    // Comprobar si ya se mostró en esta sesión para no ser invasivo
    const hasShownSession = sessionStorage.getItem('cole_splash_shown');
    if (hasShownSession) {
      setShouldRender(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('cole_splash_shown', 'true');
      const removeTimer = setTimeout(() => setShouldRender(false), 600);
      return () => clearTimeout(removeTimer);
    }, 1400);

    return () => clearTimeout(timer);
  }, [brandingConfig?.splashScreenActivo]);

  if (!shouldRender || brandingConfig?.splashScreenActivo === false) return null;

  const primaryColor = brandingConfig?.primaryColor || '#4f46e5';
  const logoUrl = brandingConfig?.logoUrl;
  const siglas = brandingConfig?.siglas || 'CS';
  const schoolName = brandingConfig?.nombreInstitucion || 'ColeSistema';
  const splashText = brandingConfig?.splashScreenTexto || 'Iniciando Plataforma de Gestión Escolar...';

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-500 select-none ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Fondo con resplandores suaves */}
      <div 
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none animate-pulse"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-5 max-w-sm">
        {/* Insignia / Escudo con pulso */}
        <div className="relative">
          <div 
            className="w-24 h-24 rounded-3xl p-1 flex items-center justify-center shadow-2xl shadow-indigo-950 border border-white/20 animate-bounce"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={schoolName} className="w-full h-full object-contain p-2 rounded-2xl" />
            ) : (
              <div 
                className="w-full h-full rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-inner"
                style={{ backgroundColor: primaryColor }}
              >
                {siglas}
              </div>
            )}
          </div>
          <div 
            className="absolute -inset-2 rounded-3xl blur-md opacity-40 -z-10 animate-pulse"
            style={{ backgroundColor: primaryColor }}
          />
        </div>

        {/* Título Institucional */}
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white tracking-tight">{schoolName}</h2>
          <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            {brandingConfig?.slogan || 'Año Académico 2026'}
          </p>
        </div>

        {/* Barra de Carga Dinámica */}
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
          <div 
            className="h-full rounded-full animate-[progress_1.4s_ease-in-out_infinite]"
            style={{ 
              backgroundColor: primaryColor,
              backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
            }}
          />
        </div>

        <p className="text-[11px] text-slate-500 font-mono animate-pulse">
          {splashText}
        </p>
      </div>
    </div>
  );
}
