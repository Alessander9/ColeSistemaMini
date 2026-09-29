'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { DayOfWeek, ScheduleSlot } from '@/types';
import { TIME_BLOCKS, DAYS } from '@/lib/constants/schedule';
import { getAttendanceWindow } from '@/lib/schedule/attendanceWindow';
import { useAulaColors } from '@/hooks/useAulaColors';
import { ChevronDown, Clock, MapPin, Printer, UserCheck } from 'lucide-react';

const WEEKDAY_KEYS: (DayOfWeek | null)[] = [null, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', null];

function timeText(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
}

export default function DocenteHorarioPage() {
  const { currentUser, courses, sections, enrollments, getTeacherSchedule, getTeacherSections } = useApp();

  const mySchedule = useMemo(() => getTeacherSchedule(currentUser.id), [getTeacherSchedule, currentUser.id]);
  const mySections = useMemo(() => getTeacherSections(currentUser.id), [getTeacherSections, currentUser.id]);

  // Hora actual que se actualiza sola cada 30 s, para habilitar/deshabilitar la asistencia sin recargar
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const todayKey = WEEKDAY_KEYS[now.getDay()];
  const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayKey || 'lunes');
  const [showWeek, setShowWeek] = useState(false);

  // Aulas del horario (y las asignadas aunque aún no tengan horas), cada una con su color
  const aulaIds = useMemo(() => {
    const ids = [...mySections.map(s => s.seccion.id), ...mySchedule.map(s => s.seccion_id)];
    return Array.from(new Set(ids));
  }, [mySections, mySchedule]);
  const colorOf = useAulaColors(); // color fijo por aula, igual en todo el portal docente
  const sectionOf = (id?: string) => sections.find(s => s.id === id) || mySections.find(s => s.seccion.id === id)?.seccion;
  const aulaName = (id?: string) => {
    const s = sectionOf(id);
    return s ? `${s.grado?.nombre || 'Grado'} "${s.letra}"` : 'Aula';
  };
  const courseName = (id?: string) => courses.find(c => c.id === id)?.nombre || 'Curso';
  const slotAt = (day: DayOfWeek, inicio: string) => mySchedule.find(s => s.dia === day && s.hora_inicio === inicio);
  const classesOn = (day: DayOfWeek) => mySchedule.filter(s => s.dia === day).length;

  // Clase actual, siguiente de hoy o primera del próximo día con clases
  const featured = useMemo(() => {
    if (todayKey) {
      const today = mySchedule.filter(s => s.dia === todayKey).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
      const current = today.find(s => s.hora_inicio <= nowHHMM && nowHHMM < s.hora_fin);
      if (current) return { kind: 'now' as const, slot: current };
      const next = today.find(s => s.hora_inicio > nowHHMM);
      if (next) return { kind: 'next' as const, slot: next };
    }
    const order = DAYS.map(d => d.key);
    const start = todayKey ? order.indexOf(todayKey) + 1 : 0;
    for (let i = 0; i < order.length; i++) {
      const key = order[(start + i) % order.length];
      const first = mySchedule.filter(s => s.dia === key).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))[0];
      if (first) return { kind: 'later' as const, slot: first };
    }
    return null;
  }, [mySchedule, todayKey, nowHHMM]);

  const dayLabel = (key: string) => DAYS.find(d => d.key === key)?.label || key;
  const studentsIn = (secId: string) => enrollments.filter(e => e.seccion_id === secId && e.estado === 'activo').length;

  // La asistencia solo se toma el mismo día de la clase, entre su hora de inicio y su hora de fin
  const attendanceWindow = (slot: ScheduleSlot): { open: boolean; reason: string } => {
    const state = getAttendanceWindow(slot, todayKey, nowHHMM);
    if (state === 'other-day') return { open: false, reason: `Se habilita el ${dayLabel(slot.dia).toLowerCase()} a las ${timeText(slot.hora_inicio)}` };
    if (state === 'before') return { open: false, reason: `Se habilita a las ${timeText(slot.hora_inicio)}` };
    if (state === 'after') return { open: false, reason: `La clase terminó a las ${timeText(slot.hora_fin)}` };
    return { open: true, reason: `Disponible hasta las ${timeText(slot.hora_fin)}` };
  };

  const AttendanceLink = ({ slot, big = false }: { slot: ScheduleSlot; big?: boolean }) => {
    const { open, reason } = attendanceWindow(slot);
    const size = big ? 'px-5 py-3 text-base' : 'px-4 py-2.5 text-sm';
    const icon = <UserCheck className={big ? 'w-5 h-5' : 'w-4 h-4'} />;
    return (
      <span className="flex flex-col items-stretch md:items-end gap-1 shrink-0 print:hidden">
        {open ? (
          <Link
            href={`/docente?aula=${encodeURIComponent(slot.seccion_id)}#tomar-asistencia`}
            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black ${size}`}
          >
            {icon} Tomar asistencia
          </Link>
        ) : (
          <button
            type="button"
            disabled
            aria-disabled="true"
            title={reason}
            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black cursor-not-allowed ${size}`}
          >
            {icon} Tomar asistencia
          </button>
        )}
        <span className={`text-sm font-semibold ${open ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>{reason}</span>
      </span>
    );
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10 animate-in fade-in-50">

      {/* ── CABECERA ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Mi horario</h1>
          <p className="text-base text-slate-600 dark:text-slate-300 mt-1">
            Tus clases de lunes a viernes · <strong>{mySections.length} {mySections.length === 1 ? 'aula' : 'aulas'}</strong> · <strong>{mySchedule.length} horas</strong> de clase por semana
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-base font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer print:hidden"
        >
          <Printer className="w-5 h-5" /> Imprimir horario
        </button>
      </div>

      {mySchedule.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center">
          <p className="text-xl font-black text-slate-900 dark:text-white">Aún no tienes clases en tu horario</p>
          <p className="text-base text-slate-600 dark:text-slate-300 mt-2">Cuando Coordinación Académica publique tu horario, aquí verás tus clases de cada día.</p>
        </div>
      ) : (
        <>
          {/* ── AHORA / PRÓXIMA CLASE ── */}
          {featured && (
            <div className={`rounded-3xl border-2 p-5 flex flex-col md:flex-row md:items-center gap-4 print:hidden ${
              featured.kind === 'now' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30'
            }`}>
              <div className="flex-1 min-w-0">
                <p className={`text-base font-black ${featured.kind === 'now' ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300'}`}>
                  {featured.kind === 'now' ? '● Ahora tienes clase'
                    : featured.kind === 'next' ? 'Tu próxima clase de hoy'
                    : `${todayKey ? 'Hoy ya terminaste tus clases.' : 'Hoy no hay clases.'} Tu próxima clase es el ${dayLabel(featured.slot.dia).toLowerCase()}`}
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {courseName(featured.slot.curso_id)} · {aulaName(featured.slot.seccion_id)}
                </p>
                <p className="text-lg text-slate-700 dark:text-slate-200 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1.5"><Clock className="w-5 h-5" /> {timeText(featured.slot.hora_inicio)} a {timeText(featured.slot.hora_fin)}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="w-5 h-5" /> {featured.slot.aula || sectionOf(featured.slot.seccion_id)?.aula || 'Aula por confirmar'}</span>
                </p>
              </div>
              <AttendanceLink slot={featured.slot} big />
            </div>
          )}

          {/* ── DÍAS ── */}
          <div className="grid grid-cols-5 gap-2 print:hidden" role="tablist" aria-label="Días de la semana">
            {DAYS.map(d => {
              const active = selectedDay === d.key;
              const isToday = d.key === todayKey;
              return (
                <button
                  key={d.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedDay(d.key)}
                  className={`rounded-2xl border-2 px-2 py-3 text-center transition-colors cursor-pointer ${
                    active ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-slate-400'
                  }`}
                >
                  <span className="block text-base sm:text-lg font-black">{d.label}</span>
                  <span className={`block text-sm font-semibold ${active ? 'opacity-90' : 'text-slate-500 dark:text-slate-400'}`}>
                    {isToday ? 'Hoy · ' : ''}{classesOn(d.key)} {classesOn(d.key) === 1 ? 'clase' : 'clases'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── CLASES DEL DÍA ELEGIDO ── */}
          <div className="space-y-2 print:hidden">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {selectedDay === todayKey ? 'Hoy, ' : ''}{dayLabel(selectedDay)}
            </h2>
            {TIME_BLOCKS.map(block => {
              if (block.isBreak) {
                return (
                  <div key={block.id} className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border-2 border-dashed border-amber-300 dark:border-amber-800">
                    <span className="min-w-[11rem] text-base font-bold text-amber-800 dark:text-amber-200 shrink-0 whitespace-nowrap">{timeText(block.inicio)} a {timeText(block.fin)}</span>
                    <span className="text-base font-black text-amber-800 dark:text-amber-200">☕ Recreo</span>
                  </div>
                );
              }
              const slot = slotAt(selectedDay, block.inicio);
              const isNow = !!slot && selectedDay === todayKey && slot.hora_inicio <= nowHHMM && nowHHMM < slot.hora_fin;
              if (!slot) {
                return (
                  <div key={block.id} className="flex items-center gap-4 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="min-w-[11rem] text-base font-semibold text-slate-400 shrink-0 whitespace-nowrap">{timeText(block.inicio)} a {timeText(block.fin)}</span>
                    <span className="text-base text-slate-400">Hora libre</span>
                  </div>
                );
              }
              const color = colorOf(slot.seccion_id);
              return (
                <div key={block.id} className={`flex rounded-2xl border-2 overflow-hidden ${isNow ? 'border-emerald-500' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-900`}>
                  <span className={`w-2.5 shrink-0 ${color.dot}`} />
                  <div className="flex-1 min-w-0 px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
                    <span className="w-44 shrink-0">
                      <span className="block text-lg font-black text-slate-900 dark:text-white">{timeText(slot.hora_inicio)}</span>
                      <span className="block text-sm text-slate-500 dark:text-slate-400">hasta las {timeText(slot.hora_fin)}</span>
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-lg font-black text-slate-900 dark:text-white">
                        {courseName(slot.curso_id)} · {aulaName(slot.seccion_id)}
                        {isNow && <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-sm align-middle">Ahora</span>}
                      </span>
                      <span className="block text-base text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 shrink-0" /> {slot.aula || sectionOf(slot.seccion_id)?.aula || 'Aula por confirmar'} · {studentsIn(slot.seccion_id)} {studentsIn(slot.seccion_id) === 1 ? 'alumno' : 'alumnos'}
                      </span>
                    </span>
                    <AttendanceLink slot={slot} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── SEMANA COMPLETA (desplegable; siempre visible al imprimir) ── */}
          <div className="flex justify-center print:hidden">
            <button
              type="button"
              onClick={() => setShowWeek(v => !v)}
              aria-expanded={showWeek}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-base font-black text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showWeek ? 'rotate-180' : ''}`} />
              {showWeek ? 'Ocultar la semana completa' : 'Ver la semana completa'}
            </button>
          </div>

          <div className={`${showWeek ? 'block' : 'hidden'} print:block rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3`}>
            {/* Leyenda de colores por aula */}
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {aulaIds.map(id => (
                <span key={id} className="inline-flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
                  <span className={`w-4 h-4 rounded ${colorOf(id).dot}`} /> {aulaName(id)}
                </span>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-separate border-spacing-1.5 text-sm">
                <thead>
                  <tr>
                    <th className="w-28 text-left text-slate-500 font-bold">Hora</th>
                    {DAYS.map(d => (
                      <th key={d.key} className={`py-2 rounded-xl text-base font-black ${d.key === todayKey ? 'bg-emerald-600 text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                        {d.label}{d.key === todayKey ? ' (hoy)' : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_BLOCKS.map(block => (
                    <tr key={block.id}>
                      <td className="text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap align-middle">{timeText(block.inicio)}</td>
                      {block.isBreak ? (
                        <td colSpan={DAYS.length} className="text-center py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 font-black">☕ Recreo</td>
                      ) : DAYS.map(d => {
                        const slot = slotAt(d.key, block.inicio);
                        if (!slot) return <td key={d.key} className="py-2 text-center text-slate-300 dark:text-slate-600">—</td>;
                        const color = colorOf(slot.seccion_id);
                        return (
                          <td key={d.key} className={`px-2 py-2 rounded-xl ${color.soft}`}>
                            <span className={`block font-black ${color.text}`}>{aulaName(slot.seccion_id)}</span>
                            <span className="block text-slate-600 dark:text-slate-300">{courseName(slot.curso_id)}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
