'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { GradeLetter } from '@/types';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  Award,
  TrendingUp,
  GraduationCap,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

// Grade letter to number
const gradeToNum: Record<GradeLetter, number> = { AD: 4, A: 3, B: 2, C: 1 };
const numToGrade = (n: number): GradeLetter => {
  if (n >= 3.5) return 'AD';
  if (n >= 2.5) return 'A';
  if (n >= 1.5) return 'B';
  return 'C';
};

type FilterNivel = 'todos' | 'primaria' | 'secundaria';

export default function NotasSalonPage() {
  const { grades: gradeRecords, enrollments, courses, sections } = useApp();

  const [filterNivel, setFilterNivel] = useState<FilterNivel>('todos');
  const [filterCurso, setFilterCurso] = useState<string>('todos');
  const [search, setSearch] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('sec-3pri-a');

  // Group sections by grade
  const sectionsByGrade = useMemo(() => {
    const filtered = sections.filter(s => {
      if (filterNivel === 'todos') return true;
      return s.grado?.nivel === filterNivel;
    });
    
    const byGrade: Record<string, typeof sections> = {};
    filtered.forEach(sec => {
      const key = sec.grado_id;
      if (!byGrade[key]) byGrade[key] = [];
      byGrade[key].push(sec);
    });
    return byGrade;
  }, [sections, filterNivel]);

  // Sorted grade levels
  const sortedGrades = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; nombre: string; nivel: string; numero: number }[] = [];
    sections.forEach(s => {
      if (!s.grado || seen.has(s.grado_id)) return;
      if (filterNivel !== 'todos' && s.grado.nivel !== filterNivel) return;
      seen.add(s.grado_id);
      result.push({ id: s.grado_id, nombre: s.grado.nombre, nivel: s.grado.nivel, numero: s.grado.numero_grado });
    });
    return result.sort((a, b) => {
      if (a.nivel !== b.nivel) return a.nivel === 'primaria' ? -1 : 1;
      return a.numero - b.numero;
    });
  }, [sections, filterNivel]);

  // Build section data with student grades
  const getSectionData = (sectionId: string) => {
    const sectionEnrollments = enrollments.filter(e => e.seccion_id === sectionId);
    
    const students = sectionEnrollments.map(enr => {
      const studentGrades = gradeRecords.filter(g => {
        const base = g.matricula_id === enr.id;
        if (!base) return false;
        if (filterCurso !== 'todos') {
          const comp = courses.find(c => c.id === filterCurso);
          return comp?.competencias?.some(cp => cp.id === g.competencia_id);
        }
        return true;
      });
      
      const scores = studentGrades.map(g => gradeToNum[g.nota_letra]).filter(Boolean);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      
      // Per-course averages
      const courseAvgs: Record<string, GradeLetter | null> = {};
      courses.forEach(course => {
        const courseGrades = gradeRecords.filter(g =>
          g.matricula_id === enr.id &&
          course.competencias?.some(c => c.id === g.competencia_id)
        );
        if (courseGrades.length > 0) {
          const cScores = courseGrades.map(g => gradeToNum[g.nota_letra]);
          const cAvg = cScores.reduce((a, b) => a + b, 0) / cScores.length;
          courseAvgs[course.id] = numToGrade(cAvg);
        } else {
          courseAvgs[course.id] = null;
        }
      });

      return {
        enr,
        student: enr.estudiante,
        grades: studentGrades,
        avg,
        avgLetter: avg > 0 ? numToGrade(avg) : null,
        courseAvgs,
        totalGrades: studentGrades.length,
      };
    }).filter(s => {
      if (!search) return true;
      const name = `${s.student?.profile?.nombres} ${s.student?.profile?.apellidos}`.toLowerCase();
      return name.includes(search.toLowerCase());
    });

    // Section stats
    const withGrades = students.filter(s => s.avg > 0);
    const sectionAvg = withGrades.length > 0
      ? withGrades.reduce((a, b) => a + b.avg, 0) / withGrades.length
      : 0;

    const distrib = { AD: 0, A: 0, B: 0, C: 0 };
    withGrades.forEach(s => {
      if (s.avgLetter) distrib[s.avgLetter]++;
    });

    return { students, sectionAvg, distrib, totalStudents: sectionEnrollments.length };
  };

  const gradeColors: Record<string, string> = {
    AD: 'from-emerald-500 to-teal-600',
    A: 'from-blue-500 to-indigo-600',
    B: 'from-amber-500 to-orange-500',
    C: 'from-rose-500 to-pink-600',
  };

  const statusColors: Record<string, string> = {
    AD: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400',
    A: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400',
    B: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400',
    C: 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400',
  };

  const nivelColor = {
    primaria: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    secundaria: 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Notas por Salón"
        description="Vista consolidada de calificaciones AD–A–B–C organizadas por grado y sección (6 primaria + 5 secundaria, hasta 2 secciones cada uno)."
        badge="Admin"
        badgeColor="admin"
      >
        <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all">
          <Download className="w-3.5 h-3.5" />
          Exportar
        </button>
      </PageHeader>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar alumno..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
          />
        </div>

        {/* Nivel filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          {(['todos', 'primaria', 'secundaria'] as FilterNivel[]).map(n => (
            <button
              key={n}
              onClick={() => setFilterNivel(n)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                filterNivel === n
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {n === 'todos' ? 'Todos los niveles' : n}
            </button>
          ))}
        </div>

        {/* Course filter */}
        <div className="relative">
          <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterCurso}
            onChange={e => setFilterCurso(e.target.value)}
            className="pl-9 pr-8 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
          >
            <option value="todos">Todos los cursos</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grade Groups */}
      <div className="space-y-8">
        {sortedGrades.map(grade => {
          const gradeSections = sectionsByGrade[grade.id] || [];
          return (
            <div key={grade.id}>
              {/* Grade Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${nivelColor[grade.nivel as keyof typeof nivelColor]}`}>
                  <GraduationCap className="w-3.5 h-3.5" />
                  {grade.nombre}
                </div>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {gradeSections.length} sección{gradeSections.length !== 1 ? 'es' : ''}
                </span>
              </div>

              {/* Sections side by side */}
              <div className={`grid gap-5 ${gradeSections.length > 1 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                {gradeSections
                  .sort((a, b) => a.letra.localeCompare(b.letra))
                  .map(section => {
                    const isExpanded = expandedSection === section.id;
                    const data = getSectionData(section.id);
                    const avgLetter = data.sectionAvg > 0 ? numToGrade(data.sectionAvg) : null;

                    return (
                      <div
                        key={section.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800/70 shadow-sm overflow-hidden card-lift"
                      >
                        {/* Section Header */}
                        <div
                          className="p-5 cursor-pointer select-none"
                          onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Section letter badge */}
                              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grade.nivel === 'primaria' ? 'from-blue-500 to-indigo-600' : 'from-purple-500 to-violet-600'} flex items-center justify-center shadow-lg`}>
                                <span className="text-white font-black text-lg">{section.letra}</span>
                              </div>
                              <div>
                                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                                  {grade.nombre} — Sección {section.letra}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <Users className="w-3 h-3" />
                                    {data.totalStudents} alumnos
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-[10px] text-slate-400">
                                    Cap. {section.capacidad_maxima}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Quick distrib pills */}
                              <div className="hidden sm:flex items-center gap-1.5">
                                {(['AD','A','B','C'] as GradeLetter[]).map(l => (
                                  data.distrib[l] > 0 && (
                                    <div key={l} className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${statusColors[l]}`}>
                                      {l}: {data.distrib[l]}
                                    </div>
                                  )
                                ))}
                              </div>

                              {/* Section average */}
                              {avgLetter && (
                                <GradeBadge grade={avgLetter} size="md" />
                              )}

                              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-4 grid grid-cols-4 gap-1.5">
                            {(['AD','A','B','C'] as GradeLetter[]).map(l => {
                              const pct = data.totalStudents > 0 ? Math.round((data.distrib[l] / data.totalStudents) * 100) : 0;
                              return (
                                <div key={l} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400">{l}</span>
                                    <span className="text-[9px] font-bold text-slate-400">{pct}%</span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full bg-gradient-to-r ${gradeColors[l]} transition-all duration-700`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Expanded: Student Table */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 dark:border-slate-800">
                            {data.students.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                <AlertCircle className="w-8 h-8 mb-2 text-slate-300" />
                                <p className="text-sm font-semibold">Sin alumnos matriculados</p>
                                <p className="text-xs mt-1">Esta sección no tiene estudiantes asignados aún.</p>
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                                      <th className="text-left px-5 py-3 font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                                        Alumno
                                      </th>
                                      {courses.map(c => (
                                        <th key={c.id} className="text-center px-3 py-3 font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] min-w-[80px]">
                                          <div className="flex flex-col items-center gap-0.5">
                                            <div
                                              className="w-2 h-2 rounded-full"
                                              style={{ background: c.color_hex }}
                                            />
                                            {c.nombre.split(' ')[0]}
                                          </div>
                                        </th>
                                      ))}
                                      <th className="text-center px-5 py-3 font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                                        Promedio
                                      </th>
                                      <th className="text-center px-5 py-3 font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                                        Estado
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {data.students.map((s, idx) => {
                                      const promoted = s.avgLetter === 'AD' || s.avgLetter === 'A';
                                      const atRisk = s.avgLetter === 'C';
                                      return (
                                        <tr
                                          key={s.enr.id}
                                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                          {/* Student name */}
                                          <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300 shrink-0">
                                                {idx + 1}
                                              </div>
                                              <div>
                                                <p className="font-bold text-slate-900 dark:text-white">
                                                  {s.student?.profile?.apellidos?.split(' ')[0]}, {s.student?.profile?.nombres?.split(' ')[0]}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                  {s.student?.codigo_estudiante}
                                                </p>
                                              </div>
                                            </div>
                                          </td>

                                          {/* Per-course grades */}
                                          {courses.map(c => (
                                            <td key={c.id} className="px-3 py-3.5 text-center">
                                              {s.courseAvgs[c.id] ? (
                                                <GradeBadge grade={s.courseAvgs[c.id]!} size="sm" />
                                              ) : (
                                                <span className="text-slate-300 dark:text-slate-600 text-base">—</span>
                                              )}
                                            </td>
                                          ))}

                                          {/* Average */}
                                          <td className="px-5 py-3.5 text-center">
                                            {s.avgLetter ? (
                                              <div className="flex flex-col items-center gap-0.5">
                                                <GradeBadge grade={s.avgLetter} size="sm" />
                                                <span className="text-[9px] text-slate-400">
                                                  {s.avg.toFixed(1)}/4.0
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-slate-300 dark:text-slate-600">—</span>
                                            )}
                                          </td>

                                          {/* Status */}
                                          <td className="px-5 py-3.5 text-center">
                                            {s.avgLetter ? (
                                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                                promoted
                                                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                                                  : atRisk
                                                  ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'
                                                  : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                                              }`}>
                                                {promoted
                                                  ? <><CheckCircle2 className="w-3 h-3" />Aprobado</>
                                                  : atRisk
                                                  ? <><AlertCircle className="w-3 h-3" />En Riesgo</>
                                                  : <><Clock className="w-3 h-3" />En Proceso</>
                                                }
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-slate-400">Sin notas</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>

                                {/* Section Summary Footer */}
                                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                      Resumen del salón:
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {(['AD','A','B','C'] as GradeLetter[]).map(l => (
                                        data.distrib[l] > 0 && (
                                          <span key={l} className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${statusColors[l]}`}>
                                            {l}: {data.distrib[l]}
                                          </span>
                                        )
                                      ))}
                                    </div>
                                  </div>
                                  {avgLetter && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="text-slate-400 font-medium">Promedio salón:</span>
                                      <GradeBadge grade={avgLetter} size="sm" />
                                      <span className="font-black text-slate-600 dark:text-slate-300">
                                        {data.sectionAvg.toFixed(2)}/4.0
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}

        {sortedGrades.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-semibold">No se encontraron salones</p>
          </div>
        )}
      </div>
    </div>
  );
}
