'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { GradeSelector } from '@/components/notas/GradeSelector';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { TaskAssignment, GradeLetter } from '@/types';
import { PlusCircle, BookOpen, Clock, Calendar, CheckCircle2, User, Award, Paperclip } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DocenteTareasPage() {
  const { tasks, addTask, submissions, gradeTask, courses, enrollments } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTaskForGrading, setSelectedTaskForGrading] = useState<TaskAssignment | null>(null);
  
  // Grade Form Modal
  const [gradingSubmission, setGradingSubmission] = useState<{
    tareaId: string;
    matriculaId: string;
    studentName: string;
    currentGrade?: GradeLetter;
    retroalimentacion?: string;
  } | null>(null);

  // New Task Form
  const [formData, setFormData] = useState({
    cursoId: courses[0]?.id || 'course-mat',
    seccionId: 'sec-3pri-a',
    titulo: '',
    descripcion: '',
    fechaLimite: '2026-09-20T23:59',
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.descripcion) return;

    addTask({
      cursoId: formData.cursoId,
      seccionId: formData.seccionId,
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      fechaLimite: new Date(formData.fechaLimite).toISOString(),
    });

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
    });

    setIsAddModalOpen(false);
    setFormData({
      cursoId: courses[0]?.id || 'course-mat',
      seccionId: 'sec-3pri-a',
      titulo: '',
      descripcion: '',
      fechaLimite: '2026-09-20T23:59',
    });
  };

  const handleSaveGrade = (grade: GradeLetter, retro?: string) => {
    if (!gradingSubmission) return;

    gradeTask({
      tareaId: gradingSubmission.tareaId,
      matriculaId: gradingSubmission.matriculaId,
      calificacionLetra: grade,
      retroalimentacion: retro,
    });

    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.8 },
    });

    setGradingSubmission(null);
  };

  const columns: Column<TaskAssignment>[] = [
    {
      header: 'Tarea / Asignación',
      cell: (task) => (
        <div>
          <p className="font-extrabold text-slate-800 dark:text-white text-xs">{task.titulo}</p>
          <p className="text-[11px] text-slate-500 line-clamp-1 max-w-md">{task.descripcion}</p>
        </div>
      ),
    },
    {
      header: 'Curso',
      cell: (task) => (
        <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
          {task.curso?.nombre}
        </span>
      ),
    },
    {
      header: 'Fecha Límite',
      cell: (task) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          {new Date(task.fecha_limite).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Entregas',
      cell: (task) => {
        const taskSubs = submissions.filter(s => s.tarea_id === task.id);
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
            {taskSubs.length} de {enrollments.length} entregas
          </span>
        );
      },
    },
    {
      header: 'Acciones',
      cell: (task) => (
        <button
          type="button"
          onClick={() => setSelectedTaskForGrading(task)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 transition-all border border-blue-200"
        >
          <Award className="w-3.5 h-3.5" />
          Revisar Entregas
        </button>
      ),
    },
  ];

  const [activeCourseFilter, setActiveCourseFilter] = useState('todos');

  const courseFilterChips = [
    { id: 'todos', label: 'Todas las Materias', count: tasks.length },
    ...courses.map(c => ({ id: c.id, label: c.nombre })),
  ];

  const filteredTasks = React.useMemo(() => {
    if (activeCourseFilter === 'todos') return tasks;
    return tasks.filter(t => t.curso_id === activeCourseFilter);
  }, [tasks, activeCourseFilter]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50">
      <PageHeader
        title="Gestión de Tareas Escolares"
        description="Publica asignaciones para tus secciones, recibe entregas y califica con retroalimentación cualitativa."
        badge={`${tasks.length} Tareas`}
      >
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Crear Nueva Tarea
        </button>
      </PageHeader>

      <DataTable
        data={filteredTasks}
        columns={columns}
        itemsPerPage={10}
        searchPlaceholder="Buscar tarea por título o descripción..."
        filterChips={courseFilterChips}
        activeFilter={activeCourseFilter}
        onFilterChange={setActiveCourseFilter}
        searchFilter={(t, q) => `${t.titulo} ${t.descripcion} ${t.curso?.nombre}`.toLowerCase().includes(q)}
        gridItemRender={(task) => {
          const taskSubs = submissions.filter(s => s.tarea_id === task.id);
          return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <span className="font-extrabold text-xs px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {task.curso?.nombre}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {new Date(task.fecha_limite).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug mb-1.5 line-clamp-2">
                  {task.titulo}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {task.descripcion}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {taskSubs.length} entregas
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTaskForGrading(task)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 transition-all border border-blue-200/80 dark:border-blue-800"
                >
                  <Award className="w-3.5 h-3.5" />
                  Revisar
                </button>
              </div>
            </div>
          );
        }}
      />

      {/* Modal: New Task Form */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Publicar Nueva Tarea Escolar"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Título de la Tarea *</label>
            <input
              required
              type="text"
              placeholder="Ej. Guía de Fracciones y Números Mixtos"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Curso *</label>
              <select
                value={formData.cursoId}
                onChange={(e) => setFormData({ ...formData, cursoId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha y Hora Límite *</label>
              <input
                required
                type="datetime-local"
                value={formData.fechaLimite}
                onChange={(e) => setFormData({ ...formData, fechaLimite: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Instrucciones y Descripción *</label>
            <textarea
              required
              rows={4}
              placeholder="Describe detalladamente los ejercicios o actividades que deben presentar los alumnos..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition-all active:scale-95"
            >
              Publicar Tarea
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Submissions & Grade */}
      {selectedTaskForGrading && (
        <Modal
          isOpen={!!selectedTaskForGrading}
          onClose={() => setSelectedTaskForGrading(null)}
          title={`Entregas: ${selectedTaskForGrading.titulo}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-xs">
              <p className="font-bold text-blue-900 dark:text-blue-200">{selectedTaskForGrading.descripcion}</p>
              <p className="text-slate-500 mt-1">Límite: {new Date(selectedTaskForGrading.fecha_limite).toLocaleString('es-PE')}</p>
            </div>

            <div className="space-y-2.5">
              {enrollments.map((enr) => {
                const sub = submissions.find(
                  s => s.tarea_id === selectedTaskForGrading.id && s.matricula_id === enr.id
                );
                const studentName = `${enr.estudiante?.profile?.apellidos}, ${enr.estudiante?.profile?.nombres}`;

                return (
                  <div
                    key={enr.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={enr.estudiante?.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={studentName}
                        className="w-8 h-8 rounded-xl object-cover"
                      />
                      <div>
                        <p className="font-extrabold text-slate-800 dark:text-white">{studentName}</p>
                        <p className="text-[10px] text-slate-400">
                          {sub ? `Entregado el ${new Date(sub.fecha_entrega).toLocaleDateString('es-PE')}` : 'Sin entrega aún'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {sub?.calificacion_letra ? (
                        <GradeBadge grade={sub.calificacion_letra} size="sm" />
                      ) : (
                        <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                          Pendiente
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setGradingSubmission({
                            tareaId: selectedTaskForGrading.id,
                            matriculaId: enr.id,
                            studentName,
                            currentGrade: sub?.calificacion_letra,
                            retroalimentacion: sub?.retroalimentacion_docente,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 text-[11px] transition-all"
                      >
                        Calificar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Grade Submission Dialog */}
      {gradingSubmission && (
        <Modal
          isOpen={!!gradingSubmission}
          onClose={() => setGradingSubmission(null)}
          title={`Calificar Tarea: ${gradingSubmission.studentName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 text-center">
                Calificación (AD, A, B, C):
              </label>
              <div className="flex justify-center">
                <GradeSelector
                  value={gradingSubmission.currentGrade}
                  onChange={(grade) => handleSaveGrade(grade, gradingSubmission.retroalimentacion)}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Retroalimentación Docente:
              </label>
              <textarea
                rows={3}
                placeholder="Observaciones o recomendaciones para el estudiante..."
                value={gradingSubmission.retroalimentacion || ''}
                onChange={(e) =>
                  setGradingSubmission({
                    ...gradingSubmission,
                    retroalimentacion: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="px-4 py-2 font-bold text-slate-600 rounded-xl"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSaveGrade(
                    gradingSubmission.currentGrade || 'A',
                    gradingSubmission.retroalimentacion
                  )
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
              >
                Guardar Calificación
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
