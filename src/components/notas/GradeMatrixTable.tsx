'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Course, EvaluationPeriod, Section, GradeLetter } from '@/types';
import { GradeBadge } from './GradeBadge';
import { GradeSelector } from './GradeSelector';
import { calculateAverage } from '@/lib/grades/calculations';
import { Modal } from '@/components/ui/Modal';
import { Sparkles, Edit3, CheckCircle2, User } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GradeMatrixTableProps {
  course: Course;
  evaluationPeriod: EvaluationPeriod;
  section: Section;
}

export function GradeMatrixTable({
  course,
  evaluationPeriod,
  section,
}: GradeMatrixTableProps) {
  const { enrollments, grades, updateGrade } = useApp();
  const [editingCell, setEditingCell] = useState<{
    matriculaId: string;
    studentName: string;
    competenciaId: string;
    competenciaCodigo: string;
    currentGrade?: GradeLetter;
    conclusionDescriptiva?: string;
  } | null>(null);

  // Filter enrollments for this section
  const sectionEnrollments = enrollments.filter(e => e.seccion_id === section.id && e.estado === 'activo');
  const competencies = course.competencias || [];

  const handleSaveGrade = (newGrade: GradeLetter, conclusion?: string) => {
    if (!editingCell) return;

    updateGrade({
      matriculaId: editingCell.matriculaId,
      competenciaId: editingCell.competenciaId,
      periodoEvaluacionId: evaluationPeriod.id,
      notaLetra: newGrade,
      conclusionDescriptiva: conclusion,
    });

    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.8 },
    });

    setEditingCell(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header Info */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Curso & Sección</span>
          <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color_hex || '#3b82f6' }} />
            {course.nombre} — {section.grado?.nombre} &quot;{section.letra}&quot;
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {evaluationPeriod.nombre}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {sectionEnrollments.length} alumnos
          </span>
        </div>
      </div>

      {/* Grade Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold">
              <th className="py-3 px-4 sm:px-6 min-w-[200px]">Estudiante</th>
              {competencies.map((comp) => (
                <th key={comp.id} className="py-3 px-3 text-center min-w-[110px]" title={comp.descripcion}>
                  <div className="font-bold text-slate-800 dark:text-white">{comp.codigo}</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate max-w-[120px] mx-auto">
                    {comp.descripcion}
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 text-center bg-blue-50/60 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 min-w-[100px]">
                Promedio
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sectionEnrollments.map((enr) => {
              const studentName = `${enr.estudiante?.profile?.apellidos}, ${enr.estudiante?.profile?.nombres}`;
              
              // Get student's grades for all competencies in this period
              const studentGrades: GradeLetter[] = [];

              return (
                <tr key={enr.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Student Name */}
                  <td className="py-3 px-4 sm:px-6">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={enr.estudiante?.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={studentName}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{studentName}</p>
                        <p className="text-[10px] font-mono text-slate-400">{enr.estudiante?.codigo_estudiante}</p>
                      </div>
                    </div>
                  </td>

                  {/* Competency Cells */}
                  {competencies.map((comp) => {
                    const gradeRec = grades.find(
                      g => g.matricula_id === enr.id && 
                           g.competencia_id === comp.id && 
                           g.periodo_evaluacion_id === evaluationPeriod.id
                    );

                    if (gradeRec?.nota_letra) {
                      studentGrades.push(gradeRec.nota_letra);
                    }

                    return (
                      <td key={comp.id} className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingCell({
                              matriculaId: enr.id,
                              studentName,
                              competenciaId: comp.id,
                              competenciaCodigo: comp.codigo,
                              currentGrade: gradeRec?.nota_letra,
                              conclusionDescriptiva: gradeRec?.conclusion_descriptiva,
                            })
                          }
                          className="group p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Haga clic para calificar o modificar"
                        >
                          <GradeBadge grade={gradeRec?.nota_letra} size="sm" />
                          <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                    );
                  })}

                  {/* Calculated Average */}
                  <td className="py-3 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20">
                    {studentGrades.length > 0 ? (
                      <GradeBadge grade={calculateAverage(studentGrades).averageLetter} size="md" />
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Grade Modal */}
      {editingCell && (
        <Modal
          isOpen={!!editingCell}
          onClose={() => setEditingCell(null)}
          title={`Calificar Competencia ${editingCell.competenciaCodigo}`}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Estudiante</p>
                <p className="text-xs font-bold text-slate-800 dark:text-white">{editingCell.studentName}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Seleccione Calificación (AD – A – B – C):
              </label>
              <div className="flex justify-center">
                <GradeSelector
                  value={editingCell.currentGrade}
                  onChange={(grade) => handleSaveGrade(grade, editingCell.conclusionDescriptiva)}
                />
              </div>
            </div>

            <div className="pt-2 text-center text-[11px] text-slate-400">
              Al seleccionar una nota, el promedio de periodo se recalculará instantáneamente.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
