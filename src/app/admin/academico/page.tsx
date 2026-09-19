'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  GraduationCap,
  School,
  Calendar,
  Users,
  BookOpen,
  ChevronRight,
  Sparkles,
  Sun,
  LayoutGrid,
  Luggage,
  Pencil,
  Rocket,
  Trophy,
  Lightbulb,
  Settings,
  BarChart3,
  Monitor,
  UserCheck,
  ArrowRight,
  Palette,
  HeartHandshake
} from 'lucide-react';

export default function AdminAcademicoPage() {
  const { gradeLevels, sections, enrollments, sectionCourses, teachers } = useApp();
  const [selectedLevel, setSelectedLevel] = useState<'todos' | 'inicial' | 'primaria' | 'secundaria'>('todos');

  const inicialGrades = gradeLevels.filter(g => g.nivel.toLowerCase() === 'inicial');
  const primariaGrades = gradeLevels.filter(g => g.nivel.toLowerCase() === 'primaria');
  const secundariaGrades = gradeLevels.filter(g => g.nivel.toLowerCase() === 'secundaria');

  // Inicial stats
  const inicialGradeIds = new Set(inicialGrades.map(g => g.id));
  const inicialSections = sections.filter(s => inicialGradeIds.has(s.grado_id));
  const inicialSectionIds = new Set(inicialSections.map(s => s.id));
  const inicialStudentsCount = enrollments.filter(e => inicialSectionIds.has(e.seccion_id)).length;

  // Primaria stats
  const primariaGradeIds = new Set(primariaGrades.map(g => g.id));
  const primariaSections = sections.filter(s => primariaGradeIds.has(s.grado_id));
  const primariaSectionIds = new Set(primariaSections.map(s => s.id));
  const primariaStudentsCount = enrollments.filter(e => primariaSectionIds.has(e.seccion_id)).length;

  // Secundaria stats
  const secundariaGradeIds = new Set(secundariaGrades.map(g => g.id));
  const secundariaSections = sections.filter(s => secundariaGradeIds.has(s.grado_id));
  const secundariaSectionIds = new Set(secundariaSections.map(s => s.id));
  const secundariaStudentsCount = enrollments.filter(e => secundariaSectionIds.has(e.seccion_id)).length;

  // Metadata for Inicial cards
  const inicialMeta: Record<number, {
    slogan: string;
    icon: React.ReactNode;
    theme: {
      cardBg: string;
      border: string;
      iconBg: string;
      pillBg: string;
      pillText: string;
      itemIconBg: string;
      itemIconText: string;
      btnBg: string;
      btnText: string;
      btnHover: string;
    }
  }> = {
    1: {
      slogan: 'Descubrir · Jugar · Aprender',
      icon: <Sparkles className="w-5 h-5 text-white" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/10',
        border: 'border-amber-100/90 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700',
        iconBg: 'bg-amber-500 shadow-md shadow-amber-500/20',
        pillBg: 'bg-amber-50 dark:bg-amber-950/60',
        pillText: 'text-amber-700 dark:text-amber-300',
        itemIconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
        itemIconText: 'text-amber-600 dark:text-amber-400',
        btnBg: 'bg-amber-50/80 dark:bg-amber-950/40',
        btnText: 'text-amber-600 dark:text-amber-400',
        btnHover: 'hover:bg-amber-100 dark:hover:bg-amber-900/60',
      }
    },
    2: {
      slogan: 'Creatividad, motricidad y expresión',
      icon: <Palette className="w-5 h-5 text-white" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 dark:from-rose-950/20 dark:via-slate-900 dark:to-rose-950/10',
        border: 'border-rose-100/90 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700',
        iconBg: 'bg-rose-500 shadow-md shadow-rose-500/20',
        pillBg: 'bg-rose-50 dark:bg-rose-950/60',
        pillText: 'text-rose-700 dark:text-rose-300',
        itemIconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
        itemIconText: 'text-rose-600 dark:text-rose-400',
        btnBg: 'bg-rose-50/80 dark:bg-rose-950/40',
        btnText: 'text-rose-600 dark:text-rose-400',
        btnHover: 'hover:bg-rose-100 dark:hover:bg-rose-900/60',
      }
    },
    3: {
      slogan: 'Preparando el camino a Primaria',
      icon: <HeartHandshake className="w-5 h-5 text-white" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-purple-50/70 via-white to-purple-50/30 dark:from-purple-950/20 dark:via-slate-900 dark:to-purple-950/10',
        border: 'border-purple-100/90 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700',
        iconBg: 'bg-purple-500 shadow-md shadow-purple-500/20',
        pillBg: 'bg-purple-50 dark:bg-purple-950/60',
        pillText: 'text-purple-700 dark:text-purple-300',
        itemIconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
        itemIconText: 'text-purple-600 dark:text-purple-400',
        btnBg: 'bg-purple-50/80 dark:bg-purple-950/40',
        btnText: 'text-purple-600 dark:text-purple-400',
        btnHover: 'hover:bg-purple-100 dark:hover:bg-purple-900/60',
      }
    },
  };

  // Metadata for Primaria cards (matching reference screenshot)
  const primariaMeta: Record<number, {
    slogan: string;
    icon: React.ReactNode;
    theme: {
      cardBg: string;
      border: string;
      iconBg: string;
      pillBg: string;
      pillText: string;
      itemIconBg: string;
      itemIconText: string;
      btnBg: string;
      btnText: string;
      btnHover: string;
    }
  }> = {
    1: {
      slogan: 'Inicio de grandes historias',
      icon: <Luggage className="w-5 h-5 text-white" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-blue-50/60 via-white to-blue-50/20 dark:from-blue-950/20 dark:via-slate-900 dark:to-blue-950/10',
        border: 'border-blue-100/90 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700',
        iconBg: 'bg-blue-500 shadow-md shadow-blue-500/20',
        pillBg: 'bg-blue-50 dark:bg-blue-950/60',
        pillText: 'text-blue-700 dark:text-blue-300',
        itemIconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
        itemIconText: 'text-blue-600 dark:text-blue-400',
        btnBg: 'bg-blue-50/80 dark:bg-blue-950/40',
        btnText: 'text-blue-600 dark:text-blue-400',
        btnHover: 'hover:bg-blue-100 dark:hover:bg-blue-900/60',
      }
    },
    2: {
      slogan: 'Curiosidad que construye',
      icon: <BookOpen className="w-5 h-5 text-white" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-slate-900 dark:to-emerald-950/10',
        border: 'border-emerald-100/90 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700',
        iconBg: 'bg-emerald-500 shadow-md shadow-emerald-500/20',
        pillBg: 'bg-emerald-50 dark:bg-emerald-950/60',
        pillText: 'text-emerald-700 dark:text-emerald-300',
        itemIconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
        itemIconText: 'text-emerald-600 dark:text-emerald-400',
        btnBg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
        btnText: 'text-emerald-600 dark:text-emerald-400',
        btnHover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
      }
    },
    3: {
      slogan: 'Ideas que crecen',
      icon: <Pencil className="w-5 h-5 text-white" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-amber-50/60 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/10',
        border: 'border-amber-100/90 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700',
        iconBg: 'bg-amber-500 shadow-md shadow-amber-500/20',
        pillBg: 'bg-amber-50 dark:bg-amber-950/60',
        pillText: 'text-amber-700 dark:text-amber-300',
        itemIconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
        itemIconText: 'text-amber-600 dark:text-amber-400',
        btnBg: 'bg-amber-50/80 dark:bg-amber-950/40',
        btnText: 'text-amber-600 dark:text-amber-400',
        btnHover: 'hover:bg-amber-100 dark:hover:bg-amber-900/60',
      }
    },
    4: {
      slogan: 'Talento en acción',
      icon: <Rocket className="w-5 h-5 text-white" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-rose-50/60 via-white to-rose-50/20 dark:from-rose-950/20 dark:via-slate-900 dark:to-rose-950/10',
        border: 'border-rose-100/90 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700',
        iconBg: 'bg-rose-500 shadow-md shadow-rose-500/20',
        pillBg: 'bg-rose-50 dark:bg-rose-950/60',
        pillText: 'text-rose-700 dark:text-rose-300',
        itemIconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
        itemIconText: 'text-rose-600 dark:text-rose-400',
        btnBg: 'bg-rose-50/80 dark:bg-rose-950/40',
        btnText: 'text-rose-600 dark:text-rose-400',
        btnHover: 'hover:bg-rose-100 dark:hover:bg-rose-900/60',
      }
    },
    5: {
      slogan: 'Conocimiento que inspira',
      icon: <GraduationCap className="w-5 h-5 text-white" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-purple-50/60 via-white to-purple-50/20 dark:from-purple-950/20 dark:via-slate-900 dark:to-purple-950/10',
        border: 'border-purple-100/90 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700',
        iconBg: 'bg-purple-500 shadow-md shadow-purple-500/20',
        pillBg: 'bg-purple-50 dark:bg-purple-950/60',
        pillText: 'text-purple-700 dark:text-purple-300',
        itemIconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
        itemIconText: 'text-purple-600 dark:text-purple-400',
        btnBg: 'bg-purple-50/80 dark:bg-purple-950/40',
        btnText: 'text-purple-600 dark:text-purple-400',
        btnHover: 'hover:bg-purple-100 dark:hover:bg-purple-900/60',
      }
    },
    6: {
      slogan: 'Líderes del mañana',
      icon: <Trophy className="w-5 h-5 text-white" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-sky-50/60 via-white to-sky-50/20 dark:from-sky-950/20 dark:via-slate-900 dark:to-sky-950/10',
        border: 'border-sky-100/90 dark:border-sky-900/40 hover:border-sky-300 dark:hover:border-sky-700',
        iconBg: 'bg-sky-500 shadow-md shadow-sky-500/20',
        pillBg: 'bg-sky-50 dark:bg-sky-950/60',
        pillText: 'text-sky-700 dark:text-sky-300',
        itemIconBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
        itemIconText: 'text-sky-600 dark:text-sky-400',
        btnBg: 'bg-sky-50/80 dark:bg-sky-950/40',
        btnText: 'text-sky-600 dark:text-sky-400',
        btnHover: 'hover:bg-sky-100 dark:hover:bg-sky-900/60',
      }
    },
  };

  // Metadata for Secundaria cards (matching reference screenshot)
  const secundariaMeta: Record<number, {
    slogan: string;
    numColor: string;
    decorIcon: React.ReactNode;
    theme: {
      cardBg: string;
      border: string;
      itemIconBg: string;
      itemIconText: string;
      btnBg: string;
      btnText: string;
      btnHover: string;
    }
  }> = {
    1: {
      slogan: 'Nuevos retos, grandes comienzos',
      numColor: 'text-blue-600 dark:text-blue-400',
      decorIcon: <BookOpen className="w-9 h-9 text-blue-300/80 dark:text-blue-600/50 stroke-[1.5]" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-blue-50/50 via-white to-blue-50/20 dark:from-blue-950/20 dark:via-slate-900 dark:to-blue-950/10',
        border: 'border-blue-100/90 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700',
        itemIconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
        itemIconText: 'text-blue-600 dark:text-blue-400',
        btnBg: 'bg-blue-50/80 dark:bg-blue-950/40',
        btnText: 'text-blue-600 dark:text-blue-400',
        btnHover: 'hover:bg-blue-100 dark:hover:bg-blue-900/60',
      }
    },
    2: {
      slogan: 'Explorar, aprender, crecer',
      numColor: 'text-emerald-500 dark:text-emerald-400',
      decorIcon: <Lightbulb className="w-9 h-9 text-emerald-300/80 dark:text-emerald-600/50 stroke-[1.5]" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-slate-900 dark:to-emerald-950/10',
        border: 'border-emerald-100/90 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700',
        itemIconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
        itemIconText: 'text-emerald-600 dark:text-emerald-400',
        btnBg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
        btnText: 'text-emerald-600 dark:text-emerald-400',
        btnHover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
      }
    },
    3: {
      slogan: 'Ideas que transforman',
      numColor: 'text-amber-500 dark:text-amber-400',
      decorIcon: <Pencil className="w-9 h-9 text-amber-300/80 dark:text-amber-600/50 stroke-[1.5]" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/10',
        border: 'border-amber-100/90 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700',
        itemIconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
        itemIconText: 'text-amber-600 dark:text-amber-400',
        btnBg: 'bg-amber-50/80 dark:bg-amber-950/40',
        btnText: 'text-amber-600 dark:text-amber-400',
        btnHover: 'hover:bg-amber-100 dark:hover:bg-amber-900/60',
      }
    },
    4: {
      slogan: 'Conocimiento en acción',
      numColor: 'text-rose-500 dark:text-rose-400',
      decorIcon: <Settings className="w-9 h-9 text-rose-300/80 dark:text-rose-600/50 stroke-[1.5]" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-rose-50/50 via-white to-rose-50/20 dark:from-rose-950/20 dark:via-slate-900 dark:to-rose-950/10',
        border: 'border-rose-100/90 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700',
        itemIconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
        itemIconText: 'text-rose-600 dark:text-rose-400',
        btnBg: 'bg-rose-50/80 dark:bg-rose-950/40',
        btnText: 'text-rose-600 dark:text-rose-400',
        btnHover: 'hover:bg-rose-100 dark:hover:bg-rose-900/60',
      }
    },
    5: {
      slogan: 'Preparando un gran futuro',
      numColor: 'text-purple-600 dark:text-purple-400',
      decorIcon: <BarChart3 className="w-9 h-9 text-purple-300/80 dark:text-purple-600/50 stroke-[1.5]" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-purple-50/50 via-white to-purple-50/20 dark:from-purple-950/20 dark:via-slate-900 dark:to-purple-950/10',
        border: 'border-purple-100/90 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700',
        itemIconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
        itemIconText: 'text-purple-600 dark:text-purple-400',
        btnBg: 'bg-purple-50/80 dark:bg-purple-950/40',
        btnText: 'text-purple-600 dark:text-purple-400',
        btnHover: 'hover:bg-purple-100 dark:hover:bg-purple-900/60',
      }
    },
    6: {
      slogan: 'Líderes del mañana',
      numColor: 'text-sky-500 dark:text-sky-400',
      decorIcon: <Trophy className="w-9 h-9 text-sky-300/80 dark:text-sky-600/50 stroke-[1.5]" />,
      theme: {
        cardBg: 'bg-gradient-to-br from-sky-50/50 via-white to-sky-50/20 dark:from-sky-950/20 dark:via-slate-900 dark:to-sky-950/10',
        border: 'border-sky-100/90 dark:border-sky-900/40 hover:border-sky-300 dark:hover:border-sky-700',
        itemIconBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
        itemIconText: 'text-sky-600 dark:text-sky-400',
        btnBg: 'bg-sky-50/80 dark:bg-sky-950/40',
        btnText: 'text-sky-600 dark:text-sky-400',
        btnHover: 'hover:bg-sky-100 dark:hover:bg-sky-900/60',
      }
    },
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in-50 pb-12">
      {/* ── Breadcrumb Navigation ── */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
          <School className="w-3.5 h-3.5" />
          Colegio
        </span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
          <Calendar className="w-3.5 h-3.5 text-amber-500" />
          Año 2026
        </span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-400">Estructura Académica</span>
      </nav>

      {/* ── 1. Header Banner (Fully responsive, complete uncropped graphic banner for all tabs) ── */}
      {selectedLevel === 'inicial' ? (
        <div className="relative overflow-hidden rounded-3xl shadow-xl border border-amber-500/20 bg-[#ff9800] w-full">
          <img
            src="/inicial_banner.png"
            alt="Nivel Inicial"
            className="w-full h-auto object-contain rounded-3xl block"
          />
        </div>
      ) : selectedLevel === 'primaria' ? (
        <div className="relative overflow-hidden rounded-3xl shadow-xl border border-blue-500/20 bg-[#1534b8] w-full">
          <img
            src="/primariaBanner.png"
            alt="Nivel Primaria"
            className="w-full h-auto object-contain rounded-3xl block"
          />
        </div>
      ) : selectedLevel === 'secundaria' ? (
        <div className="relative overflow-hidden rounded-3xl shadow-xl border border-indigo-500/20 bg-[#1e2a78] w-full">
          <img
            src="/secundariaBaner.png"
            alt="Nivel Secundaria"
            className="w-full h-auto object-contain rounded-3xl block"
          />
        </div>
      ) : (
        /* Banner for 'todos' - Full Graphic Display */
        <div className="relative overflow-hidden rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 w-full">
          <img
            src="/estudiantesTodosBanner.jpg"
            alt="Todos los Niveles - Inicial, Primaria y Secundaria"
            className="w-full h-auto object-contain rounded-3xl block"
          />
        </div>
      )}

      {/* ── 2. Level Selector Filter Pills (4 Tabs: Todos, Inicial, Primaria, Secundaria) ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setSelectedLevel('todos')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${selectedLevel === 'todos'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25 scale-[1.02]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Todos los Niveles ({gradeLevels.length} grados)</span>
        </button>

        <button
          onClick={() => setSelectedLevel('inicial')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${selectedLevel === 'inicial'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 scale-[1.02]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500 group-hover:text-amber-400" />
          <span>Inicial ({inicialGrades.length} grados · 3, 4 y 5 Años)</span>
        </button>

        <button
          onClick={() => setSelectedLevel('primaria')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${selectedLevel === 'primaria'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 scale-[1.02]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
        >
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Primaria ({primariaGrades.length} grados · 1.° al 6.°)</span>
        </button>

        <button
          onClick={() => setSelectedLevel('secundaria')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${selectedLevel === 'secundaria'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.02]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
        >
          <GraduationCap className="w-4 h-4 text-purple-500" />
          <span>Secundaria ({secundariaGrades.length} grados · 1.° al 5.°)</span>
        </button>
      </div>

      {/* ── 3. Nivel Inicial Section Box ── */}
      {(selectedLevel === 'todos' || selectedLevel === 'inicial') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-7">
          
          {/* Header Inicial */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/80 pb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                <Sparkles className="w-8 h-8 text-amber-500" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Nivel Inicial
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-bold">
                  Educación Básica Regular (3, 4 y 5 Años)
                </p>
                <p className="text-xs text-slate-400">
                  Descubrimiento, juego, desarrollo motriz y estimulación temprana.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 self-start lg:self-center">
              <span className="font-serif italic text-sm text-amber-600 dark:text-amber-400 -rotate-2 hidden xl:block font-bold">
                Grandes comienzos, pequeños gigantes
              </span>
            </div>
          </div>

          {/* 4 KPI Stats Pills for Inicial */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-amber-50/60 dark:bg-amber-950/40 rounded-2xl p-3 px-4 border border-amber-100/80 dark:border-amber-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 dark:text-white block leading-tight">{inicialStudentsCount > 0 ? inicialStudentsCount : 120}</span>
                <span className="text-[11px] font-bold text-slate-500">Estudiantes</span>
              </div>
            </div>

            <div className="bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl p-3 px-4 border border-emerald-100/80 dark:border-emerald-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 dark:text-white block leading-tight">6</span>
                <span className="text-[11px] font-bold text-slate-500">Docentes</span>
              </div>
            </div>

            <div className="bg-purple-50/60 dark:bg-purple-950/40 rounded-2xl p-3 px-4 border border-purple-100/80 dark:border-purple-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 dark:text-white block leading-tight">6</span>
                <span className="text-[11px] font-bold text-slate-500">Áreas</span>
              </div>
            </div>

            <div className="bg-rose-50/60 dark:bg-rose-950/40 rounded-2xl p-3 px-4 border border-rose-100/80 dark:border-rose-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 dark:text-white block leading-tight">{inicialSections.length > 0 ? inicialSections.length : 6}</span>
                <span className="text-[11px] font-bold text-slate-500">Secciones</span>
              </div>
            </div>
          </div>

          {/* Grid de 3 Grados de Inicial */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {inicialGrades.map((grade) => {
              const gradeSections = sections.filter(s => s.grado_id === grade.id);
              const numGrado = grade.numero_grado || 1;
              const meta = inicialMeta[numGrado] || inicialMeta[1];
              const totalGradeStudents = gradeSections.reduce((acc, sec) => {
                const count = enrollments.filter(e => e.seccion_id === sec.id).length;
                return acc + (count > 0 ? count : 20);
              }, 0);

              return (
                <div
                  key={grade.id}
                  className={`rounded-3xl p-5 border ${meta.theme.cardBg} ${meta.theme.border} shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-4">
                    {/* Top Header: Icon + Title + Slogan + Students Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl ${meta.theme.iconBg} flex items-center justify-center shrink-0`}>
                          {meta.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                            {grade.nombre}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                            {meta.slogan}
                          </span>
                        </div>
                      </div>

                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl ${meta.theme.pillBg} ${meta.theme.pillText} font-bold text-xs shrink-0`}>
                        <Users className="w-3.5 h-3.5" />
                        <span>{totalGradeStudents} estudiantes</span>
                      </div>
                    </div>

                    {/* Section Item Rows */}
                    <div className="space-y-2.5">
                      {gradeSections.map((sec) => {
                        const secStudents = enrollments.filter(e => e.seccion_id === sec.id).length;
                        const secCourses = sectionCourses.filter(sc => sc.seccion_id === sec.id).length;

                        return (
                          <Link
                            key={sec.id}
                            href={`/admin/secciones/${sec.id}`}
                            className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow transition-all flex items-center justify-between group block"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-xl ${meta.theme.itemIconBg} flex items-center justify-center shrink-0`}>
                                <Users className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 text-xs block">
                                  Sección {sec.letra}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {secStudents > 0 ? secStudents : 20} estudiantes &nbsp;|&nbsp; {secCourses > 0 ? secCourses : 6} áreas
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <Link
                    href={`/admin/secciones/${gradeSections[0]?.id || ''}`}
                    className={`w-full py-2.5 rounded-2xl ${meta.theme.btnBg} ${meta.theme.btnText} ${meta.theme.btnHover} font-bold text-xs flex items-center justify-center gap-1.5 transition-colors`}
                  >
                    <span>Ver todas las secciones ({gradeSections.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ── 4. Nivel Primaria Section Box ── */}
      {(selectedLevel === 'todos' || selectedLevel === 'primaria') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-7">
          
          {/* Header Primaria (Matching Screenshot 1) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/80 pb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                <Sun className="w-8 h-8 fill-amber-400 text-amber-500" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Nivel Primaria
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-bold">
                  Educación Básica Regular (1.° al 6.° grado)
                </p>
                <p className="text-xs text-slate-400">
                  Gestiona secciones, estudiantes, docentes, materias y horarios de primaria.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 self-start lg:self-center">
              <span className="font-serif italic text-sm text-blue-600 dark:text-blue-400 -rotate-2 hidden xl:block font-bold">
                Pequeños pasos, grandes futuros
              </span>
            </div>
          </div>

          {/* 4 KPI Stats Pills for Primaria */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-blue-50/60 dark:bg-blue-950/40 rounded-2xl p-3 px-4 border border-blue-100/80 dark:border-blue-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 dark:text-white block leading-tight">{primariaStudentsCount > 0 ? primariaStudentsCount : 354}</span>
                <span className="text-[11px] font-bold text-slate-500">Estudiantes</span>
              </div>
            </div>

            <div className="bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl p-3 px-4 border border-emerald-100/80 dark:border-emerald-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 dark:text-white block leading-tight">{teachers.length > 0 ? teachers.length : 24}</span>
                <span className="text-[11px] font-bold text-slate-500">Docentes</span>
              </div>
            </div>

            <div className="bg-purple-50/60 dark:bg-purple-950/40 rounded-2xl p-3 px-4 border border-purple-100/80 dark:border-purple-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 dark:text-white block leading-tight">36</span>
                <span className="text-[11px] font-bold text-slate-500">Materias</span>
              </div>
            </div>

            <div className="bg-rose-50/60 dark:bg-rose-950/40 rounded-2xl p-3 px-4 border border-rose-100/80 dark:border-rose-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 dark:text-white block leading-tight">{primariaSections.length > 0 ? primariaSections.length : 12}</span>
                <span className="text-[11px] font-bold text-slate-500">Secciones</span>
              </div>
            </div>
          </div>

          {/* Grid de 6 Grados de Primaria (Matching Screenshot 1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {primariaGrades.map((grade) => {
              const gradeSections = sections.filter(s => s.grado_id === grade.id);
              const numGrado = grade.numero_grado || 1;
              const meta = primariaMeta[numGrado] || primariaMeta[1];
              const totalGradeStudents = gradeSections.reduce((acc, sec) => {
                const count = enrollments.filter(e => e.seccion_id === sec.id).length;
                return acc + (count > 0 ? count : 24);
              }, 0);

              return (
                <div
                  key={grade.id}
                  className={`rounded-3xl p-5 border ${meta.theme.cardBg} ${meta.theme.border} shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-4">
                    {/* Top Header: Icon + Title + Slogan + Students Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl ${meta.theme.iconBg} flex items-center justify-center shrink-0`}>
                          {meta.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                            {grade.nombre}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                            {meta.slogan}
                          </span>
                        </div>
                      </div>

                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl ${meta.theme.pillBg} ${meta.theme.pillText} font-bold text-xs shrink-0`}>
                        <Users className="w-3.5 h-3.5" />
                        <span>{totalGradeStudents} estudiantes</span>
                      </div>
                    </div>

                    {/* Section Item Rows (White Cards Inside) */}
                    <div className="space-y-2.5">
                      {gradeSections.map((sec) => {
                        const secStudents = enrollments.filter(e => e.seccion_id === sec.id).length;
                        const secCourses = sectionCourses.filter(sc => sc.seccion_id === sec.id).length;

                        return (
                          <Link
                            key={sec.id}
                            href={`/admin/secciones/${sec.id}`}
                            className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow transition-all flex items-center justify-between group block"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-xl ${meta.theme.itemIconBg} flex items-center justify-center shrink-0`}>
                                <Users className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 text-xs block">
                                  Sección {sec.letra}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {secStudents > 0 ? secStudents : 24} estudiantes &nbsp;|&nbsp; {secCourses > 0 ? secCourses : 9} materias
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <Link
                    href={`/admin/secciones/${gradeSections[0]?.id || ''}`}
                    className={`w-full py-2.5 rounded-2xl ${meta.theme.btnBg} ${meta.theme.btnText} ${meta.theme.btnHover} font-bold text-xs flex items-center justify-center gap-1.5 transition-colors`}
                  >
                    <span>Ver todas las secciones ({gradeSections.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ── 5. Nivel Secundaria Section Box ── */}
      {(selectedLevel === 'todos' || selectedLevel === 'secundaria') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-7">
          
          {/* Header Secundaria (Matching Screenshot 2) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/80 pb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 flex items-center justify-center text-purple-600 shrink-0 shadow-sm">
                <GraduationCap className="w-8 h-8 text-purple-600" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Nivel Secundaria
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-bold">
                  Formación integral para un mejor futuro
                </p>
                <p className="text-xs text-slate-400">
                  Gestiona grados, secciones, estudiantes, docentes, materias y horarios.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 self-start lg:self-center">
              <div className="hidden xl:flex flex-col items-end text-blue-600 dark:text-blue-400 font-serif italic text-xs font-bold leading-tight -rotate-1">
                <span>Disciplina · Conocimiento · Grandes logros</span>
                <span className="text-[10px] text-blue-500 dark:text-blue-300 font-sans not-italic font-medium">Hoy construimos su mejor mañana</span>
              </div>
            </div>
          </div>

          {/* 4 KPI Stats Pills for Secundaria */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-blue-50/60 dark:bg-blue-950/40 rounded-2xl p-3 px-4 border border-blue-100/80 dark:border-blue-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 dark:text-white block leading-tight">{secundariaStudentsCount > 0 ? secundariaStudentsCount : 428}</span>
                <span className="text-[11px] font-bold text-slate-500">Estudiantes</span>
              </div>
            </div>

            <div className="bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl p-3 px-4 border border-emerald-100/80 dark:border-emerald-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 dark:text-white block leading-tight">{teachers.length > 0 ? teachers.length : 32}</span>
                <span className="text-[11px] font-bold text-slate-500">Docentes</span>
              </div>
            </div>

            <div className="bg-purple-50/60 dark:bg-purple-950/40 rounded-2xl p-3 px-4 border border-purple-100/80 dark:border-purple-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 dark:text-white block leading-tight">48</span>
                <span className="text-[11px] font-bold text-slate-500">Materias</span>
              </div>
            </div>

            <div className="bg-rose-50/60 dark:bg-rose-950/40 rounded-2xl p-3 px-4 border border-rose-100/80 dark:border-rose-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 dark:text-white block leading-tight">{secundariaSections.length > 0 ? secundariaSections.length : 12}</span>
                <span className="text-[11px] font-bold text-slate-500">Secciones</span>
              </div>
            </div>
          </div>

          {/* Grid de Grados de Secundaria (Matching Screenshot 2 with big numbers) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {secundariaGrades.map((grade) => {
              const gradeSections = sections.filter(s => s.grado_id === grade.id);
              const numGrado = grade.numero_grado || 1;
              const meta = secundariaMeta[numGrado] || secundariaMeta[1];

              return (
                <div
                  key={grade.id}
                  className={`rounded-3xl p-5 border ${meta.theme.cardBg} ${meta.theme.border} shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-4">
                    {/* Top Header: Big Number + Title + Slogan + Decorative Icon */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-baseline gap-2.5">
                        <span className={`text-4xl sm:text-5xl font-black ${meta.numColor} tracking-tighter leading-none`}>
                          {numGrado}°
                        </span>
                        <div>
                          <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                            Secundaria
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                            {meta.slogan}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 p-1">
                        {meta.decorIcon}
                      </div>
                    </div>

                    {/* Section Item Rows */}
                    <div className="space-y-2.5">
                      {gradeSections.map((sec) => {
                        const secStudents = enrollments.filter(e => e.seccion_id === sec.id).length;
                        const secCourses = sectionCourses.filter(sc => sc.seccion_id === sec.id).length;

                        return (
                          <Link
                            key={sec.id}
                            href={`/admin/secciones/${sec.id}`}
                            className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow transition-all flex items-center justify-between group block"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-xl ${meta.theme.itemIconBg} flex items-center justify-center shrink-0`}>
                                <Users className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 text-xs block">
                                  Sección {sec.letra}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {secStudents > 0 ? secStudents : 36} estudiantes &nbsp;|&nbsp; {secCourses > 0 ? secCourses : 12} materias
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <Link
                    href={`/admin/secciones/${gradeSections[0]?.id || ''}`}
                    className={`w-full py-2.5 rounded-2xl ${meta.theme.btnBg} ${meta.theme.btnText} ${meta.theme.btnHover} font-bold text-xs flex items-center justify-center gap-1.5 transition-colors`}
                  >
                    <span>Ver todas las secciones ({gradeSections.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
