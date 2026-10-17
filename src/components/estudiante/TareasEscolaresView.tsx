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
      return matched;
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
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

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


  // ── Ayudas para el nuevo diseño (pensado para estudiantes) ──
  const firstName = (activeStudent?.profile?.nombres || activeStudent?.nombres || currentUser?.nombres || '').split(' ')[0];
  const subOf = (task: TaskAssignment) =>
    submissions.find(s => s.tarea_id === task.id && s.matricula_id === activeEnrollment?.id);

  const startOfToday = () => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  };
  const dayDiff = (dateString: string) => {
    const d = new Date(dateString);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round((day.getTime() - startOfToday().getTime()) / 86400000);
  };
  const timeText = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
  const shortDay = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  const longDay = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  const dueText = (dateString: string) => {
    const days = dayDiff(dateString);
    if (days < 0) return days === -1 ? 'Venció ayer' : `Venció hace ${-days} días`;
    if (days === 0) return `Vence hoy a las ${timeText(dateString)}`;
    if (days === 1) return `Vence mañana a las ${timeText(dateString)}`;
    return `Vence el ${new Date(dateString).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' })}`;
  };
  const whenLabel = (days: number) =>
    days < 0 ? 'Atrasada' : days === 0 ? '¡Hoy!' : days === 1 ? 'Mañana' : `En ${days} días`;
  const urgencyChip = (days: number) =>
    days < 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
      : days === 0 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
      : days <= 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
      : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300';
  const courseEmoji = (name?: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('matem')) return '🔢';
    if (n.includes('comunic')) return '📖';
    if (n.includes('cienc') || n.includes('tecnol')) return '🌱';
    if (n.includes('social') || n.includes('historia')) return '🌎';
    if (n.includes('arte') || n.includes('cultura')) return '🎨';
    if (n.includes('ingl')) return '🗣️';
    if (n.includes('físic') || n.includes('fisic')) return '⚽';
    if (n.includes('relig')) return '🙏';
    if (n.includes('comput') || n.includes('robot')) return '💻';
    return '📘';
  };

  const openSubmit = (task: TaskAssignment) => {
    setSelectedTaskToSubmit(task);
    setRawSelectedFile(null);
    setCompressionResult(null);
    setComment('');
  };

  const pendingByDate = studentMetrics.studentTasks
    .filter(t => !subOf(t))
    .sort((a, b) => new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime());
  const focusTask = pendingByDate[0] || null;
  const dueTodayCount = pendingByDate.filter(t => dayDiff(t.fecha_limite) === 0).length;

  // Agrupar las tareas visibles por urgencia y estado
  const taskGroups = (() => {
    const pending = displayedTasks.filter(t => !subOf(t));
    const delivered = displayedTasks.filter(t => subOf(t) && !subOf(t)?.calificacion_letra)
      .sort((a, b) => new Date(b.fecha_limite).getTime() - new Date(a.fecha_limite).getTime());
    const graded = displayedTasks.filter(t => !!subOf(t)?.calificacion_letra)
      .sort((a, b) => new Date(b.fecha_limite).getTime() - new Date(a.fecha_limite).getTime());
    const byDays = (fn: (d: number) => boolean) => pending.filter(t => fn(dayDiff(t.fecha_limite)));
    return [
      { id: 'atrasadas', emoji: '⚠️', title: 'Atrasadas: entrégalas lo antes posible', titleClass: 'text-rose-600 dark:text-rose-400', items: byDays(d => d < 0) },
      { id: 'hoy', emoji: '🔥', title: 'Para hoy', titleClass: 'text-orange-600 dark:text-orange-400', items: byDays(d => d === 0) },
      { id: 'manana', emoji: '⏰', title: 'Para mañana', titleClass: 'text-amber-600 dark:text-amber-400', items: byDays(d => d === 1) },
      { id: 'semana', emoji: '📅', title: 'Esta semana', titleClass: 'text-sky-700 dark:text-sky-300', items: byDays(d => d >= 2 && d <= 7) },
      { id: 'despues', emoji: '🗓️', title: 'Más adelante', titleClass: 'text-slate-600 dark:text-slate-300', items: byDays(d => d > 7) },
      { id: 'entregadas', emoji: '✅', title: 'Entregadas (esperando nota)', titleClass: 'text-emerald-700 dark:text-emerald-400', items: delivered },
      { id: 'calificadas', emoji: '⭐', title: 'Con nota', titleClass: 'text-violet-700 dark:text-violet-400', items: graded },
    ].filter(g => g.items.length > 0);
  })();

  // Calendario del mes elegido (empieza en el mes actual)
  const calYear = calMonth.getFullYear();
  const calM = calMonth.getMonth();
  const calLabelRaw = calMonth.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  const calLabel = calLabelRaw.charAt(0).toUpperCase() + calLabelRaw.slice(1);
  const shiftCalMonth = (delta: number) => setCalMonth(new Date(calYear, calM + delta, 1));
  const todayIso = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  })();
  const calCells: ({ day: number; iso: string; isToday: boolean; tasks: TaskAssignment[]; hasPending: boolean; hasSubmitted: boolean; hasGraded: boolean } | null)[] = [
    ...Array.from({ length: (new Date(calYear, calM, 1).getDay() + 6) % 7 }, () => null),
    ...Array.from({ length: new Date(calYear, calM + 1, 0).getDate() }, (_, i) => {
      const day = i + 1;
      const iso = `${calYear}-${String(calM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTasks = studentMetrics.studentTasks.filter(t => t.fecha_limite.split('T')[0] === iso);
      return {
        day,
        iso,
        isToday: iso === todayIso,
        tasks: dayTasks,
        hasPending: dayTasks.some(t => !subOf(t)),
        hasSubmitted: dayTasks.some(t => subOf(t) && !subOf(t)?.calificacion_letra),
        hasGraded: dayTasks.some(t => !!subOf(t)?.calificacion_letra),
      };
    }),
  ];

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

      {/* ── 1. CABECERA AMIGABLE CON DIBUJO, CONTADORES Y PROGRESO ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100 via-amber-50 to-emerald-100 dark:from-sky-950/50 dark:via-slate-900 dark:to-emerald-950/40 border border-sky-200/70 dark:border-sky-900/60 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {isApoderado ? 'Tareas de ' : 'Mis tareas'}
              {firstName && <span className="text-sky-600 dark:text-sky-300">{isApoderado ? firstName : ` · ${firstName}`}</span>}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {isApoderado
                ? 'Revisa qué tareas tiene pendientes, cuáles ya entregó y sus notas.'
                : 'Aquí ves qué te toca hacer, para cuándo y cómo te fue. ¡Una tarea a la vez! ✏️'}
            </p>
            <div className="flex flex-wrap gap-2 pt-1.5">
              {[
                { id: 'pendientes' as const, label: `${studentMetrics.pendingCount} por hacer`, emoji: '📝' },
                { id: 'pendientes' as const, label: `${dueTodayCount} para hoy`, emoji: '🔥', hide: dueTodayCount === 0 },
                { id: 'entregadas' as const, label: `${studentMetrics.submittedCount} entregadas`, emoji: '✅' },
                { id: 'calificadas' as const, label: `${studentMetrics.gradedCount} con nota`, emoji: '⭐' },
              ].filter(c => !c.hide).map(chip => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => { setActiveFilter(chip.id); setSelectedCalendarDate(null); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <span aria-hidden="true">{chip.emoji}</span> {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <div className="relative w-20 h-20" title={`${studentMetrics.submittedCount} de ${studentMetrics.total} tareas entregadas`}>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3.5" className="stroke-white/80 dark:stroke-slate-800" />
                <circle
                  cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3.5" strokeLinecap="round"
                  className="stroke-emerald-500 transition-all duration-700"
                  strokeDasharray={`${studentMetrics.progressPercentage}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{studentMetrics.progressPercentage}%</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">hecho</span>
              </div>
            </div>
            <TasksIllustration className="hidden lg:block w-32 h-24 animate-float" />
          </div>
        </div>
      </div>

      {/* ── 2. CONTENIDO: LISTA (IZQ) + CALENDARIO Y AYUDA (DER) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        <div className="lg:col-span-8 space-y-3">

          {/* Tarea más urgente destacada */}
          {focusTask && activeFilter !== 'entregadas' && activeFilter !== 'calificadas' && !selectedCalendarDate && !searchQuery && (() => {
            const days = dayDiff(focusTask.fecha_limite);
            return (
              <div className={`rounded-3xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${
                days < 0 ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                  : days === 0 ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/60'
                  : 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60'
              }`}>
                <span className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-4xl shrink-0" aria-hidden="true">
                  {courseEmoji(focusTask.curso?.nombre)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> {days < 0 ? '¡Ojo! Esta tarea ya venció' : '¡Empieza por esta!'}
                  </p>
                  <h2 className="mt-0.5 text-lg font-black text-slate-900 dark:text-white leading-snug truncate">{focusTask.titulo}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                    <strong className="text-slate-800 dark:text-slate-100">{focusTask.curso?.nombre || 'Curso'}</strong> · {dueText(focusTask.fecha_limite)}
                  </p>
                  {focusTask.descripcion && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{focusTask.descripcion}</p>
                  )}
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openSubmit(focusTask)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-md shadow-blue-600/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> {isApoderado ? 'Subir tarea' : 'Entregar tarea'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTaskDetail(focusTask)}
                    className="flex-1 px-5 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Pestañas + buscador */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl overflow-x-auto">
              {[
                { id: 'todas' as const, label: 'Todas', emoji: '📚', count: studentMetrics.total },
                { id: 'pendientes' as const, label: 'Por hacer', emoji: '📝', count: studentMetrics.pendingCount },
                { id: 'entregadas' as const, label: 'Entregadas', emoji: '✅', count: studentMetrics.submittedCount },
                { id: 'calificadas' as const, label: 'Con nota', emoji: '⭐', count: studentMetrics.gradedCount },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setActiveFilter(tab.id); setSelectedCalendarDate(null); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <span aria-hidden="true">{tab.emoji}</span> {tab.label}
                  <span className={`px-1.5 rounded-full text-[10px] ${activeFilter === tab.id ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' : 'bg-slate-200 dark:bg-slate-700'}`}>{tab.count}</span>
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto sm:w-48 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar una tarea"
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} aria-label="Borrar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filtro activo */}
          {(selectedCalendarDate || searchQuery) && (
            <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/50 text-xs font-semibold text-sky-800 dark:text-sky-200">
              <span className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                {selectedCalendarDate ? `Tareas que vencen el ${longDay(selectedCalendarDate)}` : ''}
                {selectedCalendarDate && searchQuery ? ' · ' : ''}
                {searchQuery ? `Buscando "${searchQuery}"` : ''}
              </span>
              <button
                type="button"
                onClick={() => { setSelectedCalendarDate(null); setSearchQuery(''); }}
                className="font-bold hover:underline cursor-pointer"
              >
                Quitar filtro
              </button>
            </div>
          )}

          {/* Lista agrupada */}
          <div ref={taskListRef} style={{ maxHeight: taskListMaxHeight }} className="space-y-4 lg:overflow-y-auto lg:pr-1 custom-scrollbar">
            {taskGroups.length === 0 ? (
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-2">
                <div className="text-5xl" aria-hidden="true">
                  {activeFilter === 'pendientes' && !searchQuery && !selectedCalendarDate ? '🎉' : '🔍'}
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {activeFilter === 'pendientes' && !searchQuery && !selectedCalendarDate
                    ? '¡No tienes tareas por hacer!'
                    : 'No encontramos tareas aquí'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {activeFilter === 'pendientes' && !searchQuery && !selectedCalendarDate
                    ? 'Estás al día. Aprovecha para repasar o descansar un rato. 😊'
                    : 'Prueba con otra pestaña, otra fecha o quita la búsqueda.'}
                </p>
              </div>
            ) : (
              taskGroups.map(group => (
                <section key={group.id} className="space-y-2">
                  <h3 className={`px-1 text-sm font-black flex items-center gap-1.5 ${group.titleClass}`}>
                    <span aria-hidden="true">{group.emoji}</span> {group.title}
                    <span className="text-xs font-bold text-slate-400">({group.items.length})</span>
                  </h3>
                  {group.items.map(task => {
                    const submission = subOf(task);
                    const isGraded = !!submission?.calificacion_letra;
                    const days = dayDiff(task.fecha_limite);
                    const stripe = isGraded ? 'bg-violet-500' : submission ? 'bg-emerald-500' : days < 0 ? 'bg-rose-500' : days === 0 ? 'bg-orange-500' : days === 1 ? 'bg-amber-400' : 'bg-sky-400';
                    return (
                      <div key={task.id} className="group flex rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <span className={`w-1.5 shrink-0 ${stripe}`} />
                        <div className="flex-1 min-w-0 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedTaskDetail(task)}
                            className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                            title="Ver detalle de la tarea"
                          >
                            <span className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0" aria-hidden="true">
                              {courseEmoji(task.curso?.nombre)}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400">{task.titulo}</span>
                              <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                                <strong className="text-slate-700 dark:text-slate-300">{task.curso?.nombre || 'Curso'}</strong>
                                {' · '}
                                {submission
                                  ? `Entregada el ${shortDay(submission.fecha_entrega)}`
                                  : dueText(task.fecha_limite)}
                              </span>
                            </span>
                          </button>

                          <div className="flex items-center justify-end gap-2 shrink-0">
                            {isGraded ? (
                              <>
                                <GradeBadge grade={submission!.calificacion_letra!} size="md" />
                                <button
                                  type="button"
                                  onClick={() => setSelectedTaskDetail(task)}
                                  className="px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-xs font-bold hover:bg-violet-100 dark:hover:bg-violet-900/50 cursor-pointer"
                                >
                                  Ver nota
                                </button>
                              </>
                            ) : submission ? (
                              <>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">✅ Entregada</span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedTaskDetail(task)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                  Ver entrega
                                </button>
                              </>
                            ) : (
                              <>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-black whitespace-nowrap ${urgencyChip(days)}`}>{whenLabel(days)}</span>
                                <button
                                  type="button"
                                  onClick={() => openSubmit(task)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer"
                                >
                                  <Upload className="w-3.5 h-3.5" /> {isApoderado ? 'Subir' : 'Entregar'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </section>
              ))
            )}
          </div>
        </div>

        {/* ── COLUMNA DERECHA ── */}
        <div className="lg:col-span-4 space-y-3">

          {/* Calendario real del mes */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => shiftCalMonth(-1)} aria-label="Mes anterior" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-500" /> {calLabel}
              </h3>
              <button type="button" onClick={() => shiftCalMonth(1)} aria-label="Mes siguiente" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-0.5 text-center">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <span key={i} className="text-[10px] font-bold text-slate-400 py-1">{d}</span>
              ))}
              {calCells.map((cell, i) => {
                if (!cell) return <span key={`e-${i}`} />;
                const isSelected = selectedCalendarDate === cell.iso;
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => setSelectedCalendarDate(isSelected ? null : cell.iso)}
                    title={cell.tasks.map(t => t.titulo).join('\n') || undefined}
                    className={`relative h-9 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isSelected ? 'bg-sky-600 text-white'
                        : cell.isToday ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 ring-1 ring-orange-300'
                        : cell.tasks.length ? 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 hover:bg-sky-50 dark:hover:bg-sky-950/40'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {cell.day}
                    {cell.tasks.length > 0 && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {cell.hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        {cell.hasSubmitted && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        {cell.hasGraded && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> Hoy</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Por hacer</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Entregada</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> Con nota</span>
            </div>
          </div>

          {/* Cómo hago mis tareas */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500" /> ¿Cómo entrego una tarea?
            </h3>
            <ol className="mt-2.5 space-y-2">
              {[
                { emoji: '👀', text: 'Lee bien qué te piden (toca la tarea para ver el detalle).' },
                { emoji: '✏️', text: 'Hazla con calma, empezando por la que vence primero.' },
                { emoji: '📸', text: 'Toma una foto o guarda tu archivo.' },
                { emoji: '📤', text: 'Toca "Entregar", sube tu archivo y ¡listo!' },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-base shrink-0" aria-hidden="true">{step.emoji}</span>
                  <span className="pt-1">{step.text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Mis notas', emoji: '⭐', onClick: () => setIsGradesModalOpen(true), bg: 'bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/40' },
              { label: 'Horario', emoji: '🕒', onClick: () => setIsScheduleModalOpen(true), bg: 'bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40' },
              { label: 'Recursos', emoji: '📚', onClick: () => setIsResourcesModalOpen(true), bg: 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40' },
            ].map(q => (
              <button
                key={q.label}
                type="button"
                onClick={q.onClick}
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl transition-colors cursor-pointer ${q.bg}`}
              >
                <span className="text-xl" aria-hidden="true">{q.emoji}</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{q.label}</span>
              </button>
            ))}
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
                  <strong className="text-slate-700 dark:text-slate-200">{dueText(selectedTaskToSubmit.fecha_limite)}</strong>
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

// Dibujo amigable para la cabecera de tareas (cuaderno, lápiz y estrellas)
function TasksIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <circle cx="78" cy="62" r="50" className="fill-white/60 dark:fill-white/5" />
      <rect x="40" y="24" width="70" height="84" rx="10" className="fill-white dark:fill-slate-800" stroke="#0ea5e9" strokeWidth="3" />
      <rect x="40" y="24" width="14" height="84" rx="6" fill="#0ea5e9" />
      <circle cx="47" cy="40" r="3" fill="#e0f2fe" />
      <circle cx="47" cy="66" r="3" fill="#e0f2fe" />
      <circle cx="47" cy="92" r="3" fill="#e0f2fe" />
      <path d="M64 46 l5 5 l9 -10" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="84" y="44" width="18" height="5" rx="2.5" fill="#bae6fd" />
      <path d="M64 70 l5 5 l9 -10" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="84" y="68" width="18" height="5" rx="2.5" fill="#bae6fd" />
      <rect x="64" y="90" width="12" height="12" rx="3" fill="none" stroke="#f59e0b" strokeWidth="3" />
      <rect x="84" y="93" width="18" height="5" rx="2.5" fill="#fde68a" />
      <g transform="rotate(35 128 66)">
        <rect x="122" y="36" width="12" height="48" rx="3" fill="#fbbf24" />
        <rect x="122" y="36" width="12" height="8" rx="3" fill="#f472b6" />
        <path d="M122 84 L128 96 L134 84 Z" fill="#fde68a" />
        <path d="M126.5 93 L128 96 L129.5 93 Z" fill="#334155" />
      </g>
      <path d="M22 26 l3 6 l6 1 l-4.5 4.5 l1 6.5 l-5.5 -3 l-5.5 3 l1 -6.5 l-4.5 -4.5 l6 -1 Z" fill="#fbbf24" />
      <path d="M142 14 l2 4 l4 0.7 l-3 3 l0.7 4.3 l-3.7 -2 l-3.7 2 l0.7 -4.3 l-3 -3 l4 -0.7 Z" fill="#34d399" />
    </svg>
  );
}
