'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { EvaluationExam } from '@/types';
import { Calendar, PlusCircle, Clock, BookOpen, Layers, CheckCircle2, FileText, Award, Timer } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import confetti from 'canvas-confetti';

export default function DocenteEvaluacionesPage() {
  const { exams, addExam, courses, evaluationPeriods } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    cursoId: courses[0]?.id || 'course-mat',
    seccionId: 'sec-3pri-a',
    periodoEvaluacionId: evaluationPeriods[1]?.id || 'eval-bim-2',
    competenciaId: 'comp-mat-1',
    titulo: '',
    tipo: 'examen' as 'examen' | 'practica' | 'proyecto',
    fechaProgramada: '2026-09-24',
    horaInicio: '08:00',
    duracionMinutos: 60,
  });

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo) return;

    addExam({
      cursoId: formData.cursoId,
      seccionId: formData.seccionId,
      periodoEvaluacionId: formData.periodoEvaluacionId,
      competenciaId: formData.competenciaId,
      titulo: formData.titulo,
      tipo: formData.tipo,
      fechaProgramada: formData.fechaProgramada,
      horaInicio: formData.horaInicio,
      duracionMinutos: Number(formData.duracionMinutos),
    });

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
    });

    setIsAddModalOpen(false);
    setFormData({
      ...formData,
      titulo: '',
    });
  };

  const columns: Column<EvaluationExam>[] = [
    {
      header: 'Evaluación',
      cell: (exam) => (
        <div>
          <p className="font-extrabold text-slate-800 dark:text-white text-xs">{exam.titulo}</p>
          <span className="text-[10px] uppercase font-bold text-slate-400">
            {exam.tipo.toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      header: 'Curso',
      cell: (exam) => (
        <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
          {exam.curso?.nombre}
        </span>
      ),
    },
    {
      header: 'Fecha Programada',
      cell: (exam) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          {exam.fecha_programada} ({exam.hora_inicio || '08:00'})
        </span>
      ),
    },
    {
      header: 'Duración',
      cell: (exam) => (
        <span className="text-xs text-slate-500 font-medium">
          {exam.duracion_minutos} minutos
        </span>
      ),
    },
    {
      header: 'Estado',
      cell: () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3 h-3" />
          Programado
        </span>
      ),
    },
  ];

  const [activeTypeFilter, setActiveTypeFilter] = useState('todos');

  const typeFilterChips = [
    { id: 'todos', label: 'Todas las Evaluaciones', count: exams.length },
    { id: 'examen', label: 'Exámenes Mensuales' },
    { id: 'practica', label: 'Prácticas Calificadas' },
    { id: 'proyecto', label: 'Proyectos & Rúbricas' },
  ];

  const filteredExams = React.useMemo(() => {
    if (activeTypeFilter === 'todos') return exams;
    return exams.filter(e => e.tipo === activeTypeFilter);
  }, [exams, activeTypeFilter]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50">
      <PageHeader
        title="Cronograma de Evaluaciones y Exámenes"
        description="Programa exámenes bimestrales, prácticas calificadas y rúbricas por competencia."
        badge={`${exams.length} Evaluaciones`}
      >
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Programar Examen / Práctica
        </button>
      </PageHeader>

      <DataTable
        data={filteredExams}
        columns={columns}
        itemsPerPage={10}
        searchPlaceholder="Buscar por título o curso..."
        filterChips={typeFilterChips}
        activeFilter={activeTypeFilter}
        onFilterChange={setActiveTypeFilter}
        searchFilter={(ex, q) => `${ex.titulo} ${ex.curso?.nombre} ${ex.tipo}`.toLowerCase().includes(q)}
        gridItemRender={(exam) => (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <span className="font-extrabold text-xs px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {exam.curso?.nombre}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {exam.tipo.toUpperCase()}
                </span>
              </div>

              <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug mb-3">
                {exam.titulo}
              </h4>

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

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Clock className="w-3 h-3" />
                Programado
              </span>
              <span className="text-[11px] font-bold text-slate-400">Ponderación 100%</span>
            </div>
          </div>
        )}
      />

      {/* Modal: New Exam Form */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Programar Nueva Evaluación Escolar"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                Título de la Evaluación *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  required
                  type="text"
                  placeholder="Ej. Examen Mensual de Álgebra"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-500" />
                Tipo de Evaluación *
              </label>
              <SearchableSelect
                value={formData.tipo}
                onChange={(val) => setFormData({ ...formData, tipo: val as 'examen' | 'practica' | 'proyecto' })}
                icon={<Award className="w-4 h-4" />}
                options={[
                  { value: 'examen', label: 'Examen Mensual / Bimestral', sublabel: 'Evaluación Sumativa' },
                  { value: 'practica', label: 'Práctica Calificada', sublabel: 'Evaluación Formativa' },
                  { value: 'proyecto', label: 'Proyecto / Exposición', sublabel: 'Rúbrica de Desempeño' },
                ]}
                placeholder="Buscar tipo..."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                Curso o Materia *
              </label>
              <SearchableSelect
                value={formData.cursoId}
                onChange={(val) => {
                  const firstComp = courses.find(c => c.id === val)?.competencias?.[0]?.id || 'comp-mat-1';
                  setFormData({ ...formData, cursoId: val, competenciaId: firstComp });
                }}
                icon={<BookOpen className="w-4 h-4" />}
                options={courses.map((c) => ({
                  value: c.id,
                  label: c.nombre,
                  sublabel: `Código: ${c.codigo}`,
                }))}
                placeholder="Buscar materia..."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Competencia a Evaluar *
              </label>
              <SearchableSelect
                value={formData.competenciaId}
                onChange={(val) => setFormData({ ...formData, competenciaId: val })}
                icon={<Layers className="w-4 h-4" />}
                options={(courses.find(c => c.id === formData.cursoId)?.competencias || []).map((comp) => ({
                  value: comp.id,
                  label: comp.codigo,
                  sublabel: comp.descripcion,
                }))}
                placeholder="Buscar competencia..."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Bimestre / Periodo *
              </label>
              <SearchableSelect
                value={formData.periodoEvaluacionId}
                onChange={(val) => setFormData({ ...formData, periodoEvaluacionId: val })}
                icon={<Calendar className="w-4 h-4" />}
                options={evaluationPeriods.map((p) => ({
                  value: p.id,
                  label: p.nombre,
                  sublabel: `Periodo ${p.numero_periodo}`,
                }))}
                placeholder="Buscar periodo..."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Fecha Programada *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  required
                  type="date"
                  value={formData.fechaProgramada}
                  onChange={(e) => setFormData({ ...formData, fechaProgramada: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Hora de Inicio
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-blue-500" />
                Duración (minutos)
              </label>
              <div className="relative">
                <Timer className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min={10}
                  max={240}
                  value={formData.duracionMinutos}
                  onChange={(e) => setFormData({ ...formData, duracionMinutos: Number(e.target.value) })}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition-all active:scale-95"
            >
              Guardar y Notificar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
