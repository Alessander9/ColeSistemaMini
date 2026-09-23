'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  HeartHandshake,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Award,
  Hash,
  Layers,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  UploadCloud,
  Image as ImageIcon,
  Link2,
  RotateCcw,
  X
} from 'lucide-react';
import { CourseFormModal } from '@/components/academico/CourseFormModal';
import { SectionFormModal } from '@/components/academico/SectionFormModal';
import { BannerImageEditor } from '@/components/ui/BannerImageEditor';
import { Course, Section, EducationalLevel } from '@/types';

export default function AdminAcademicoPage() {
  const { 
    gradeLevels, 
    sections, 
    enrollments, 
    sectionCourses, 
    teachers, 
    courses, 
    deleteCourse,
    evaluationPeriods,
    updateEvaluationPeriod,
    toggleClosePeriod,
    preloadOfficialCnebCurriculum,
    deleteSection,
    assignSectionTutor,
    brandingConfig,
    updateBrandingConfig
  } = useApp();

  const searchParams = useSearchParams();

  // Estado del panel de personalización de imágenes de banners
  const [isBannerEditorOpen, setIsBannerEditorOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'todos' | 'inicial' | 'primaria' | 'secundaria'>('todos');
  const [activeMainTab, setActiveMainTab] = useState<'grados' | 'cursos' | 'periodos'>('grados');
  const [courseSearch, setCourseSearch] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'cursos' || tabParam === 'grados' || tabParam === 'periodos') {
      setActiveMainTab(tabParam);
    }
  }, [searchParams]);
  
  // Modal de Curso
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Modal de Sección
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<Section | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);

  // Modal de Precarga CNEB
  const [isCnebPreloadModalOpen, setIsCnebPreloadModalOpen] = useState(false);

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

      {/* ── 1. Header Banner (Fully responsive, personalized via branding, per level) ── */}
      {selectedLevel === 'inicial' ? (
        <div className="relative overflow-hidden rounded-3xl shadow-xl border border-amber-500/20 bg-[#ff9800] w-full">
          <img
            src={brandingConfig.academicBannerInicialUrl || '/inicial_banner.png'}
            alt="Nivel Inicial"
            className="w-full h-auto object-contain rounded-3xl block"
          />
        </div>
      ) : selectedLevel === 'primaria' ? (
        <div className="relative overflow-hidden rounded-3xl shadow-xl border border-blue-500/20 bg-[#1534b8] w-full">
          <img
            src={brandingConfig.academicBannerPrimariaUrl || '/primariaBanner.png'}
            alt="Nivel Primaria"
            className="w-full h-auto object-contain rounded-3xl block"
          />
        </div>
      ) : selectedLevel === 'secundaria' ? (
        <div className="relative overflow-hidden rounded-3xl shadow-xl border border-indigo-500/20 bg-[#1e2a78] w-full">
          <img
            src={brandingConfig.academicBannerSecundariaUrl || '/secundariaBaner.png'}
            alt="Nivel Secundaria"
            className="w-full h-auto object-contain rounded-3xl block"
          />
        </div>
      ) : (
        /* Banner for 'todos' - Full Graphic Display */
        <div className="relative overflow-hidden rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 w-full">
          <img
            src={brandingConfig.academicBannerTodosUrl || '/estudiantesTodosBanner.jpg'}
            alt="Todos los Niveles - Inicial, Primaria y Secundaria"
            className="w-full h-auto object-contain rounded-3xl block"
          />
        </div>
      )}

      {/* ── 2. Main Module Navigation Tabs (Grados vs Cursos vs Periodos) + Action CTAs ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveMainTab('grados')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'grados'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <School className="w-4 h-4" />
            <span>1. Aulas & Grados ({sections.length} Salones)</span>
          </button>

          <button
            onClick={() => setActiveMainTab('cursos')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'cursos'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Catálogo de Cursos ({courses.length} Asignaturas)</span>
          </button>

          <button
            onClick={() => setActiveMainTab('periodos')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'periodos'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>3. Periodos Lectivos ({evaluationPeriods.length} Bimestres)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsBannerEditorOpen(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-black text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Personalizar las imágenes de banner de Inicial, Primaria, Secundaria y Todos los Niveles"
          >
            <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Personalizar Imágenes</span>
          </button>

          <button
            onClick={() => setIsCnebPreloadModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Precargar el Currículo Nacional de la Educación Básica (MINEDU)"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>⚡ Precargar CNEB Oficial</span>
          </button>

          <button
            onClick={() => {
              setSectionToEdit(null);
              setIsSectionModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Salón</span>
          </button>

          <button
            onClick={() => {
              setCourseToEdit(null);
              setIsCourseModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-600/25 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Curso</span>
          </button>
        </div>
      </div>

      {/* ── 3. Level Selector Filter Pills (4 Tabs: Todos, Inicial, Primaria, Secundaria) ── */}
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

      {/* ── 4. Vista Condicional: Grados y Aulas vs Catálogo de Cursos ── */}
      {activeMainTab === 'grados' ? (
        <div className="space-y-7">
          {/* ── Nivel Inicial Section Box ── */}
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
                      Educación Inicial
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                      Desarrollo integral de la primera infancia (3, 4 y 5 años) a través del juego, estimulación temprana y exploración guiada.
                    </p>
                  </div>
                </div>

                {/* Stat Badges */}
                <div className="flex items-center gap-3 self-start lg:self-center flex-wrap">
                  <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
                    <School className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aulas Activas</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">{inicialSections.length} Secciones</div>
                    </div>
                  </div>

                  <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estudiantes</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">{inicialStudentsCount} Niños</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Grades Grid for Inicial */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {inicialGrades.map((grade) => {
                  const gradeSections = sections.filter(s => s.grado_id === grade.id);
                  const numGrado = grade.numero_grado;
                  const meta = inicialMeta[numGrado] || inicialMeta[1];

                  return (
                    <div
                      key={grade.id}
                      className={`p-6 rounded-3xl ${meta.theme.cardBg} border ${meta.theme.border} shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6 group`}
                    >
                      <div className="space-y-4">
                        {/* Top Badge & Number */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl ${meta.theme.iconBg} flex items-center justify-center shrink-0`}>
                              {meta.icon}
                            </div>
                            <div>
                              <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                                {grade.nombre}
                              </h3>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                                {meta.slogan}
                              </span>
                            </div>
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
                                      {secStudents > 0 ? secStudents : 22} alumnos &nbsp;|&nbsp; {secCourses > 0 ? secCourses : 6} materias
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

          {/* ── Nivel Primaria Section Box ── */}
          {(selectedLevel === 'todos' || selectedLevel === 'primaria') && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-7">
              {/* Header Primaria */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/80 pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      Educación Primaria
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                      Formación integral de 1.° a 6.° grado: competencias fundamentales, pensamiento analítico y valores cívicos.
                    </p>
                  </div>
                </div>

                {/* Stat Badges */}
                <div className="flex items-center gap-3 self-start lg:self-center flex-wrap">
                  <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
                    <School className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aulas Activas</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">{primariaSections.length} Secciones</div>
                    </div>
                  </div>

                  <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estudiantes</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">{primariaStudentsCount} Alumnos</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 Grades Grid for Primaria */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {primariaGrades.map((grade) => {
                  const gradeSections = sections.filter(s => s.grado_id === grade.id);
                  const numGrado = grade.numero_grado;
                  const meta = primariaMeta[numGrado] || primariaMeta[1];

                  return (
                    <div
                      key={grade.id}
                      className={`p-6 rounded-3xl ${meta.theme.cardBg} border ${meta.theme.border} shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6 group`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl ${meta.theme.iconBg} flex items-center justify-center shrink-0`}>
                              {meta.icon}
                            </div>
                            <div>
                              <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                                {grade.nombre}
                              </h3>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                                {meta.slogan}
                              </span>
                            </div>
                          </div>
                        </div>

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
                                      {secStudents > 0 ? secStudents : 30} alumnos &nbsp;|&nbsp; {secCourses > 0 ? secCourses : 10} materias
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                              </Link>
                            );
                          })}
                        </div>
                      </div>

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

          {/* ── Nivel Secundaria Section Box ── */}
          {(selectedLevel === 'todos' || selectedLevel === 'secundaria') && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-7">
              {/* Header Secundaria */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/80 pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 flex items-center justify-center text-purple-600 shrink-0 shadow-sm">
                    <GraduationCap className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      Educación Secundaria
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                      Preparación académica avanzada de 1.° a 5.° de secundaria con enfoque en ciencias, humanidades y competencias del siglo XXI.
                    </p>
                  </div>
                </div>

                {/* Stat Badges */}
                <div className="flex items-center gap-3 self-start lg:self-center flex-wrap">
                  <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
                    <School className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aulas Activas</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">{secundariaSections.length} Secciones</div>
                    </div>
                  </div>

                  <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estudiantes</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">{secundariaStudentsCount} Alumnos</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5 Grades Grid for Secundaria */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {secundariaGrades.map((grade) => {
                  const gradeSections = sections.filter(s => s.grado_id === grade.id);
                  const numGrado = grade.numero_grado;
                  const meta = secundariaMeta[numGrado] || secundariaMeta[1];

                  return (
                    <div
                      key={grade.id}
                      className={`p-6 rounded-3xl ${meta.theme.cardBg} border ${meta.theme.border} shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6 group`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className={`text-2xl font-black ${meta.numColor} tracking-tight`}>
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
      ) : (
        /* ── VISTA: CATÁLOGO DE CURSOS Y MATERIAS ── */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          {/* Header de Cursos */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-purple-600" />
                Catálogo de Cursos & Asignaturas Escolares
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Gestiona las materias oficiales, sus competencias CNEB y los profesores asignados por nivel.
              </p>
            </div>

            {/* Buscador de Cursos */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Buscar por nombre, código o área..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Grid de Cursos */}
          {(() => {
            const filtered = courses.filter((c) => {
              const matchesLvl = selectedLevel === 'todos' || c.nivel === selectedLevel;
              const matchesQ = 
                c.nombre.toLowerCase().includes(courseSearch.toLowerCase()) ||
                c.codigo.toLowerCase().includes(courseSearch.toLowerCase()) ||
                (c.area_curricular || '').toLowerCase().includes(courseSearch.toLowerCase());
              return matchesLvl && matchesQ;
            });

            if (filtered.length === 0) {
              return (
                <div className="p-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                  <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No se encontraron cursos</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {courseSearch ? 'No hay asignaturas que coincidan con la búsqueda.' : 'Aún no hay cursos registrados para este nivel.'}
                  </p>
                  <button
                    onClick={() => {
                      setCourseToEdit(null);
                      setIsCourseModalOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow transition-all cursor-pointer"
                  >
                    + Crear Primer Curso
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((course) => {
                  const assignedTeachers = sectionCourses
                    .filter(sc => sc.curso_id === course.id)
                    .map(sc => {
                      const doc = teachers.find(t => t.id === sc.docente_id);
                      const sec = sections.find(s => s.id === sc.seccion_id);
                      return { doc, sec, sc };
                    });

                  const uniqueTeachers = Array.from(
                    new Set(assignedTeachers.map(a => a.doc?.id).filter(Boolean))
                  ).map(id => teachers.find(t => t.id === id)).filter(Boolean);

                  const courseColor = course.color_hex || course.color || '#4f46e5';

                  return (
                    <div
                      key={course.id}
                      className="p-5 rounded-3xl bg-slate-50/60 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      {/* Top Bar with Badges */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span 
                            className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-xs flex items-center gap-1.5"
                            style={{ backgroundColor: courseColor }}
                          >
                            <Hash className="w-3 h-3" />
                            {course.codigo}
                          </span>

                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            course.nivel === 'inicial'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : course.nivel === 'primaria'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          }`}>
                            {course.nivel}
                          </span>
                        </div>

                        {/* Title & Area */}
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                          {course.nombre}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-semibold">
                          <span>{course.area_curricular || 'Área General'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                            <Clock className="w-3 h-3 text-purple-500" />
                            {course.horas_semanales_sugeridas || 4} hrs/sem
                          </span>
                        </div>

                        {/* Competencias CNEB */}
                        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Award className="w-3 h-3 text-indigo-500" />
                            {course.competencias?.length || 0} Competencias CNEB
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {course.competencias && course.competencias.length > 0 ? (
                              course.competencias.slice(0, 4).map((comp, cIdx) => (
                                <span
                                  key={comp.id || cIdx}
                                  title={comp.descripcion}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[200px]"
                                >
                                  {comp.codigo}: {comp.descripcion}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Sin competencias registradas</span>
                            )}
                            {(course.competencias?.length || 0) > 4 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                +{(course.competencias?.length || 0) - 4} más
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Docentes Asignados */}
                        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-purple-500" />
                            Plana Docente Asignada
                          </div>
                          {uniqueTeachers.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {uniqueTeachers.map((t) => (
                                <span
                                  key={t?.id}
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 flex items-center gap-1"
                                >
                                  👨‍🏫 {t?.apellidos}, {t?.nombres.split(' ')[0]}
                                </span>
                              ))}
                              <span className="text-[10px] text-slate-400 font-medium ml-1">
                                ({assignedTeachers.length} aulas)
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                                ⚠️ Sin docente asignado
                              </span>
                              <Link
                                href="/admin/docentes"
                                className="text-[10px] font-black text-amber-700 hover:underline"
                              >
                                Asignar &rarr;
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                        <Link
                          href="/admin/docentes"
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 transition-colors flex items-center gap-1"
                        >
                          <GraduationCap className="w-3 h-3" />
                          <span>Asignar</span>
                        </Link>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setCourseToEdit(course);
                              setIsCourseModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Editar curso y competencias"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCourseToDelete(course)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Eliminar curso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── 3. PESTAÑA: PERIODOS LECTIVOS & CIERRE DE BIMESTRES (CNEB) ── */}
      {activeMainTab === 'periodos' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-6 h-6 text-emerald-600" />
                Gestión de Periodos de Evaluación (Bimestres 2026)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apertura y cierre de bimestres para el ingreso oficial de notas por competencias y conclusiones descriptivas CNEB.
              </p>
            </div>
            <div className="px-4 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Año Académico 2026 Activo
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {evaluationPeriods.map((period) => {
              const isClosed = !!period.cerrado;
              const isActive = !!period.activo;

              return (
                <div
                  key={period.id}
                  className={`rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                    isClosed
                      ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-90'
                      : isActive
                      ? 'bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/20 border-emerald-300 dark:border-emerald-800 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        isClosed 
                          ? 'bg-rose-100 text-rose-700' 
                          : isActive 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isClosed ? '🔒 Cerrado' : isActive ? '🟢 En Curso (Activo)' : '⚪ Programado'}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        N° {period.numero_periodo}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {period.nombre}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isClosed 
                          ? 'Las calificaciones están bloqueadas y no pueden ser editadas por docentes.'
                          : 'Periodo habilitado para el registro de calificaciones.'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-400">Inicio:</span>
                        <span className="font-bold">{period.fecha_inicio}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-400">Cierre:</span>
                        <span className="font-bold">{period.fecha_fin}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() => toggleClosePeriod(period.id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isClosed
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20'
                      }`}
                    >
                      {isClosed ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          <span>Reabrir Bimestre</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Cerrar Bimestre</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL: PERSONALIZAR IMÁGENES DE BANNERS (Estructura Académica) ── */}
      {isBannerEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="sticky top-0 z-10 p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 flex items-center justify-between rounded-t-3xl bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Personalizar Imágenes de Estructura Académica
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configura el banner de cada nivel con una URL o subiendo un archivo (se comprime automáticamente)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBannerEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: 4 banners */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <BannerImageEditor
                label="Banner: Todos los Niveles"
                description="Vista general de la estructura académica"
                currentUrl={brandingConfig.academicBannerTodosUrl}
                defaultUrl="/estudiantesTodosBanner.jpg"
                fallbackColor="#6366f1"
                onChange={(url) => updateBrandingConfig({ academicBannerTodosUrl: url })}
              />
              <BannerImageEditor
                label="Banner: Nivel Inicial"
                description="Encabezado del nivel inicial (3, 4 y 5 años)"
                currentUrl={brandingConfig.academicBannerInicialUrl}
                defaultUrl="/inicial_banner.png"
                fallbackColor="#f59e0b"
                onChange={(url) => updateBrandingConfig({ academicBannerInicialUrl: url })}
              />
              <BannerImageEditor
                label="Banner: Nivel Primaria"
                description="Encabezado del nivel primaria (1.° a 6.°)"
                currentUrl={brandingConfig.academicBannerPrimariaUrl}
                defaultUrl="/primariaBanner.png"
                fallbackColor="#2563eb"
                onChange={(url) => updateBrandingConfig({ academicBannerPrimariaUrl: url })}
              />
              <BannerImageEditor
                label="Banner: Nivel Secundaria"
                description="Encabezado del nivel secundaria (1.° a 5.°)"
                currentUrl={brandingConfig.academicBannerSecundariaUrl}
                defaultUrl="/secundariaBaner.png"
                fallbackColor="#7c3aed"
                onChange={(url) => updateBrandingConfig({ academicBannerSecundariaUrl: url })}
              />
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between rounded-b-3xl">
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Los cambios se aplican y guardan automáticamente.
              </p>
              <button
                onClick={() => setIsBannerEditorOpen(false)}
                className="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all active:scale-95"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REGISTRAR / EDITAR CURSO ── */}
      <CourseFormModal
        isOpen={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false);
          setCourseToEdit(null);
        }}
        courseToEdit={courseToEdit}
        defaultLevel={selectedLevel === 'todos' ? 'primaria' : selectedLevel}
      />

      {/* ── MODAL: CREAR / EDITAR SALÓN O SECCIÓN ── */}
      <SectionFormModal
        isOpen={isSectionModalOpen}
        onClose={() => {
          setIsSectionModalOpen(false);
          setSectionToEdit(null);
        }}
        sectionToEdit={sectionToEdit}
      />

      {/* ── MODAL DE CONFIRMACIÓN DE PRECARGA CNEB ── */}
      {isCnebPreloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                ¿Precargar Currículo CNEB Oficial (MINEDU)?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Se cargarán automáticamente todas las áreas y competencias oficiales para <strong>Inicial, Primaria y Secundaria</strong> según la Resolución Ministerial del MINEDU. Los cursos ya existentes no se duplicarán.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-semibold">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-amber-800 font-black">Inicial</p>
                <p className="text-[10px] text-amber-600">5 Asignaturas</p>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-blue-800 font-black">Primaria</p>
                <p className="text-[10px] text-blue-600">8 Asignaturas</p>
              </div>
              <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-200">
                <p className="text-indigo-800 font-black">Secundaria</p>
                <p className="text-[10px] text-indigo-600">10 Asignaturas</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                onClick={() => setIsCnebPreloadModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  preloadOfficialCnebCurriculum();
                  setIsCnebPreloadModalOpen(false);
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Confirmar y Precargar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE SECCIÓN ── */}
      {sectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                ¿Eliminar el salón {sectionToDelete.grado?.nombre} &quot;{sectionToDelete.letra}&quot;?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esta acción eliminará el aula y desvinculará sus horarios y asignaciones de cursos.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSectionToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteSection(sectionToDelete.id);
                  setSectionToDelete(null);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors"
              >
                Sí, Eliminar Salón
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE CURSO ── */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                ¿Eliminar el curso &quot;{courseToDelete.nombre}&quot;?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esta acción eliminará la materia y sus competencias asociadas. Si existen horarios o asignaciones de docentes vinculadas a este curso, también serán removidas.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteCourse(courseToDelete.id);
                  setCourseToDelete(null);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors"
              >
                Sí, Eliminar Curso
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
