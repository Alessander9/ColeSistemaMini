'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { TaskAssignment } from '@/types';
import { Clock, BookOpen, CheckCircle2, Upload, Paperclip, AlertCircle, FileText, X, FileCheck, Download } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EstudianteTareasPage() {
  const { tasks, submissions, submitTask, enrollments, currentUser, students, showToast } = useApp();
  
  const activeStudent = students.find(s => s.profile_id === currentUser.id) || students[0];
  const activeEnrollment = enrollments.find(e => e.estudiante_id === activeStudent.id) || enrollments[0];

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 pb-12">
      <PageHeader
        title="Mis Tareas Escolares"
        description="Consulta las asignaciones de tus cursos, revisa fechas límite y entrega tus trabajos escolares."
        badge={`${tasks.length} Tareas Asignadas`}
      />

      <div className="space-y-4">
        {tasks.map((task) => {
          const submission = submissions.find(
            s => s.tarea_id === task.id && s.matricula_id === activeEnrollment?.id
          );
          const isSubmitted = !!submission;

          return (
            <div
              key={task.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                    {task.curso?.nombre}
                  </span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1" suppressHydrationWarning>
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Límite: {new Date(task.fecha_limite).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {task.titulo}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {task.descripcion}
                </p>

                {/* Delivered File and Comment preview */}
                {isSubmitted && (
                  <div className="space-y-1.5 pt-1">
                    {submission.archivo_nombre && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold">
                        <FileCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="truncate max-w-xs">{submission.archivo_nombre}</span>
                        {submission.archivo_tamano && (
                          <span className="text-[10px] text-slate-400">({submission.archivo_tamano})</span>
                        )}
                      </div>
                    )}
                    {submission.comentario_estudiante && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                        &quot;{submission.comentario_estudiante}&quot;
                      </p>
                    )}
                  </div>
                )}

                {submission?.retroalimentacion_docente && (
                  <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
                    <strong>Comentario del Profesor:</strong> &quot;{submission.retroalimentacion_docente}&quot;
                  </div>
                )}
              </div>

              {/* Status & Submission Button */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                {isSubmitted ? (
                  <div className="text-right space-y-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Entregado
                    </span>
                    {submission.calificacion_letra && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-[10px] text-slate-400 font-bold">Nota:</span>
                        <GradeBadge grade={submission.calificacion_letra} size="sm" />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTaskToSubmit(task);
                      setAttachedFile(null);
                      setComment('');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Entregar Tarea
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-100 rounded-lg"
                  >
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Quitar archivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedTaskToSubmit(null);
                  setAttachedFile(null);
                }}
                className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition-all active:scale-95 cursor-pointer"
              >
                Enviar Entrega
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
