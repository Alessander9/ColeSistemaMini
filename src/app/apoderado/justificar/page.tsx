'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useParentChildren } from '@/hooks/useParentChildren';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Clock,
  UserX,
  Stethoscope,
  HeartHandshake,
  Trophy,
  Plane,
  CloudLightning,
  MoreHorizontal,
  Paperclip,
  X,
  Phone,
  Mail,
  CalendarPlus,
  MessageSquare,
  FileCheck2,
  Info,
  PartyPopper,
  MousePointerClick,
  PencilLine,
  MessageCircleReply,
} from 'lucide-react';

// Fecha local "YYYY-MM-DD" (sin toISOString: en Perú daría el día siguiente desde las 7 p. m.)
const localIso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (iso: string, n: number) => { const [y, m, d] = iso.split('-').map(Number); return localIso(new Date(y, m - 1, d + n)); };
const niceDate = (iso: string, long = false) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const t = new Date(y, m - 1, d).toLocaleDateString('es-PE', long ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const niceTime = (hora?: string) => {
  if (!hora || hora === '—') return '';
  const [h, m] = hora.split(':').map(Number);
  if (Number.isNaN(h)) return '';
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
};

// Motivos con ejemplo para que el apoderado sepa qué escribir
const REASONS = [
  { id: 'Salud / Cita médica', label: 'Salud o cita médica', icon: Stethoscope, tone: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300', example: 'Tuvo fiebre y lo llevamos al médico. Adjunto la constancia.' },
  { id: 'Emergencia Familiar', label: 'Emergencia familiar', icon: HeartHandshake, tone: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300', example: 'Tuvimos una emergencia familiar y no pudo asistir.' },
  { id: 'Representación Deportiva o Académica', label: 'Competencia o representación', icon: Trophy, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300', example: 'Participó en el campeonato distrital de fútbol.' },
  { id: 'Viaje o Trámite', label: 'Viaje o trámite', icon: Plane, tone: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300', example: 'Viajamos por un trámite familiar y regresamos el lunes.' },
  { id: 'Motivos de Fuerza Mayor', label: 'Fuerza mayor', icon: CloudLightning, tone: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300', example: 'Por las lluvias no hubo transporte hasta el colegio.' },
  { id: 'Otro', label: 'Otro motivo', icon: MoreHorizontal, tone: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300', example: 'Cuéntale al tutor qué pasó.' },
];
const MAX_FILE_MB = 1.5;

// Estados escritos como los diría el colegio a un padre
const STATUS = {
  pendiente: { label: 'Esperando respuesta', icon: Clock, cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  aprobada: { label: 'Aceptada', icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  rechazada: { label: 'No aceptada', icon: X, cls: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};

type Incident = { fecha: string; estado: string; hora?: string };

export default function JustificarFaltaPage() {
  const { currentUser, attendances, justificationRequests, requestJustification, showToast } = useApp();
  const { children, child, selectChild } = useParentChildren();

  const todayIso = localIso();
  // Formulario cerrado = se ve la lista de días pendientes; abierto = se justifica el día elegido
  const [formOpen, setFormOpen] = useState(false);
  const [freeDate, setFreeDate] = useState(false); // día elegido a mano (aviso o un día que no aparece en la lista)
  const [fecha, setFecha] = useState(todayIso);
  const [tipo, setTipo] = useState<'falta' | 'tardanza'>('falta');
  const [reasonId, setReasonId] = useState('');
  const [details, setDetails] = useState('');
  const [file, setFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [sent, setSent] = useState<{ fecha: string; tipo: string } | null>(null);

  const enrollmentId = child?.enrollment?.id;
  const firstName = child?.nombre.split(' ')[0] || 'tu hijo';
  const tutorName = child?.tutor ? `${child.tutor.nombres} ${child.tutor.apellidos}` : '';

  // Días con falta o tardanza (un registro por día)
  const incidents = useMemo<Incident[]>(() => {
    const byDay = new Map<string, Incident>();
    attendances
      .filter(a => a.matricula_id === enrollmentId && a.tipo_registro !== 'salida')
      .forEach(a => { if (!byDay.has(a.fecha) || a.tipo_registro === 'ingreso') byDay.set(a.fecha, { fecha: a.fecha, estado: a.estado, hora: a.hora_registro }); });
    return Array.from(byDay.values())
      .filter(i => i.estado === 'falta' || i.estado === 'tardanza' || i.estado === 'justificado')
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [attendances, enrollmentId]);

  const myRequests = useMemo(
    () => justificationRequests.filter(j => j.matricula_id === enrollmentId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [justificationRequests, enrollmentId]
  );
  const requestFor = (f: string) => myRequests.find(j => j.fecha === f);
  const pending = incidents.filter(i => i.estado !== 'justificado' && !requestFor(i.fecha));
  const waiting = myRequests.filter(j => j.estado === 'pendiente').length;

  const alreadySent = requestFor(fecha);
  const isFuture = fecha > todayIso;
  const reason = REASONS.find(r => r.id === reasonId);
  const verb = tipo === 'tardanza' ? 'llegó tarde' : isFuture ? 'faltará' : 'faltó';

  const scrollToForm = () => setTimeout(() => document.getElementById('form-justificar')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);

  const openForDay = (i: Incident) => {
    setFecha(i.fecha);
    setTipo(i.estado === 'tardanza' ? 'tardanza' : 'falta');
    setFreeDate(false);
    setFormOpen(true);
    setSent(null);
    scrollToForm();
  };
  const openFree = () => {
    setFecha(todayIso);
    setTipo('falta');
    setFreeDate(true);
    setFormOpen(true);
    setSent(null);
    scrollToForm();
  };
  const closeForm = () => { setFormOpen(false); setSent(null); setReasonId(''); setDetails(''); setFile(null); };

  // Si viene de "Justificar" en una falta concreta: /apoderado/justificar?fecha=2026-09-25
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get('fecha');
    if (!f || !/^\d{4}-\d{2}-\d{2}$/.test(f)) return;
    const inc = incidents.find(i => i.fecha === f);
    if (inc) openForDay(inc);
    else { setFecha(f); setFreeDate(true); setFormOpen(true); }
    // Solo al entrar a la página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFile = (f?: File | null) => {
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) { showToast(`El archivo pesa más de ${MAX_FILE_MB} MB. Prueba con una foto más liviana.`, 'warning'); return; }
    const reader = new FileReader();
    reader.onload = () => setFile({ name: f.name, dataUrl: String(reader.result) });
    reader.readAsDataURL(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!child?.enrollment) { showToast('No encontramos la matrícula del alumno', 'error'); return; }
    if (alreadySent) { showToast('Ya enviaste una justificación para ese día', 'warning'); return; }
    if (!reason) { showToast('Elige el motivo', 'warning'); return; }
    if (details.trim().length < 5) { showToast('Escríbele al tutor un mensaje corto contando qué pasó', 'warning'); return; }
    requestJustification({
      matricula_id: child.enrollment.id,
      estudiante_id: child.enrollment.estudiante_id,
      apoderado_id: currentUser?.id,
      apoderado_nombre: currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : 'Apoderado',
      fecha,
      tipo,
      motivo: `${reason.id} — ${details.trim()}${isFuture ? ' (aviso anticipado)' : ''}`,
      documento_url: file?.dataUrl,
    });
    setSent({ fecha, tipo });
    setReasonId('');
    setDetails('');
    setFile(null);
  };

  const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm';
  const stepBadge = 'inline-flex w-6 h-6 mr-2 rounded-full bg-pink-600 text-white text-xs font-black items-center justify-center shrink-0';

  if (!child) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-3">
        <UserX className="w-12 h-12 text-slate-300 mx-auto" />
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Aún no hay alumnos vinculados a tu cuenta</h1>
        <Link href="/apoderado" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"><ArrowLeft className="w-4 h-4" /> Volver</Link>
      </div>
    );
  }

  // Historial: lo enviado por el padre y las faltas que el colegio justificó directamente
  const history = [
    ...myRequests.map(j => ({ key: j.id, fecha: j.fecha, tipo: j.tipo, req: j })),
    ...incidents.filter(i => i.estado === 'justificado' && !requestFor(i.fecha)).map(i => ({ key: `att-${i.fecha}`, fecha: i.fecha, tipo: 'falta' as const, req: null })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-24 animate-fade-in">

      {/* ── ENCABEZADO: qué tiene que hacer el padre, en una frase ── */}
      <section className={`${card} overflow-hidden`}>
        <div className="h-1 bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400" />
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <Link href="/apoderado" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio</Link>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">Justificar faltas de {firstName}</h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mt-1">
                {pending.length > 0
                  ? <>{firstName} tiene <strong className="text-rose-600 dark:text-rose-400">{pending.length} {pending.length === 1 ? 'día' : 'días'} sin justificar</strong>. Elige el día y cuéntale al tutor qué pasó.</>
                  : <>{firstName} no tiene faltas ni tardanzas por justificar. 🎉</>}
                {waiting > 0 && <> Tienes {waiting} {waiting === 1 ? 'justificación esperando' : 'justificaciones esperando'} respuesta del tutor.</>}
              </p>
            </div>
            {children.length > 1 && (
              <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Elegir hijo">
                {children.map(c => (
                  <button key={c.id} type="button" onClick={() => { selectChild(c.id); closeForm(); }} aria-pressed={c.id === child.id}
                    className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border shrink-0 cursor-pointer ${c.id === child.id ? 'bg-pink-50 dark:bg-pink-950/30 border-pink-300 dark:border-pink-800' : 'border-slate-200 dark:border-slate-700'}`}>
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 text-white text-xs font-black flex items-center justify-center">{c.nombre[0]}{c.apellidos[0] || ''}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.nombre.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cómo funciona, en 3 pasos visibles desde el inicio */}
          <ol className="grid grid-cols-3 gap-2">
            {[
              { icon: MousePointerClick, title: 'Elige el día', text: 'Toca el día que faltó o llegó tarde.' },
              { icon: PencilLine, title: 'Cuenta qué pasó', text: 'Elige el motivo y escribe un mensaje corto.' },
              { icon: MessageCircleReply, title: 'El tutor responde', text: 'Si lo acepta, la falta queda justificada.' },
            ].map((s, i) => (
              <li key={s.title} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1.5 sm:gap-2.5 p-2 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-300 flex items-center justify-center shrink-0"><s.icon className="w-4 h-4" /></span>
                <span className="min-w-0">
                  <span className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">{i + 1}. {s.title}</span>
                  <span className="hidden sm:block text-xs text-slate-600 dark:text-slate-400">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* ── COLUMNA PRINCIPAL ── */}
        <div className="lg:col-span-7 space-y-4">
          {!formOpen ? (
            <>
              {/* Paso 1: días pendientes */}
              <section className={`${card} p-4 sm:p-5 space-y-3`}>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center"><span className={stepBadge}>1</span>¿Qué día quieres justificar?</h2>
                {pending.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200">
                    <PartyPopper className="w-8 h-8 shrink-0" />
                    <p className="text-sm"><strong>¡Todo en orden!</strong> No hay días pendientes por justificar.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {pending.map(i => {
                      const late = i.estado === 'tardanza';
                      const time = niceTime(i.hora);
                      return (
                        <li key={i.fecha}>
                          <button type="button" onClick={() => openForDay(i)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-pink-400 hover:bg-pink-50/50 dark:hover:bg-pink-950/20 text-left transition-colors cursor-pointer">
                            <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${late ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60' : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60'}`}>
                              {late ? <Clock className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm sm:text-base font-black text-slate-900 dark:text-white">{niceDate(i.fecha, true)}</span>
                              <span className="block text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                {late ? `Llegó tarde${time ? `, a las ${time}` : ''}` : 'No fue al colegio'}
                              </span>
                            </span>
                            <span className="px-3 py-2 rounded-lg bg-pink-600 text-white text-xs sm:text-sm font-black shrink-0">Justificar</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Otro día o aviso anticipado */}
              <button type="button" onClick={openFree}
                className={`${card} w-full p-4 flex items-center gap-3 text-left hover:border-pink-300 dark:hover:border-pink-800 transition-colors cursor-pointer`}>
                <span className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300 flex items-center justify-center shrink-0"><CalendarPlus className="w-5 h-5" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm sm:text-base font-black text-slate-900 dark:text-white">¿{firstName} va a faltar o el día no aparece aquí?</span>
                  <span className="block text-xs sm:text-sm text-slate-600 dark:text-slate-400">Avisa con anticipación o elige la fecha tú mismo.</span>
                </span>
                <span className="text-sm font-black text-pink-600 dark:text-pink-400 shrink-0"><span className="hidden sm:inline">Elegir fecha </span>→</span>
              </button>
            </>
          ) : (
            <section id="form-justificar" className={`${card} p-4 sm:p-5 scroll-mt-20`}>
              {sent ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto"><CheckCircle2 className="w-9 h-9" /></div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">¡Listo, se lo enviamos al tutor!</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    {tutorName || 'El tutor'} revisará la {sent.tipo === 'tardanza' ? 'tardanza' : 'falta'} del <strong>{niceDate(sent.fecha, true)}</strong>.
                    Cuando responda, lo verás en <strong>Lo que ya enviaste</strong>.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {pending.length > 0 && (
                      <button type="button" onClick={closeForm} className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold cursor-pointer">
                        Justificar otro día ({pending.length} {pending.length === 1 ? 'pendiente' : 'pendientes'})
                      </button>
                    )}
                    <Link href="/apoderado" className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200">Volver al inicio</Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  {/* Día elegido */}
                  <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-pink-700 dark:text-pink-300">{freeDate ? 'Elige la fecha' : 'Estás justificando'}</p>
                      {freeDate ? (
                        <input type="date" value={fecha} max={addDays(todayIso, 30)} aria-label="Fecha a justificar"
                          onChange={e => {
                            const f = e.target.value;
                            setFecha(f);
                            const inc = incidents.find(i => i.fecha === f);
                            if (inc) setTipo(inc.estado === 'tardanza' ? 'tardanza' : 'falta');
                          }}
                          className="mt-1 px-3 py-1.5 rounded-lg border border-pink-200 dark:border-pink-800 bg-white dark:bg-slate-900 text-sm font-bold text-slate-800 dark:text-slate-100" />
                      ) : (
                        <p className="text-base font-black text-slate-900 dark:text-white">{niceDate(fecha, true)} · {tipo === 'tardanza' ? 'llegó tarde' : 'no fue al colegio'}</p>
                      )}
                      {freeDate && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{niceDate(fecha, true)}{isFuture ? ' · le avisarás al tutor antes de que falte' : ''}</p>}
                    </div>
                    <button type="button" onClick={closeForm} className="text-xs font-bold text-pink-700 dark:text-pink-300 hover:underline shrink-0 cursor-pointer">Cambiar día</button>
                  </div>

                  {alreadySent && (
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-2.5 flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0" /> Ya enviaste una justificación para ese día ({STATUS[alreadySent.estado].label.toLowerCase()}). Elige otra fecha.
                    </p>
                  )}

                  {/* Solo se pregunta si faltó o llegó tarde cuando el colegio no lo sabe */}
                  {freeDate && (
                    <div className="space-y-2">
                      <p className="text-sm font-black text-slate-900 dark:text-white">¿Qué pasó ese día?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {([['falta', isFuture ? 'Va a faltar' : 'No fue al colegio', UserX], ['tardanza', 'Llegó tarde', Clock]] as const).map(([id, label, Icon]) => (
                          <button key={id} type="button" onClick={() => setTipo(id)} aria-pressed={tipo === id}
                            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-bold cursor-pointer ${tipo === id ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}>
                            <Icon className="w-5 h-5" /> {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Paso 2: motivo */}
                  <div className="space-y-2">
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center"><span className={stepBadge}>2</span>¿Por qué {verb}?</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {REASONS.map(r => (
                        <button key={r.id} type="button" onClick={() => setReasonId(r.id)} aria-pressed={reasonId === r.id}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left cursor-pointer ${reasonId === r.id ? 'border-pink-500 bg-pink-50/60 dark:bg-pink-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${r.tone}`}><r.icon className="w-4 h-4" /></span>
                          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paso 3: mensaje y constancia */}
                  <div className="space-y-2">
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center"><span className={stepBadge}>3</span>Escríbele al tutor</p>
                    <textarea rows={3} value={details} onChange={e => setDetails(e.target.value)}
                      placeholder={`Por ejemplo: ${(reason || REASONS[0]).example}`}
                      aria-label="Mensaje para el tutor"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500" />
                    {file ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-sm">
                        <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="flex-1 truncate text-emerald-800 dark:text-emerald-200 font-semibold">{file.name}</span>
                        <button type="button" onClick={() => setFile(null)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer" aria-label="Quitar archivo"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:border-pink-400 cursor-pointer">
                        <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                        <span><strong>Adjuntar constancia</strong> (si la tienes): foto o PDF, por ejemplo una constancia médica.</span>
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
                      </label>
                    )}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button type="submit" disabled={!!alreadySent} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-black shadow-md shadow-pink-600/20 cursor-pointer">
                      <Send className="w-4 h-4" /> Enviar al tutor
                    </button>
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                      Le llegará a {tutorName || 'su tutor(a)'}{child.aula ? `, tutor(a) de ${child.aula}` : ''}.
                    </p>
                  </div>
                </form>
              )}
            </section>
          )}
        </div>

        {/* ── COLUMNA LATERAL ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Lo que ya envió el padre y cómo va */}
          <section className={`${card} p-4 space-y-3`}>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Lo que ya enviaste</h2>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Aún no has enviado ninguna justificación.</p>
            ) : (
              <ul className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                {history.map(h => {
                  const st = h.req ? STATUS[h.req.estado] : STATUS.aprobada;
                  const [motivo, detalle] = h.req ? h.req.motivo.split(' — ') : [];
                  const motivoLabel = REASONS.find(r => r.id === motivo)?.label || motivo;
                  return (
                    <li key={h.key} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{niceDate(h.fecha, true)}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${st.cls}`}>
                          <st.icon className="w-3 h-3" /> {st.label}
                        </span>
                      </div>
                      {h.req ? (
                        <>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {h.tipo === 'tardanza' ? 'Tardanza' : 'Falta'}{motivoLabel && detalle ? <> · <strong>{motivoLabel}</strong></> : null}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic">“{detalle || motivo}”</p>
                          {h.req.documento_url && <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1"><Paperclip className="w-3 h-3" /> Constancia adjunta</p>}
                          {h.req.estado === 'pendiente' && (
                            <p className="text-xs text-amber-700 dark:text-amber-300">El tutor aún no lo revisa. Te avisaremos aquí cuando responda.</p>
                          )}
                          {h.req.respuesta_colegio && (
                            <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-2.5 py-1.5 flex gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                              <span><strong>Respuesta{h.req.revisado_por ? ` de ${h.req.revisado_por}` : ' del colegio'}:</strong> {h.req.respuesta_colegio}</span>
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-slate-600 dark:text-slate-300">El colegio registró esta falta como justificada.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Contacto directo con el tutor */}
          {child.tutor && (
            <section className={`${card} p-4`}>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-blue-600 text-white text-sm font-black flex items-center justify-center shrink-0">{child.tutor.nombres[0]}{child.tutor.apellidos[0] || ''}</span>
                <p className="flex-1 min-w-0 text-sm">
                  <span className="block text-xs text-slate-500 dark:text-slate-400">¿Es urgente? Comunícate con su tutor(a)</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">{tutorName}</span>
                </p>
                {child.tutor.telefono && <a href={`tel:${child.tutor.telefono}`} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600" aria-label="Llamar al tutor"><Phone className="w-4 h-4" /></a>}
                {child.tutor.email && <a href={`mailto:${child.tutor.email}`} className="p-2 rounded-lg bg-blue-600 text-white" aria-label="Escribir al tutor"><Mail className="w-4 h-4" /></a>}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
