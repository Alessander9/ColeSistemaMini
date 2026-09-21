'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { GradeMatrixTable } from '@/components/notas/GradeMatrixTable';
import { Award, BookOpen, Layers, Lock, ShieldCheck, AlertCircle, Sparkles, FileDown } from 'lucide-react';
import { generateRegistroAuxiliarPdf } from '@/lib/pdf/registroAuxiliarPdfGenerator';

export default function DocenteNotasPage() {
  const { courses, evaluationPeriods, sections, currentUser, getTeacherSections, students, enrollments, brandingConfig } = useApp();

  // Obtener salones y cursos asignados estrictamente a este docente
  const teacherSections = useMemo(() => {
    // Obtener secciones y cursos reales asignados al docente
    return currentUser?.id ? (getTeacherSections(currentUser.id) || []) : [];
  }, [getTeacherSections, currentUser]);

  const availableSections = useMemo(() => {
    return teacherSections.map(ts => ts.seccion);
  }, [teacherSections]);

  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    availableSections[0]?.id || ''
  );

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    evaluationPeriods[0]?.id || 'eval-bim-1'
  );

  // Cursos asignados para el salón seleccionado
  const currentAssignment = useMemo(() => {
    return teacherSections.find(ts => ts.seccion.id === selectedSectionId);
  }, [teacherSections, selectedSectionId]);

  const availableCourses = useMemo(() => {
    return currentAssignment?.cursos || [];
  }, [currentAssignment]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    availableCourses[0]?.id || courses[0]?.id || 'course-mat'
  );

  // Auto-ajustar el curso seleccionado si no pertenece a la nueva sección elegida
  useEffect(() => {
    if (availableCourses.length > 0) {
      const exists = availableCourses.some(c => c.id === selectedCourseId);
      if (!exists) {
        setSelectedCourseId(availableCourses[0].id);
      }
    }
  }, [availableCourses, selectedCourseId]);

  const activeSection = availableSections.find(s => s.id === selectedSectionId) || availableSections[0];
  const activeCourse = availableCourses.find(c => c.id === selectedCourseId) || availableCourses[0];
  const activePeriod = evaluationPeriods.find(p => p.id === selectedPeriodId) || evaluationPeriods[0];

  const handleDownloadRegistroAuxiliar = () => {
    if (!activeSection) return;
    const doc = generateRegistroAuxiliarPdf({
      section: activeSection,
      course: activeCourse,
      teacherName: currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : 'Docente',
      periodName: activePeriod?.nombre || 'I BIMESTRE',
      students,
      enrollments,
      brandingConfig,
    });
    doc.save(`Registro_Auxiliar_${activeSection.grado?.nombre || 'Grado'}_${activeSection.letra}_${activeCourse?.nombre || 'Curso'}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 pb-12">
      <PageHeader
        title="Registro de Calificaciones (AD – A – B – C)"
        description="Ingresa y modifica las notas de tus alumnos por competencias. Visualización restringida a tus salones y materias asignadas."
        badge={activeSection ? `${activeSection.grado?.nombre || ''} "${activeSection.letra}"` : 'Sin Asignación'}
      >
        <div className="flex items-center gap-2">
          {activeSection && (
            <button
              onClick={handleDownloadRegistroAuxiliar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer border border-slate-700 shadow-xs"
              title="Descargar plantilla PDF para toma de notas físicas"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>Registro Físico (PDF)</span>
            </button>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Acceso Docente</span>
          </div>
        </div>
      </PageHeader>

      {/* Selector de Salones y Cursos Asignados */}
      {availableSections.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            No tienes salones ni cursos asignados
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            El administrador aún no ha vinculado materias a tu perfil de docente. Comunícate con la dirección académica.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {/* Selector de Salón Asignado */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Tus Salones Asignados ({availableSections.length}):
              </label>
              <span className="text-[10px] font-semibold text-slate-400">
                Solo puedes calificar tus aulas designadas
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {availableSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    selectedSectionId === sec.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{sec.grado?.nombre} &quot;{sec.letra}&quot;</span>
                  <span className="text-[10px] opacity-75 font-normal">({sec.grado?.nivel})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
              {/* Selector de Curso Asignado en el Salón */}
              <div className="w-full sm:w-auto">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  Materia que Dictas en este Salón:
                </label>
                {availableCourses.length === 0 ? (
                  <span className="text-xs text-amber-500 font-semibold italic">
                    Sin cursos asignados en este salón
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full scrollbar-thin">
                    {availableCourses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
                          selectedCourseId === course.id
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: course.color_hex || '#3b82f6' }} />
                        {course.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selector de Bimestre */}
              <div className="w-full sm:w-auto">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Periodo / Bimestre de Evaluación:
                </label>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full scrollbar-thin">
                  {evaluationPeriods.map((period) => (
                    <button
                      key={period.id}
                      onClick={() => setSelectedPeriodId(period.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
                        selectedPeriodId === period.id
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {period.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matriz Interactiva de Notas */}
      {activeCourse && activePeriod && activeSection ? (
        <GradeMatrixTable
          course={activeCourse}
          evaluationPeriod={activePeriod}
          section={activeSection}
        />
      ) : (
        <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          Selecciona una sección y materia asignada para cargar el padrón de alumnos y la matriz de notas.
        </div>
      )}
    </div>
  );
}

