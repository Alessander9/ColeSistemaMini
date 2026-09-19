'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

export interface DateRange {
  id: 'hoy' | '7dias' | 'este_mes' | 'bimestre_actual' | 'todo_anio' | 'personalizado';
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

interface DateRangePickerProps {
  selectedRange: DateRange;
  onSelectRange: (range: DateRange) => void;
}

export function DateRangePicker({ selectedRange, onSelectRange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(selectedRange.startDate);
  const [customEnd, setCustomEnd] = useState(selectedRange.endDate);

  const presets: Omit<DateRange, 'label'>[] = [
    { id: 'hoy', startDate: '2026-09-16', endDate: '2026-09-16' },
    { id: '7dias', startDate: '2026-09-10', endDate: '2026-09-16' },
    { id: 'este_mes', startDate: '2026-09-01', endDate: '2026-09-30' },
    { id: 'bimestre_actual', startDate: '2026-08-10', endDate: '2026-10-16' },
    { id: 'todo_anio', startDate: '2026-03-01', endDate: '2026-12-20' },
  ];

  const presetLabels: Record<string, string> = {
    hoy: 'Hoy (16 sept. 2026)',
    '7dias': 'Últimos 7 días',
    este_mes: 'Este mes (Septiembre 2026)',
    bimestre_actual: 'Bimestre actual (III Bimestre)',
    todo_anio: 'Todo el año escolar 2026',
    personalizado: 'Rango personalizado',
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      onSelectRange({
        id: 'personalizado',
        label: `${customStart} — ${customEnd}`,
        startDate: customStart,
        endDate: customEnd,
      });
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-sm transition-all cursor-pointer"
      >
        <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
        <span>{selectedRange.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-40 animate-in fade-in-50 zoom-in-95">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-2 py-1">
              Seleccionar Rango
            </span>

            <div className="space-y-1 my-1">
              {presets.map((p) => {
                const isSelected = selectedRange.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectRange({
                        id: p.id,
                        label: presetLabels[p.id],
                        startDate: p.startDate,
                        endDate: p.endDate,
                      });
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{presetLabels[p.id]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Range Inputs */}
            <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 px-1">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Personalizado:
              </span>
              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Desde</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full text-[11px] px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Hasta</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full text-[11px] px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <button
                onClick={handleApplyCustom}
                className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                Aplicar Rango
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
