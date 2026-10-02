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
  CalendarDays,
  ShieldCheck,
  MessageSquare,
  FileCheck2,
  AlertCircle,
  Info,
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

const STATUS = {
  sin: { label: 'Sin justificar', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
  pendiente: { label: 'En revisión', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  aprobada: { label: 'Aceptada', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  rechazada: { label: 'No aceptada', cls: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};

export default function JustificarFaltaPage() {
  const { currentUser, attendances, justificationRequests, requestJustification, evaluationPeriods, showToast } = useApp();
  const { children, child, selectChild } = useParentChildren();

  const todayIso = localIso();
  const [fecha, setFecha] = useState(todayIso);
  const [tipo, setTipo] = useState<'falta' | 'tardanza'>('falta');
  const [reasonId, setReasonId] = useState(REASONS[0].id);
  const [details, setDetails] = useState('');
  const [file, setFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [sent, setSent] = useState<{ fecha: string; tipo: string } | null>(null);

  // Si viene de "Justificar" en una falta concreta: /apoderado/justificar?fecha=2026-09-25
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get('fecha');
    if (f && /^\d{4}-\d{2}-\d{2}$/.test(f)) setFecha(f);
  }, []);

  const enrollmentId = child?.enrollment?.id;
  const firstName = child?.nombre.split(' ')[0] || 'tu hijo';
  const currentPeriod = evaluationPeriods.find(p => p.fecha_inicio <= todayIso && todayIso <= p.fecha_fin);

  // Días con falta o tardanza (un registro por día)
  const incidents = useMemo(() => {
    const byDay = new Map<string, string>();
    attendances
      .filter(a => a.matricula_id === enrollmentId && a.tipo_registro !== 'salida')
      .forEach(a => { if (!byDay.has(a.fecha) || a.tipo_registro === 'ingreso') byDay.set(a.fecha, a.estado); });
    return Array.from(byDay.entries())
      .filter(([, e]) => e === 'falta' || e === 'tardanza' || e === 'justificado')
      .map(([f, estado]) => ({ fecha: f, estado }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [attendances, enrollmentId]);

  const myRequests = useMemo(
    () => justificationRequests.filter(j => j.matricula_id === enrollmentId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [justificationRequests, enrollmentId]
  );
  const requestFor = (f: string) => myRequests.find(j => j.fecha === f);
  const unexcused = incidents.filter(i => i.estado !== 'justificado' && !requestFor(i.fecha));

  const stats = {
    faltas: incidents.filter(i => i.estado === 'falta' && (!currentPeriod || i.fecha >= currentPeriod.fecha_inicio)).length,
    sin: unexcused.length,
    revision: myRequests.filter(j => j.estado === 'pendiente').length,
    aceptadas: myRequests.filter(j => j.estado === 'aprobada').length,
  };

  const alreadySent = requestFor(fecha);
  const recordOnDate = incidents.find(i => i.fecha === fecha);
  const isFuture = fecha > todayIso;
  const reason = REASONS.find(r => r.id === reasonId) || REASONS[0];

  const pickDate = (f: string, t?: 'falta' | 'tardanza') => {
    setFecha(f);
    if (t) setTipo(t);
    setSent(null);
    document.getElementById('form-justificar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
    if (details.trim().length < 5) { showToast('Cuéntale al tutor un poco más de lo que pasó', 'warning'); return; }
    requestJustification({
      matricula_id: child.enrollment.id,
      estudiante_id: child.enrollment.estudiante_id,
      apoderado_id: currentUser?.id,
      apoderado_nombre: currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : 'Apoderado',
      fecha,
      tipo,
      motivo: `${reasonId} — ${details.trim()}${isFuture ? ' (aviso anticipado)' : ''}`,
      documento_url: file?.dataUrl,
    });
    setSent({ fecha, tipo });
    setDetails('');
    setFile(null);
  };

  const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm';

  if (!child) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-3">
        <UserX className="w-12 h-12 text-slate-300 mx-auto" />
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Aún no hay alumnos vinculados a tu cuenta</h1>
        <Link href="/apoderado" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"><ArrowLeft className="w-4 h-4" /> Volver</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-24 animate-fade-in">

      {/* ── ENCABEZADO ── */}
      <section className={`${card} overflow-hidden`}>
        <div className="h-1 bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400" />
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <Link href="/apoderado" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio</Link>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">Justificar una falta</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                Si {firstName} faltó, llegó tarde o sabes que faltará, avísale aquí a su tutor(a). Cuando lo acepte, la falta queda como <strong>justificada</strong>.
              </p>
            </div>
            {children.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {children.map(c => (
                  <button key={c.id} type="button" onClick={() => { selectChild(c.id); setSent(null); }} aria-pressed={c.id === child.id}
                    className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border shrink-0 cursor-pointer ${c.id === child.id ? 'bg-pink-50 dark:bg-pink-950/30 border-pink-300 dark:border-pink-800' : 'border-slate-200 dark:border-slate-700'}`}>
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 text-white text-xs font-black flex items-center justify-center">{c.nombre[0]}{c.apellidos[0] || ''}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.nombre.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: `Faltas${currentPeriod ? ` en el ${currentPeriod.nombre}` : ''}`, value: stats.faltas, icon: UserX, cls: 'bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200' },
              { label: 'Sin justificar', value: stats.sin, icon: AlertCircle, cls: stats.sin > 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200' },
              { label: 'En revisión', value: stats.revision, icon: Clock, cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
              { label: 'Aceptadas', value: stats.aceptadas, icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
            ].map(s => (
              <div key={s.label} className={`flex items-center gap-3 p-3 rounded-xl ${s.cls}`}>
                <s.icon className="w-5 h-5 shrink-0" />
                <div>
                  <p className="text-2xl font-black leading-none">{s.value}</p>
                  <p className="text-xs font-bold mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── FORMULARIO ── */}
        <section id="form-justificar" className={`${card} p-4 sm:p-5 lg:col-span-7 scroll-mt-20`}>
          {sent ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto"><CheckCircle2 className="w-9 h-9" /></div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">¡Justificación enviada!</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                {child.tutor ? `${child.tutor.nombres} ${child.tutor.apellidos}` : 'El tutor'} revisará la {sent.tipo === 'tardanza' ? 'tardanza' : 'falta'} del <strong>{niceDate(sent.fecha, true)}</strong>. Verás la respuesta aquí mismo, en <strong>Tus justificaciones</strong>.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button type="button" onClick={() => setSent(null)} className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold cursor-pointer">Justificar otro día</button>
                <Link href="/apoderado" className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200">Volver al inicio</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {/* Paso 1: día */}
              <div className="space-y-2">
                <p className="text-sm font-black text-slate-900 dark:text-white"><span className="inline-flex w-6 h-6 mr-1.5 rounded-full bg-pink-600 text-white text-xs items-center justify-center">1</span>¿Qué día?</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ...unexcused.slice(0, 4).map(i => ({ f: i.fecha, label: `${niceDate(i.fecha)} · ${i.estado === 'tardanza' ? 'tarde' : 'faltó'}`, t: (i.estado === 'tardanza' ? 'tardanza' : 'falta') as 'falta' | 'tardanza', warn: true })),
                    { f: todayIso, label: 'Hoy', t: undefined, warn: false },
                    { f: addDays(todayIso, -1), label: 'Ayer', t: undefined, warn: false },
                    { f: addDays(todayIso, 1), label: 'Mañana (aviso)', t: undefined, warn: false },
                  ].filter((x, i, arr) => arr.findIndex(y => y.f === x.f) === i).map(x => (
                    <button key={x.f} type="button" onClick={() => pickDate(x.f, x.t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${fecha === x.f ? 'bg-pink-600 border-pink-600 text-white' : x.warn ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'}`}>
                      {x.label}
                    </button>
                  ))}
                  <input type="date" value={fecha} max={addDays(todayIso, 30)} onChange={e => { setFecha(e.target.value); setSent(null); }} aria-label="Elegir otra fecha"
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> {niceDate(fecha, true)}
                  {isFuture ? ' · le avisarás al tutor antes de que falte' : recordOnDate ? ` · ese día figura como ${recordOnDate.estado === 'tardanza' ? 'tardanza' : recordOnDate.estado === 'justificado' ? 'justificado' : 'falta'}` : ''}
                </p>
                {alreadySent && (
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4 shrink-0" /> Ya enviaste una justificación para ese día ({STATUS[alreadySent.estado].label.toLowerCase()}).
                  </p>
                )}
              </div>

              {/* Paso 2: falta o tardanza */}
              <div className="space-y-2">
                <p className="text-sm font-black text-slate-900 dark:text-white"><span className="inline-flex w-6 h-6 mr-1.5 rounded-full bg-pink-600 text-white text-xs items-center justify-center">2</span>¿Qué pasó?</p>
                <div className="grid grid-cols-2 gap-2">
                  {([['falta', 'No asistió', UserX], ['tardanza', 'Llegó tarde', Clock]] as const).map(([id, label, Icon]) => (
                    <button key={id} type="button" onClick={() => setTipo(id)} aria-pressed={tipo === id}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-bold cursor-pointer ${tipo === id ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}>
                      <Icon className="w-5 h-5" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paso 3: motivo */}
              <div className="space-y-2">
                <p className="text-sm font-black text-slate-900 dark:text-white"><span className="inline-flex w-6 h-6 mr-1.5 rounded-full bg-pink-600 text-white text-xs items-center justify-center">3</span>¿Por qué?</p>
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

              {/* Paso 4: detalle y constancia */}
              <div className="space-y-2">
                <p className="text-sm font-black text-slate-900 dark:text-white"><span className="inline-flex w-6 h-6 mr-1.5 rounded-full bg-pink-600 text-white text-xs items-center justify-center">4</span>Cuéntale al tutor</p>
                <textarea rows={3} value={details} onChange={e => setDetails(e.target.value)} placeholder={`Ej. ${reason.example}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500" />
                {file ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-sm">
                    <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="flex-1 truncate text-emerald-800 dark:text-emerald-200 font-semibold">{file.name}</span>
                    <button type="button" onClick={() => setFile(null)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer" aria-label="Quitar archivo"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:border-pink-400 cursor-pointer">
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <span><strong>Adjuntar constancia</strong> (opcional) · foto o PDF de hasta {MAX_FILE_MB} MB</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
                  </label>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Le llegará a {child.tutor ? `${child.tutor.nombres} ${child.tutor.apellidos}` : 'su tutor(a)'}.</p>
                <button type="submit" disabled={!!alreadySent} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black shadow-md shadow-pink-600/20 cursor-pointer">
                  <Send className="w-4 h-4" /> Enviar justificación
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ── COLUMNA DERECHA ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Faltas y tardanzas registradas */}
          <section className={`${card} p-4 space-y-3`}>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Faltas y tardanzas de {firstName}</h2>
            {incidents.length === 0 ? (
              <p className="text-sm text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No tiene faltas ni tardanzas. ¡Muy bien!</p>
            ) : (
              <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {incidents.map(i => {
                  const req = requestFor(i.fecha);
                  const st = i.estado === 'justificado' ? STATUS.aprobada : req ? STATUS[req.estado] : STATUS.sin;
                  const canJustify = !req && i.estado !== 'justificado';
                  return (
                    <li key={i.fecha} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${i.estado === 'tardanza' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60' : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60'}`}>{i.estado === 'tardanza' ? <Clock className="w-4 h-4" /> : <UserX className="w-4 h-4" />}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{niceDate(i.fecha)}</p>
                        <p className="text-xs text-slate-500">{i.estado === 'tardanza' ? 'Llegó tarde' : 'No asistió'}</p>
                      </div>
                      {canJustify
                        ? <button type="button" onClick={() => pickDate(i.fecha, i.estado === 'tardanza' ? 'tardanza' : 'falta')} className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold cursor-pointer">Justificar</button>
                        : <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${st.cls}`}>{st.label}</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Historial de justificaciones */}
          <section className={`${card} p-4 space-y-3`}>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Tus justificaciones</h2>
            {myRequests.length === 0 ? (
              <p className="text-sm text-slate-500">Aún no has enviado ninguna.</p>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {myRequests.map(j => {
                  const st = STATUS[j.estado];
                  const [motivo, detalle] = j.motivo.split(' — ');
                  return (
                    <li key={j.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{niceDate(j.fecha)} · {j.tipo === 'tardanza' ? 'Tardanza' : 'Falta'}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300"><strong>{motivo}</strong>{detalle ? ` — ${detalle}` : ''}</p>
                      {j.documento_url && <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1"><Paperclip className="w-3 h-3" /> Constancia adjunta</p>}
                      {j.respuesta_colegio && (
                        <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-2.5 py-1.5 flex gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" /> <span><strong>{j.revisado_por || 'Colegio'}:</strong> {j.respuesta_colegio}</span>
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Cómo funciona + tutor */}
          <section className={`${card} p-4 space-y-3`}>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /> ¿Cómo funciona?</h2>
            <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex gap-2"><span className="font-black text-pink-600">1.</span> Envías el motivo (y si tienes, la constancia).</li>
              <li className="flex gap-2"><span className="font-black text-pink-600">2.</span> El tutor(a) lo revisa y te responde aquí.</li>
              <li className="flex gap-2"><span className="font-black text-pink-600">3.</span> Si lo acepta, la falta pasa a <strong>justificada</strong> y no afecta su asistencia.</li>
            </ol>
            {child.tutor && (
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="w-9 h-9 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center">{child.tutor.nombres[0]}{child.tutor.apellidos[0] || ''}</span>
                <p className="flex-1 min-w-0 text-sm"><span className="block text-xs text-slate-500">¿Es urgente? Habla con su tutor(a)</span><span className="font-bold text-slate-900 dark:text-white truncate block">{child.tutor.nombres} {child.tutor.apellidos}</span></p>
                {child.tutor.telefono && <a href={`tel:${child.tutor.telefono}`} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600" aria-label="Llamar al tutor"><Phone className="w-4 h-4" /></a>}
                {child.tutor.email && <a href={`mailto:${child.tutor.email}`} className="p-2 rounded-lg bg-blue-600 text-white" aria-label="Escribir al tutor"><Mail className="w-4 h-4" /></a>}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
