'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { GradeLetter, Student, Course } from '@/types';
import { 
  FileCheck, 
  X, 
  Award, 
  GraduationCap, 
  Calendar, 
  User, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { GradeSelector } from './GradeSelector';

interface SubsanacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student;
  course?: Course;
  matriculaId?: string;
}

export default function SubsanacionModal({
  isOpen,
  onClose,
  student,
  course,
  matriculaId,
}: SubsanacionModalProps) {
  const { 
    students, 
    courses, 
    enrollments, 
    teachers, 
    currentUser, 
    registerSubsanacion,
    showToast 
  } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState(student?.id || '');
  const [selectedCourseId, setSelectedCourseId] = useState(course?.id || '');
  const [notaOriginal, setNotaOriginal] = useState<GradeLetter>('C');
  const [notaSubsanacion, setNotaSubsanacion] = useState<GradeLetter>('A');
  const [docenteEvaluadorId, setDocenteEvaluadorId] = useState(currentUser.id || '');
  const [fechaEvaluacion, setFechaEvaluacion] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');

  if (!isOpen) return null;

  const currentEnrollment = enrollments.find(e => 
    e.estudiante_id === (selectedStudentId || student?.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedCourseId || !currentEnrollment) {
      showToast('Seleccione estudiante, curso y matrícula válida', 'error');
      return;
    }

    registerSubsanacion({
      matricula_id: currentEnrollment.id,
      estudiante_id: selectedStudentId,
      curso_id: selectedCourseId,
      periodo_id: 'period-2026',
      nota_original: notaOriginal,
      nota_subsanacion: notaSubsanacion,
      fecha_evaluacion: fechaEvaluacion,
      docente_evaluador_id: docenteEvaluadorId,
      observaciones: observaciones.trim() || undefined,
      estado: (notaSubsanacion === 'AD' || notaSubsanacion === 'A' || notaSubsanacion === 'B') ? 'aprobado' : 'desaprobado',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Acta de Subsanación Pedagógica
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Programa de Recuperación Académica CNEB - MINEDU
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Estudiante Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Estudiante *
            </label>
            <select
              required
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Seleccionar Estudiante --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.apellidos}, {s.nombres} ({s.codigo_estudiante || s.dni})
                </option>
              ))}
            </select>
          </div>

          {/* Asignatura Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Área Curricular / Asignatura *
            </label>
            <select
              required
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Seleccionar Asignatura --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.codigo || c.nivel.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Calificaciones: Original vs Subsanación */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                Calificación Anterior
              </label>
              <div className="flex items-center gap-2">
                {(['C', 'B'] as GradeLetter[]).map(grade => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setNotaOriginal(grade)}
                    className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center transition-all ${
                      notaOriginal === grade
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                Nota de Subsanación *
              </label>
              <div className="flex items-center gap-1.5">
                {(['AD', 'A', 'B', 'C'] as GradeLetter[]).map(grade => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setNotaSubsanacion(grade)}
                    className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center transition-all ${
                      notaSubsanacion === grade
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-500/30'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Fecha Evaluación *
              </label>
              <input
                type="date"
                required
                value={fechaEvaluacion}
                onChange={(e) => setFechaEvaluacion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Docente Evaluador
              </label>
              <select
                value={docenteEvaluadorId}
                onChange={(e) => setDocenteEvaluadorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {teachers.filter(t => t.rol === 'docente' || t.rol === 'admin').map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombres} {t.apellidos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Observaciones Pedagógicas
            </label>
            <textarea
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej. Estudiante sustentó portafolio de evidencias y rindió evaluación escrita satisfactoriamente..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Registrar Acta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
