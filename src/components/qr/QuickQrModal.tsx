'use client';

import React from 'react';
import { X, QrCode, Sparkles } from 'lucide-react';
import { QrScanner } from '@/components/qr/QrScanner';

interface QuickQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickQrModal: React.FC<QuickQrModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                Lector de Asistencia QR
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lectura instantánea desde cualquier vista
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Cerrar modal QR"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          <QrScanner 
            variant="embedded"
            showHeader={false}
            autoStart={true}
            onScanSuccess={() => {
              // Optional auto close or keep open for continuous rapid scans
            }} 
          />
        </div>
      </div>
    </div>
  );
};
