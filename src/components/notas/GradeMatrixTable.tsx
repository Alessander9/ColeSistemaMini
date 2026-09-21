'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Course, EvaluationPeriod, Section, GradeLetter } from '@/types';
import { GradeBadge } from './GradeBadge';
import { GradeSelector } from './GradeSelector';
import { calculateAverage } from '@/lib/grades/calculations';
import { getSuggestedConclusions } from '@/lib/cneb/conclusionesDescriptivasTemplates';
import { Modal } from '@/components/ui/Modal';
import { Sparkles, Edit3, CheckCircle2, User, Zap, ChevronDown } from 'lucide-react';
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
  const { enrollments, grades, updateGrade, showToast } = useApp();
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
  const isPeriodClosed = evaluationPeriod.cerrado === true;

  const [tempConclusion, setTempConclusion] = useState<string>('');
  const [selectedGradeValue, setSelectedGradeValue] = useState<GradeLetter | undefined>(undefined);
  const [lastSavedInfo, setLastSavedInfo] = useState<string | null>(null);
  const [activeBulkMenu, setActiveBulkMenu] = useState<string | null>(null);

  const handleBulkFillColumn = (competenciaId: string, grade: GradeLetter) => {
    if (isPeriodClosed) return;
    sectionEnrollments.forEach(enr => {
      updateGrade({
        matriculaId: enr.id,
        competenciaId,
        periodoEvaluacionId: evaluationPeriod.id,
        notaLetra: grade,
      });
    });
    setActiveBulkMenu(null);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSavedInfo(`Llenado masivo ${grade} guardado a las ${nowTime}`);
    showToast(`Se aplicó la calificación ${grade} a toda la columna del salón`, 'success', '⚡ Llenado Masivo');
  };

  const handleOpenEdit = (data: {
    matriculaId: string;
    studentName: string;
    competenciaId: string;
    competenciaCodigo: string;
    currentGrade?: GradeLetter;
    conclusionDescriptiva?: string;
  }) => {
    if (isPeriodClosed) return;
    setEditingCell(data);
    setSelectedGradeValue(data.currentGrade);
    setTempConclusion(data.conclusionDescriptiva || '');
  };

  const handleSaveGrade = (newGrade?: GradeLetter) => {
    if (!editingCell) return;
    const gradeToSave = newGrade || selectedGradeValue;
    if (!gradeToSave) return;

    updateGrade({
      matriculaId: editingCell.matriculaId,
      competenciaId: editingCell.competenciaId,
      periodoEvaluacionId: evaluationPeriod.id,
      notaLetra: gradeToSave,
      conclusionDescriptiva: tempConclusion.trim() || undefined,
    });

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSavedInfo(`Guardado a las ${nowTime}`);

    showToast(
      `Nota ${gradeToSave} registrada para ${editingCell.studentName}`,
      'success',
      '✓ Calificación Guardada'
    );

    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.8 },
    });

    setEditingCell(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Closed Period Alert */}
      {isPeriodClosed && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-3 flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-bold">Periodo Cerrado por Dirección Académica:</span>
            <span>Este bimestre ha sido clausurado para el registro de notas. La matriz se muestra en modo solo lectura.</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
            Bloqueado
          </span>
        </div>
      )}

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
          {lastSavedInfo && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200/80 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {lastSavedInfo}
            </span>
          )}
          <span className={`text-xs font-bold px-3 py-1 rounded-xl ${
            isPeriodClosed 
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
          }`}>
            {evaluationPeriod.nombre} {isPeriodClosed && '(Cerrado)'}
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
                <th key={comp.id} className="py-3 px-3 text-center min-w-[125px]" title={comp.descripcion}>
                  <div className="font-bold text-slate-800 dark:text-white flex items-center justify-center gap-1">
                    <span>{comp.codigo}</span>
                    {!isPeriodClosed && (
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() => setActiveBulkMenu(activeBulkMenu === comp.id ? null : comp.id)}
                          className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Llenado rápido de columna"
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                        </button>
                        {activeBulkMenu === comp.id && (
                          <div className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 flex gap-1 animate-in fade-in zoom-in-95">
                            {(['AD', 'A', 'B', 'C'] as GradeLetter[]).map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => handleBulkFillColumn(comp.id, g)}
                                className="px-2 py-1 rounded-lg text-[10px] font-black bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white transition-colors"
                                title={`Llenar toda la columna con ${g}`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
              const studentName = `${enr.estudiante?.profile?.apellidos || enr.estudiante?.apellidos || ''}, ${enr.estudiante?.profile?.nombres || enr.estudiante?.nombres || ''}`;
              
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
                          disabled={isPeriodClosed}
                          onClick={() =>
                            handleOpenEdit({
                              matriculaId: enr.id,
                              studentName,
                              competenciaId: comp.id,
                              competenciaCodigo: comp.codigo,
                              currentGrade: gradeRec?.nota_letra,
                              conclusionDescriptiva: gradeRec?.conclusion_descriptiva,
                            })
                          }
                          className={`group p-1 rounded-xl transition-all inline-flex items-center gap-1 ${
                            isPeriodClosed 
                              ? 'cursor-not-allowed opacity-90' 
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                          }`}
                          title={isPeriodClosed ? 'Periodo cerrado (solo lectura)' : (gradeRec?.conclusion_descriptiva ? `Conclusión: ${gradeRec.conclusion_descriptiva}` : 'Clic para calificar')}
                        >
                          <GradeBadge grade={gradeRec?.nota_letra} size="sm" />
                          {!isPeriodClosed && (
                            <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
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
          <div className="space-y-4 text-xs">
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
                Nivel de Logro CNEB (AD – A – B – C):
              </label>
              <div className="flex justify-center">
                <GradeSelector
                  value={selectedGradeValue}
                  onChange={(grade) => {
                    setSelectedGradeValue(grade);
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Conclusión Descriptiva CNEB (RVM 094-2020):
                </label>
                {selectedGradeValue && (
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Sugerencias rápidas abajo
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                placeholder="Ej. El estudiante demuestra dominio sobresaliente al resolver problemas matemáticos contextualizados..."
                value={tempConclusion}
                onChange={(e) => setTempConclusion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              />

              {/* Suggestions chips */}
              {selectedGradeValue && (
                <div className="mt-2 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Sugerencias CNEB ({selectedGradeValue}):</p>
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                    {getSuggestedConclusions(course.nombre, selectedGradeValue, editingCell.studentName).map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTempConclusion(sug)}
                        className="text-left text-[11px] p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedGradeValue}
                onClick={() => handleSaveGrade()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-40"
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
