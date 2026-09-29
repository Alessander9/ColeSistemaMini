'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { GradeMatrixTable } from '@/components/notas/GradeMatrixTable';
import { Award, BookOpen, FileDown, Layers, Lock } from 'lucide-react';
import { useAulaColors } from '@/hooks/useAulaColors';
import { generateRegistroAuxiliarPdf } from '@/lib/pdf/registroAuxiliarPdfGenerator';

// Permite abrir la página ya elegida: /docente/notas?aula=ID&curso=ID&periodo=ID (desde Evaluaciones)
const urlParam = (key: string) => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(key) || '' : '');

export default function DocenteNotasPage() {
  const { evaluationPeriods, currentUser, getTeacherSections, students, enrollments, brandingConfig } = useApp();
  const aulaColor = useAulaColors();

  // Solo las aulas y cursos asignados a este docente
  const teacherSections = useMemo(
    () => (currentUser?.id ? getTeacherSections(currentUser.id) || [] : []),
    [getTeacherSections, currentUser]
  );
  const availableSections = useMemo(() => teacherSections.map(ts => ts.seccion), [teacherSections]);

  const [selectedSectionId, setSelectedSectionId] = useState<string>(() => urlParam('aula') || availableSections[0]?.id || '');
  useEffect(() => {
    if (!availableSections.some(s => s.id === selectedSectionId) && availableSections[0]) {
      setSelectedSectionId(availableSections[0].id);
    }
  }, [availableSections, selectedSectionId]);

  // Por defecto se abre el bimestre en curso (el primero que no está cerrado)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    () => (evaluationPeriods.find(p => p.id === urlParam('periodo')) || evaluationPeriods.find(p => p.activo && !p.cerrado) || evaluationPeriods.find(p => !p.cerrado) || evaluationPeriods[0])?.id || ''
  );

  const availableCourses = useMemo(
    () => teacherSections.find(ts => ts.seccion.id === selectedSectionId)?.cursos || [],
    [teacherSections, selectedSectionId]
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => urlParam('curso') || availableCourses[0]?.id || '');
  useEffect(() => {
    if (availableCourses.length > 0 && !availableCourses.some(c => c.id === selectedCourseId)) {
      setSelectedCourseId(availableCourses[0].id);
    }
  }, [availableCourses, selectedCourseId]);

  const activeSection = availableSections.find(s => s.id === selectedSectionId) || availableSections[0];
  const activeCourse = availableCourses.find(c => c.id === selectedCourseId) || availableCourses[0];
  const activePeriod = evaluationPeriods.find(p => p.id === selectedPeriodId) || evaluationPeriods[0];

  const studentsIn = (secId: string) => enrollments.filter(e => e.seccion_id === secId && e.estado === 'activo').length;

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

  const stepTitle = (n: number, icon: React.ReactNode, text: string) => (
    <p className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100 mb-2">
      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">{n}</span>
      {icon} {text}
    </p>
  );

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in-50 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" /> Notas de mis alumnos
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Elige el aula, el curso y el bimestre. Luego toca un casillero para poner la nota.</p>
        </div>
        {activeSection && (
          <button
            type="button"
            onClick={handleDownloadRegistroAuxiliar}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 text-slate-800 dark:text-slate-100 text-sm font-bold cursor-pointer shrink-0"
            title="Descarga una hoja para anotar las notas a mano"
          >
            <FileDown className="w-5 h-5 text-emerald-600" /> Hoja para anotar a mano (PDF)
          </button>
        )}
      </div>

      {availableSections.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-black text-slate-900 dark:text-white text-lg">Aún no tienes aulas asignadas</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">Coordinación todavía no te asignó cursos. Comunícate con la dirección académica.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {/* Paso 1: aula */}
          <div>
            {stepTitle(1, <Layers className="w-4 h-4 text-indigo-500" />, 'Elige el aula')}
            <div className="flex flex-wrap gap-2">
              {availableSections.map(sec => {
                const active = selectedSectionId === sec.id;
                const c = aulaColor(sec.id);
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setSelectedSectionId(sec.id)}
                    aria-pressed={active}
                    className={`text-left px-4 py-2.5 rounded-2xl border-2 transition-colors cursor-pointer ${
                      active
                        ? `${c.solid} shadow-md`
                        : `bg-white dark:bg-slate-800 ${c.border} text-slate-800 dark:text-slate-100 ${c.hover}`
                    }`}
                  >
                    <span className="flex items-center gap-2 text-base font-black">{!active && <span className={`w-3 h-3 rounded-full ${c.dot}`} />}{sec.grado?.nombre} &quot;{sec.letra}&quot;</span>
                    <span className={`block text-xs font-semibold ${active ? c.solidSub : 'text-slate-500 dark:text-slate-400'}`}>
                      {sec.grado?.nivel} · {studentsIn(sec.id)} {studentsIn(sec.id) === 1 ? 'alumno' : 'alumnos'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Paso 2: curso */}
            <div>
              {stepTitle(2, <BookOpen className="w-4 h-4 text-blue-500" />, 'Elige el curso')}
              {availableCourses.length === 0 ? (
                <p className="text-sm text-amber-600 font-semibold">No dictas cursos en esta aula.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableCourses.map(course => {
                    const active = selectedCourseId === course.id;
                    return (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => setSelectedCourseId(course.id)}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-sm font-black transition-colors cursor-pointer ${
                          active
                            ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-md'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-slate-500'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color_hex || '#3b82f6' }} />
                        {course.nombre}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Paso 3: bimestre */}
            <div>
              {stepTitle(3, <Award className="w-4 h-4 text-amber-500" />, 'Elige el bimestre')}
              <div className="flex flex-wrap gap-2">
                {evaluationPeriods.map(period => {
                  const active = selectedPeriodId === period.id;
                  return (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => setSelectedPeriodId(period.id)}
                      aria-pressed={active}
                      className={`inline-flex flex-col items-start px-4 py-2 rounded-2xl border-2 transition-colors cursor-pointer ${
                        active
                          ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-amber-500'
                      }`}
                    >
                      <span className="text-sm font-black">{period.nombre}</span>
                      <span className={`text-[11px] font-semibold flex items-center gap-1 ${active ? 'text-amber-50' : period.cerrado ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {period.cerrado ? <><Lock className="w-3 h-3" /> Cerrado</> : '● Abierto'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeCourse && activePeriod && activeSection ? (
        <GradeMatrixTable course={activeCourse} evaluationPeriod={activePeriod} section={activeSection} />
      ) : availableSections.length > 0 ? (
        <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
          Elige un aula y un curso para ver la lista de alumnos.
        </div>
      ) : null}
    </div>
  );
}
