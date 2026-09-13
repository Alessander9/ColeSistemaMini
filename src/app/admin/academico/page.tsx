'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { 
  GraduationCap, 
  School, 
  Calendar, 
  Users, 
  BookOpen, 
  ArrowRight, 
  ChevronRight, 
  Sparkles,
  Layers,
  Award,
  Clock
} from 'lucide-react';
import { Section } from '@/types';

export default function AdminAcademicoPage() {
  const { gradeLevels, sections, enrollments, sectionCourses, scheduleSlots } = useApp();
  const [selectedLevel, setSelectedLevel] = useState<'todos' | 'primaria' | 'secundaria'>('todos');

  const filteredGrades = gradeLevels.filter(g => {
    if (selectedLevel === 'todos') return true;
    return g.nivel.toLowerCase() === selectedLevel;
  });

  const primariaGrades = gradeLevels.filter(g => g.nivel.toLowerCase() === 'primaria');
  const secundariaGrades = gradeLevels.filter(g => g.nivel.toLowerCase() === 'secundaria');

  const totalStudents = enrollments.length;
  const totalSections = sections.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in-50 pb-12">
      {/* ── Breadcrumb Navigation ── */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
          <School className="w-3.5 h-3.5" />
          Colegio
        </span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
          <Calendar className="w-3.5 h-3.5 text-amber-500" />
          Año Escolar 2026
        </span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-400">Estructura Académica</span>
      </nav>

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 p-6 sm:p-8 border border-purple-900/40 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Estructura Curricular & Salones 2026
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              Explorador Académico Escolar
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Navega jerárquicamente por niveles, grados y secciones para gestionar bimestres, asignación de profesores, horarios y notas.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-purple-200 block">Niveles</span>
              <span className="text-lg font-black text-white">2 (Prim. & Sec.)</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-purple-200 block">Total Salones</span>
              <span className="text-lg font-black text-white">{totalSections} Secciones</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-purple-200 block">Matriculados</span>
              <span className="text-lg font-black text-white">{totalStudents} Alumnos</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Level Selector Pills ── */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
        <button
          onClick={() => setSelectedLevel('todos')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            selectedLevel === 'todos'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          🏫 Todos los Niveles ({gradeLevels.length} grados)
        </button>
        <button
          onClick={() => setSelectedLevel('primaria')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            selectedLevel === 'primaria'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          👦 Primaria ({primariaGrades.length} grados · 1.° al 6.°)
        </button>
        <button
          onClick={() => setSelectedLevel('secundaria')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            selectedLevel === 'secundaria'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          🎓 Secundaria ({secundariaGrades.length} grados · 1.° al 5.°)
        </button>
      </div>

      {/* ── Hierarchy Card Grids ── */}
      <div className="space-y-8">
        {(selectedLevel === 'todos' || selectedLevel === 'primaria') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                  👦
                </span>
                Nivel Primaria — Educación Básica Regular (6 Grados)
              </h2>
              <span className="text-xs font-bold text-slate-400">12 Secciones (A & B)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {primariaGrades.map((grade) => {
                const gradeSections = sections.filter(s => s.grado_id === grade.id);
                return (
                  <div
                    key={grade.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {grade.nombre}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {gradeSections.length} Secciones
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-4">
                      Ciclo de Primaria
                    </h3>

                    {/* Section Buttons */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {gradeSections.map((sec) => {
                        const secStudents = enrollments.filter(e => e.seccion_id === sec.id).length;
                        const secCourses = sectionCourses.filter(sc => sc.seccion_id === sec.id).length;

                        return (
                          <Link
                            key={sec.id}
                            href={`/admin/secciones/${sec.id}`}
                            className="group p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-700 transition-all block"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-black text-slate-900 dark:text-white group-hover:text-purple-600 text-sm">
                                Sección &quot;{sec.letra}&quot;
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                              <div className="flex items-center gap-1 font-bold">
                                <Users className="w-3 h-3 text-blue-500" />
                                {secStudents > 0 ? `${secStudents} alumnos` : '28 alumnos'}
                              </div>
                              <div className="flex items-center gap-1 font-medium">
                                <BookOpen className="w-3 h-3 text-purple-500" />
                                {secCourses > 0 ? `${secCourses} áreas` : '9 materias'}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(selectedLevel === 'todos' || selectedLevel === 'secundaria') && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                  🎓
                </span>
                Nivel Secundaria — Educación Básica Regular (5 Grados)
              </h2>
              <span className="text-xs font-bold text-slate-400">10 Secciones (A & B)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {secundariaGrades.map((grade) => {
                const gradeSections = sections.filter(s => s.grado_id === grade.id);
                return (
                  <div
                    key={grade.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {grade.nombre}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {gradeSections.length} Secciones
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-4">
                      Ciclo de Secundaria
                    </h3>

                    {/* Section Buttons */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {gradeSections.map((sec) => {
                        const secStudents = enrollments.filter(e => e.seccion_id === sec.id).length;
                        const secCourses = sectionCourses.filter(sc => sc.seccion_id === sec.id).length;

                        return (
                          <Link
                            key={sec.id}
                            href={`/admin/secciones/${sec.id}`}
                            className="group p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all block"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-black text-slate-900 dark:text-white group-hover:text-emerald-600 text-sm">
                                Sección &quot;{sec.letra}&quot;
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                              <div className="flex items-center gap-1 font-bold">
                                <Users className="w-3 h-3 text-emerald-500" />
                                {secStudents > 0 ? `${secStudents} alumnos` : '26 alumnos'}
                              </div>
                              <div className="flex items-center gap-1 font-medium">
                                <BookOpen className="w-3 h-3 text-teal-500" />
                                {secCourses > 0 ? `${secCourses} áreas` : '9 materias'}
                              </div>
                            </div>
                          </Link>
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
    </div>
  );
}
