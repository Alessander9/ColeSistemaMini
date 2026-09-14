'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { GradeMatrixTable } from '@/components/notas/GradeMatrixTable';
import { MOCK_SECTIONS } from '@/lib/mock-data';
import { Award, BookOpen, Layers } from 'lucide-react';

export default function DocenteNotasPage() {
  const { courses, evaluationPeriods, sections, currentUser, getTeacherSections } = useApp();
  const teacherSections = getTeacherSections(currentUser.id);

  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || 'course-mat');
  const [selectedPeriodId, setSelectedPeriodId] = useState(evaluationPeriods[0]?.id || 'eval-bim-1');
  const [selectedSectionId, setSelectedSectionId] = useState(
    teacherSections[0]?.seccion.id || sections[0]?.id || 'sec-pri-3a'
  );

  const activeCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const activePeriod = evaluationPeriods.find(p => p.id === selectedPeriodId) || evaluationPeriods[0];
  const activeSection = sections.find(s => s.id === selectedSectionId) || sections[0];

  const availableSections = teacherSections.length > 0
    ? teacherSections.map(ts => ts.seccion)
    : sections;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50">
      <PageHeader
        title="Registro de Calificaciones (AD – A – B – C)"
        description="Ingresa y modifica las notas por competencias. El cálculo de promedios se realiza en tiempo real."
        badge={`${activeSection.grado?.nombre || ''} "${activeSection.letra}"`}
      />

      {/* Salón, Course & Period Selectors */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Selector de Salón */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Salón / Sección:
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {availableSections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSectionId(sec.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  selectedSectionId === sec.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {sec.grado?.nombre} &quot;{sec.letra}&quot; ({sec.grado?.nivel})
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-auto">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Curso:
              </label>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full scrollbar-thin">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
                      selectedCourseId === course.id
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {course.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Periodo / Bimestre:
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

      {/* Interactive Grade Matrix Component */}
      <GradeMatrixTable
        course={activeCourse}
        evaluationPeriod={activePeriod}
        section={activeSection}
      />
    </div>
  );
}
