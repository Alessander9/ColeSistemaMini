'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column, FilterChip } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { TaskAssignment } from '@/types';
import { 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Upload, 
  Paperclip, 
  AlertCircle, 
  FileText, 
  X, 
  FileCheck, 
  Download,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EstudianteTareasPage() {
  const { tasks, submissions, submitTask, enrollments, currentUser, students, showToast } = useApp();
  
  const activeStudent = students.find(s => s.profile_id === currentUser.id) || students[0];
  const activeEnrollment = enrollments.find(e => e.estudiante_id === activeStudent?.id) || enrollments[0];

  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [selectedTaskToSubmit, setSelectedTaskToSubmit] = useState<TaskAssignment | null>(null);
  const [comment, setComment] = useState('');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    url: string;
    type: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      showToast('El archivo supera el límite de 25 MB.', 'error', 'Archivo muy pesado');
      return;
    }

    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    // Create object URL for local preview/download
    const fileUrl = URL.createObjectURL(file);

    setAttachedFile({
      name: file.name,
      size: sizeFormatted,
      url: fileUrl,
      type: file.type || 'document',
    });

    showToast(`Archivo adjunto: ${file.name}`, 'info', 'Archivo listo');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskToSubmit) return;

    submitTask({
      tareaId: selectedTaskToSubmit.id,
      matriculaId: activeEnrollment?.id || 'enr-1',
      comentarioEstudiante: comment,
      archivoUrl: attachedFile?.url,
      archivoNombre: attachedFile?.name,
      archivoTamano: attachedFile?.size,
    });

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
    });

    setSelectedTaskToSubmit(null);
    setComment('');
    setAttachedFile(null);
  };

  // Filter chips with dynamic counters
  const filterChips: FilterChip[] = useMemo(() => {
    const total = tasks.length;
    const submittedCount = tasks.filter(t => 
      submissions.some(s => s.tarea_id === t.id && s.matricula_id === activeEnrollment?.id)
    ).length;
    const pendingCount = total - submittedCount;
    const gradedCount = tasks.filter(t => 
      submissions.some(s => s.tarea_id === t.id && s.matricula_id === activeEnrollment?.id && s.calificacion_letra)
    ).length;

    return [
      { id: 'todos', label: 'Todas las Tareas', count: total },
      { id: 'pendientes', label: '⏳ Pendientes', count: pendingCount },
      { id: 'entregadas', label: '✅ Entregadas', count: submittedCount },
      { id: 'calificadas', label: '⭐ Calificadas', count: gradedCount },
    ];
  }, [tasks, submissions, activeEnrollment?.id]);

  // Filtered dataset
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const sub = submissions.find(
        s => s.tarea_id === task.id && s.matricula_id === activeEnrollment?.id
      );
      if (activeFilter === 'todos') return true;
      if (activeFilter === 'pendientes') return !sub;
      if (activeFilter === 'entregadas') return !!sub;
      if (activeFilter === 'calificadas') return !!sub?.calificacion_letra;
      return true;
    });
  }, [tasks, submissions, activeEnrollment?.id, activeFilter]);

  const columns: Column<TaskAssignment>[] = [
    {
      header: 'Tarea / Actividad',
      cell: (task) => {
        const submission = submissions.find(
          s => s.tarea_id === task.id && s.matricula_id === activeEnrollment?.id
        );
        return (
          <div className="space-y-1 max-w-sm">
            <p className="font-extrabold text-slate-800 dark:text-white text-xs leading-snug">
              {task.titulo}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
              {task.descripcion}
            </p>
            {submission?.archivo_nombre && (
              <div className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                <FileCheck className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{submission.archivo_nombre}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Materia',
      cell: (task) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-xs font-bold">
          {task.curso?.nombre || 'Curso'}
        </span>
      ),
    },
    {
      header: 'Fecha Límite',
      cell: (task) => (
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            {new Date(task.fecha_limite).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      header: 'Estado & Nota',
      cell: (task) => {
        const submission = submissions.find(
          s => s.tarea_id === task.id && s.matricula_id === activeEnrollment?.id
        );
        if (!submission) {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
              <Clock className="w-3 h-3" />
              Pendiente
            </span>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              Entregado
            </span>
            {submission.calificacion_letra && (
              <GradeBadge grade={submission.calificacion_letra} size="sm" />
            )}
          </div>
        );
      },
    },
    {
      header: 'Acciones',
      cell: (task) => {
        const submission = submissions.find(
          s => s.tarea_id === task.id && s.matricula_id === activeEnrollment?.id
        );
        return (
          <div>
            {!submission ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedTaskToSubmit(task);
                  setAttachedFile(null);
                  setComment('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Entregar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedTaskToSubmit(task);
                  setComment(submission.comentario_estudiante || '');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                Ver Entrega
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 pb-12">
      <PageHeader
        title="Mis Tareas Escolares"
        description="Consulta las asignaciones de tus cursos, revisa fechas límite y entrega tus trabajos escolares."
        badge={`${tasks.length} Tareas Asignadas`}
      />

      <DataTable
        title="Listado de Tareas Escolares"
        data={filteredTasks}
        columns={columns}
        filterChips={filterChips}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchPlaceholder="Buscar tarea por título, materia o descripción..."
        itemsPerPage={10}
        searchFilter={(task, q) =>
          `${task.titulo} ${task.descripcion} ${task.curso?.nombre}`.toLowerCase().includes(q)
        }
        gridItemRender={(task) => {
          const submission = submissions.find(
            s => s.tarea_id === task.id && s.matricula_id === activeEnrollment?.id
          );
          const isSubmitted = !!submission;

          return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                    {task.curso?.nombre}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1" suppressHydrationWarning>
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {new Date(task.fecha_limite).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                  {task.titulo}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {task.descripcion}
                </p>

                {isSubmitted && submission.archivo_nombre && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold">
                    <FileCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="truncate max-w-xs">{submission.archivo_nombre}</span>
                  </div>
                )}

                {submission?.retroalimentacion_docente && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-200">
                    <strong>Profesor:</strong> &quot;{submission.retroalimentacion_docente}&quot;
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 mt-4">
                {isSubmitted ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Entregado
                    </span>
                    {submission.calificacion_letra && (
                      <GradeBadge grade={submission.calificacion_letra} size="sm" />
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    <Clock className="w-3 h-3" />
                    Pendiente
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTaskToSubmit(task);
                    setComment(submission?.comentario_estudiante || '');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    isSubmitted
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
                  }`}
                >
                  {isSubmitted ? (
                    <>
                      <FileCheck className="w-3.5 h-3.5" />
                      Ver Entrega
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Entregar
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        }}
      />

      {/* Submit Homework Modal */}
      {selectedTaskToSubmit && (
        <Modal
          isOpen={!!selectedTaskToSubmit}
          onClose={() => {
            setSelectedTaskToSubmit(null);
            setAttachedFile(null);
          }}
          title={`Entregar Tarea: ${selectedTaskToSubmit.titulo}`}
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-800 dark:text-white">{selectedTaskToSubmit.descripcion}</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Comentarios / Mensaje para el Profesor:
              </label>
              <textarea
                rows={3}
                placeholder="Escribe aquí tu respuesta, dudas o enlace adicional..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Hidden real file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.ppt,.pptx"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* File Upload Trigger / Dropzone */}
            {!attachedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all group"
              >
                <Paperclip className="w-7 h-7 text-slate-400 group-hover:text-blue-500 mx-auto mb-1.5 transition-colors" />
                <p className="font-extrabold text-slate-700 dark:text-slate-200 text-xs">
                  Haz clic para adjuntar archivo (PDF, Word, Imagen)
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Formatos admitidos: .pdf, .docx, .png, .jpg · Máx. 25 MB
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                      {attachedFile.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {attachedFile.size} · Listo para enviar
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-500 transition-colors"
                    title="Eliminar archivo adjunto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedTaskToSubmit(null);
                  setAttachedFile(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirmar Entrega
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
