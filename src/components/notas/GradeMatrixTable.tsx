'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Course, EvaluationPeriod, Section, GradeLetter } from '@/types';
import { calculateAverage } from '@/lib/grades/calculations';
import { getSuggestedConclusions } from '@/lib/cneb/conclusionesDescriptivasTemplates';
import { Modal } from '@/components/ui/Modal';
import { CheckCircle2, ChevronDown, ChevronRight, Lock, MessageSquareText, Pencil, Plus, Wand2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GRADE_OPTIONS, gradeOption } from './gradeOptions';
import { useAulaColors } from '@/hooks/useAulaColors';

interface GradeMatrixTableProps {
  course: Course;
  evaluationPeriod: EvaluationPeriod;
  section: Section;
}

type EditingCell = {
  matriculaId: string;
  studentName: string;
  competenciaId: string;
  competenciaCodigo: string;
  competenciaDescripcion: string;
};

export function GradeMatrixTable({ course, evaluationPeriod, section }: GradeMatrixTableProps) {
  const { enrollments, grades, updateGrade, showToast } = useApp();
  const aulaColor = useAulaColors();
  const isPeriodClosed = evaluationPeriod.cerrado === true;
  const competencies = useMemo(() => [...(course.competencias || [])].sort((a, b) => a.orden - b.orden), [course.competencias]);

  const sectionEnrollments = useMemo(() => {
    const nameOf = (e: typeof enrollments[number]) => `${e.estudiante?.profile?.apellidos || e.estudiante?.apellidos || ''} ${e.estudiante?.profile?.nombres || e.estudiante?.nombres || ''}`;
    return enrollments
      .filter(e => e.seccion_id === section.id && e.estado === 'activo')
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  }, [enrollments, section.id]);

  const gradeOf = (matriculaId: string, competenciaId: string) =>
    grades.find(g => g.matricula_id === matriculaId && g.competencia_id === competenciaId && g.periodo_evaluacion_id === evaluationPeriod.id);

  const studentNameOf = (enr: typeof sectionEnrollments[number]) => {
    const nombres = enr.estudiante?.profile?.nombres || enr.estudiante?.nombres || '';
    const apellidos = enr.estudiante?.profile?.apellidos || enr.estudiante?.apellidos || '';
    return { nombres, apellidos, full: `${apellidos}, ${nombres}` };
  };

  // Avance: cuántos casilleros ya tienen nota
  const totalCells = sectionEnrollments.length * competencies.length;
  const filledCells = sectionEnrollments.reduce(
    (acc, enr) => acc + competencies.filter(c => gradeOf(enr.id, c.id)?.nota_letra).length,
    0
  );
  const progress = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;

  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<GradeLetter | undefined>(undefined);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [bulkMenu, setBulkMenu] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const openCell = (cell: EditingCell) => {
    if (isPeriodClosed) return;
    const rec = gradeOf(cell.matriculaId, cell.competenciaId);
    setEditing(cell);
    setSelectedGrade(rec?.nota_letra);
    setComment(rec?.conclusion_descriptiva || '');
    setShowComment(!!rec?.conclusion_descriptiva);
  };

  const stamp = () => new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  // Guarda la nota; si `goNext` es true abre el siguiente alumno en la misma competencia
  const saveGrade = (goNext: boolean) => {
    if (!editing || !selectedGrade) return;
    updateGrade({
      matriculaId: editing.matriculaId,
      competenciaId: editing.competenciaId,
      periodoEvaluacionId: evaluationPeriod.id,
      notaLetra: selectedGrade,
      conclusionDescriptiva: comment.trim() || undefined,
    });
    setLastSaved(`Última nota guardada a las ${stamp()}`);
    showToast(`Nota ${selectedGrade} guardada para ${editing.studentName}`, 'success', '✓ Nota guardada');

    const idx = sectionEnrollments.findIndex(e => e.id === editing.matriculaId);
    const next = goNext ? sectionEnrollments[idx + 1] : undefined;
    if (next) {
      openCell({ ...editing, matriculaId: next.id, studentName: studentNameOf(next).full });
    } else {
      if (goNext) confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      setEditing(null);
    }
  };

  // Llenado rápido: solo completa los casilleros vacíos de la competencia (no pisa notas ya puestas)
  const fillEmpty = (competenciaId: string, grade: GradeLetter) => {
    if (isPeriodClosed) return;
    const empty = sectionEnrollments.filter(enr => !gradeOf(enr.id, competenciaId)?.nota_letra);
    empty.forEach(enr => updateGrade({ matriculaId: enr.id, competenciaId, periodoEvaluacionId: evaluationPeriod.id, notaLetra: grade }));
    setBulkMenu(null);
    setLastSaved(`Última nota guardada a las ${stamp()}`);
    showToast(
      empty.length > 0 ? `Se puso ${grade} a ${empty.length} ${empty.length === 1 ? 'alumno' : 'alumnos'} sin nota` : 'Todos los alumnos ya tenían nota en esta competencia',
      empty.length > 0 ? 'success' : 'info',
      'Llenado rápido'
    );
  };

  const editingIndex = editing ? sectionEnrollments.findIndex(e => e.id === editing.matriculaId) : -1;
  const hasNext = editingIndex >= 0 && editingIndex < sectionEnrollments.length - 1;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Bimestre cerrado */}
      {isPeriodClosed && (
        <div className="rounded-t-3xl bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-5 py-3 flex items-center gap-3 text-amber-800 dark:text-amber-200">
          <Lock className="w-5 h-5 shrink-0" />
          <p className="text-sm"><strong>Este bimestre ya está cerrado.</strong> Puedes ver las notas, pero ya no se pueden cambiar.</p>
        </div>
      )}

      {/* Encabezado + avance */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: course.color_hex || '#3b82f6' }} />
              {course.nombre} · <span className={`px-2.5 py-0.5 rounded-full text-sm ${aulaColor(section.id).chip}`}>{section.grado?.nombre} &quot;{section.letra}&quot;</span>
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{evaluationPeriod.nombre} · {sectionEnrollments.length} {sectionEnrollments.length === 1 ? 'alumno' : 'alumnos'} · {competencies.length} competencias</p>
          </div>
          {lastSaved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4" /> {lastSaved}
            </span>
          )}
        </div>

        {totalCells > 0 && (
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-bold text-slate-700 dark:text-slate-200">Notas puestas: {filledCells} de {totalCells}</span>
              <span className={`font-black ${progress === 100 ? 'text-emerald-600' : 'text-slate-500'}`}>{progress === 100 ? '¡Completo! ✅' : `${progress}%`}</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Leyenda de niveles */}
        <div className="flex flex-wrap gap-2">
          {GRADE_OPTIONS.map(o => (
            <span key={o.letter} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold ${o.soft}`}>
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-black ${o.solid}`}>{o.letter}</span>
              {o.label}
            </span>
          ))}
        </div>
      </div>

      {competencies.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Este curso aún no tiene competencias registradas. Pide a Coordinación que las agregue.</p>
      ) : sectionEnrollments.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Esta aula aún no tiene alumnos matriculados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                <th className="py-3 px-4 min-w-[220px] text-sm font-black text-slate-700 dark:text-slate-200 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">Alumno</th>
                {competencies.map((comp, i) => (
                  <th key={comp.id} className="py-3 px-2 text-center align-top min-w-[150px]">
                    <p className="text-sm font-black text-slate-800 dark:text-white">Competencia {i + 1}</p>
                    <p className="text-xs font-normal text-slate-500 dark:text-slate-400 line-clamp-2 max-w-[170px] mx-auto" title={comp.descripcion}>{comp.descripcion}</p>
                    {!isPeriodClosed && (
                      <div className="relative inline-block mt-1.5">
                        <button
                          type="button"
                          onClick={() => setBulkMenu(bulkMenu === comp.id ? null : comp.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-700 cursor-pointer"
                          aria-expanded={bulkMenu === comp.id}
                        >
                          <Wand2 className="w-3.5 h-3.5 text-indigo-500" /> Llenar vacíos <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {bulkMenu === comp.id && (
                          <div className="absolute z-30 top-full left-1/2 -translate-x-1/2 mt-1 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 text-left">
                            <p className="px-1 pb-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Pone esta nota solo a los alumnos que aún no tienen nota:</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {GRADE_OPTIONS.map(o => (
                                <button key={o.letter} type="button" onClick={() => fillEmpty(comp.id, o.letter)} className={`py-2 rounded-xl text-sm font-black border cursor-pointer hover:opacity-90 ${o.solid}`}>
                                  {o.letter}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                ))}
                <th className="py-3 px-3 text-center min-w-[110px] text-sm font-black text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40">Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sectionEnrollments.map(enr => {
                const { nombres, apellidos, full } = studentNameOf(enr);
                const studentGrades: GradeLetter[] = [];
                return (
                  <tr key={enr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center justify-center shrink-0">
                          {`${nombres[0] || ''}${apellidos[0] || ''}`.toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-slate-900 dark:text-white truncate">{full}</span>
                          <span className="block text-[11px] font-mono text-slate-400">{enr.estudiante?.codigo_estudiante}</span>
                        </span>
                      </div>
                    </td>

                    {competencies.map(comp => {
                      const rec = gradeOf(enr.id, comp.id);
                      const opt = gradeOption(rec?.nota_letra);
                      if (rec?.nota_letra) studentGrades.push(rec.nota_letra);
                      const cell = { matriculaId: enr.id, studentName: full, competenciaId: comp.id, competenciaCodigo: comp.codigo, competenciaDescripcion: comp.descripcion };
                      return (
                        <td key={comp.id} className="py-2 px-2 text-center">
                          {isPeriodClosed ? (
                            opt ? (
                              <span className={`inline-flex items-center justify-center min-w-[52px] px-3 py-2 rounded-xl border text-base font-black ${opt.solid}`}>{opt.letter}</span>
                            ) : <span className="text-sm text-slate-400">Sin nota</span>
                          ) : opt ? (
                            <button
                              type="button"
                              onClick={() => openCell(cell)}
                              aria-label={`Cambiar nota ${opt.letter} de ${full}`}
                              title={rec?.conclusion_descriptiva ? `Comentario: ${rec.conclusion_descriptiva}` : 'Toca para cambiar la nota'}
                              className={`group inline-flex items-center gap-1.5 min-w-[88px] justify-center px-3 py-2 rounded-xl border-2 text-base font-black cursor-pointer transition-transform hover:scale-105 ${opt.solid}`}
                            >
                              {opt.letter}
                              {rec?.conclusion_descriptiva && <MessageSquareText className="w-3.5 h-3.5 opacity-80" />}
                              <Pencil className="w-3.5 h-3.5 opacity-70" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openCell(cell)}
                              aria-label={`Poner nota a ${full}`}
                              className="inline-flex items-center gap-1 min-w-[88px] justify-center px-3 py-2 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/30 text-sm font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 hover:border-indigo-500 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" /> Poner
                            </button>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-2 px-3 text-center bg-indigo-50/50 dark:bg-indigo-950/20">
                      {(() => {
                        const avg = gradeOption(studentGrades.length > 0 ? calculateAverage(studentGrades).averageLetter : null);
                        return avg
                          ? <span className={`inline-flex items-center justify-center min-w-[52px] px-3 py-2 rounded-xl border text-base font-black ${avg.soft}`}>{avg.letter}</span>
                          : <span className="text-sm text-slate-400">—</span>;
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Ventana para calificar */}
      {editing && (
        <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Poner nota" maxWidth="lg">
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="text-lg font-black text-slate-900 dark:text-white">{editing.studentName}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Competencia {competencies.findIndex(c => c.id === editing.competenciaId) + 1}:</strong> {editing.competenciaDescripcion}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Alumno {editingIndex + 1} de {sectionEnrollments.length}</p>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">1. Elige la nota:</p>
              <div className="grid grid-cols-2 gap-2">
                {GRADE_OPTIONS.map(o => {
                  const active = selectedGrade === o.letter;
                  return (
                    <button
                      key={o.letter}
                      type="button"
                      onClick={() => setSelectedGrade(o.letter)}
                      aria-pressed={active}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left cursor-pointer transition-all ${active ? `${o.solid} ring-4 ring-offset-1 ring-indigo-200 dark:ring-indigo-900` : `${o.soft} hover:scale-[1.02]`}`}
                    >
                      <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shrink-0 ${active ? 'bg-white/25' : o.solid}`}>{o.letter}</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black">{o.label}</span>
                        <span className={`block text-xs ${active ? 'text-white/90' : 'opacity-80'}`}>{o.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowComment(v => !v)}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer"
                aria-expanded={showComment}
              >
                {showComment ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                2. Comentario para la libreta <span className="font-normal text-slate-500">(opcional)</span>
              </button>
              {showComment && (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Escribe cómo le fue al alumno o elige una sugerencia de abajo"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  {selectedGrade && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500">Sugerencias (toca una para usarla):</p>
                      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                        {getSuggestedConclusions(course.nombre, selectedGrade, editing.studentName).map((sug, idx) => (
                          <button key={idx} type="button" onClick={() => setComment(sug)} className="text-left text-xs p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 cursor-pointer">
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                Cancelar
              </button>
              <button type="button" disabled={!selectedGrade} onClick={() => saveGrade(false)} className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-indigo-600 text-indigo-700 dark:text-indigo-300 text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                Guardar
              </button>
              {hasNext && (
                <button type="button" disabled={!selectedGrade} onClick={() => saveGrade(true)} className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                  Guardar y seguir con el siguiente <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
