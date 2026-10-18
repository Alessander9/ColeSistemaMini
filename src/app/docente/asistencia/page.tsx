'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { triggerConfetti } from '@/lib/ui/confetti';
import { useApp } from '@/context/AppContext';
import { AttendanceStatus, DayOfWeek, ScheduleSlot, Section, Course } from '@/types';
import { DAYS } from '@/lib/constants/schedule';
import { getSectionClassStatus } from '@/lib/schedule/attendanceWindow';
import { useAulaColors } from '@/hooks/useAulaColors';
import { Check, CheckCheck, Clock, FileDown, ListChecks, Lock, QrCode, Search, XCircle } from 'lucide-react';

const QrScanner = dynamic(() => import('@/components/qr/QrScanner').then(m => m.QrScanner), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-2xl border border-slate-800 text-slate-300">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-semibold">Cargando escáner QR de aula...</p>
    </div>
  ),
});

const WEEKDAY_KEYS: (DayOfWeek | null)[] = [null, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', null];

const STATUS_BUTTONS: { status: AttendanceStatus; label: string; on: string; row: string }[] = [
  { status: 'presente', label: 'Presente', on: 'bg-emerald-600 text-white border-emerald-600', row: '' },
  { status: 'tardanza', label: 'Tardanza', on: 'bg-amber-500 text-white border-amber-500', row: 'bg-amber-50/80 dark:bg-amber-950/20' },
  { status: 'falta', label: 'Falta', on: 'bg-rose-600 text-white border-rose-600', row: 'bg-rose-50/80 dark:bg-rose-950/20' },
  { status: 'justificado', label: 'Justificada', on: 'bg-sky-600 text-white border-sky-600', row: 'bg-sky-50/80 dark:bg-sky-950/20' },
];

function localIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function timeText(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
}

export default function DocenteAsistenciaPage() {
  const {
    students,
    enrollments,
    attendances,
    courses,
    currentUser,
    getTeacherSections,
    getTeacherSchedule,
    saveClassAttendanceQuickly,
    brandingConfig,
  } = useApp();
  const aulaColor = useAulaColors();

  // Hora actual que se actualiza sola cada 30 s (habilita/deshabilita sin recargar)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const todayStr = localIso(now);
  const todayKey = WEEKDAY_KEYS[now.getDay()];
  const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const teacherSections = useMemo(() => (currentUser?.id ? getTeacherSections(currentUser.id) || [] : []), [getTeacherSections, currentUser?.id]);
  const mySchedule = useMemo(() => (currentUser?.id ? getTeacherSchedule(currentUser.id) : []), [getTeacherSchedule, currentUser?.id]);
  const courseName = (id?: string) => courses.find(c => c.id === id)?.nombre || 'Curso';
  const dayLabel = (key: string) => DAYS.find(d => d.key === key)?.label || key;

  // Estado de la clase de un aula respecto a la hora actual
  const classInfo = (secId: string): { open: boolean; slot: ScheduleSlot | null; message: string; chip: string } => {
    const st = getSectionClassStatus(mySchedule, secId, todayKey, nowHHMM);
    if (st.kind === 'open') {
      return { open: true, slot: st.slot, message: `Clase de ${courseName(st.slot.curso_id)} en curso · puedes tomar la asistencia hasta las ${timeText(st.slot.hora_fin)}`, chip: '🟢 En clase ahora' };
    }
    if (st.kind === 'later-today') {
      return { open: false, slot: st.slot, message: `Se habilita hoy a las ${timeText(st.slot.hora_inicio)} (clase de ${courseName(st.slot.curso_id)})`, chip: `Hoy a las ${timeText(st.slot.hora_inicio)}` };
    }
    if (st.kind === 'next-day') {
      return {
        open: false,
        slot: st.slot,
        message: `${st.hadClassToday ? 'La clase de hoy ya terminó. ' : ''}Se habilita el ${dayLabel(st.slot.dia).toLowerCase()} a las ${timeText(st.slot.hora_inicio)}`,
        chip: st.hadClassToday ? 'Hoy ya terminó' : 'Sin clase hoy',
      };
    }
    return { open: false, slot: null, message: 'Esta aula aún no tiene clases en tu horario', chip: 'Sin horario' };
  };

  // Aula elegida: la que tiene clase ahora; si no, la de la siguiente clase; si no, la primera
  const [selectedSectionId, setSelectedSectionId] = useState('');
  useEffect(() => {
    if (selectedSectionId || teacherSections.length === 0) return;
    const withOpen = teacherSections.find(t => classInfo(t.seccion.id).open);
    const withNext = teacherSections.find(t => classInfo(t.seccion.id).chip.startsWith('Hoy a las'));
    setSelectedSectionId((withOpen || withNext || teacherSections[0]).seccion.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherSections, selectedSectionId]);

  const info = selectedSectionId ? classInfo(selectedSectionId) : null;
  const canEdit = !!info?.open;
  const activeSection = teacherSections.find(t => t.seccion.id === selectedSectionId)?.seccion;
  const sectionLabel = activeSection ? `${activeSection.grado?.nombre || 'Grado'} "${activeSection.letra}"` : '';

  const [viewMode, setViewMode] = useState<'lista' | 'qr'>('lista');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  useEffect(() => { setDraft({}); setSearch(''); }, [selectedSectionId]);
  // Si la clase termina con cambios sin guardar o con la cámara abierta, se bloquea todo
  useEffect(() => { if (!canEdit) setViewMode('lista'); }, [canEdit]);

  const sectionEnrollments = useMemo(
    () => enrollments
      .filter(e => e.seccion_id === selectedSectionId && e.estado === 'activo')
      .sort((a, b) => (a.estudiante?.profile?.apellidos || a.estudiante?.apellidos || '').localeCompare(b.estudiante?.profile?.apellidos || b.estudiante?.apellidos || '')),
    [enrollments, selectedSectionId]
  );
  const savedStatus = (id: string) => attendances.find(a => a.matricula_id === id && a.fecha === todayStr && a.tipo_registro !== 'salida')?.estado;
  const baseStatus = (id: string): AttendanceStatus => savedStatus(id) || 'presente';
  const statusOf = (id: string): AttendanceStatus => draft[id] || baseStatus(id);
  const pendingChanges = Object.entries(draft).filter(([id, st]) => st !== baseStatus(id)).length;
  const takenToday = sectionEnrollments.length > 0 && sectionEnrollments.every(e => !!savedStatus(e.id));
  const counts = sectionEnrollments.reduce(
    (acc, e) => { acc[statusOf(e.id)]++; return acc; },
    { presente: 0, tardanza: 0, falta: 0, justificado: 0 } as Record<AttendanceStatus, number>
  );
  const visible = sectionEnrollments.filter(e =>
    `${e.estudiante?.profile?.apellidos || e.estudiante?.apellidos || ''} ${e.estudiante?.profile?.nombres || e.estudiante?.nombres || ''} ${e.estudiante?.codigo_estudiante || ''}`
      .toLowerCase().includes(search.trim().toLowerCase())
  );

  const markAll = (status: AttendanceStatus) => {
    if (!canEdit) return;
    const next: Record<string, AttendanceStatus> = {};
    sectionEnrollments.forEach(e => { next[e.id] = status; });
    setDraft(next);
  };
  const save = () => {
    if (!canEdit || sectionEnrollments.length === 0) return;
    saveClassAttendanceQuickly(selectedSectionId, todayStr, sectionEnrollments.map(e => ({ matriculaId: e.id, estado: statusOf(e.id) })));
    setDraft({});
    triggerConfetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
  };

  const downloadTemplate = async () => {
    if (!activeSection) return;
    const { generateRegistroAuxiliarPdf } = await import('@/lib/pdf/registroAuxiliarPdfGenerator');
    const doc = generateRegistroAuxiliarPdf({
      section: activeSection,
      teacherName: currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : 'Docente',
      students,
      enrollments,
      brandingConfig,
    });
    doc.save(`Asistencia_${activeSection.grado?.nombre || 'Grado'}_${activeSection.letra}.pdf`);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10 animate-in fade-in-50">

      {/* ── CABECERA ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Tomar asistencia</h1>
          <p className="text-base text-slate-600 dark:text-slate-300 mt-1">
            Se puede tomar solo durante la hora de tu clase. Todos empiezan como <strong>Presente</strong>: marca solo a quien faltó o llegó tarde.
          </p>
        </div>
        {activeSection && (
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            title="Descargar la lista en papel para tomar asistencia a mano"
          >
            <FileDown className="w-5 h-5 text-emerald-600" /> Lista en papel (PDF)
          </button>
        )}
      </div>

      {teacherSections.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center">
          <p className="text-xl font-black text-slate-900 dark:text-white">Aún no tienes aulas asignadas</p>
          <p className="text-base text-slate-600 dark:text-slate-300 mt-2">Cuando Coordinación Académica te asigne aulas, aparecerán aquí.</p>
        </div>
      ) : (
        <>
          {/* ── AULAS ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {teacherSections.map(ts => {
              const active = ts.seccion.id === selectedSectionId;
              const ci = classInfo(ts.seccion.id);
              return (
                <button
                  key={ts.seccion.id}
                  type="button"
                  onClick={() => setSelectedSectionId(ts.seccion.id)}
                  className={`text-left rounded-2xl border-2 px-3 py-2.5 transition-colors cursor-pointer ${
                    active ? `${aulaColor(ts.seccion.id).solid} shadow-md` : `bg-white dark:bg-slate-900 ${aulaColor(ts.seccion.id).border} text-slate-800 dark:text-slate-100 ${aulaColor(ts.seccion.id).hover}`
                  }`}
                >
                  <span className="flex items-center gap-2 text-base font-black">{!active && <span className={`w-3 h-3 rounded-full ${aulaColor(ts.seccion.id).dot}`} />}{ts.seccion.grado?.nombre || 'Grado'} &quot;{ts.seccion.letra}&quot;</span>
                  <span className={`block text-sm font-semibold ${active ? 'opacity-90' : ci.open ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{ci.chip}</span>
                </button>
              );
            })}
          </div>

          {/* ── ESTADO DE LA CLASE ── */}
          {info && (
            <div className={`rounded-2xl border-2 px-4 py-3 flex items-start gap-3 ${canEdit ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'}`}>
              {canEdit ? <Clock className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" /> : <Lock className="w-6 h-6 text-slate-500 shrink-0 mt-0.5" />}
              <div>
                <p className={`text-lg font-black ${canEdit ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-100'}`}>
                  {canEdit ? `Asistencia habilitada para ${sectionLabel}` : `La asistencia de ${sectionLabel} está deshabilitada`}
                </p>
                <p className="text-base text-slate-700 dark:text-slate-300">{info.message}</p>
              </div>
            </div>
          )}

          {/* ── HERRAMIENTAS ── */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button type="button" onClick={() => setViewMode('lista')} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black cursor-pointer ${viewMode === 'lista' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
                <ListChecks className="w-5 h-5" /> Lista del aula
              </button>
              <button
                type="button"
                onClick={() => canEdit && setViewMode('qr')}
                disabled={!canEdit}
                title={canEdit ? 'Leer los carnets con la cámara' : 'El lector se habilita durante la hora de la clase'}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black ${viewMode === 'qr' ? 'bg-emerald-600 text-white' : canEdit ? 'text-slate-600 dark:text-slate-300 cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`}
              >
                <QrCode className="w-5 h-5" /> Lector de carnets
              </button>
            </div>
            {viewMode === 'lista' && (
              <>
                <button type="button" onClick={() => markAll('presente')} disabled={!canEdit} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                  <CheckCheck className="w-5 h-5" /> Todos presentes
                </button>
                <div className="relative ml-auto">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno" className="w-48 pl-9 pr-8 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
                  {search && <button type="button" onClick={() => setSearch('')} aria-label="Borrar búsqueda" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"><XCircle className="w-4 h-4" /></button>}
                </div>
              </>
            )}
          </div>

          {viewMode === 'qr' && canEdit ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
              <div className="max-w-lg mx-auto text-center space-y-3">
                <p className="text-lg font-black text-slate-900 dark:text-white">Acerca el carnet de cada alumno a la cámara</p>
                <p className="text-base text-slate-600 dark:text-slate-300">Cada lectura registra su asistencia de hoy en {sectionLabel}.</p>
                <QrScanner autoStart={true} variant="embedded" showHeader={false} expectedSectionId={selectedSectionId} />
              </div>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="flex flex-wrap gap-2">
                {STATUS_BUTTONS.map(b => (
                  <span key={b.status} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base font-bold text-slate-800 dark:text-slate-100">
                    <span className={`w-3 h-3 rounded-full ${b.on.split(' ')[0]}`} /> {b.label}: {counts[b.status]}
                  </span>
                ))}
              </div>

              {/* Lista */}
              <div className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 ${canEdit ? '' : 'opacity-70'}`}>
                {visible.length === 0 ? (
                  <p className="p-8 text-center text-base text-slate-500 dark:text-slate-400">
                    {sectionEnrollments.length === 0 ? 'Esta aula aún no tiene alumnos matriculados.' : 'No hay alumnos con ese nombre.'}
                  </p>
                ) : visible.map(enr => {
                  const st = statusOf(enr.id);
                  const nombres = enr.estudiante?.profile?.nombres || enr.estudiante?.nombres || '';
                  const apellidos = enr.estudiante?.profile?.apellidos || enr.estudiante?.apellidos || '';
                  const changed = draft[enr.id] !== undefined && draft[enr.id] !== baseStatus(enr.id);
                  return (
                    <div key={enr.id} className={`px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 ${STATUS_BUTTONS.find(b => b.status === st)?.row || ''}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-sm font-black flex items-center justify-center shrink-0">
                          {`${nombres[0] || ''}${apellidos[0] || ''}`.toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-base font-black text-slate-900 dark:text-white truncate">{apellidos}, {nombres}</span>
                          <span className="block text-sm text-slate-500 dark:text-slate-400">
                            {changed ? '● Sin guardar' : savedStatus(enr.id) ? 'Guardado' : 'Aún no registrado'}
                          </span>
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 shrink-0">
                        {STATUS_BUTTONS.map(b => (
                          <button
                            key={b.status}
                            type="button"
                            disabled={!canEdit}
                            onClick={() => setDraft(prev => ({ ...prev, [enr.id]: b.status }))}
                            aria-pressed={st === b.status}
                            aria-label={`${b.label}: ${nombres} ${apellidos}`}
                            className={`px-3 py-2 rounded-xl border-2 text-sm font-black transition-colors ${
                              st === b.status ? b.on : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            } ${canEdit ? 'cursor-pointer hover:border-slate-400' : 'cursor-not-allowed'}`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Guardar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-base text-slate-600 dark:text-slate-300">
                  {!canEdit ? (takenToday ? `✅ La asistencia de ${sectionLabel} de hoy ya está guardada.` : `🔒 Podrás guardar la asistencia durante la hora de la clase.`)
                    : pendingChanges > 0 ? <strong className="text-amber-600">{pendingChanges} {pendingChanges === 1 ? 'cambio sin guardar' : 'cambios sin guardar'}</strong>
                    : takenToday ? `✅ Ya guardaste la asistencia de ${sectionLabel} hoy. Puedes corregirla y volver a guardar.`
                    : `Aún no guardas la asistencia de ${sectionLabel} hoy.`}
                </p>
                <button
                  type="button"
                  onClick={save}
                  disabled={!canEdit || sectionEnrollments.length === 0}
                  title={canEdit ? undefined : info?.message}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-black shadow-sm disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
                >
                  {canEdit ? <Check className="w-5 h-5" /> : <Lock className="w-5 h-5" />} Guardar asistencia de {sectionLabel}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
