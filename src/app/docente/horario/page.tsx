'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { DayOfWeek } from '@/types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  Users, 
  School, 
  Sparkles, 
  Printer 
} from 'lucide-react';
import { TIME_BLOCKS, DAYS } from '@/lib/constants/schedule';

export default function DocenteHorarioPage() {
  const { currentUser, getTeacherSchedule, getTeacherSections } = useApp();
  const [selectedMobileDay, setSelectedMobileDay] = React.useState<DayOfWeek>('lunes');

  const mySchedule = getTeacherSchedule(currentUser.id);
  const mySections = getTeacherSections(currentUser.id);
  const totalWeeklyHours = mySchedule.length;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-blue-800/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Horario Académico Docente 2026
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Mi Horario de Clases Semanal
          </h1>
          <p className="text-blue-200/80 text-sm mt-1 max-w-xl">
            Consulta los salones, materias y horarios pedagógicos que tienes a tu cargo de lunes a viernes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir Mi Horario
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white block">{totalWeeklyHours} hrs</span>
            <span className="text-xs font-bold text-slate-500">Carga Horaria Semanal</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
            <School className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white block">{mySections.length}</span>
            <span className="text-xs font-bold text-slate-500">Salones Asignados</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white block">
              {mySections.reduce((acc, curr) => acc + curr.cursos.length, 0)}
            </span>
            <span className="text-xs font-bold text-slate-500">Materias a Cargo</span>
          </div>
        </div>
      </div>

      {/* Salones a Cargo Chips */}
      {mySections.length > 0 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Mis Salones y Cursos Vinculados:
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {mySections.map(({ seccion, cursos }) => (
              <div 
                key={seccion.id}
                className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  {seccion.letra}
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                    {seccion.grado?.nombre} &quot;{seccion.letra}&quot;
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">
                    {cursos.map(c => c.nombre).join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Day Selector Bar (Visible on mobile screens < md) */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          {DAYS.map(d => (
            <button
              key={d.key}
              onClick={() => setSelectedMobileDay(d.key)}
              className={`flex-1 py-2 px-1 text-center rounded-xl text-xs font-black transition-all ${
                selectedMobileDay === d.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>{d.short}</span>
            </button>
          ))}
        </div>

        {/* Day's Timeline Cards */}
        <div className="space-y-2">
          {TIME_BLOCKS.map(block => {
            if (block.isBreak) {
              return (
                <div key={block.id} className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">☕</span>
                    <span className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">Recreo Escolar</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">{block.inicio} - {block.fin}</span>
                </div>
              );
            }

            const slot = mySchedule.find(
              s => s.dia === selectedMobileDay && s.hora_inicio === block.inicio
            );

            if (slot) {
              const color = slot.curso?.color_hex || '#3b82f6';
              return (
                <div
                  key={block.id}
                  className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-sm"
                  style={{
                    backgroundColor: `${color}12`,
                    borderColor: `${color}45`,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate block">
                        {slot.curso?.nombre}
                      </span>
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold truncate">
                        {slot.seccion?.grado?.nombre} &quot;{slot.seccion?.letra}&quot; • {slot.aula || 'Aula Principal'}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-xs shrink-0">
                    {block.inicio} - {block.fin}
                  </span>
                </div>
              );
            }

            // Free period
            return (
              <div
                key={block.id}
                className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30 flex items-center justify-between opacity-60"
              >
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{block.label}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Libre ({block.inicio} - {block.fin})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timetable Grid (Desktop md+) */}
      <div className="hidden md:block overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full border-collapse text-left min-w-[750px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <th className="p-3.5 text-center text-[11px] font-black uppercase text-slate-500 w-28">
                Hora
              </th>
              {DAYS.map(d => (
                <th key={d.key} className="p-3.5 text-center text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {TIME_BLOCKS.map(block => {
              if (block.isBreak) {
                return (
                  <tr key={block.id} className="bg-amber-500/10 dark:bg-amber-950/20">
                    <td className="p-2 text-center text-xs font-black text-amber-700 dark:text-amber-400">
                      {block.inicio} - {block.fin}
                    </td>
                    <td colSpan={5} className="p-2 text-center text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-widest">
                      ☕ RECREO
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={block.id}>
                  <td className="p-3 text-center border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/30">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {block.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {block.inicio} - {block.fin}
                    </span>
                  </td>

                  {DAYS.map(day => {
                    const slot = mySchedule.find(
                      s => s.dia === day.key && s.hora_inicio === block.inicio
                    );

                    if (slot) {
                      const color = slot.curso?.color_hex || '#3b82f6';
                      return (
                        <td key={day.key} className="p-2 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">
                          <div 
                            className="p-2.5 rounded-2xl border flex flex-col justify-between h-24"
                            style={{
                              backgroundColor: `${color}14`,
                              borderColor: `${color}40`,
                            }}
                          >
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                                {slot.curso?.nombre}
                              </span>
                              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block">
                                {slot.seccion?.grado?.nombre} &quot;{slot.seccion?.letra}&quot;
                              </span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              {slot.aula || 'Aula Principal'}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={day.key} className="p-2 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0 text-center text-slate-300 dark:text-slate-700 text-xs">
                        —
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
