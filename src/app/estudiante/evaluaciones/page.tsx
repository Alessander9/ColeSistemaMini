'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column, FilterChip } from '@/components/ui/DataTable';
import { EvaluationExam } from '@/types';
import { Calendar, Clock, BookOpen, AlertCircle, Sparkles, Layers, Award } from 'lucide-react';

export default function EstudianteEvaluacionesPage() {
  const { exams, currentUser, students, enrollments } = useApp();
  const [activeFilter, setActiveFilter] = useState<string>('todos');

  // Encontrar el estudiante y su sección asignada
  const currentStudent = useMemo(() => {
    return students.find(s => s.profile_id === currentUser?.id || s.id === currentUser?.id);
  }, [students, currentUser]);

  const currentEnrollment = useMemo(() => {
    return enrollments.find(e => e.estudiante_id === currentStudent?.id);
  }, [enrollments, currentStudent]);

  const relevantExams = useMemo(() => {
    if (!currentEnrollment?.seccion_id) return exams;
    return exams.filter(e => !e.seccion_id || e.seccion_id === currentEnrollment.seccion_id);
  }, [exams, currentEnrollment]);

  // Filter chips with dynamic counters
  const filterChips: FilterChip[] = useMemo(() => [
    { id: 'todos', label: 'Todas las Evaluaciones', count: relevantExams.length },
    { id: 'examen', label: '📝 Exámenes Mensuales', count: relevantExams.filter(e => e.tipo === 'examen').length },
    { id: 'practica', label: '📋 Prácticas Calificadas', count: relevantExams.filter(e => e.tipo === 'practica').length },
    { id: 'proyecto', label: '🏆 Proyectos & Rúbricas', count: relevantExams.filter(e => e.tipo === 'proyecto').length },
  ], [relevantExams]);

  // Filtered exams dataset
  const filteredExams = useMemo(() => {
    if (activeFilter === 'todos') return relevantExams;
    return relevantExams.filter(e => e.tipo === activeFilter);
  }, [relevantExams, activeFilter]);

  const columns: Column<EvaluationExam>[] = [
    {
      header: 'Evaluación',
      cell: (exam) => (
        <div className="space-y-0.5">
          <p className="font-extrabold text-slate-800 dark:text-white text-xs">
            {exam.titulo}
          </p>
          <p className="text-[11px] text-slate-400">
            {exam.competencia?.descripcion || 'Evaluación de competencias curriculares'}
          </p>
        </div>
      ),
    },
    {
      header: 'Materia / Curso',
      cell: (exam) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-xs font-bold">
          {exam.curso?.nombre}
        </span>
      ),
    },
    {
      header: 'Tipo',
      cell: (exam) => (
        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          {exam.tipo.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Fecha & Hora',
      cell: (exam) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          {exam.fecha_programada} ({exam.hora_inicio || '08:00 AM'})
        </span>
      ),
    },
    {
      header: 'Duración',
      cell: (exam) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {exam.duracion_minutos} min
        </span>
      ),
    },
    {
      header: 'Estado',
      cell: () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Clock className="w-3 h-3" />
          Programado
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 pb-12">
      <PageHeader
        title="Mis Próximas Evaluaciones"
        description="Consulta las fechas de exámenes bimestrales, prácticas calificadas y competencias a evaluar."
        badge={`${exams.length} Programadas`}
      />

      <DataTable
        title="Cronograma de Evaluaciones Escolares"
        data={filteredExams}
        columns={columns}
        filterChips={filterChips}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchPlaceholder="Buscar evaluación por título, curso o competencia..."
        itemsPerPage={10}
        searchFilter={(exam, q) =>
          `${exam.titulo} ${exam.curso?.nombre} ${exam.tipo} ${exam.competencia?.descripcion || ''}`
            .toLowerCase()
            .includes(q)
        }
        gridItemRender={(exam) => (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                  {exam.curso?.nombre}
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {exam.tipo.toUpperCase()}
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                {exam.titulo}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2">
                Competencia: {exam.competencia?.descripcion || 'Resolución de problemas y pensamiento crítico'}
              </p>

              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Fecha:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    {exam.fecha_programada}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Hora de Inicio:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {exam.hora_inicio || '08:00 AM'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Duración:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {exam.duracion_minutos} minutos
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Clock className="w-3 h-3" />
                Programado
              </span>
              <span className="text-[11px] font-bold text-slate-400">Ponderación Oficial</span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
