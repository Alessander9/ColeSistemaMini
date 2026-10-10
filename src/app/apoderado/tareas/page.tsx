'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useParentChildren } from '@/hooks/useParentChildren';
import { Modal } from '@/components/ui/Modal';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { compressFile, formatBytes } from '@/lib/services/compressionService';
import { TaskAssignment, TaskSubmission } from '@/types';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Camera,
  Hourglass,
  MessageSquare,
  Star,
  Upload,
  UserX,
  X,
  AlertTriangle,
  Award,
  Calendar,
} from 'lucide-react';

// ── Fechas en palabras que entiende cualquier padre ──
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayDiff = (iso: string) => Math.round((startOfDay(new Date(iso)).getTime() - startOfDay(new Date()).getTime()) / 86400000);
const longDate = (iso: string) => {
  const t = new Date(iso).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
const relative = (days: number) =>
  days === 0 ? 'hoy' : days === 1 ? 'mañana' : days > 1 ? `en ${days} días` : days === -1 ? 'ayer' : `hace ${-days} días`;

const courseEmoji = (name?: string) => {
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
};

// Qué significa cada nota, dicho para padres
const GRADE_HELP = [
  { letter: 'AD', label: 'Logro destacado', desc: 'Hizo más de lo que se esperaba.' },
  { letter: 'A', label: 'Logro esperado', desc: 'Logró lo que se esperaba.' },
  { letter: 'B', label: 'En proceso', desc: 'Está cerca; necesita practicar más.' },
  { letter: 'C', label: 'En inicio', desc: 'Necesita apoyo para lograrlo.' },
];

type Group = 'pendiente' | 'noEntregada' | 'esperando' | 'conNota';

export default function ApoderadoTareasPage() {
  const { tasks, submissions, submitTask, courses, users, currentUser, showToast } = useApp();
  const { children, child, selectChild } = useParentChildren();

  const [openId, setOpenId] = useState<string | null>(null);
  const [uploadTask, setUploadTask] = useState<TaskAssignment | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const enrollment = child?.enrollment;
  const firstName = child?.nombre.split(' ')[0] || 'tu hijo';
  const parentName = currentUser ? `${currentUser.nombres} ${currentUser.apellidos}`.trim() : 'su apoderado';

  const courseName = (t: TaskAssignment) => t.curso?.nombre || courses.find(c => c.id === t.curso_id)?.nombre || 'Curso';
  const teacherName = (t: TaskAssignment) => {
    const u = users.find(x => x.id === t.docente_id);
    return u ? `${u.nombres} ${u.apellidos}` : '';
  };

  // Tareas del aula del hijo, cada una con su entrega (si la hay) y su grupo
  const items = useMemo(() => {
    if (!enrollment) return [];
    return tasks
      .filter(t => t.seccion_id === enrollment.seccion_id && t.estado !== 'borrador')
      .map(t => {
        const sub = submissions.find(s => s.tarea_id === t.id && s.matricula_id === enrollment.id) as TaskSubmission | undefined;
        const group: Group = sub ? (sub.calificacion_letra ? 'conNota' : 'esperando') : t.estado === 'cerrada' ? 'noEntregada' : 'pendiente';
        return { task: t, sub, group, days: dayDiff(t.fecha_limite) };
      });
  }, [tasks, submissions, enrollment]);

  const byGroup = (g: Group) => items.filter(i => i.group === g);
  const pending = byGroup('pendiente').sort((a, b) => a.days - b.days);
  const missed = byGroup('noEntregada').sort((a, b) => b.days - a.days);
  const waiting = byGroup('esperando').sort((a, b) => (b.sub?.fecha_entrega || '').localeCompare(a.sub?.fecha_entrega || ''));
  const graded = byGroup('conNota').sort((a, b) => (b.sub?.fecha_entrega || '').localeCompare(a.sub?.fecha_entrega || ''));
  const next = pending[0];

  const closeUpload = () => { setUploadTask(null); setFile(null); setComment(''); setSending(false); };

  const sendTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTask || !enrollment) return;
    if (!file) { showToast('Toma una foto de la tarea o elige el archivo', 'warning'); return; }
    if (file.size > 50 * 1024 * 1024) { showToast('El archivo pesa más de 50 MB. Prueba con una foto.', 'warning'); return; }
    setSending(true);
    // Las fotos se achican sin perder nitidez para que suban rápido
    let url = URL.createObjectURL(file);
    let name = file.name;
    let size = formatBytes(file.size);
    try {
      const r = await compressFile(file, 'balanced');
      url = r.previewUrl; name = r.name; size = r.compressedFormatted;
    } catch { /* se envía el archivo original */ }
    submitTask({
      tareaId: uploadTask.id,
      matriculaId: enrollment.id,
      comentarioEstudiante: comment.trim() ? `Mensaje de ${parentName} (apoderado): ${comment.trim()}` : `Subida por ${parentName} (apoderado)`,
      archivoUrl: url,
      archivoNombre: name,
      archivoTamano: size,
    });
    closeUpload();
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

  // Una tarea: siempre se ve el resumen; al tocarla se ve qué piden y la respuesta del profesor
  const renderTask = ({ task, sub, group, days }: (typeof items)[number]) => {
    const open = openId === task.id;
    const course = courseName(task);
    const teacher = teacherName(task);
    const status =
      group === 'pendiente'
        ? days < 0
          ? { text: `Venció ${relative(days)} y aún no la entrega`, cls: 'text-rose-700 dark:text-rose-300' }
          : { text: `Debe entregarla ${relative(days)} (${longDate(task.fecha_limite).toLowerCase()})`, cls: days <= 1 ? 'text-orange-700 dark:text-orange-300' : 'text-slate-600 dark:text-slate-300' }
        : group === 'noEntregada'
          ? { text: `No se entregó · venció el ${shortDate(task.fecha_limite)}`, cls: 'text-rose-700 dark:text-rose-300' }
          : group === 'esperando'
            ? { text: `Entregada el ${shortDate(sub!.fecha_entrega)} · el profesor aún no la califica`, cls: 'text-emerald-700 dark:text-emerald-300' }
            : { text: `Entregada el ${shortDate(sub!.fecha_entrega)}`, cls: 'text-slate-600 dark:text-slate-300' };

    return (
      <li key={task.id} className={`${card} overflow-hidden`}>
        <div className="p-3 sm:p-4 flex items-start gap-3">
          <span className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0" aria-hidden="true">{courseEmoji(course)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{course}</p>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">{task.titulo}</p>
            <p className={`text-xs sm:text-sm font-semibold mt-0.5 ${status.cls}`}>{status.text}</p>
          </div>
          {group === 'conNota' && sub?.calificacion_letra && <GradeBadge grade={sub.calificacion_letra} size="lg" />}
        </div>

        <div className="px-3 sm:px-4 pb-3 flex flex-wrap items-center gap-2">
          {group === 'pendiente' && (
            <button type="button" onClick={() => setUploadTask(task)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black cursor-pointer">
              <Upload className="w-4 h-4" /> Subir la tarea de {firstName}
            </button>
          )}
          <button type="button" onClick={() => setOpenId(open ? null : task.id)} aria-expanded={open}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            {open ? 'Ocultar' : group === 'conNota' ? 'Ver nota y comentario' : 'Ver qué le piden'}
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {open && (
          <div className="px-3 sm:px-4 pb-4 space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-sm">
            <div>
              <p className="text-xs font-black text-slate-500 dark:text-slate-400">Lo que pide el profesor</p>
              <p className="text-slate-700 dark:text-slate-200">{task.descripcion || 'Sin indicaciones adicionales.'}</p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
              <p>Fecha de entrega: <strong className="text-slate-700 dark:text-slate-200">{longDate(task.fecha_limite)}</strong></p>
              {teacher && <p>Profesor(a): <strong className="text-slate-700 dark:text-slate-200">{teacher}</strong></p>}
            </div>
            {sub?.archivo_nombre && (
              <a href={sub.archivo_url || '#'} download={sub.archivo_nombre}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" /> <span className="flex-1 truncate font-semibold">{sub.archivo_nombre}</span>
                <Download className="w-4 h-4 text-blue-600 shrink-0" />
              </a>
            )}
            {sub?.calificacion_letra && (
              <p className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400">Nota:</span>
                <GradeBadge grade={sub.calificacion_letra} size="sm" />
                <span>{GRADE_HELP.find(g => g.letter === sub.calificacion_letra)?.label}</span>
              </p>
            )}
            {sub?.retroalimentacion_docente && (
              <p className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200 flex gap-2">
                <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                <span><strong>Comentario del profesor:</strong> “{sub.retroalimentacion_docente}”</span>
              </p>
            )}
            {group === 'noEntregada' && (
              <p className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200">
                Esta tarea ya cerró. Si {firstName} tuvo un motivo para no entregarla, conversa con {teacher || 'su profesor(a)'}.
              </p>
            )}
          </div>
        )}
      </li>
    );
  };

  const renderSection = ({ title, hint, icon: Icon, tone, list }: { title: string; hint: string; icon: typeof Clock; tone: string; list: typeof items }) =>
    list.length === 0 ? null : (
      <section className="space-y-2">
        <div className="px-1">
          <h2 className={`text-base sm:text-lg font-black flex items-center gap-2 ${tone}`}><Icon className="w-5 h-5" /> {title} <span className="text-sm text-slate-400">({list.length})</span></h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{hint}</p>
        </div>
        <ul className="space-y-2">{list.map(renderTask)}</ul>
      </section>
    );

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-24 animate-fade-in">

      {/* ── ENCABEZADO: el estado de las tareas en una frase ── */}
      <section className={`${card} overflow-hidden`}>
        <div className="h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400" />
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <Link href="/apoderado" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio</Link>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">Tareas de {firstName}</h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mt-1">
                {next
                  ? <>{firstName} tiene <strong className="text-blue-700 dark:text-blue-300">{pending.length} {pending.length === 1 ? 'tarea por entregar' : 'tareas por entregar'}</strong>. La próxima vence <strong>{relative(next.days)}</strong>.</>
                  : <>{firstName} está al día: no tiene tareas por entregar. 🎉</>}
                {missed.length > 0 && <> Hay {missed.length} {missed.length === 1 ? 'tarea que no se entregó' : 'tareas que no se entregaron'} a tiempo.</>}
              </p>
            </div>
            {children.length > 1 && (
              <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Elegir hijo">
                {children.map(c => (
                  <button key={c.id} type="button" onClick={() => { selectChild(c.id); setOpenId(null); }} aria-pressed={c.id === child.id}
                    className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border shrink-0 cursor-pointer ${c.id === child.id ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800' : 'border-slate-200 dark:border-slate-700'}`}>
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-sky-500 text-white text-xs font-black flex items-center justify-center">{c.nombre[0]}{c.apellidos[0] || ''}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.nombre.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resumen en 3 números con su explicación */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { n: pending.length, label: 'Por entregar', icon: Clock, cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
              { n: waiting.length, label: 'Esperando nota', icon: Hourglass, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
              { n: graded.length, label: 'Con nota', icon: Star, cls: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
            ].map(s => (
              <div key={s.label} className={`flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 p-2.5 sm:p-3 rounded-xl text-center sm:text-left ${s.cls}`}>
                <s.icon className="w-5 h-5 shrink-0" />
                <div>
                  <p className="text-xl sm:text-2xl font-black leading-none">{s.n}</p>
                  <p className="text-[11px] sm:text-xs font-bold mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* ── LISTA POR ESTADO, LO MÁS URGENTE PRIMERO ── */}
        <div className="lg:col-span-8 space-y-5">
          {items.length === 0 && (
            <div className={`${card} p-8 text-center space-y-2`}>
              <div className="text-5xl" aria-hidden="true">📚</div>
              <p className="font-black text-slate-900 dark:text-white">Aún no hay tareas para {firstName}</p>
              <p className="text-sm text-slate-500">Cuando sus profesores dejen tareas, aparecerán aquí.</p>
            </div>
          )}

          {items.length > 0 && pending.length === 0 && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-8 h-8 shrink-0" />
              <p className="text-sm"><strong>¡Todo al día!</strong> {firstName} no tiene tareas pendientes de entrega.</p>
            </div>
          )}

          {renderSection({ title: 'Por entregar', icon: CalendarClock, tone: 'text-blue-700 dark:text-blue-300', list: pending,
            hint: `Revisa con ${firstName} que las haga a tiempo. Si la hizo en papel, puedes tomarle una foto y subirla.` })}
          {renderSection({ title: 'No se entregaron', icon: AlertTriangle, tone: 'text-rose-700 dark:text-rose-300', list: missed,
            hint: 'Ya cerraron y no tienen entrega. Pueden afectar sus notas.' })}
          {renderSection({ title: 'Entregadas, esperando nota', icon: Hourglass, tone: 'text-emerald-700 dark:text-emerald-300', list: waiting,
            hint: 'El profesor las está revisando. Cuando las califique, verás la nota aquí.' })}
          {renderSection({ title: 'Con nota', icon: Award, tone: 'text-violet-700 dark:text-violet-300', list: graded,
            hint: 'Toca "Ver nota y comentario" para leer lo que dijo el profesor.' })}
        </div>

        {/* ── AYUDA PARA EL PADRE ── */}
        <div className="lg:col-span-4 space-y-4">
          <section className={`${card} p-4 space-y-3`}>
            <h2 className="text-base font-black text-slate-900 dark:text-white">¿Qué significan las notas?</h2>
            <ul className="space-y-2">
              {GRADE_HELP.map(g => (
                <li key={g.letter} className="flex items-center gap-3">
                  <GradeBadge grade={g.letter} size="md" />
                  <span className="text-sm min-w-0">
                    <strong className="block text-slate-900 dark:text-white">{g.label}</strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{g.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={`${card} p-4 space-y-2`}>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"><Camera className="w-5 h-5 text-blue-600" /> ¿Cómo subo una tarea?</h2>
            <ol className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
              <li><strong className="text-blue-600">1.</strong> Toca <strong>Subir la tarea de {firstName}</strong>.</li>
              <li><strong className="text-blue-600">2.</strong> Toma una foto de la tarea o elige el archivo.</li>
              <li><strong className="text-blue-600">3.</strong> Toca <strong>Enviar al profesor</strong> y listo.</li>
            </ol>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <Link href="/estudiante/libreta-notas" className={`${card} p-3 flex flex-col items-center gap-1 text-center hover:border-violet-300 dark:hover:border-violet-800`}>
              <Award className="w-5 h-5 text-violet-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Libreta de notas</span>
            </Link>
            <Link href="/estudiante/horario" className={`${card} p-3 flex flex-col items-center gap-1 text-center hover:border-sky-300 dark:hover:border-sky-800`}>
              <Calendar className="w-5 h-5 text-sky-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Horario de clases</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── SUBIR TAREA: solo foto/archivo y un mensaje opcional ── */}
      {uploadTask && (
        <Modal isOpen={!!uploadTask} onClose={closeUpload} title={`Subir la tarea de ${firstName}`} maxWidth="md">
          <form onSubmit={sendTask} className="space-y-4 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{courseName(uploadTask)}</p>
              <p className="font-black text-slate-900 dark:text-white">{uploadTask.titulo}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Fecha de entrega: {longDate(uploadTask.fecha_limite)}</p>
            </div>

            <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block truncate font-bold text-emerald-900 dark:text-emerald-100">{file.name}</span>
                  <span className="block text-xs text-emerald-700 dark:text-emerald-300">{formatBytes(file.size)} · listo para enviar</span>
                </span>
                <button type="button" onClick={() => setFile(null)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer" aria-label="Quitar archivo"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-center cursor-pointer">
                <Camera className="w-8 h-8 text-blue-600 mx-auto mb-1.5" />
                <span className="block font-black text-slate-900 dark:text-white">Tomar foto o elegir archivo</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Foto del cuaderno, PDF o Word</span>
              </button>
            )}

            <div>
              <label htmlFor="msg-profesor" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Mensaje para el profesor (opcional)</label>
              <textarea id="msg-profesor" rows={2} value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Por ejemplo: Lucas la hizo en su cuaderno, envío la foto."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={closeUpload} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={sending}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-black cursor-pointer">
                <Upload className="w-4 h-4" /> {sending ? 'Enviando…' : 'Enviar al profesor'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
