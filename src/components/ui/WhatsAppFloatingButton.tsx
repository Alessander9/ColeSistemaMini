'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { MessageCircle, X } from 'lucide-react';

export function WhatsAppFloatingButton() {
  const { brandingConfig } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  if (!brandingConfig?.mostrarWhatsappFlotante || !brandingConfig?.whatsappSoporteNumero) {
    return null;
  }

  const cleanNumber = brandingConfig.whatsappSoporteNumero.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(
    brandingConfig.whatsappSoporteMensaje ||
    `Hola, me comunico desde la plataforma de ${brandingConfig.nombreInstitucion || 'ColeSistema'}.`
  );
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[9990] flex flex-col items-end animate-in slide-in-from-bottom-5 duration-300">
      {/* Popover Card */}
      {isOpen && (
        <div className="mb-3 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Atención {brandingConfig.siglas || 'Escolar'}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● En línea ahora</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p>
              ¿Tienes dudas sobre matrículas, notas o asistencia en <strong>{brandingConfig.nombreInstitucion || 'nuestro colegio'}</strong>?
            </p>
            <p className="text-[11px] text-slate-400">
              Escríbenos directamente por WhatsApp y nuestro equipo de secretaría te atenderá.
            </p>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" /> Iniciar Chat en WhatsApp
          </a>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        title="Contactar por WhatsApp"
        aria-label="Abrir chat de WhatsApp"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white border-2 border-emerald-500 rounded-full" />
          </div>
        )}
      </button>
    </div>
  );
}
