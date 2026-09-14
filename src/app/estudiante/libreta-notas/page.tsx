'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { AnnualReportCardView } from '@/components/notas/AnnualReportCardView';
import { calculateAverage, calculateAnnualStatus, calculateStudentAnnualReportCard } from '@/lib/grades/calculations';
import { Printer, FileText, Layers, Award, Sparkles, CheckCircle } from 'lucide-react';
import { MOCK_USERS } from '@/lib/mock-data';

export default function EstudianteLibretaNotasPage() {
  const { students, enrollments, courses, grades, evaluationPeriods, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'anual' | 'bimestral'>('anual');

  const activeStudent = students.find(s => s.profile_id === currentUser.id) || students[0];
  const studentProfile = activeStudent?.profile || MOCK_USERS.find(u => u.id === activeStudent?.profile_id) || currentUser;
  const activeEnrollment = enrollments.find(e => e.estudiante_id === activeStudent?.id) || enrollments[0];

  const studentGradesAll = useMemo(() => {
    return grades.filter(g => g.matricula_id === activeEnrollment?.id).map(g => g.nota_letra);
  }, [grades, activeEnrollment?.id]);

  const { averageLetter, averageScore } = useMemo(() => {
    return calculateAverage(studentGradesAll);
  }, [studentGradesAll]);

  // Consolidado Anual
  const annualReportCard = useMemo(() => {
    return calculateStudentAnnualReportCard({
      enrollmentId: activeEnrollment?.id || 'enr-1',
      studentId: activeStudent?.id || 'student-1',
      studentName: `${studentProfile?.apellidos || ''}, ${studentProfile?.nombres || ''}`,
      studentDni: studentProfile?.dni || '44556677',
      studentCode: activeStudent?.codigo_estudiante || 'EST-2026-001',
      gradeLevelName: activeEnrollment?.seccion?.grado?.nombre || '3° de Primaria',
      sectionLetter: activeEnrollment?.seccion?.letra || 'A',
      academicYear: 2026,
      tutorName: 'Lic. Carlos Alberto Mendoza Rojas',
      courses,
      grades,
      evaluationPeriodIds: evaluationPeriods.map(p => ({ id: p.id, numero_periodo: p.numero_periodo })),
      attendancePercentage: 98,
      conductGrade: 'AD',
    });
  }, [activeEnrollment, activeStudent, studentProfile, courses, grades, evaluationPeriods]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50">
      <PageHeader
        title="Libreta de Calificaciones Escolar"
        description="Boletín oficial y consolidado anual según el currículo nacional CNEB / SIAGIE."
        badge="Año Lectivo 2026"
      >
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Libreta
          </button>
        </div>
      </PageHeader>

      {/* Navigation Tabs (Hidden on Print) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit border border-slate-200 dark:border-slate-700 print:hidden">
        <button
          onClick={() => setActiveTab('anual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'anual'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Libreta Anual Consolidada (4 Bimestres)
        </button>
        <button
          onClick={() => setActiveTab('bimestral')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'bimestral'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Vista Bimestral por Competencias
        </button>
      </div>

      {/* TAB 1: LIBRETA ANUAL CONSOLIDADA */}
      {activeTab === 'anual' && (
        <AnnualReportCardView reportCard={annualReportCard} showPrintButton={false} />
      )}

      {/* TAB 2: VISTA BIMESTRAL POR COMPETENCIAS */}
      {activeTab === 'bimestral' && (
        <div className="space-y-6">
          {/* Student Info Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={studentProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={studentProfile?.nombres}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400"
              />
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {studentProfile?.apellidos}, {studentProfile?.nombres}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Código: <strong className="font-mono text-slate-700 dark:text-slate-300">{activeStudent?.codigo_estudiante}</strong> • DNI: {studentProfile?.dni || activeStudent?.id}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Grado: <strong className="text-slate-700 dark:text-slate-300">{activeEnrollment?.seccion?.grado?.nombre} &quot;{activeEnrollment?.seccion?.letra}&quot;</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Promedio General</p>
                <p className="text-xs font-semibold text-slate-500">Puntaje: {averageScore}</p>
              </div>
              <GradeBadge grade={averageLetter} size="lg" />
            </div>
          </div>

          {/* Course-by-Course Competencies Breakdown */}
          <div className="space-y-4">
            {courses.map((course) => {
              const courseCompetencies = course.competencias || [];
              const courseGrades = grades.filter(
                g => g.matricula_id === activeEnrollment?.id && courseCompetencies.some(c => c.id === g.competencia_id)
              );
              const courseGradeLetters = courseGrades.map(g => g.nota_letra);
              const courseAvg = calculateAverage(courseGradeLetters);

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                >
                  {/* Course Title Bar */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: course.color_hex || '#3b82f6' }} />
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                        {course.nombre}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Promedio del Curso:</span>
                      <GradeBadge grade={courseAvg.averageLetter} size="sm" />
                    </div>
                  </div>

                  {/* Competencies Table */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {courseCompetencies.map((comp) => {
                      const compGrade = courseGrades.find(g => g.competencia_id === comp.id);
                      return (
                        <div
                          key={comp.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5 max-w-xl">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                                {comp.codigo}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-white">
                                {comp.descripcion}
                              </span>
                            </div>
                            {compGrade?.conclusion_descriptiva && (
                              <p className="text-[11px] text-slate-400 italic">
                                &quot;{compGrade.conclusion_descriptiva}&quot;
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            <GradeBadge grade={compGrade?.nota_letra} size="md" showLabel={true} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

