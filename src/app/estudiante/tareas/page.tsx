'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { TaskAssignment } from '@/types';
import { Clock, BookOpen, CheckCircle2, Upload, Paperclip, AlertCircle, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EstudianteTareasPage() {
  const { tasks, submissions, submitTask, enrollments, currentUser, students } = useApp();
  
  const activeStudent = students.find(s => s.profile_id === currentUser.id) || students[0];
  const activeEnrollment = enrollments.find(e => e.estudiante_id === activeStudent.id) || enrollments[0];

  const [selectedTaskToSubmit, setSelectedTaskToSubmit] = useState<TaskAssignment | null>(null);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskToSubmit) return;

    submitTask({
      tareaId: selectedTaskToSubmit.id,
      matriculaId: activeEnrollment?.id || 'enr-1',
      comentarioEstudiante: comment,
    });

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
    });

    setSelectedTaskToSubmit(null);
    setComment('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50">
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
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
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
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
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
                    onClick={() => setSelectedTaskToSubmit(task)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95"
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
          onClose={() => setSelectedTaskToSubmit(null)}
          title={`Entregar Tarea: ${selectedTaskToSubmit.titulo}`}
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-800 dark:text-white">{selectedTaskToSubmit.descripcion}</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Comentarios para el Profesor:
              </label>
              <textarea
                required
                rows={3}
                placeholder="Escribe aquí tu respuesta, dudas o enlace de tu documento..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center cursor-pointer hover:border-blue-400">
              <Paperclip className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <p className="font-bold text-slate-700 dark:text-slate-300">Adjuntar archivo (PDF, Foto o Word)</p>
              <p className="text-[10px] text-slate-400">Tamaño máximo 25 MB</p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedTaskToSubmit(null)}
                className="px-4 py-2 font-bold text-slate-600 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
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
