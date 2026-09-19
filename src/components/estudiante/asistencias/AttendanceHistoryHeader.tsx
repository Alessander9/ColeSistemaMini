'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Calendar, Clock, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';

interface AttendanceHistoryHeaderProps {
  onExport: (format: 'pdf' | 'excel') => void;
}

export function AttendanceHistoryHeader({ onExport }: AttendanceHistoryHeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('08:24 AM');
  const [currentDateStr, setCurrentDateStr] = useState<string>('Martes, 16 de septiembre de 2026');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeFormatter = new Intl.DateTimeFormat('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setCurrentTime(timeFormatter.format(now));

      const dateFormatter = new Intl.DateTimeFormat('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const formatted = dateFormatter.format(now);
      // Capitalize first letter of weekday
      setCurrentDateStr(formatted.charAt(0).toUpperCase() + formatted.slice(1));
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
      {/* Left: Icon, Title and Subtitle */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <QrCode className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Historial de Asistencias
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl font-normal leading-relaxed">
            Registro cronológico de tus ingresos escaneados mediante código QR institucional.
          </p>
        </div>
      </div>

      {/* Right: Date & Time Live Pill + Export Button */}
      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
        {/* Date & Time Widget */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-300">
          <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
              {currentDateStr}
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-white font-mono tracking-tight leading-tight">
              {currentTime}
            </span>
          </div>
        </div>

        {/* Export Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all duration-150 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Reporte</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>

          {showExportMenu && (
            <>
              <div 
                className="fixed inset-0 z-20" 
                onClick={() => setShowExportMenu(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-30 animate-in fade-in-50 zoom-in-95">
                <button
                  onClick={() => {
                    onExport('pdf');
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                >
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>Descargar como PDF</span>
                </button>
                <button
                  onClick={() => {
                    onExport('excel');
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Exportar como Excel (CSV)</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
