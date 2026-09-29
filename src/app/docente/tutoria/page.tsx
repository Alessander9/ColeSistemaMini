'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { BehaviorLogEntry, Section } from '@/types';
import { useAulaColors } from '@/hooks/useAulaColors';
import { HeartHandshake, MessageCircle, NotebookPen, Phone, Plus, Search, X } from 'lucide-react';

type TabKey = 'alumnos' | 'justificaciones' | 'anecdotario';
type LogType = BehaviorLogEntry['tipo'];

const LOG_TYPES: { tipo: LogType; emoji: string; label: string; titulo: string; on: string; chip: string }[] = [
  { tipo: 'merito', emoji: '👍', label: 'Mérito', titulo: 'Reconocimiento / Mérito', on: 'bg-emerald-600 border-emerald-600 text-white', chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200' },
  { tipo: 'observacion', emoji: '📝', label: 'Observación', titulo: 'Observación de tutoría', on: 'bg-blue-600 border-blue-600 text-white', chip: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200' },
  { tipo: 'demerito', emoji: '⚠️', label: 'Falta de conducta', titulo: 'Falta / Incidencia', on: 'bg-rose-600 border-rose-600 text-white', chip: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200' },
  { tipo: 'citacion', emoji: '📅', label: 'Citar al apoderado', titulo: 'Citación al apoderado', on: 'bg-amber-500 border-amber-500 text-white', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200' },
];
const logTypeInfo = (t: string) => LOG_TYPES.find(l => l.tipo === t) || { tipo: t as LogType, emoji: '⭐', label: 'Felicitación', titulo: 'Felicitación', on: '', chip: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200' };

const QUICK_PHRASES: Record<string, string[]> = {
  merito: ['Ayudó a un compañero sin que se lo pidieran.', 'Participó activamente en clase.', 'Mejoró mucho en sus tareas esta semana.'],
  observacion: ['Se le nota distraído en las últimas clases.', 'Conversé con el alumno y se comprometió a mejorar.', 'Llega sin sus materiales de trabajo.'],
  demerito: ['Interrumpió la clase varias veces.', 'Faltó el respeto a un compañero.', 'Usó el celular durante la clase.'],
  citacion: ['Se cita al apoderado para conversar sobre el rendimiento del alumno.', 'Se cita al apoderado por reiteradas tardanzas.'],
};
const REJECT_REASONS = ['Falta el documento que lo respalde (certificado o constancia).', 'La fecha no coincide con la falta registrada.', 'El motivo no justifica la inasistencia.'];

const localIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const niceDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
};

export default function DocenteTutoriaPage() {
  const {
    currentUser, sections, students, enrollments, grades, attendances, behaviorLogs, courses, evaluationPeriods,
    justificationRequests, approveJustification, rejectJustification, addBehaviorLog, getTeacherSections,
  } = useApp();
  const aulaColor = useAulaColors();

  // Aulas: primero las que tiene como tutor; si no tiene tutoría asignada, las aulas donde enseña
  const mySections = useMemo<{ seccion: Section; tutor: boolean }[]>(() => {
    if (!currentUser?.id) return [];
    const tutored = sections.filter(s => s.tutor_id === currentUser.id).map(s => ({ seccion: s, tutor: true }));
    const teaching = (getTeacherSections(currentUser.id) || [])
      .filter(ts => !tutored.some(t => t.seccion.id === ts.seccion.id))
      .map(ts => ({ seccion: ts.seccion, tutor: false }));
    const list = [...tutored, ...teaching];
    if (list.length === 0 && currentUser.rol === 'admin') return sections.map(s => ({ seccion: s, tutor: false }));
    return list;
  }, [sections, currentUser, getTeacherSections]);
  const isTutorOfAny = mySections.some(s => s.tutor);

  const [selectedSectionId, setSelectedSectionId] = useState(() => mySections[0]?.seccion.id || '');
  const activeSection = mySections.find(s => s.seccion.id === selectedSectionId)?.seccion || mySections[0]?.seccion;
  // Toda la página toma el color del aula elegida
  const ac = aulaColor(activeSection?.id);
  const sectionLabel = (s?: Section) => (s ? `${s.grado?.nombre || ''} "${s.letra}"` : 'Aula');

  const [tab, setTab] = useState<TabKey>('alumnos');
  const [onlyNeedHelp, setOnlyNeedHelp] = useState(false);
  const [search, setSearch] = useState('');

  const sectionEnrollments = useMemo(
    () => enrollments.filter(e => e.seccion_id === activeSection?.id && e.estado === 'activo'),
    [enrollments, activeSection?.id]
  );
  const enrollmentIds = useMemo(() => new Set(sectionEnrollments.map(e => e.id)), [sectionEnrollments]);

  // Bimestre en curso: las notas en "C" se miran solo en este periodo
  const currentPeriod = evaluationPeriods.find(p => p.activo && !p.cerrado) || evaluationPeriods.find(p => !p.cerrado) || evaluationPeriods[0];
  const courseOfCompetency = (compId: string) => courses.find(c => c.competencias?.some(k => k.id === compId));

  const studentRows = useMemo(() => {
    const rows = sectionEnrollments.map(enr => {
      const student = students.find(s => s.id === enr.estudiante_id) || enr.estudiante;
      const nombres = student?.profile?.nombres || student?.nombres || enr.estudiante?.nombres || '';
      const apellidos = student?.profile?.apellidos || student?.apellidos || enr.estudiante?.apellidos || '';

      // Cursos (sin repetir) con alguna competencia en C en el bimestre actual
      const lowCourses = Array.from(new Set(
        grades
          .filter(g => g.matricula_id === enr.id && g.nota_letra === 'C' && (!currentPeriod || g.periodo_evaluacion_id === currentPeriod.id))
          .map(g => courseOfCompetency(g.competencia_id)?.nombre)
          .filter((n): n is string => !!n)
      ));

      const atts = attendances.filter(a => a.matricula_id === enr.id);
      const faltas = atts.filter(a => a.estado === 'falta').length;
      const tardanzas = atts.filter(a => a.estado === 'tardanza').length;
      const pctAsistencia = atts.length > 0 ? Math.round(((atts.length - faltas) / atts.length) * 100) : 100;

      const logs = behaviorLogs.filter(b => b.matricula_id === enr.id);
      const meritos = logs.filter(b => b.tipo === 'merito' || b.tipo === 'felicitacion').length;
      const demeritos = logs.filter(b => b.tipo === 'demerito').length;

      // Motivos en palabras simples
      const reasons: string[] = [];
      if (lowCourses.length > 0) reasons.push(`${lowCourses.length === 1 ? 'Va en C en' : `${lowCourses.length} cursos en C:`} ${lowCourses.join(', ')}`);
      if (faltas > 0) reasons.push(`${faltas} ${faltas === 1 ? 'falta' : 'faltas'}`);
      if (tardanzas >= 3) reasons.push(`${tardanzas} tardanzas`);
      if (demeritos >= 2) reasons.push(`${demeritos} faltas de conducta`);

      const level: 'alto' | 'medio' | 'ok' =
        lowCourses.length >= 2 || faltas >= 3 || demeritos >= 3 ? 'alto' :
        lowCourses.length === 1 || faltas > 0 || tardanzas >= 3 || demeritos >= 2 ? 'medio' : 'ok';

      return {
        enr, student, nombres, apellidos, lowCourses, faltas, tardanzas, pctAsistencia, meritos, demeritos, reasons, level,
        parentName: student?.nombre_apoderado || '',
        parentPhone: student?.telefono_apoderado || '',
      };
    });
    const order = { alto: 0, medio: 1, ok: 2 };
    return rows.sort((a, b) => order[a.level] - order[b.level] || a.apellidos.localeCompare(b.apellidos));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionEnrollments, students, grades, attendances, behaviorLogs, courses, currentPeriod?.id]);

  const needHelpCount = studentRows.filter(r => r.level !== 'ok').length;
  const visibleRows = studentRows
    .filter(r => !onlyNeedHelp || r.level !== 'ok')
    .filter(r => !search.trim() || `${r.nombres} ${r.apellidos}`.toLowerCase().includes(search.trim().toLowerCase()));

  const sectionJustifications = justificationRequests
    .filter(j => enrollmentIds.has(j.matricula_id))
    .sort((a, b) => (a.estado === 'pendiente' ? 0 : 1) - (b.estado === 'pendiente' ? 0 : 1) || b.fecha.localeCompare(a.fecha));
  const pendingJustifications = sectionJustifications.filter(j => j.estado === 'pendiente').length;

  const sectionLogs = behaviorLogs
    .filter(b => enrollmentIds.has(b.matricula_id))
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || (b.created_at || '').localeCompare(a.created_at || ''));
  const monthPrefix = localIso(new Date()).slice(0, 7);
  const logsThisMonth = sectionLogs.filter(l => (l.fecha || '').startsWith(monthPrefix)).length;
  const nameOfEnrollment = (matriculaId: string) => {
    const r = studentRows.find(x => x.enr.id === matriculaId);
    return r ? `${r.nombres} ${r.apellidos}` : 'Alumno';
  };

  // ── Registrar en el anecdotario ──
  const [logOpen, setLogOpen] = useState(false);
  const [logForm, setLogForm] = useState({ matriculaId: '', tipo: 'observacion' as LogType, descripcion: '', visible: true });
  const openLog = (matriculaId?: string, tipo: LogType = 'observacion') => {
    setLogForm({ matriculaId: matriculaId || studentRows[0]?.enr.id || '', tipo, descripcion: '', visible: true });
    setLogOpen(true);
  };
  const saveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const row = studentRows.find(r => r.enr.id === logForm.matriculaId);
    if (!row || !logForm.descripcion.trim()) return;
    addBehaviorLog({
      matricula_id: row.enr.id,
      estudiante_id: row.enr.estudiante_id,
      tipo: logForm.tipo,
      titulo: logTypeInfo(logForm.tipo).titulo,
      descripcion: logForm.descripcion.trim(),
      fecha: localIso(new Date()),
      docente_id: currentUser?.id,
      docente_nombre: currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : 'Docente tutor',
      visible_apoderado: logForm.visible,
    });
    setLogOpen(false);
  };

  // ── Justificaciones ──
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const approve = (id: string) => {
    approveJustification(id, 'Justificación aprobada por el tutor.');
  };
  const confirmReject = () => {
    if (!rejectingId || !rejectReason.trim()) return;
    rejectJustification(rejectingId, rejectReason.trim());
    setRejectingId(null);
    setRejectReason('');
  };

  const LEVEL_UI = {
    alto: { label: '🔴 Necesita apoyo', chip: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200', border: 'border-rose-200 dark:border-rose-900' },
    medio: { label: '🟡 Prestar atención', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200', border: 'border-amber-200 dark:border-amber-900' },
    ok: { label: '🟢 Va bien', chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200', border: 'border-slate-200 dark:border-slate-800' },
  };

  const TABS: { key: TabKey; label: string; count: number; alert?: boolean }[] = [
    { key: 'alumnos', label: '👥 Mis alumnos', count: studentRows.length },
    { key: 'justificaciones', label: '📋 Justificaciones', count: pendingJustifications, alert: pendingJustifications > 0 },
    { key: 'anecdotario', label: '📘 Anecdotario', count: sectionLogs.length },
  ];

  const inputCls = `w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none ${ac.focus}`;

  if (mySections.length === 0) {
    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
        <HeartHandshake className="w-10 h-10 text-rose-500 mx-auto" />
        <h1 className="text-xl font-black text-slate-900 dark:text-white">Aún no tienes aulas asignadas</h1>
        <p className="text-sm text-slate-500">Cuando Coordinación te asigne un aula, aquí podrás hacer el seguimiento de tus alumnos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in-50 pb-16">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HeartHandshake className={`w-7 h-7 ${ac.icon}`} /> Tutoría <span className={`px-3 py-0.5 rounded-full text-base ${ac.chip}`}>{sectionLabel(activeSection)}</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Mira cómo va cada alumno, anota lo importante y revisa las justificaciones de los padres.</p>
        </div>
        <button type="button" onClick={() => openLog()} disabled={studentRows.length === 0}
          className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl ${ac.btn} text-base font-black shadow-md disabled:opacity-40 cursor-pointer shrink-0`}>
          <NotebookPen className="w-5 h-5" /> Anotar en el anecdotario
        </button>
      </div>

      {/* Aulas */}
      <div className={`rounded-3xl border-2 ${ac.border} ${ac.soft} p-4 space-y-2`}>
        <p className="text-sm font-black text-slate-800 dark:text-slate-100">Elige el aula</p>
        <div className="flex flex-wrap gap-2">
          {mySections.map(({ seccion, tutor }) => {
            const active = activeSection?.id === seccion.id;
            const count = enrollments.filter(e => e.seccion_id === seccion.id && e.estado === 'activo').length;
            return (
              <button key={seccion.id} type="button" onClick={() => { setSelectedSectionId(seccion.id); setSearch(''); setOnlyNeedHelp(false); }} aria-pressed={active}
                className={`text-left px-4 py-2.5 rounded-2xl border-2 cursor-pointer ${active ? `${aulaColor(seccion.id).solid} shadow-md` : `bg-white dark:bg-slate-800 ${aulaColor(seccion.id).border} text-slate-800 dark:text-slate-100 ${aulaColor(seccion.id).hover}`}`}>
                <span className="flex items-center gap-2 text-base font-black">{!active && <span className={`w-3 h-3 rounded-full ${aulaColor(seccion.id).dot}`} />}{sectionLabel(seccion)} {tutor && '★'}</span>
                <span className={`block text-xs font-semibold ${active ? aulaColor(seccion.id).solidSub : 'text-slate-500 dark:text-slate-400'}`}>{tutor ? 'Soy tutor · ' : ''}{count} {count === 1 ? 'alumno' : 'alumnos'}</span>
              </button>
            );
          })}
        </div>
        {!isTutorOfAny && <p className="text-xs text-slate-500">Aún no tienes un aula como tutor, por eso ves las aulas donde enseñas.</p>}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button type="button" onClick={() => { setTab('alumnos'); setOnlyNeedHelp(true); }} className={`text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 ${ac.border} ${ac.hover} cursor-pointer`}>
          <p className="text-3xl font-black text-rose-600">{needHelpCount}</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{needHelpCount === 1 ? 'alumno necesita' : 'alumnos necesitan'} atención</p>
          <p className="text-xs text-slate-500">Por notas en C, faltas o conducta</p>
        </button>
        <button type="button" onClick={() => setTab('justificaciones')} className={`text-left p-4 rounded-2xl border-2 cursor-pointer ${pendingJustifications > 0 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 hover:border-amber-500' : `bg-white dark:bg-slate-900 ${ac.border} ${ac.hover}`}`}>
          <p className="text-3xl font-black text-amber-600">{pendingJustifications}</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{pendingJustifications === 1 ? 'justificación por revisar' : 'justificaciones por revisar'}</p>
          <p className="text-xs text-slate-500">Enviadas por los padres</p>
        </button>
        <button type="button" onClick={() => setTab('anecdotario')} className={`text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 ${ac.border} ${ac.hover} cursor-pointer`}>
          <p className={`text-3xl font-black ${ac.icon}`}>{logsThisMonth}</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{logsThisMonth === 1 ? 'anotación' : 'anotaciones'} este mes</p>
          <p className="text-xs text-slate-500">En el anecdotario del aula</p>
        </button>
      </div>

      {/* Pestañas */}
      <div className="grid grid-cols-3 gap-2">
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} aria-pressed={active}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-2.5 rounded-2xl border-2 text-sm sm:text-base font-black cursor-pointer ${active ? `${ac.solid} shadow-md` : `bg-white dark:bg-slate-800 ${ac.border} text-slate-800 dark:text-slate-100 ${ac.hover}`}`}>
              {t.label}
              <span className={`min-w-[26px] text-center px-2 py-0.5 rounded-full text-xs font-black ${t.alert ? 'bg-amber-500 text-white' : active ? 'bg-white/25' : ac.chip}`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Mis alumnos ── */}
      {tab === 'alumnos' && (
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex gap-2">
              {[{ v: false, l: `Todos (${studentRows.length})` }, { v: true, l: `Necesitan atención (${needHelpCount})` }].map(o => (
                <button key={String(o.v)} type="button" onClick={() => setOnlyNeedHelp(o.v)} aria-pressed={onlyNeedHelp === o.v}
                  className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold cursor-pointer ${onlyNeedHelp === o.v ? ac.solid : `bg-white dark:bg-slate-800 ${ac.border} text-slate-700 dark:text-slate-200 ${ac.hover}`}`}>
                  {o.l}
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno" className={`w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none ${ac.focus}`} />
              {search && <button type="button" onClick={() => setSearch('')} aria-label="Borrar búsqueda" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>}
            </div>
          </div>

          {visibleRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              {studentRows.length === 0 ? 'Esta aula aún no tiene alumnos matriculados.' : onlyNeedHelp ? '¡Todos van bien! 🎉' : 'No hay alumnos con ese nombre.'}
            </p>
          ) : visibleRows.map(r => {
            const ui = LEVEL_UI[r.level];
            const phone = r.parentPhone.replace(/\D/g, '');
            return (
              <div key={r.enr.id} className={`bg-white dark:bg-slate-900 rounded-3xl border-2 ${ui.border} p-4 flex flex-col lg:flex-row lg:items-center gap-3`}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-sm font-black flex items-center justify-center shrink-0">
                    {`${r.nombres[0] || ''}${r.apellidos[0] || ''}`.toUpperCase()}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-black text-slate-900 dark:text-white">{r.apellidos}, {r.nombres}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${ui.chip}`}>{ui.label}</span>
                    </div>
                    {r.reasons.length > 0 && <p className="text-sm text-slate-700 dark:text-slate-200">{r.reasons.join(' · ')}</p>}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Asistencia <strong className={r.pctAsistencia < 85 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}>{r.pctAsistencia}%</strong>
                      {' · '}👍 {r.meritos} {r.meritos === 1 ? 'mérito' : 'méritos'} · ⚠️ {r.demeritos} {r.demeritos === 1 ? 'falta' : 'faltas'} de conducta
                    </p>
                  </div>
                </div>

                <div className="lg:w-72 space-y-1.5">
                  <p className="text-xs text-slate-500">Apoderado: <strong className="text-slate-700 dark:text-slate-200">{r.parentName || 'No registrado'}</strong></p>
                  <div className="flex flex-wrap gap-1.5">
                    {phone ? (
                      <>
                        <a href={`tel:${r.parentPhone}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400">
                          <Phone className="w-3.5 h-3.5 text-indigo-600" /> Llamar
                        </a>
                        <a href={`https://wa.me/51${phone}?text=${encodeURIComponent(`Buen día, ${r.parentName || 'estimado apoderado'}. Le escribe el tutor de ${r.nombres} ${r.apellidos}.`)}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      </>
                    ) : <span className="text-xs text-slate-400 py-1.5">Sin teléfono registrado</span>}
                    <button type="button" onClick={() => openLog(r.enr.id)} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 ${ac.soft} ${ac.border} ${ac.text} text-xs font-bold cursor-pointer`}>
                      <Plus className="w-3.5 h-3.5" /> Anotar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Justificaciones ── */}
      {tab === 'justificaciones' && (
        <div className="space-y-2.5">
          <p className="text-sm text-slate-600 dark:text-slate-300">Los padres explican por qué su hijo faltó o llegó tarde. Si apruebas, la asistencia queda como <strong>justificada</strong>.</p>
          {sectionJustifications.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">No hay justificaciones en esta aula.</p>
          ) : sectionJustifications.map(req => {
            const pending = req.estado === 'pendiente';
            const isRejecting = rejectingId === req.id;
            return (
              <div key={req.id} className={`bg-white dark:bg-slate-900 rounded-3xl border-2 p-4 space-y-2 ${pending ? 'border-amber-300 dark:border-amber-800' : 'border-slate-200 dark:border-slate-800'}`}>
                <div className="flex flex-col md:flex-row md:items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${req.estado === 'aprobada' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200' : req.estado === 'rechazada' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'}`}>
                        {req.estado === 'aprobada' ? '✓ Aprobada' : req.estado === 'rechazada' ? '✕ Rechazada' : '⏳ Por revisar'}
                      </span>
                      <p className="text-base font-black text-slate-900 dark:text-white">{nameOfEnrollment(req.matricula_id)}</p>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {req.tipo === 'falta' ? 'Faltó' : 'Llegó tarde'} el <strong>{niceDate(req.fecha)}</strong>
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200"><strong>Motivo:</strong> {req.motivo}</p>
                    {req.apoderado_nombre && <p className="text-xs text-slate-500">Enviado por: {req.apoderado_nombre}</p>}
                    {req.documento_url && <a href={req.documento_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-700 dark:text-blue-300 underline">Ver documento adjunto</a>}
                    {req.respuesta_colegio && !pending && <p className="text-xs text-slate-500 italic">Respuesta: {req.respuesta_colegio}</p>}
                  </div>
                  {pending && !isRejecting && (
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => approve(req.id)} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black cursor-pointer">✓ Aprobar</button>
                      <button type="button" onClick={() => { setRejectingId(req.id); setRejectReason(''); }} className="px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-sm font-black text-rose-600 hover:border-rose-400 cursor-pointer">✕ Rechazar</button>
                    </div>
                  )}
                </div>
                {isRejecting && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">¿Por qué la rechazas? El motivo queda como respuesta en la solicitud.</p>
                    <div className="flex flex-col gap-1.5">
                      {REJECT_REASONS.map(rr => (
                        <button key={rr} type="button" onClick={() => setRejectReason(rr)} className={`text-left text-sm px-3 py-2 rounded-xl border-2 cursor-pointer ${rejectReason === rr ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700 hover:border-rose-300'}`}>{rr}</button>
                      ))}
                    </div>
                    <textarea rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="O escribe otro motivo" className={inputCls} />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setRejectingId(null)} className="px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">Cancelar</button>
                      <button type="button" disabled={!rejectReason.trim()} onClick={confirmReject} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Rechazar justificación</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Anecdotario ── */}
      {tab === 'anecdotario' && (
        <div className="space-y-2.5">
          {sectionLogs.length === 0 ? (
            <div className="py-10 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500">Todavía no hay anotaciones para esta aula.</p>
              <button type="button" onClick={() => openLog()} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${ac.btn} text-sm font-black cursor-pointer`}><NotebookPen className="w-4 h-4" /> Hacer la primera anotación</button>
            </div>
          ) : sectionLogs.map(log => {
            const info = logTypeInfo(log.tipo);
            return (
              <div key={log.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${info.chip}`}>{info.emoji} {info.label}</span>
                  <p className="text-base font-black text-slate-900 dark:text-white">{nameOfEnrollment(log.matricula_id)}</p>
                  <span className="text-xs text-slate-500 capitalize">{log.fecha ? niceDate(log.fecha) : ''}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{log.descripcion}</p>
                <p className="text-xs text-slate-400">
                  {log.docente_nombre || log.autor_nombre ? `Anotó: ${log.docente_nombre || log.autor_nombre}` : ''}
                  {log.visible_apoderado ? ' · Visible para el apoderado' : ' · Solo para el colegio'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ───────── Ventana: anotar en el anecdotario ───────── */}
      <Modal isOpen={logOpen} onClose={() => setLogOpen(false)} title="Anotar en el anecdotario" maxWidth="lg">
        <form onSubmit={saveLog} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">1. Alumno</span>
            <select value={logForm.matriculaId} onChange={e => setLogForm(f => ({ ...f, matriculaId: e.target.value }))} className={inputCls}>
              {studentRows.map(r => <option key={r.enr.id} value={r.enr.id}>{r.apellidos}, {r.nombres}</option>)}
            </select>
          </label>

          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">2. ¿Qué vas a anotar?</p>
            <div className="grid grid-cols-2 gap-2">
              {LOG_TYPES.map(t => (
                <button key={t.tipo} type="button" onClick={() => setLogForm(f => ({ ...f, tipo: t.tipo }))} aria-pressed={logForm.tipo === t.tipo}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border-2 text-sm font-black cursor-pointer ${logForm.tipo === t.tipo ? t.on : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-slate-500'}`}>
                  <span className="text-xl">{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">3. ¿Qué pasó?</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(QUICK_PHRASES[logForm.tipo] || []).map(ph => (
                <button key={ph} type="button" onClick={() => setLogForm(f => ({ ...f, descripcion: ph }))} className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer">
                  {ph}
                </button>
              ))}
            </div>
            <textarea required rows={3} value={logForm.descripcion} onChange={e => setLogForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Escribe lo que pasó o toca una frase de arriba" className={`${inputCls} resize-none`} />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input type="checkbox" checked={logForm.visible} onChange={e => setLogForm(f => ({ ...f, visible: e.target.checked }))} className="w-5 h-5 accent-slate-700" />
            <span className="text-sm text-slate-700 dark:text-slate-200"><strong>El apoderado puede verlo</strong> en su portal</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => setLogOpen(false)} className="px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">Cancelar</button>
            <button type="submit" disabled={!logForm.descripcion.trim() || !logForm.matriculaId} className={`px-5 py-2.5 rounded-xl ${ac.btn} text-sm font-black shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}>Guardar anotación</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
