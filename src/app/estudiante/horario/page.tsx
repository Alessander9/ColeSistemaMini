'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/context/AppContext';
import { Course, DayOfWeek, ScheduleSlot, UserProfile } from '@/types';
import { TIME_BLOCKS, DAYS } from '@/lib/constants/schedule';
import {
  ChevronDown,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';

// Día de la semana actual en el formato del horario (fin de semana → null)
const WEEKDAY_KEYS: (DayOfWeek | null)[] = [null, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', null];

function courseEmoji(name?: string) {
  const n = (name || '').toLowerCase();
  if (n.includes('matem')) return '🔢';
  if (n.includes('comunic')) return '📖';
  if (n.includes('cienc') || n.includes('tecnol')) return '🌱';
  if (n.includes('social') || n.includes('historia')) return '🌎';
  if (n.includes('arte') || n.includes('cultura')) return '🎨';
  if (n.includes('ingl')) return '🗣️';
  if (n.includes('físic') || n.includes('fisic')) return '⚽';
  if (n.includes('relig')) return '🙏';
  if (n.includes('comput') || n.includes('robot')) return '💻';
  return '📘';
}

function timeText(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
}

function initials(p?: UserProfile | null) {
  if (!p) return '?';
  return `${(p.nombres || '?')[0]}${(p.apellidos || '')[0] || ''}`.toUpperCase();
}

function TeacherAvatar({ teacher, size = 'md' }: { teacher?: UserProfile | null; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-16 h-16 text-xl rounded-2xl' : size === 'sm' ? 'w-7 h-7 text-[10px] rounded-lg' : 'w-10 h-10 text-sm rounded-xl';
  if (teacher?.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={teacher.avatar_url} alt={`${teacher.nombres} ${teacher.apellidos}`} className={`${cls} object-cover shrink-0`} />;
  }
  return (
    <span className={`${cls} bg-gradient-to-br from-violet-500 to-sky-500 text-white font-black flex items-center justify-center shrink-0`}>
      {initials(teacher)}
    </span>
  );
}

// Dibujo amigable: mochila con reloj
function ScheduleIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <circle cx="80" cy="62" r="50" className="fill-white/60 dark:fill-white/5" />
      <rect x="44" y="34" width="56" height="70" rx="16" fill="#8b5cf6" />
      <path d="M58 34 v-6 a14 14 0 0 1 28 0 v6" fill="none" stroke="#6d28d9" strokeWidth="5" />
      <rect x="52" y="64" width="40" height="30" rx="8" fill="#a78bfa" />
      <rect x="66" y="72" width="12" height="4" rx="2" fill="#ede9fe" />
      <circle cx="116" cy="46" r="20" fill="#fff" stroke="#0ea5e9" strokeWidth="4" />
      <path d="M116 34 V46 L124 51" fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 30 l3 6 l6 1 l-4.5 4.5 l1 6.5 l-5.5 -3 l-5.5 3 l1 -6.5 l-4.5 -4.5 l6 -1 Z" fill="#fbbf24" />
      <path d="M140 84 l2 4 l4 0.7 l-3 3 l0.7 4.3 l-3.7 -2 l-3.7 2 l0.7 -4.3 l-3 -3 l4 -0.7 Z" fill="#34d399" />
    </svg>
  );
}

export default function EstudianteHorarioPage() {
  const { currentUser, students, enrollments, users, courses, sections, getSectionSchedule, getSectionCourses } = useApp();

  const currentStudent = students.find(s => s.profile_id === currentUser.id || s.id === currentUser.id);
  const currentEnrollment = enrollments.find(e => e.estudiante_id === currentStudent?.id);
  const sectionId = currentEnrollment?.seccion_id || '';
  const section = sections.find(s => s.id === sectionId) || currentEnrollment?.seccion;

  const slots = getSectionSchedule(sectionId);
  const sectionCourses = getSectionCourses(sectionId);

  const now = new Date();
  const todayKey = WEEKDAY_KEYS[now.getDay()];
  const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayKey || 'lunes');
  const [showWeek, setShowWeek] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const courseById = (id?: string) => courses.find(c => c.id === id);
  const teacherById = (id?: string) => users.find(u => u.id === id) || null;
  const tutor = teacherById(section?.tutor_id);

  // Cursos del alumno: los asignados a su sección y los que aparecen en su horario
  const myCourses = useMemo(() => {
    const ids = new Set<string>([...sectionCourses.map(sc => sc.curso_id), ...slots.map(s => s.curso_id)]);
    return Array.from(ids)
      .map(id => {
        const course = courseById(id);
        const courseSlots = slots.filter(s => s.curso_id === id);
        const teacherId = sectionCourses.find(sc => sc.curso_id === id)?.docente_id || courseSlots[0]?.docente_id;
        return course ? { course, teacher: teacherById(teacherId), slots: courseSlots } : null;
      })
      .filter((c): c is { course: Course; teacher: UserProfile | null; slots: ScheduleSlot[] } => !!c)
      .sort((a, b) => b.slots.length - a.slots.length || a.course.nombre.localeCompare(b.course.nombre));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionCourses, slots, courses, users]);

  const teacherCount = new Set(myCourses.map(c => c.teacher?.id).filter(Boolean)).size;
  const slotAt = (day: DayOfWeek, inicio: string) => slots.find(s => s.dia === day && s.hora_inicio === inicio);

  // Clase actual o siguiente (hoy); si no hay más hoy, la primera del próximo día con clases
  const liveInfo = useMemo(() => {
    if (todayKey) {
      const today = slots.filter(s => s.dia === todayKey).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
      const current = today.find(s => s.hora_inicio <= nowHHMM && nowHHMM < s.hora_fin);
      if (current) return { kind: 'now' as const, slot: current, dayLabel: 'Hoy' };
      const next = today.find(s => s.hora_inicio > nowHHMM);
      if (next) return { kind: 'next' as const, slot: next, dayLabel: 'Hoy' };
    }
    const order = DAYS.map(d => d.key);
    const startIdx = todayKey ? order.indexOf(todayKey) + 1 : 0;
    for (let i = 0; i < order.length; i++) {
      const key = order[(startIdx + i) % order.length];
      const first = slots.filter(s => s.dia === key).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))[0];
      if (first) return { kind: 'later' as const, slot: first, dayLabel: DAYS.find(d => d.key === key)?.label || '' };
    }
    return null;
  }, [slots, todayKey, nowHHMM]);

  const selectedCourse = myCourses.find(c => c.course.id === selectedCourseId) || null;

  useEffect(() => {
    if (!selectedCourseId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedCourseId(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedCourseId]);

  const firstName = (currentStudent?.profile?.nombres || currentStudent?.nombres || currentUser?.nombres || '').split(' ')[0];
  const classroom = section?.grado?.nombre ? `${section.grado.nombre} "${section.letra}"` : 'Sin aula asignada';

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in-50 pb-8">

      {/* ── CABECERA AMIGABLE ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-100 via-sky-50 to-emerald-100 dark:from-violet-950/50 dark:via-slate-900 dark:to-emerald-950/40 border border-violet-200/70 dark:border-violet-900/60 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Mi horario {firstName && <span className="text-violet-600 dark:text-violet-300">· {firstName}</span>}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {classroom}{tutor ? ` · Tutor(a): ${tutor.nombres} ${tutor.apellidos}` : ''} · Toca un curso para conocer a tu profesor.
            </p>
            <div className="flex flex-wrap gap-2 pt-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200">📚 {myCourses.length} cursos</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200">🧑‍🏫 {teacherCount} profesores</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200">⏱️ {slots.length} horas de clase a la semana</span>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer print:hidden"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </button>
            </div>
          </div>
          <ScheduleIllustration className="hidden sm:block w-32 h-24 shrink-0 animate-float" />
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-2">
          <div className="text-5xl" aria-hidden="true">🗓️</div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Tu horario aún no está listo</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Cuando el colegio publique tu horario, aquí verás tus clases de cada día y a tus profesores.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* ── COLUMNA PRINCIPAL ── */}
          <div className="lg:col-span-8 space-y-3">

            {/* Ahora / siguiente */}
            {liveInfo && (() => {
              const course = courseById(liveInfo.slot.curso_id);
              const teacher = teacherById(liveInfo.slot.docente_id);
              return (
                <button
                  type="button"
                  onClick={() => setSelectedCourseId(liveInfo.slot.curso_id)}
                  className={`w-full text-left rounded-3xl border p-4 flex items-center gap-4 cursor-pointer transition-shadow hover:shadow-md ${
                    liveInfo.kind === 'now' ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60' : 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60'
                  }`}
                >
                  <span className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-4xl shrink-0" aria-hidden="true">
                    {courseEmoji(course?.nombre)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5 inline -mt-0.5" />{' '}
                      {liveInfo.kind === 'now' ? `Ahora mismo · hasta las ${timeText(liveInfo.slot.hora_fin)}`
                        : liveInfo.kind === 'next' ? `Tu próxima clase · hoy a las ${timeText(liveInfo.slot.hora_inicio)}`
                        : `${todayKey ? 'Hoy ya no tienes más clases' : 'Hoy no hay clases 🛋️'} · El ${liveInfo.dayLabel.toLowerCase()} empiezas con`}
                    </span>
                    <span className="block text-lg font-black text-slate-900 dark:text-white truncate">{course?.nombre || 'Curso'}</span>
                    <span className="flex items-center gap-2 mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                      <TeacherAvatar teacher={teacher} size="sm" />
                      <span className="truncate">{teacher ? `Prof. ${teacher.nombres} ${teacher.apellidos}` : 'Profesor por asignar'} · {liveInfo.slot.aula || 'Aula por confirmar'}</span>
                    </span>
                  </span>
                  <span className="hidden sm:inline text-xs font-bold text-sky-700 dark:text-sky-300 shrink-0">Ver curso →</span>
                </button>
              );
            })()}

            {/* Pestañas de días */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl overflow-x-auto print:hidden">
              {DAYS.map(d => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedDay(d.key)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    selectedDay === d.key ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {d.label}
                  {d.key === todayKey && <span className="px-1.5 rounded-full bg-emerald-500 text-white text-[10px]">Hoy</span>}
                </button>
              ))}
            </div>

            {/* Línea de tiempo del día */}
            <div className="space-y-1.5">
              {TIME_BLOCKS.map(block => {
                if (block.isBreak) {
                  return (
                    <div key={block.id} className="flex items-center gap-3">
                      <span className="w-20 text-right text-[11px] font-bold text-slate-400 shrink-0">{timeText(block.inicio)}</span>
                      <div className="flex-1 rounded-2xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 px-4 py-2 text-sm font-black text-amber-700 dark:text-amber-300">
                        🍎 Recreo · a jugar y comer tu lonchera
                      </div>
                    </div>
                  );
                }
                const slot = slotAt(selectedDay, block.inicio);
                const course = courseById(slot?.curso_id);
                const teacher = teacherById(slot?.docente_id);
                const isNow = slot && selectedDay === todayKey && slot.hora_inicio <= nowHHMM && nowHHMM < slot.hora_fin;
                return (
                  <div key={block.id} className="flex items-center gap-3">
                    <span className="w-20 text-right shrink-0">
                      <span className="block text-xs font-black text-slate-700 dark:text-slate-200">{timeText(block.inicio)}</span>
                      <span className="block text-[10px] text-slate-400">{block.label}</span>
                    </span>
                    {slot ? (
                      <button
                        type="button"
                        onClick={() => setSelectedCourseId(slot.curso_id)}
                        className={`flex-1 min-w-0 flex rounded-2xl bg-white dark:bg-slate-900 border shadow-sm hover:shadow-md transition-shadow overflow-hidden text-left cursor-pointer ${
                          isNow ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        <span className="w-1.5 shrink-0" style={{ backgroundColor: course?.color_hex || '#8b5cf6' }} />
                        <span className="flex-1 min-w-0 px-3 py-2 flex items-center gap-3">
                          <span className="text-2xl shrink-0" aria-hidden="true">{courseEmoji(course?.nombre)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-black text-slate-900 dark:text-white truncate">
                              {course?.nombre || 'Curso'} {isNow && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] align-middle">Ahora</span>}
                            </span>
                            <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                              {teacher ? `Prof. ${teacher.nombres} ${teacher.apellidos}` : 'Profesor por asignar'} · {slot.aula || 'Aula por confirmar'}
                            </span>
                          </span>
                          <TeacherAvatar teacher={teacher} size="sm" />
                        </span>
                      </button>
                    ) : (
                      <div className="flex-1 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-400">Hora libre</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Semana completa (desplegable) */}
            <div className="flex justify-center print:hidden">
              <button
                type="button"
                onClick={() => setShowWeek(v => !v)}
                aria-expanded={showWeek}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 text-xs font-black text-violet-700 dark:text-violet-300 shadow-sm hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showWeek ? 'rotate-180' : ''}`} />
                {showWeek ? 'Ocultar semana completa' : 'Ver semana completa'}
              </button>
            </div>

            {(showWeek) && (
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 overflow-x-auto animate-in fade-in-50">
                <table className="w-full min-w-[640px] border-separate border-spacing-1 text-xs">
                  <thead>
                    <tr>
                      <th className="w-16" />
                      {DAYS.map(d => (
                        <th key={d.key} className={`py-1.5 rounded-lg font-black ${d.key === todayKey ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'text-slate-500'}`}>{d.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_BLOCKS.map(block => (
                      <tr key={block.id}>
                        <td className="text-right pr-1 text-[10px] font-bold text-slate-400 whitespace-nowrap">{timeText(block.inicio)}</td>
                        {block.isBreak ? (
                          <td colSpan={DAYS.length} className="text-center py-1 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-black">🍎 Recreo</td>
                        ) : DAYS.map(d => {
                          const slot = slotAt(d.key, block.inicio);
                          const course = courseById(slot?.curso_id);
                          return (
                            <td key={d.key} className="p-0">
                              {slot ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedCourseId(slot.curso_id)}
                                  className="w-full text-left px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-violet-50 dark:hover:bg-violet-950/40 border-l-4 cursor-pointer"
                                  style={{ borderLeftColor: course?.color_hex || '#8b5cf6' }}
                                  title={`${course?.nombre} · ${slot.aula || ''}`}
                                >
                                  <span className="block font-bold text-slate-800 dark:text-slate-100 truncate">{courseEmoji(course?.nombre)} {course?.nombre}</span>
                                </button>
                              ) : <span className="block px-2 py-1.5 text-slate-300 dark:text-slate-600">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── COLUMNA LATERAL: CURSOS Y PROFESORES ── */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-violet-500" /> Mis cursos y profesores
              </h3>
              <ul className="mt-2.5 space-y-1.5">
                {myCourses.map(({ course, teacher, slots: cs }) => (
                  <li key={course.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCourseId(course.id)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left cursor-pointer"
                    >
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: `${course.color_hex || '#8b5cf6'}22` }} aria-hidden="true">
                        {courseEmoji(course.nombre)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-slate-900 dark:text-white truncate">{course.nombre}</span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {teacher ? `${teacher.nombres} ${teacher.apellidos}` : 'Profesor por asignar'}
                        </span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">{cs.length} h/sem</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {tutor && (
              <button
                type="button"
                onClick={() => {
                  const tutorCourse = myCourses.find(c => c.teacher?.id === tutor.id);
                  if (tutorCourse) setSelectedCourseId(tutorCourse.course.id);
                }}
                className="w-full rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 p-4 flex items-center gap-3 text-left cursor-pointer"
              >
                <TeacherAvatar teacher={tutor} />
                <span className="min-w-0">
                  <span className="block text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Tu tutor(a)</span>
                  <span className="block text-sm font-black text-slate-900 dark:text-white truncate">{tutor.nombres} {tutor.apellidos}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Si tienes un problema o una duda, puedes contarle.</span>
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: CURSO Y PROFESOR ── */}
      {selectedCourse && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-50"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedCourseId(null); }}
        >
          <div role="dialog" aria-modal="true" aria-label={`Curso ${selectedCourse.course.nombre}`} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Cabecera con el color del curso */}
            <div className="relative px-5 pt-5 pb-4" style={{ backgroundColor: `${selectedCourse.course.color_hex || '#8b5cf6'}22` }}>
              <button type="button" onClick={() => setSelectedCourseId(null)} aria-label="Cerrar" className="absolute top-3 right-3 p-1.5 rounded-xl bg-white/80 dark:bg-slate-900/70 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 pr-8">
                <span className="w-14 h-14 rounded-2xl bg-white/90 dark:bg-slate-900/70 flex items-center justify-center text-3xl shrink-0" aria-hidden="true">
                  {courseEmoji(selectedCourse.course.nombre)}
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-snug">{selectedCourse.course.nombre}</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {selectedCourse.slots.length} {selectedCourse.slots.length === 1 ? 'hora' : 'horas'} a la semana
                    {selectedCourse.course.area_curricular ? ` · ${selectedCourse.course.area_curricular}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Profesor */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 p-4 flex items-center gap-4">
                <TeacherAvatar teacher={selectedCourse.teacher} size="lg" />
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Tu profesor(a){selectedCourse.teacher && tutor?.id === selectedCourse.teacher.id ? ' · también es tu tutor(a)' : ''}
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    {selectedCourse.teacher ? `${selectedCourse.teacher.nombres} ${selectedCourse.teacher.apellidos}` : 'Profesor por asignar'}
                  </p>
                  {selectedCourse.teacher?.especialidad && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Especialidad: {selectedCourse.teacher.especialidad}</p>
                  )}
                  {selectedCourse.teacher?.email && (
                    <a href={`mailto:${selectedCourse.teacher.email}`} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-sky-700 dark:text-sky-300 hover:underline">
                      <Mail className="w-3.5 h-3.5" /> {selectedCourse.teacher.email}
                    </a>
                  )}
                </div>
              </div>

              {/* Cuándo es la clase */}
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-sky-500" /> ¿Cuándo tengo esta clase?</p>
                <ul className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {DAYS.flatMap(d => selectedCourse.slots.filter(s => s.dia === d.key).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)).map(s => (
                    <li key={s.id} className={`px-3 py-2 rounded-xl text-xs ${d.key === todayKey ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'}`}>
                      <strong>{d.label}</strong> · {timeText(s.hora_inicio)} – {timeText(s.hora_fin)}
                      {s.aula && <span className="flex items-center gap-1 text-[11px] opacity-80"><MapPin className="w-3 h-3" /> {s.aula}</span>}
                    </li>
                  )))}
                  {selectedCourse.slots.length === 0 && <li className="text-xs text-slate-400">Aún no tiene horas en tu horario.</li>}
                </ul>
              </div>

              {/* Qué se aprende */}
              {!!selectedCourse.course.competencias?.length && (
                <div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100">🎯 Lo que vas a aprender</p>
                  <ul className="mt-1.5 space-y-1">
                    {selectedCourse.course.competencias.map(c => (
                      <li key={c.id} className="text-xs text-slate-600 dark:text-slate-300 flex gap-1.5"><span className="text-violet-500">•</span> {c.descripcion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="px-5 pb-5">
              <button type="button" onClick={() => setSelectedCourseId(null)} className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-bold text-sm cursor-pointer">
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
