'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { TaskAssignment, TaskSubmission, Student } from '@/types';
import {
  Clock,
  BookOpen,
  CheckCircle2,
  Upload,
  Paperclip,
  FileText,
  X,
  FileCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Search,
  Hourglass,
  Star,
  Target,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Leaf,
  Activity,
  Users,
  Palette,
  Languages,
  Cpu,
  Heart,
  MoreVertical,
  LayoutList,
  LayoutGrid,
  Award,
  BookMarked,
  Filter,
  Check,
  HelpCircle,
  ExternalLink,
  Download,
  AlertTriangle,
  GraduationCap,
  Zap,
  SlidersHorizontal,
  RefreshCw,
  Image as ImageIcon,
  CheckCheck,
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import {
  compressFile,
  formatBytes,
  CompressionPreset,
  CompressionResult
} from '@/lib/services/compressionService';

interface TareasEscolaresViewProps {
  isApoderado?: boolean;
}

export function TareasEscolaresView({ isApoderado = false }: TareasEscolaresViewProps) {
  const {
    tasks,
    submissions,
    submitTask,
    enrollments,
    currentUser,
    students,
    courses,
    grades,
    scheduleSlots,
    showToast,
    brandingConfig
  } = useApp();

  // Multi-child selection for Apoderado role
  const childrenList = useMemo(() => {
    if (isApoderado) {
      if (currentUser?.rol === 'admin') return students;
      const email = currentUser?.email?.toLowerCase().trim();
      const phone = currentUser?.telefono?.trim();
      const name = `${currentUser?.nombres || ''} ${currentUser?.apellidos || ''}`.toLowerCase().trim();
      const matched = students.filter(s => {
        const matchEmail = s.email_apoderado && email && s.email_apoderado.toLowerCase().trim() === email;
        const matchPhone = s.telefono_apoderado && phone && s.telefono_apoderado.trim() === phone;
        const matchName = s.nombre_apoderado && name && (s.nombre_apoderado.toLowerCase().includes(name) || name.includes(s.nombre_apoderado.toLowerCase()));
        return matchEmail || matchPhone || matchName;
      });
      return matched.length > 0 ? matched : students;
    }
    return [];
  }, [isApoderado, students, currentUser]);

  const [selectedChildId, setSelectedChildId] = useState<string>(() => {
    if (isApoderado && childrenList.length > 0) {
      return childrenList[0].id;
    }
    const studentUser = students.find(s => s.profile_id === currentUser.id || s.id === currentUser.id);
    return studentUser?.id || '';
  });

  // Keep selected child in sync if childrenList changes
  useEffect(() => {
    if (isApoderado && childrenList.length > 0 && !childrenList.some(c => c.id === selectedChildId)) {
      setSelectedChildId(childrenList[0].id);
    }
  }, [isApoderado, childrenList, selectedChildId]);

  const activeStudent = useMemo(() => {
    if (isApoderado) {
      return childrenList.find(s => s.id === selectedChildId) || childrenList[0] || null;
    }
    return students.find(s => s.profile_id === currentUser.id || s.id === currentUser.id) || null;
  }, [isApoderado, selectedChildId, childrenList, students, currentUser]);

  const activeEnrollment = useMemo(() => {
    if (!activeStudent?.id) return null;
    return enrollments.find(e => e.estudiante_id === activeStudent.id) || null;
  }, [enrollments, activeStudent]);

  // State
  const [activeFilter, setActiveFilter] = useState<'todas' | 'pendientes' | 'entregadas' | 'calificadas'>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'proxima' | 'lejana' | 'materia' | 'estado'>('proxima');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Modals state
  const [selectedTaskToSubmit, setSelectedTaskToSubmit] = useState<TaskAssignment | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskAssignment | null>(null);
  const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isResourcesModalOpen, setIsResourcesModalOpen] = useState(false);

  // Submission Form & Compressor State
  const [comment, setComment] = useState('');
  const [rawSelectedFile, setRawSelectedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressionPreset, setCompressionPreset] = useState<CompressionPreset>('balanced');
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [useCompressedFile, setUseCompressedFile] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Subject helper to get iconic colors & icon
  const getSubjectMeta = (courseName?: string) => {
    const name = (courseName || '').toLowerCase();
    if (name.includes('matem')) {
      return {
        icon: Calculator,
        bgColor: 'bg-blue-100 dark:bg-blue-900/60',
        textColor: 'text-blue-600 dark:text-blue-300',
        badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80',
        borderColor: 'border-blue-200 dark:border-blue-800'
      };
    }
    if (name.includes('comunic')) {
      return {
        icon: BookOpen,
        bgColor: 'bg-purple-100 dark:bg-purple-900/60',
        textColor: 'text-purple-600 dark:text-purple-300',
        badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80',
        borderColor: 'border-purple-200 dark:border-purple-800'
      };
    }
    if (name.includes('cienc') || name.includes('cta') || name.includes('tecnol')) {
      return {
        icon: Leaf,
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/60',
        textColor: 'text-emerald-600 dark:text-emerald-300',
        badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80',
        borderColor: 'border-emerald-200 dark:border-emerald-800'
      };
    }
    if (name.includes('físic') || name.includes('fisica') || name.includes('deporte')) {
      return {
        icon: Activity,
        bgColor: 'bg-pink-100 dark:bg-pink-900/60',
        textColor: 'text-pink-600 dark:text-pink-300',
        badgeColor: 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/80',
        borderColor: 'border-pink-200 dark:border-pink-800'
      };
    }
    if (name.includes('social') || name.includes('historia')) {
      return {
        icon: Users,
        bgColor: 'bg-amber-100 dark:bg-amber-900/60',
        textColor: 'text-amber-600 dark:text-amber-300',
        badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80',
        borderColor: 'border-amber-200 dark:border-amber-800'
      };
    }
    if (name.includes('arte') || name.includes('cultura')) {
      return {
        icon: Palette,
        bgColor: 'bg-violet-100 dark:bg-violet-900/60',
        textColor: 'text-violet-600 dark:text-violet-300',
        badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/80',
        borderColor: 'border-violet-200 dark:border-violet-800'
      };
    }
    if (name.includes('ingl') || name.includes('idioma')) {
      return {
        icon: Languages,
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/60',
        textColor: 'text-indigo-600 dark:text-indigo-300',
        badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/80',
        borderColor: 'border-indigo-200 dark:border-indigo-800'
      };
    }
    if (name.includes('comp') || name.includes('robót') || name.includes('robot')) {
      return {
        icon: Cpu,
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/60',
        textColor: 'text-cyan-600 dark:text-cyan-300',
        badgeColor: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/80',
        borderColor: 'border-cyan-200 dark:border-cyan-800'
      };
    }
    return {
      icon: BookMarked,
      bgColor: 'bg-slate-100 dark:bg-slate-800',
      textColor: 'text-slate-600 dark:text-slate-300',
      badgeColor: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/80 dark:border-slate-700',
      borderColor: 'border-slate-200 dark:border-slate-700'
    };
  };

  // Helper for human-friendly deadline calculation
  const getDeadlineInfo = (dateString: string) => {
    const target = new Date(dateString);
    const baseDate = new Date();
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const baseDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

    const diffDays = Math.round((targetDay.getTime() - baseDay.getTime()) / (1000 * 60 * 60 * 24));

    const dayOfMonth = target.getDate();
    const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'set.', 'oct.', 'nov.', 'dic.'];
    const monthText = months[target.getMonth()] || 'set.';
    
    let hours = target.getHours();
    const minutes = target.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
    hours = hours % 12 || 12;
    const hoursFormatted = hours.toString().padStart(2, '0');
    const exactFormatted = `${dayOfMonth} de ${monthText} · ${hoursFormatted}:${minutes} ${ampm}`;

    if (diffDays === 0) {
      return {
        label: 'Hoy',
        isToday: true,
        isUrgent: true,
        isOverdue: false,
        exactDate: exactFormatted,
        badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200/80 dark:border-rose-900/50',
        dotClass: 'bg-rose-500'
      };
    } else if (diffDays === 1) {
      return {
        label: 'Mañana',
        isToday: false,
        isUrgent: true,
        isOverdue: false,
        exactDate: exactFormatted,
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/50',
        dotClass: 'bg-amber-500'
      };
    } else if (diffDays > 1) {
      return {
        label: `En ${diffDays} días`,
        isToday: false,
        isUrgent: false,
        isOverdue: false,
        exactDate: exactFormatted,
        badgeClass: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/80 dark:border-slate-700',
        dotClass: 'bg-amber-400'
      };
    } else {
      return {
        label: 'Vencida',
        isToday: false,
        isUrgent: false,
        isOverdue: true,
        exactDate: exactFormatted,
        badgeClass: 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border-red-300 dark:border-red-900',
        dotClass: 'bg-red-600'
      };
    }
  };

  // Metrics computation for active student
  const studentMetrics = useMemo(() => {
    const studentTasks = tasks.filter(t => t.seccion_id === activeEnrollment?.seccion_id || t.seccion_id === 'sec-3pri-a');
    const total = studentTasks.length;
    const submittedList = studentTasks.filter(t =>
      submissions.some(s => s.tarea_id === t.id && s.matricula_id === activeEnrollment?.id)
    );
    const submittedCount = submittedList.length;
    const pendingCount = total - submittedCount;
    const gradedCount = studentTasks.filter(t =>
      submissions.some(s => s.tarea_id === t.id && s.matricula_id === activeEnrollment?.id && s.calificacion_letra)
    ).length;

    const progressPercentage = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

    return {
      total,
      pendingCount,
      submittedCount,
      gradedCount,
      progressPercentage,
      studentTasks
    };
  }, [tasks, submissions, activeEnrollment?.id, activeEnrollment?.seccion_id]);

  // Filtered & Sorted Tasks List
  const displayedTasks = useMemo(() => {
    let result = studentMetrics.studentTasks.filter((task) => {
      const sub = submissions.find(
        s => s.tarea_id === task.id && s.matricula_id === activeEnrollment?.id
      );

      // Tab filter
      if (activeFilter === 'pendientes' && sub) return false;
      if (activeFilter === 'entregadas' && !sub) return false;
      if (activeFilter === 'calificadas' && (!sub || !sub.calificacion_letra)) return false;

      // Calendar date filter
      if (selectedCalendarDate) {
        const taskDate = task.fecha_limite.split('T')[0];
        if (taskDate !== selectedCalendarDate) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const courseName = (task.curso?.nombre || '').toLowerCase();
        const matchTitle = task.titulo.toLowerCase().includes(q);
        const matchDesc = task.descripcion.toLowerCase().includes(q);
        const matchCourse = courseName.includes(q);
        if (!matchTitle && !matchDesc && !matchCourse) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'proxima') {
        return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime();
      }
      if (sortBy === 'lejana') {
        return new Date(b.fecha_limite).getTime() - new Date(a.fecha_limite).getTime();
      }
      if (sortBy === 'materia') {
        return (a.curso?.nombre || '').localeCompare(b.curso?.nombre || '');
      }
      if (sortBy === 'estado') {
        const aSub = submissions.some(s => s.tarea_id === a.id && s.matricula_id === activeEnrollment?.id);
        const bSub = submissions.some(s => s.tarea_id === b.id && s.matricula_id === activeEnrollment?.id);
        return aSub === bSub ? 0 : aSub ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [
    studentMetrics.studentTasks,
    submissions,
    activeEnrollment?.id,
    activeFilter,
    selectedCalendarDate,
    searchQuery,
    sortBy
  ]);

  // En escritorio la lista usa el alto restante de la pantalla y hace scroll interno,
  // así la sección completa entra en una sola pantalla sin scroll de página.
  const taskListRef = useRef<HTMLDivElement>(null);
  const [taskListMaxHeight, setTaskListMaxHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const compute = () => {
      const el = taskListRef.current;
      if (!el || window.innerWidth < 1024) {
        setTaskListMaxHeight(undefined);
        return;
      }
      const main = el.closest('main');
      const top = el.getBoundingClientRect().top + (main?.scrollTop ?? 0);
      const mainPad = main ? parseFloat(getComputedStyle(main).paddingBottom) || 0 : 0;
      const wrapper = main?.firstElementChild as HTMLElement | null;
      const wrapperPad = wrapper ? parseFloat(getComputedStyle(wrapper).paddingBottom) || 0 : 0;
      setTaskListMaxHeight(Math.max(240, Math.floor(window.innerHeight - top - mainPad - wrapperPad)));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [viewMode, selectedCalendarDate, searchQuery, displayedTasks.length, isApoderado, selectedChildId]);

  // Execute file compression with preset
  const runFileCompression = async (file: File, preset: CompressionPreset) => {
    setIsCompressing(true);
    try {
      const result = await compressFile(file, preset);
      setCompressionResult(result);
      setIsCompressing(false);
      
      if (result.savedPercentage > 0) {
        showToast(
          `Compresión exitosa: de ${result.originalFormatted} a ${result.compressedFormatted} (Ahorro del ${result.savedPercentage}%)`,
          'success',
          '⚡ Archivo Optimizado'
        );
      } else {
        showToast(`Archivo procesado: ${result.compressedFormatted}`, 'info', 'Archivo listo');
      }
    } catch (err) {
      setIsCompressing(false);
      console.error('Error al comprimir archivo', err);
      showToast('No se pudo optimizar el archivo, se usará el formato original.', 'warning', 'Aviso de Compresión');
    }
  };

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('El archivo supera el límite de 50 MB.', 'error', 'Archivo muy pesado');
      return;
    }

    setRawSelectedFile(file);
    runFileCompression(file, compressionPreset);
  };

  // Change preset and recompress
  const handlePresetChange = (newPreset: CompressionPreset) => {
    setCompressionPreset(newPreset);
    if (rawSelectedFile) {
      runFileCompression(rawSelectedFile, newPreset);
    }
  };

  // Submit Homework action
  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskToSubmit) return;

    const finalName = compressionResult?.name || rawSelectedFile?.name;
    const finalSize = useCompressedFile && compressionResult
      ? compressionResult.compressedFormatted
      : rawSelectedFile ? formatBytes(rawSelectedFile.size) : undefined;
    const finalUrl = compressionResult?.previewUrl || (rawSelectedFile ? URL.createObjectURL(rawSelectedFile) : undefined);

    submitTask({
      tareaId: selectedTaskToSubmit.id,
      matriculaId: activeEnrollment?.id || 'enr-1',
      comentarioEstudiante: comment,
      archivoUrl: finalUrl,
      archivoNombre: finalName,
      archivoTamano: finalSize,
    });

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });

    showToast(
      isApoderado
        ? `Tarea de ${activeStudent?.nombres || 'tu hijo'} enviada con éxito`
        : '¡Tu tarea ha sido entregada con éxito! 🎉',
      'success',
      'Entrega Completada'
    );

    setSelectedTaskToSubmit(null);
    setComment('');
    setRawSelectedFile(null);
    setCompressionResult(null);
  };

  // Calendar dates with active tasks
  const calendarTaskDates = useMemo(() => {
    const map = new Map<number, { count: number; hasToday: boolean; hasPending: boolean; hasSubmitted: boolean; hasGraded: boolean; dateStr: string }>();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayDate = now.getDate();

    studentMetrics.studentTasks.forEach((t) => {
      const d = new Date(t.fecha_limite);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        const dateStr = t.fecha_limite.split('T')[0];
        const sub = submissions.find(s => s.tarea_id === t.id && s.matricula_id === activeEnrollment?.id);
        const isGraded = !!sub?.calificacion_letra;
        const isSubmitted = !!sub;
        const isToday = day === todayDate;

        const current = map.get(day) || {
          count: 0,
          hasToday: isToday,
          hasPending: !isSubmitted,
          hasSubmitted: isSubmitted && !isGraded,
          hasGraded: isGraded,
          dateStr
        };

        current.count += 1;
        if (isToday) current.hasToday = true;
        if (!isSubmitted) current.hasPending = true;
        if (isSubmitted && !isGraded) current.hasSubmitted = true;
        if (isGraded) current.hasGraded = true;

        map.set(day, current);
      }
    });

    return map;
  }, [studentMetrics.studentTasks, submissions, activeEnrollment?.id]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in-50 pb-6">
      
      {/* ── APODERADO MULTI-CHILD SELECTOR ── */}
      {isApoderado && childrenList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Supervisión Escolar de Hijos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona al estudiante para supervisar sus deberes y entregas
              </p>
            </div>
          </div>

          {/* Child Selection Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {childrenList.map((child) => {
              const isSelected = child.id === selectedChildId;
              return (
                <button
                  key={child.id}
                  onClick={() => {
                    setSelectedChildId(child.id);
                    setSelectedCalendarDate(null);
                    showToast(`Consultando tareas de ${child.nombres}`, 'info', 'Estudiante Activo');
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={child.profile?.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
                      alt={child.nombres || 'Hijo'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>{child.nombres} {child.apellidos?.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 1. HEADER ILUSTRADO CON FRASE Y 3D BADGE ── */}
      <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-indigo-100/80 dark:border-slate-800 px-5 py-4 sm:px-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          
          {/* Left Title & Description */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Tareas Escolares
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {isApoderado
                    ? `Organiza y revisa las actividades escolares de ${activeStudent?.nombres || 'tus hijos'}.`
                    : 'Organiza y realiza las tareas de manera fácil y mantente al día con tus actividades.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Romantic Slogan, Quote Badge & 3D Illustration */}
          <div className="flex items-center gap-5 shrink-0 self-end lg:self-auto">
            {/* Romantic Handwritten Tagline */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="font-serif italic text-base text-indigo-700/80 dark:text-pink-300 font-bold -rotate-2 select-none">
                Pequeños esfuerzos,<br />grandes logros ♡
              </span>
              <div className="mt-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 shadow-2xs text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                &ldquo;La disciplina de hoy es el éxito de mañana.&rdquo;
              </div>
            </div>

            {/* 3D Illustration Avatar / Badge */}
            <div className="hidden sm:block w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/80 dark:border-slate-700 shadow-xl bg-gradient-to-b from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-indigo-950 shrink-0 relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-tasks-student.jpg"
                alt="Alumno Estudiando"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* ── 2. METRICAS SUPERIORES / KPIS (4 COMPACT + MOTIVATIONAL BANNER) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Total */}
        <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block leading-tight">Total de Tareas</span>
            <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              {studentMetrics.total}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">Este periodo</span>
          </div>
        </div>

        {/* KPI 2: Pendientes */}
        <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Hourglass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block leading-tight">Pendientes</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 leading-tight">
              {studentMetrics.pendingCount}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">Por entregar</span>
          </div>
        </div>

        {/* KPI 3: Entregadas */}
        <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block leading-tight">Entregadas</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
              {studentMetrics.submittedCount}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">¡Buen trabajo!</span>
          </div>
        </div>

        {/* KPI 4: Calificadas */}
        <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block leading-tight">Calificadas</span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400 leading-tight">
              {studentMetrics.gradedCount}
            </span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">Con nota</span>
          </div>
        </div>

        {/* KPI 5: Mi progreso (porcentaje de entregas del periodo) */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-slate-900 dark:to-indigo-950/60 px-4 py-3 rounded-3xl border border-indigo-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white dark:text-slate-800"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-600 dark:text-indigo-400 transition-all duration-1000 ease-out"
                strokeDasharray={`${studentMetrics.progressPercentage}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-black text-[11px] text-slate-900 dark:text-white">
              {studentMetrics.progressPercentage}%
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">Mi progreso</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
              {studentMetrics.submittedCount} de {studentMetrics.total} tareas completadas
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. CONTENIDO PRINCIPAL: 2 COLUMNAS (75% IZQ / 25% DER) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ── COLUMNA IZQUIERDA (8 o 9 de 12 Cols ≈ 75%): BÚSQUEDA, FILTROS Y TAREAS ── */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-3">
          
          {/* Barra de Búsqueda con Atajo Ctrl+K */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tarea por título, materia o descripción..."
              className="w-full pl-11 pr-20 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-200/60 dark:border-slate-700 select-none">
                Ctrl + K
              </span>
            </div>
          </div>

          {/* Fila de Filtros (Chips con contadores), Selector de Orden & Switch de Vista */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            
            {/* Filter Tabs/Chips with Dynamic Counters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('todas');
                  setSelectedCalendarDate(null);
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'todas' && !selectedCalendarDate
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Todas</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeFilter === 'todas' && !selectedCalendarDate
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {studentMetrics.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveFilter('pendientes');
                  setSelectedCalendarDate(null);
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'pendientes'
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Hourglass className="w-3.5 h-3.5" />
                <span>Pendientes</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeFilter === 'pendientes'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                }`}>
                  {studentMetrics.pendingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveFilter('entregadas');
                  setSelectedCalendarDate(null);
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'entregadas'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Entregadas</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeFilter === 'entregadas'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {studentMetrics.submittedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveFilter('calificadas');
                  setSelectedCalendarDate(null);
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'calificadas'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Calificadas</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeFilter === 'calificadas'
                    ? 'bg-white/20 text-white'
                    : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                }`}>
                  {studentMetrics.gradedCount}
                </span>
              </button>
            </div>

            {/* Right Controls: Sort Select + View Toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              {/* Order Select */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="proxima">Fecha: más próxima</option>
                <option value="lejana">Fecha: más lejana</option>
                <option value="materia">Materia (A-Z)</option>
                <option value="estado">Estado de entrega</option>
              </select>

              {/* View Toggle (List vs Grid) */}
              <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title="Vista en lista"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title="Vista en cuadrícula"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Filter Status Reset Pill (if calendar date or search is active) */}
          {(selectedCalendarDate || searchQuery) && (
            <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/40 text-xs font-semibold text-blue-800 dark:text-blue-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>
                  Filtro activo: {selectedCalendarDate ? `Fecha ${selectedCalendarDate}` : ''} {searchQuery ? `Búsqueda: "${searchQuery}"` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCalendarDate(null);
                  setSearchQuery('');
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-xs cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* ── LISTADO PRINCIPAL DE TAREAS ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Tareas ({displayedTasks.length})
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Mostrando {displayedTasks.length} de {studentMetrics.total} asignaciones
              </span>
            </div>

            {displayedTasks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {activeFilter === 'pendientes'
                    ? '¡Todo al día!'
                    : 'No se encontraron tareas'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {activeFilter === 'pendientes'
                    ? 'No hay tareas pendientes en este momento. ¡Excelente trabajo!'
                    : 'Prueba cambiando los filtros de búsqueda o seleccionando otra fecha del calendario.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('todas');
                    setSelectedCalendarDate(null);
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  Ver todas las tareas
                </button>
              </div>
            ) : viewMode === 'list' ? (
              /* ── LIST VIEW (Rows) ── */
              <div ref={taskListRef} style={{ maxHeight: taskListMaxHeight }} className="space-y-2 lg:overflow-y-auto lg:pr-1 custom-scrollbar">
                {displayedTasks.map((task) => {
                  const subjectMeta = getSubjectMeta(task.curso?.nombre);
                  const SubjectIcon = subjectMeta.icon;
                  const deadline = getDeadlineInfo(task.fecha_limite);
                  const submission = submissions.find(
                    s => s.tarea_id === task.id && s.matricula_id === activeEnrollment?.id
                  );
                  const isSubmitted = !!submission;
                  const isGraded = !!submission?.calificacion_letra;

                  return (
                    <div
                      key={task.id}
                      className={`group bg-white dark:bg-slate-900 rounded-2xl px-4 py-3 border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative hover:shadow-md ${
                        deadline.isToday && !isSubmitted
                          ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 ring-2 ring-rose-500/10'
                          : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Left: Checkbox + Subject Icon + Title & Details */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {/* Checkbox circle indicator */}
                        <div className="pt-1 shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                              isSubmitted
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-blue-500'
                            }`}
                          >
                            {isSubmitted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Subject Icon Square */}
                        <div className={`w-10 h-10 rounded-xl ${subjectMeta.bgColor} ${subjectMeta.textColor} flex items-center justify-center shrink-0 shadow-2xs`}>
                          <SubjectIcon className="w-5 h-5" />
                        </div>

                        {/* Title, Description & Subject Badge */}
                        <div className="min-w-0 space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              onClick={() => setSelectedTaskDetail(task)}
                              className="font-black text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors leading-snug truncate"
                            >
                              {task.titulo}
                            </h3>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                            {task.descripcion}
                          </p>

                          <div className="flex items-center gap-2 pt-0.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${subjectMeta.badgeColor}`}>
                              {task.curso?.nombre || 'General'}
                            </span>
                            {submission?.archivo_nombre && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[180px]">
                                <FileCheck className="w-3 h-3 shrink-0" />
                                <span className="truncate">{submission.archivo_nombre}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Deadline Indicator + Status Badge + Primary Action Button + Secondary Menu */}
                      <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        
                        {/* Deadline Box */}
                        <div className="flex flex-col items-start sm:items-end min-w-[130px]">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${deadline.badgeClass}`}>
                            <Calendar className="w-3 h-3" />
                            {deadline.label}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium mt-0.5" suppressHydrationWarning>
                            {deadline.exactDate}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isGraded ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                                <Star className="w-3 h-3" />
                                Calificada
                              </span>
                              <GradeBadge grade={submission.calificacion_letra!} size="sm" />
                            </div>
                          ) : isSubmitted ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Entregado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                              <Hourglass className="w-3 h-3" />
                              Pendiente
                            </span>
                          )}
                        </div>

                        {/* Primary Action Button */}
                        <div>
                          {!isSubmitted ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTaskToSubmit(task);
                                setRawSelectedFile(null);
                                setCompressionResult(null);
                                setComment('');
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{isApoderado ? 'Subir Tarea' : 'Entregar'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedTaskDetail(task)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer whitespace-nowrap"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Ver Entrega</span>
                            </button>
                          )}
                        </div>

                        {/* Secondary Menu / Details trigger */}
                        <button
                          type="button"
                          onClick={() => setSelectedTaskDetail(task)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="Ver detalles completos"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── GRID VIEW (Cards) ── */
              <div ref={taskListRef} style={{ maxHeight: taskListMaxHeight }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:overflow-y-auto lg:pr-1 custom-scrollbar">
                {displayedTasks.map((task) => {
                  const subjectMeta = getSubjectMeta(task.curso?.nombre);
                  const SubjectIcon = subjectMeta.icon;
                  const deadline = getDeadlineInfo(task.fecha_limite);
                  const submission = submissions.find(
                    s => s.tarea_id === task.id && s.matricula_id === activeEnrollment?.id
                  );
                  const isSubmitted = !!submission;
                  const isGraded = !!submission?.calificacion_letra;

                  return (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border ${subjectMeta.badgeColor}`}>
                            {task.curso?.nombre}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${deadline.badgeClass}`}>
                            <Calendar className="w-3 h-3" />
                            {deadline.label}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-2xl ${subjectMeta.bgColor} ${subjectMeta.textColor} flex items-center justify-center shrink-0`}>
                            <SubjectIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3
                              onClick={() => setSelectedTaskDetail(task)}
                              className="font-black text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer leading-snug line-clamp-2"
                            >
                              {task.titulo}
                            </h3>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {task.descripcion}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <div>
                          {isGraded ? (
                            <GradeBadge grade={submission.calificacion_letra!} size="sm" />
                          ) : isSubmitted ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                              Entregado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                              Pendiente
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!isSubmitted) {
                              setSelectedTaskToSubmit(task);
                            } else {
                              setSelectedTaskDetail(task);
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          {!isSubmitted ? 'Entregar' : 'Ver detalle'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ── COLUMNA DERECHA (4 o 3 de 12 Cols ≈ 25%): SIDEBAR COMPACTO ── */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          
          {/* CARD 1: CALENDARIO DE ENTREGAS */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
            
            {/* Header Calendario */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                  Calendario de entregas
                </h4>
              </div>
            </div>

            {/* Selector de Mes */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => showToast('Navegando a Agosto 2026', 'info')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                Septiembre 2026
              </span>
              <button
                type="button"
                onClick={() => showToast('Navegando a Octubre 2026', 'info')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Matriz Días Semanales */}
            <div className="space-y-1">
              {/* Header Días: Lun, Mar, Mié, Jue, Vie, Sáb, Dom */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => (
                  <span key={i} className="text-[10px] font-bold text-slate-400">
                    {d}
                  </span>
                ))}
              </div>

              {/* Días del Mes (Septiembre 2026 inicia en Martes) */}
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {/* Días previos de Agosto */}
                <span className="text-xs text-slate-300 dark:text-slate-700 py-1">31</span>

                {/* Días 1 al 30 de Septiembre */}
                {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                  const hasTasks = calendarTaskDates.get(day);
                  const isDaySelected = selectedCalendarDate === `2026-09-${day.toString().padStart(2, '0')}`;
                  const isDay18Today = day === 18;

                  let cellBg = 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300';
                  if (isDaySelected) {
                    cellBg = 'bg-blue-600 text-white font-black shadow-sm';
                  } else if (isDay18Today) {
                    cellBg = 'bg-rose-500 text-white font-black shadow-sm shadow-rose-500/30';
                  }

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const dateString = `2026-09-${day.toString().padStart(2, '0')}`;
                        if (selectedCalendarDate === dateString) {
                          setSelectedCalendarDate(null);
                        } else {
                          setSelectedCalendarDate(dateString);
                          showToast(`Filtrando tareas del ${day} de setiembre`, 'info');
                        }
                      }}
                      className={`relative py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${cellBg}`}
                    >
                      <span>{day}</span>

                      {/* Dots indicators under day number */}
                      {hasTasks && (
                        <div className="absolute bottom-0 flex items-center gap-0.5">
                          {hasTasks.hasToday && !isDay18Today && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          )}
                          {hasTasks.hasPending && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          )}
                          {hasTasks.hasSubmitted && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                          {hasTasks.hasGraded && (
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Días siguientes de Octubre */}
                {Array.from({ length: 4 }, (_, i) => i + 1).map((d) => (
                  <span key={`next-${d}`} className="text-xs text-slate-300 dark:text-slate-700 py-1">{d}</span>
                ))}
              </div>
            </div>

            {/* Leyenda de Colores */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Hoy
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Próximas
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Entregadas
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Calificadas
              </span>
            </div>

          </div>

          {/* CARD 2: ACCESOS RÁPIDOS (fila compacta) */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h4 className="px-1 pb-2 font-black text-xs text-slate-900 dark:text-white">Accesos rápidos</h4>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setIsGradesModalOpen(true)}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-bold leading-tight text-center">Mis notas</span>
              </button>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-[11px] font-bold leading-tight text-center">Horario</span>
              </button>
              <button
                type="button"
                onClick={() => setIsResourcesModalOpen(true)}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-bold leading-tight text-center">Recursos</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── MODAL: ENTREGAR TAREA CON COMPRESOR INTELIGENTE ── */}
      {selectedTaskToSubmit && (
        <Modal
          isOpen={!!selectedTaskToSubmit}
          onClose={() => {
            setSelectedTaskToSubmit(null);
            setRawSelectedFile(null);
            setCompressionResult(null);
          }}
          title={`Entregar Tarea: ${selectedTaskToSubmit.titulo}`}
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmSubmit} className="space-y-4 text-xs">
            
            {/* Task summary box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                  {selectedTaskToSubmit.curso?.nombre}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Fecha límite: <strong className="text-slate-700 dark:text-slate-200">{selectedTaskToSubmit.fecha_limite}</strong>
                </span>
              </div>
              <p className="font-bold text-slate-800 dark:text-white leading-relaxed">
                {selectedTaskToSubmit.descripcion}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Comentarios / Mensaje para el Docente:
              </label>
              <textarea
                rows={2}
                placeholder="Escribe aquí tu desarrollo, dudas o enlaces adicionales..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.zip,.ppt,.pptx"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* File Dropzone or Compressor Card */}
            {!rawSelectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-7 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-2 right-3 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200/80">
                  <Zap className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                  <span>Compresor Inteligente Activo</span>
                </div>

                <Paperclip className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors" />
                <p className="font-black text-slate-800 dark:text-slate-100 text-sm">
                  Haz clic para adjuntar tu tarea (Foto de cuaderno, PDF o Word)
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                  El sistema optimizará y comprimirá el archivo automáticamente para que suba rápido sin perder nitidez.
                </p>
              </div>
            ) : isCompressing ? (
              /* Loading / Compressing State */
              <div className="p-8 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
                <div>
                  <p className="font-black text-xs sm:text-sm text-indigo-900 dark:text-indigo-200">
                    ⚡ Optimizando y comprimiendo archivo...
                  </p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Ajustando resolución y buffers sin perder legibilidad ni diseño.
                  </p>
                </div>
              </div>
            ) : compressionResult ? (
              /* ── COMPRESSOR RESULT CARD & SETTINGS ── */
              <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 p-4 space-y-4 shadow-sm animate-in fade-in">
                
                {/* Header Compresor */}
                <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                      <Zap className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        Herramienta de Compresión Activa
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                          {compressionResult.savedPercentage > 0 ? `-${compressionResult.savedPercentage}% Reducido` : 'Optimizado'}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {compressionResult.isImage ? 'Imagen procesada con renderizado Canvas HD' : 'Documento optimizado para transferencia rápida'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRawSelectedFile(null);
                      setCompressionResult(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Cambiar archivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Metric Comparison: Original vs Compressed */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 block">Tamaño Original</span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                      {compressionResult.originalFormatted}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">Tamaño Optimizado</span>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCheck className="w-4 h-4" />
                      {compressionResult.compressedFormatted}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">Ahorro de Peso</span>
                    <span className="text-sm font-black text-purple-700 dark:text-purple-300">
                      {compressionResult.savedPercentage > 0 ? `📉 -${compressionResult.savedPercentage}% de peso` : 'Máxima calidad'}
                    </span>
                  </div>

                </div>

                {/* Preset Selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    Nivel de Optimización:
                  </span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePresetChange('balanced')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        compressionPreset === 'balanced'
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-black text-xs block">🌟 Equilibrada</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Recomendado (~75%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePresetChange('high')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        compressionPreset === 'high'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-black text-xs block">🚀 Alta Compresión</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Ideal para fotos pesadas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePresetChange('maximum')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        compressionPreset === 'maximum'
                          ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-100 ring-2 ring-purple-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-black text-xs block">💎 Máxima Nitidez</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Original con buffer HD</span>
                    </button>
                  </div>
                </div>

                {/* Preview Thumbnail if Image */}
                {compressionResult.isImage && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 border shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={compressionResult.previewUrl}
                        alt="Vista previa comprimida"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-800 dark:text-white block text-xs truncate">
                        {compressionResult.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Listo para enviar · {compressionResult.compressedFormatted}
                      </span>
                    </div>
                  </div>
                )}

              </div>
            ) : null}

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedTaskToSubmit(null);
                  setRawSelectedFile(null);
                  setCompressionResult(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar Entrega
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: DETALLE COMPLETO DE TAREA ── */}
      {selectedTaskDetail && (
        <Modal
          isOpen={!!selectedTaskDetail}
          onClose={() => setSelectedTaskDetail(null)}
          title={`Detalle de la Tarea: ${selectedTaskDetail.titulo}`}
          maxWidth="lg"
        >
          {(() => {
            const submission = submissions.find(
              s => s.tarea_id === selectedTaskDetail.id && s.matricula_id === activeEnrollment?.id
            );
            const isSubmitted = !!submission;
            const deadline = getDeadlineInfo(selectedTaskDetail.fecha_limite);

            return (
              <div className="space-y-4 text-xs">
                
                {/* Header Information */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {selectedTaskDetail.curso?.nombre}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${deadline.badgeClass}`}>
                      <Calendar className="w-3 h-3" />
                      {deadline.label} · {deadline.exactDate}
                    </span>
                  </div>

                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {selectedTaskDetail.titulo}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedTaskDetail.descripcion}
                  </p>
                </div>

                {/* Submissions Details */}
                {isSubmitted ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Tu entrega fue registrada
                      </span>
                      {submission.calificacion_letra && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-bold">Nota obtenida:</span>
                          <GradeBadge grade={submission.calificacion_letra} size="sm" />
                        </div>
                      )}
                    </div>

                    {submission.comentario_estudiante && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                        <strong>Comentario enviado:</strong> &ldquo;{submission.comentario_estudiante}&rdquo;
                      </p>
                    )}

                    {submission.archivo_nombre && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                          📎 {submission.archivo_nombre}
                        </span>
                        <a
                          href={submission.archivo_url || '#'}
                          download={submission.archivo_nombre}
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Descargar
                        </a>
                      </div>
                    )}

                    {submission.retroalimentacion_docente && (
                      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200">
                        <strong className="block font-black mb-1">Feedback del Profesor:</strong>
                        &ldquo;{submission.retroalimentacion_docente}&rdquo;
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                    <div>
                      <span className="font-black text-xs text-amber-800 dark:text-amber-200 block">
                        Tarea pendiente de entrega
                      </span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-300">
                        Fecha límite: {deadline.exactDate}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTaskDetail(null);
                        setSelectedTaskToSubmit(selectedTaskDetail);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 shadow-md transition-all"
                    >
                      Subir mi entrega
                    </button>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedTaskDetail(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* ── MODAL: MIS CALIFICACIONES RÁPIDAS ── */}
      {isGradesModalOpen && (
        <Modal
          isOpen={isGradesModalOpen}
          onClose={() => setIsGradesModalOpen(false)}
          title={`Boletín de Calificaciones - ${activeStudent?.nombres || 'Estudiante'}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-500 dark:text-slate-400">
              Resumen de nivel de logro por competencias (CNEB - Periodo Vigente 2026):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {courses.slice(0, 6).map((course) => (
                <div key={course.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white truncate">{course.nombre}</span>
                  <GradeBadge grade="AD" size="sm" />
                </div>
              ))}
            </div>
            <div className="pt-3 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/estudiante/libreta-notas"
                className="text-blue-600 font-bold hover:underline"
              >
                Ver Libreta Oficial Completa →
              </Link>
              <button
                type="button"
                onClick={() => setIsGradesModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: HORARIO DE CLASES ── */}
      {isScheduleModalOpen && (
        <Modal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          title="Horario de Clases Semanal"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-500 dark:text-slate-400">
              Bloques de horario escolar para la sección del estudiante:
            </p>
            <div className="space-y-2">
              {[
                { time: '08:00 - 09:30', course: 'Matemática', teacher: 'Prof. Carlos Mendoza', room: 'Aula 301' },
                { time: '09:45 - 11:15', course: 'Comunicación', teacher: 'Prof. Patricia García', room: 'Aula 301' },
                { time: '11:30 - 13:00', course: 'Ciencia y Tecnología', teacher: 'Prof. Roberto Quispe', room: 'Laboratorio' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{item.course}</span>
                    <span className="text-[10px] text-slate-400">{item.teacher} · {item.room}</span>
                  </div>
                  <span className="font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded-lg">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: RECURSOS DE ESTUDIO ── */}
      {isResourcesModalOpen && (
        <Modal
          isOpen={isResourcesModalOpen}
          onClose={() => setIsResourcesModalOpen(false)}
          title="Recursos de Estudio & Material Educativo"
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-500 dark:text-slate-400">
              Material didáctico complementario cargado por los docentes:
            </p>
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-white">📘 Guía de Refuerzo de Fracciones (PDF)</span>
                <span className="text-blue-600 font-bold">Descargar</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-white">📖 Antología de Lecturas Paco Yunque (PDF)</span>
                <span className="text-blue-600 font-bold">Descargar</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-white">🌱 Ficha de Ecosistemas y Cadenas Tróficas</span>
                <span className="text-blue-600 font-bold">Descargar</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsResourcesModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
