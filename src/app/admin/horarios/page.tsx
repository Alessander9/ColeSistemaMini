'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Student, Enrollment, GradeLetter, DayOfWeek, Section, Course, UserProfile } from '@/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { 
  Calendar, 
  BookOpen, 
  UserCheck, 
  Plus, 
  Clock, 
  Trash2, 
  Edit2, 
  Printer, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  School, 
  GraduationCap, 
  ChevronRight, 
  ChevronLeft, 
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Users,
  Search,
  BookMarked,
  MapPin,
  X,
  Info,
  Check,
  ChevronDown,
  BarChart3,
  LayoutGrid,
  MoreHorizontal,
  Settings,
  Calculator,
  FlaskConical,
  Palette,
  Activity,
  Music,
  PanelRightClose,
  PanelRightOpen,
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileImage,
  FileText,
  Loader2
} from 'lucide-react';

const TIME_BLOCKS = [
  { id: 'b1', label: '1° Hora', inicio: '08:00', fin: '08:45' },
  { id: 'b2', label: '2° Hora', inicio: '08:45', fin: '09:30' },
  { id: 'b3', label: '3° Hora', inicio: '09:30', fin: '10:15' },
  { id: 'recreo', label: 'RECREO', inicio: '10:15', fin: '10:45', isBreak: true },
  { id: 'b4', label: '4° Hora', inicio: '10:45', fin: '11:30' },
  { id: 'b5', label: '5° Hora', inicio: '11:30', fin: '12:15' },
  { id: 'b6', label: '6° Hora', inicio: '12:15', fin: '13:00' },
  { id: 'b7', label: '7° Hora', inicio: '13:00', fin: '13:45' },
];

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'lunes', label: 'Lunes', short: 'LUN' },
  { key: 'martes', label: 'Martes', short: 'MAR' },
  { key: 'miercoles', label: 'Miércoles', short: 'MIÉ' },
  { key: 'jueves', label: 'Jueves', short: 'JUE' },
  { key: 'viernes', label: 'Viernes', short: 'VIE' },
];

function UKFlagVector({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={`shrink-0 rounded-[2px] ${className}`} aria-label="Bandera Reino Unido">
      <clipPath id="uk-flag-clip">
        <path d="M0,0 v30 h60 v-30 z"/>
      </clipPath>
      <clipPath id="uk-flag-diag">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
      </clipPath>
      <g clipPath="url(#uk-flag-clip)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-flag-diag)" stroke="#C8102E" strokeWidth="4"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
      </g>
    </svg>
  );
}

function CourseIcon({ courseName = '', className = "w-3.5 h-3.5" }: { courseName?: string; className?: string }) {
  const norm = courseName.toLowerCase();
  if (norm.includes('matem') || norm.includes('álgebra') || norm.includes('geometría') || norm.includes('trigonometría')) {
    return <Calculator className={className} />;
  }
  if (norm.includes('comunic') || norm.includes('lengu') || norm.includes('literat') || norm.includes('lectura')) {
    return <BookOpen className={className} />;
  }
  if (norm.includes('física') || norm.includes('fisica') || norm.includes('educación física') || norm.includes('deporte')) {
    return <Activity className={className} />;
  }
  if (norm.includes('ingl') || norm.includes('idioma') || norm.includes('english')) {
    return <UKFlagVector className={className} />;
  }
  if (norm.includes('social') || norm.includes('personal') || norm.includes('civic') || norm.includes('historia')) {
    return <Users className={className} />;
  }
  if (norm.includes('ciencia') || norm.includes('tecnolog') || norm.includes('cta') || norm.includes('química') || norm.includes('biolog')) {
    return <FlaskConical className={className} />;
  }
  if (norm.includes('arte') || norm.includes('cultura') || norm.includes('dibujo')) {
    return <Palette className={className} />;
  }
  if (norm.includes('música') || norm.includes('musica')) {
    return <Music className={className} />;
  }
  return <BookOpen className={className} />;
}

function getCourseTheme(courseName: string = '') {
  const norm = courseName.toLowerCase();
  if (norm.includes('matem')) {
    return {
      cardBg: 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/50',
      iconBg: 'bg-blue-600',
    };
  }
  if (norm.includes('comunic')) {
    return {
      cardBg: 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/50',
      iconBg: 'bg-pink-500',
    };
  }
  if (norm.includes('física') || norm.includes('fisica') || norm.includes('educación física')) {
    return {
      cardBg: 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/50',
      iconBg: 'bg-emerald-500',
    };
  }
  if (norm.includes('ingl') || norm.includes('idioma')) {
    return {
      cardBg: 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-900/50',
      iconBg: 'bg-indigo-600',
    };
  }
  if (norm.includes('social') || norm.includes('personal')) {
    return {
      cardBg: 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/50',
      iconBg: 'bg-amber-500',
    };
  }
  if (norm.includes('ciencia') || norm.includes('tecnolog') || norm.includes('cta')) {
    return {
      cardBg: 'bg-teal-50/80 dark:bg-teal-950/30 border-teal-200/80 dark:border-teal-900/50',
      iconBg: 'bg-teal-500',
    };
  }
  if (norm.includes('arte') || norm.includes('cultura')) {
    return {
      cardBg: 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-900/50',
      iconBg: 'bg-purple-600',
    };
  }
  return {
    cardBg: 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700',
    iconBg: 'bg-purple-600',
  };
}

function ScheduleCard({
  slot,
  inicio,
  onDelete,
}: {
  slot: any;
  inicio: string;
  onDelete: () => void;
}) {
  const courseName = slot.curso?.nombre || 'Clase';
  const theme = getCourseTheme(courseName);
  const teacherFirstName = slot.docente?.nombres?.split(' ')[0] || 'Docente';
  const teacherLastName = slot.docente?.apellidos?.split(' ')[0] || '';
  const teacherName = `Prof. ${teacherFirstName} ${teacherLastName}`.trim();
  const initials = `${teacherFirstName.charAt(0)}${teacherLastName.charAt(0)}`.toUpperCase() || 'P';

  return (
    <div
      className={`group relative p-2 sm:p-2.5 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-md flex flex-col justify-between min-h-[96px] ${theme.cardBg}`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Top: Icon + Course Title + Delete */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-5 h-5 rounded-md ${theme.iconBg} text-white flex items-center justify-center p-0.5 shrink-0 shadow-2xs`}
          >
            <CourseIcon courseName={courseName} className="w-3.5 h-3.5 text-white" />
          </div>
          <span 
            className="text-xs font-black text-slate-900 dark:text-white leading-tight block tracking-normal"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {courseName}
          </span>
        </div>
        <button
          onClick={onDelete}
          data-html2canvas-ignore="true"
          title="Eliminar bloque"
          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50 transition-opacity cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Middle: Teacher Avatar / Initials + Name */}
      <div className="flex items-center gap-1.5 my-1">
        <div 
          className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-[8px] flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600"
        >
          {initials}
        </div>
        <span 
          className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight block tracking-normal"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {teacherName}
        </span>
      </div>

      {/* Bottom: Location + Time */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
        <span className="flex items-center gap-0.5 max-w-[120px]">
          <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-400" />
          <span className="leading-tight">{slot.aula || 'Aula 301'}</span>
        </span>
        <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">
          {inicio}
        </span>
      </div>
    </div>
  );
}

export default function AdminHorariosPage() {
  const { 
    sections, 
    gradeLevels, 
    courses, 
    teachers, 
    enrollments,
    sectionCourses, 
    scheduleSlots,
    assignCourseToSection, 
    removeSectionCourse,
    updateSectionCourseTeacher,
    addScheduleSlot,
    removeScheduleSlot,
    checkTeacherConflict,
    auditScheduleIntegrity,
    getSectionCourses,
    getSectionSchedule,
    getTeacherSchedule,
    getTeacherSections,
    brandingConfig,
    showToast
  } = useApp();

  // Selection state
  const [selectedLevel, setSelectedLevel] = useState<'todos' | 'inicial' | 'primaria' | 'secundaria'>('primaria');
  const [selectedGradeNum, setSelectedGradeNum] = useState<number>(3);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('sec-3pri-a');
  const [activeTab, setActiveTab] = useState<'horario' | 'asignacion' | 'profesores'>('horario');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedMobileDay, setSelectedMobileDay] = useState<DayOfWeek>('lunes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCopiedToast, setIsCopiedToast] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(true);
  const [isSummaryCardOpen, setIsSummaryCardOpen] = useState<boolean>(true);
  const [isCoursesCardOpen, setIsCoursesCardOpen] = useState<boolean>(true);

  // Export states
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isChangeTeacherModalOpen, setIsChangeTeacherModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [targetAssignmentId, setTargetAssignmentId] = useState<string | null>(null);

  // Form states for Assign Course
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formHours, setFormHours] = useState<number>(4);
  const [formClassroom, setFormClassroom] = useState<string>('Aula 301');

  // Form states for Add Schedule Slot
  const [slotDay, setSlotDay] = useState<DayOfWeek>('lunes');
  const [slotTimeIndex, setSlotTimeIndex] = useState<number>(0);
  const [slotCourseId, setSlotCourseId] = useState<string>('');
  const [slotRoom, setSlotRoom] = useState<string>('');

  // Level Grades
  const currentLevelGrades = useMemo(() => {
    if (selectedLevel === 'todos') return gradeLevels;
    return gradeLevels.filter(g => g.nivel.toLowerCase() === selectedLevel);
  }, [gradeLevels, selectedLevel]);

  // Selected Section Object
  const currentSection = useMemo(() => {
    return sections.find(s => s.id === selectedSectionId) || sections[0];
  }, [sections, selectedSectionId]);

  // Available Grades for the selected level
  const availableGradeNumbers = useMemo(() => {
    const setNums = new Set(currentLevelGrades.map(g => g.numero_grado || 1));
    return Array.from(setNums).sort((a, b) => a - b);
  }, [currentLevelGrades]);

  // Available Sections for current grade & level
  const gradeSections = useMemo(() => {
    return sections.filter(s => {
      const matchesLevel = selectedLevel === 'todos' || s.grado?.nivel === selectedLevel;
      const matchesGrade = selectedLevel === 'todos' || s.grado?.numero_grado === selectedGradeNum;
      const matchesSearch = searchQuery === '' || 
        `${s.grado?.nombre} ${s.letra}`.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && (searchQuery ? matchesSearch : matchesGrade);
    });
  }, [sections, selectedLevel, selectedGradeNum, searchQuery]);

  // Filtered sections for selector
  const filteredSections = useMemo(() => {
    if (selectedLevel === 'todos') return sections;
    return sections.filter(s => s.grado?.nivel === selectedLevel);
  }, [sections, selectedLevel]);

  // Section Assigned Courses
  const currentSectionCourses = useMemo(() => {
    return getSectionCourses(selectedSectionId);
  }, [getSectionCourses, selectedSectionId]);

  // Section Schedule Slots
  const currentSectionSchedule = useMemo(() => {
    return getSectionSchedule(selectedSectionId);
  }, [getSectionSchedule, selectedSectionId]);

  // Total weekly hours in schedule
  const scheduledHoursCount = currentSectionSchedule.length;
  const targetTotalHours = currentSectionCourses.reduce((acc, curr) => acc + (curr.horas_semanales || 0), 0);

  // Distinct teachers assigned to this section
  const assignedTeachersCount = useMemo(() => {
    const teacherIds = new Set(currentSectionCourses.map(sc => sc.docente_id));
    return teacherIds.size;
  }, [currentSectionCourses]);

  // Audit result
  const auditResult = useMemo(() => {
    return auditScheduleIntegrity();
  }, [auditScheduleIntegrity]);

  // Check real-time conflict for the slot modal
  const modalConflictCheck = useMemo(() => {
    if (!slotCourseId) return { hasConflict: false };
    const assignment = currentSectionCourses.find(sc => sc.curso_id === slotCourseId);
    const teacherId = assignment?.docente_id || teachers[0]?.id;
    const timeBlock = TIME_BLOCKS[slotTimeIndex];
    if (!timeBlock || timeBlock.isBreak) return { hasConflict: false };

    return checkTeacherConflict(teacherId, slotDay, timeBlock.inicio);
  }, [slotCourseId, slotDay, slotTimeIndex, currentSectionCourses, teachers, checkTeacherConflict]);

  // Handlers
  const handleLevelChange = (level: 'todos' | 'inicial' | 'primaria' | 'secundaria') => {
    setSelectedLevel(level);
    const validGrades = level === 'todos' ? gradeLevels : gradeLevels.filter(g => g.nivel.toLowerCase() === level);
    const firstGradeNum = validGrades[0]?.numero_grado || 1;
    setSelectedGradeNum(firstGradeNum);
    const matchSec = sections.find(s => (level === 'todos' || s.grado?.nivel === level) && s.grado?.numero_grado === firstGradeNum);
    if (matchSec) setSelectedSectionId(matchSec.id);
  };

  const handleGradeChange = (gradeNum: number) => {
    setSelectedGradeNum(gradeNum);
    const matchSec = sections.find(s => (selectedLevel === 'todos' || s.grado?.nivel === selectedLevel) && s.grado?.numero_grado === gradeNum);
    if (matchSec) setSelectedSectionId(matchSec.id);
  };

  const handleCopySchedule = () => {
    setIsCopiedToast(true);
    setTimeout(() => setIsCopiedToast(false), 3000);
  };

  const handleOpenAssignModal = () => {
    const unassignedCourses = courses.filter(c => !currentSectionCourses.some(sc => sc.curso_id === c.id));
    setFormCourseId(unassignedCourses[0]?.id || courses[0]?.id || '');
    setFormTeacherId(teachers[0]?.id || '');
    setFormHours(4);
    setFormClassroom(`Aula ${currentSection?.grado?.numero_grado || '3'}0${currentSection?.letra === 'A' ? '1' : '2'}`);
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCourseId || !formTeacherId) return;

    assignCourseToSection({
      seccionId: selectedSectionId,
      cursoId: formCourseId,
      docenteId: formTeacherId,
      horasSemanales: formHours,
      aulaDefecto: formClassroom,
    });

    setIsAssignModalOpen(false);
  };

  const handleOpenSlotModal = (day?: DayOfWeek, timeIdx?: number, defaultCourseId?: string) => {
    if (day) setSlotDay(day);
    if (timeIdx !== undefined) setSlotTimeIndex(timeIdx);
    
    const courseToSelect = defaultCourseId || currentSectionCourses[0]?.curso_id || courses[0]?.id || '';
    setSlotCourseId(courseToSelect);

    const assignment = currentSectionCourses.find(sc => sc.curso_id === courseToSelect);
    setSlotRoom(assignment?.aula_defecto || `Aula ${currentSection?.grado?.numero_grado || '3'}01`);
    
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotCourseId) return;

    const assignment = currentSectionCourses.find(sc => sc.curso_id === slotCourseId);
    const docenteId = assignment?.docente_id || teachers[0]?.id;
    const timeBlock = TIME_BLOCKS[slotTimeIndex];

    addScheduleSlot({
      seccionId: selectedSectionId,
      cursoId: slotCourseId,
      docenteId: docenteId,
      dia: slotDay,
      horaInicio: timeBlock.inicio,
      horaFin: timeBlock.fin,
      aula: slotRoom || assignment?.aula_defecto || 'Aula Principal',
    });

    setIsSlotModalOpen(false);
  };

  const handleOpenChangeTeacher = (assignmentId: string) => {
    setTargetAssignmentId(assignmentId);
    const assignment = sectionCourses.find(sc => sc.id === assignmentId);
    if (assignment) {
      setFormTeacherId(assignment.docente_id);
    }
    setIsChangeTeacherModalOpen(true);
  };

  const handleSaveTeacherChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetAssignmentId && formTeacherId) {
      updateSectionCourseTeacher(targetAssignmentId, formTeacherId);
      setIsChangeTeacherModalOpen(false);
      setTargetAssignmentId(null);
    }
  };

  // ── Export Functions (CSV, Image, PDF) ──────────────────────────────────────
  const exportScheduleAsCsv = () => {
    const sectionName = `${currentSection?.grado?.nombre || 'Grado'} "${currentSection?.letra || 'A'}"`;
    const nivelName = currentSection?.grado?.nivel?.toUpperCase() || 'EDUCACIÓN';
    const schoolName = brandingConfig?.nombreInstitucion || 'ColeSistema Mini';
    const currentTutor = teachers.find(t => t.id === currentSection?.tutor_id);
    const tutorName = currentTutor ? `${currentTutor.nombres} ${currentTutor.apellidos}` : 'No asignado';
    
    let csvContent = '\uFEFF'; // UTF-8 BOM para soporte de tildes en Excel
    csvContent += `"${schoolName} - Horario Escolar Oficial 2026"\n`;
    csvContent += `"Sección: ${sectionName}","Nivel: ${nivelName}","Tutor(a): ${tutorName}","Fecha de Emisión: ${new Date().toLocaleDateString('es-PE')}"\n\n`;
    
    csvContent += `"Hora / Bloque","Inicio","Fin","Lunes","Martes","Miércoles","Jueves","Viernes"\n`;
    
    TIME_BLOCKS.forEach((block) => {
      if (block.isBreak) {
        csvContent += `"${block.label}","${block.inicio}","${block.fin}","RECREO Y DESCANSO","RECREO Y DESCANSO","RECREO Y DESCANSO","RECREO Y DESCANSO","RECREO Y DESCANSO"\n`;
        return;
      }
      
      const row = [`"${block.label}"`, `"${block.inicio}"`, `"${block.fin}"`];
      
      DAYS.forEach((day) => {
        const slot = currentSectionSchedule.find((s) => s.dia === day.key && s.hora_inicio === block.inicio);
        if (slot) {
          const courseName = slot.curso?.nombre || 'Clase';
          const teacher = slot.docente ? `Prof. ${slot.docente.nombres.split(' ')[0]} ${slot.docente.apellidos.split(' ')[0]}` : '';
          const room = slot.aula || '';
          row.push(`"${courseName} - ${teacher} (${room})"`);
        } else {
          row.push(`"-"`);
        }
      });
      
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `Horario_${sectionName.replace(/[^a-zA-Z0-9]/g, '_')}_2026.csv`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
    showToast(`Horario exportado en CSV correctamente: ${fileName}`, 'success', '✓ Exportación CSV');
  };

  const exportScheduleAsImage = async () => {
    setIsExporting(true);
    setIsExportMenuOpen(false);
    try {
      const element = document.getElementById('printable-schedule-grid');
      if (!element) {
        showToast('No se encontró el contenedor del horario para exportar', 'error', 'Error');
        return;
      }
      
      showToast('Generando imagen de alta resolución...', 'info', 'Exportando Imagen');
      
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1440,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('printable-schedule-grid');
          if (clonedElement) {
            clonedElement.style.width = '1320px';
            clonedElement.style.maxWidth = '1320px';
            clonedElement.style.minWidth = '1320px';
            clonedElement.style.overflow = 'visible';
            clonedElement.style.background = '#ffffff';
            clonedElement.style.color = '#0f172a';
            clonedElement.style.boxShadow = 'none';
            clonedElement.style.border = '1px solid #e2e8f0';

            // Eliminar overflow oculto en tablas y wrappers
            const scrollWrappers = clonedElement.querySelectorAll('.overflow-x-auto');
            scrollWrappers.forEach((w) => {
              (w as HTMLElement).style.overflow = 'visible';
            });

            // Normalizar tipografía de todos los elementos para evitar texto aplastado o artefactos
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach((node) => {
              const el = node as HTMLElement;
              el.style.letterSpacing = 'normal';
              el.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
            });

            // Ocultar botones de acción interactivos
            const ignoreElements = clonedElement.querySelectorAll('[data-html2canvas-ignore="true"]');
            ignoreElements.forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });
          }
        }
      });
      
      const sectionName = `${currentSection?.grado?.nombre || 'Grado'} "${currentSection?.letra || 'A'}"`;
      const fileName = `Horario_${sectionName.replace(/[^a-zA-Z0-9]/g, '_')}_2026.png`;
      
      const image = canvas.toDataURL('image/png', 1.0);
      const a = document.createElement('a');
      a.href = image;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      showToast(`Horario exportado en Imagen PNG: ${fileName}`, 'success', '✓ Imagen Generada');
    } catch (err: any) {
      showToast(`Error al exportar imagen: ${err?.message || 'Error desconocido'}`, 'error', 'Error');
    } finally {
      setIsExporting(false);
    }
  };

  const exportScheduleAsPdf = async () => {
    setIsExporting(true);
    setIsExportMenuOpen(false);
    try {
      const element = document.getElementById('printable-schedule-grid');
      if (!element) {
        showToast('No se encontró el contenedor del horario para exportar', 'error', 'Error');
        return;
      }
      
      showToast('Compilando documento PDF oficial...', 'info', 'Exportando PDF');
      
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1440,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('printable-schedule-grid');
          if (clonedElement) {
            clonedElement.style.width = '1320px';
            clonedElement.style.maxWidth = '1320px';
            clonedElement.style.minWidth = '1320px';
            clonedElement.style.overflow = 'visible';
            clonedElement.style.background = '#ffffff';
            clonedElement.style.color = '#0f172a';
            clonedElement.style.boxShadow = 'none';
            clonedElement.style.border = '1px solid #e2e8f0';

            // Eliminar overflow oculto en tablas y wrappers
            const scrollWrappers = clonedElement.querySelectorAll('.overflow-x-auto');
            scrollWrappers.forEach((w) => {
              (w as HTMLElement).style.overflow = 'visible';
            });

            // Normalizar tipografía de todos los elementos para evitar texto aplastado o artefactos
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach((node) => {
              const el = node as HTMLElement;
              el.style.letterSpacing = 'normal';
              el.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
            });

            // Ocultar botones de acción interactivos
            const ignoreElements = clonedElement.querySelectorAll('[data-html2canvas-ignore="true"]');
            ignoreElements.forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 6;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      const xPos = (pdfWidth - finalWidth) / 2;
      const yPos = (pdfHeight - finalHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight, undefined, 'FAST');
      
      const sectionName = `${currentSection?.grado?.nombre || 'Grado'} "${currentSection?.letra || 'A'}"`;
      const fileName = `Horario_${sectionName.replace(/[^a-zA-Z0-9]/g, '_')}_2026.pdf`;
      
      pdf.save(fileName);
      showToast(`Documento PDF descargado: ${fileName}`, 'success', '✓ PDF Oficial Generado');
    } catch (err: any) {
      showToast(`Error al compilar PDF: ${err?.message || 'Error desconocido'}`, 'error', 'Error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-[1600px] mx-auto">
      
      {/* ── 1. Page Header Banner (Matching Reference Screenshot) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/80 dark:from-slate-900 dark:via-purple-950/80 dark:to-indigo-950 p-6 sm:p-7 md:p-8 border border-blue-100/90 dark:border-purple-900/40 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        
        {/* Left Content */}
        <div className="space-y-3.5 max-w-2xl">
          {/* Top Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-purple-100/80 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 flex items-center gap-1.5 shadow-xs">
              <School className="w-3.5 h-3.5" />
              Gestión Curricular & Malla 2026
            </span>
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-1.5 shadow-xs">
              <Users className="w-3.5 h-3.5" />
              {sections.length} Salones Oficiales
            </span>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Horarios & Asignación de <span className="text-purple-600 dark:text-purple-400">Profesores</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed font-medium">
              Organiza la distribución horaria de cada salón, asigna docentes especialistas y garantiza un mejor aprendizaje.
            </p>
          </div>

          {/* 3 Feature Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Pill 1 */}
            <div className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">Planifica</span>
                <span className="text-[10px] text-slate-400 font-medium truncate block">de forma simple</span>
              </div>
            </div>

            {/* Pill 2 */}
            <div className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">Asigna</span>
                <span className="text-[10px] text-slate-400 font-medium truncate block">a los mejores docentes</span>
              </div>
            </div>

            {/* Pill 3 */}
            <div className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">Evita cruces</span>
                <span className="text-[10px] text-slate-400 font-medium truncate block">y optimiza el tiempo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Slogans Artwork & Action Buttons */}
        <div className="flex flex-col xl:items-end justify-between gap-5 shrink-0">
          {/* Top Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap relative">
            {/* Export Menu Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsExportMenuOpen(prev => !prev)}
                disabled={isExporting}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs border border-slate-200 dark:border-slate-700 transition-all shadow-sm ${
                  isExporting ? 'opacity-70 cursor-wait' : 'cursor-pointer hover:border-purple-300'
                }`}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                ) : (
                  <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                )}
                <span>Exportar Horario</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Card */}
              {isExportMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsExportMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80">
                      <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">Formato de Exportación</p>
                      <p className="text-[10px] text-slate-400 font-medium">Sección actual: {currentSection?.grado?.nombre} &quot;{currentSection?.letra}&quot;</p>
                    </div>

                    {/* PNG Option */}
                    <button
                      onClick={exportScheduleAsImage}
                      disabled={isExporting}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 transition-colors group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileImage className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black block group-hover:text-purple-600 dark:group-hover:text-purple-400">Imagen HD (.PNG)</span>
                        <span className="text-[10px] text-slate-400 font-medium block">Alta nitidez para WhatsApp o redes</span>
                      </div>
                    </button>

                    {/* PDF Option */}
                    <button
                      onClick={exportScheduleAsPdf}
                      disabled={isExporting}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 transition-colors group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black block group-hover:text-blue-600 dark:group-hover:text-blue-400">Documento Oficial (.PDF)</span>
                        <span className="text-[10px] text-slate-400 font-medium block">A4 horizontal con membrete escolar</span>
                      </div>
                    </button>

                    {/* CSV Option */}
                    <button
                      onClick={exportScheduleAsCsv}
                      disabled={isExporting}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 transition-colors group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black block group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Hoja de Cálculo (.CSV)</span>
                        <span className="text-[10px] text-slate-400 font-medium block">Compatible con Excel y Sheets</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button 
              onClick={handleOpenAssignModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Asignar Materia a Salón
            </button>
          </div>

          {/* Slogans and artistic decoration */}
          <div className="hidden xl:flex items-center gap-6">
            <div className="text-right">
              <span className="font-serif italic text-base text-blue-600 dark:text-blue-400 block -rotate-2 font-bold leading-snug">
                Una mejor educación,<br />un mejor futuro
              </span>
            </div>
            <div className="text-right pl-4 border-l border-slate-200/80 dark:border-slate-800">
              <span className="font-serif italic text-xs text-purple-600 dark:text-purple-400 block leading-tight">
                Grandes docentes,<br />mejores historias
              </span>
              <span className="text-purple-400 text-xs">💜</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── 2. Three-Tier Level/Grade/Section Selector Ribbon ── */}
      {/* ── 2. Three-Tier Level/Grade/Section Selector Ribbon (Modern Responsive Design) ── */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Tier 1: Nivel Educativo + Buscador Integrado */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
          
          {/* Level Tabs Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 shrink-0 hidden sm:inline">
              Nivel Educativo:
            </span>
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleLevelChange('primaria')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedLevel === 'primaria'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Primaria</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">(1°–6°)</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleLevelChange('secundaria')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedLevel === 'secundaria'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Secundaria</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">(1°–5°)</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleLevelChange('inicial')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedLevel === 'inicial'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Inicial</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">(3–5 Años)</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleLevelChange('todos')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedLevel === 'todos'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Todos</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10 ml-0.5 font-bold">
                  {sections.length}
                </span>
              </button>
            </div>
          </div>

          {/* Search Box with Clear Button */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar salón, grado o aula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Seleccionar Grado & Sección */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-0.5">
          
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            
            {/* Section 2: Selecciona un grado */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                Grado:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {availableGradeNumbers.map(num => {
                  const isSelected = selectedGradeNum === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleGradeChange(num)}
                      className={`min-w-[34px] h-8 px-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {num}°
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* Section 3: Selecciona una sección */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                Sección:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {gradeSections.map(sec => {
                  const isSelected = sec.id === selectedSectionId;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`min-w-[34px] h-8 px-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {sec.letra}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Estado de selección actual */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 ml-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate">
              Mostrando: <strong className="text-slate-800 dark:text-white">{currentSection ? `${currentSection.grado?.nombre} "${currentSection.letra}"` : 'Todas las secciones'}</strong>
            </span>
          </div>

        </div>

      </div>

      {/* ── 3. Section Overview Header Card (Matching Image 1 & 2) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm border-l-4 border-l-purple-600 p-5 sm:p-6 space-y-5">
        
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Title with Purple Squircle Badge */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-purple-600/20 shrink-0">
              {currentSection?.grado?.numero_grado || 3}°
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {currentSection?.grado?.nombre} — Sección &quot;{currentSection?.letra}&quot;
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60">
                  {currentSection?.grado?.nivel || 'PRIMARIA'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Horario organizado, docentes asignados y materias listas para un gran año.
              </p>
            </div>
          </div>

          {/* Right Status Pill & Tab Switches */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Conflict Status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div>
                <span className="block leading-tight text-xs font-black">Sin cruces de horario</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Todo en orden</span>
              </div>
            </div>

            {/* Audit button */}
            <button
              onClick={() => setIsAuditModalOpen(true)}
              title="Auditoría de cruces"
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Tab Switches */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                onClick={() => setActiveTab('asignacion')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeTab === 'asignacion'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Materias ({currentSectionCourses.length})
              </button>
              <button
                onClick={() => setActiveTab('horario')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeTab === 'horario'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Malla Horaria
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Stats Row & Quick Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          
          {/* 4 Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
            {/* Stat 1: Capacidad */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Capacidad</span>
                <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                  {currentSection?.capacidad_maxima || 30} alumnos
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {enrollments.filter(e => e.seccion_id === currentSection?.id).length || 28} matriculados
                </span>
              </div>
            </div>

            {/* Stat 2: Materias Asignadas */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Materias asignadas</span>
                <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                  {currentSectionCourses.length}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  de 10 planificadas
                </span>
              </div>
            </div>

            {/* Stat 3: Docentes Asignados */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Docentes asignados</span>
                <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                  {assignedTeachersCount || 6}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  especialistas
                </span>
              </div>
            </div>

            {/* Stat 4: Horario Semanal */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Horario semanal</span>
                <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                  {scheduledHoursCount || 35} bloques
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  de 45 minutos
                </span>
              </div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="h-12 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block shrink-0" />

          {/* Quick Actions (Acciones rápidas) */}
          <div className="space-y-1.5 shrink-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              Acciones rápidas
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('profesores')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200/70 dark:border-blue-800/60 transition-colors shadow-xs"
              >
                <Users className="w-3.5 h-3.5" />
                Carga por Docente
              </button>
              <button
                onClick={handleCopySchedule}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200/70 dark:border-emerald-800/60 transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                Copiar Horario
              </button>
              <Link
                href={`/admin/secciones/${currentSection?.id || ''}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200/70 dark:border-amber-800/60 transition-colors shadow-xs"
              >
                <Settings className="w-3.5 h-3.5" />
                Configurar Sección
              </Link>
            </div>
          </div>

        </div>

        {isCopiedToast && (
          <div className="p-3 rounded-2xl bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Malla horaria copiada al portapapeles y lista para replicar en otras secciones!</span>
          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: MALLA HORARIA SEMANAL (EXACT REPLICA OF DESIGN)                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'horario' && (
        <div className="space-y-4">
          
          {/* Top Bar for Timetable (Matching Screenshot Header) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedLevel('primaria')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-all shadow-2xs"
              >
                <span>←</span>
                <span>Volver</span>
              </button>
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-inner">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Malla Horaria: {currentSection?.grado?.nombre || '3° de Primaria'} &quot;{currentSection?.letra || 'A'}&quot;
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Haz clic en cualquier bloque libre para asignar una clase con el profesor correspondiente.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              {/* Week Navigator Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-2xs">
                <button
                  type="button"
                  className="hover:text-purple-600 transition-colors cursor-pointer"
                  title="Semana anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-center px-1">
                  <span className="text-[10px] text-slate-400 block leading-tight">Semana del</span>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">12 - 16 Feb, 2026</span>
                </div>
                <button
                  type="button"
                  className="hover:text-purple-600 transition-colors cursor-pointer"
                  title="Semana siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* + Bloque Horario Button */}
              <button
                onClick={() => handleOpenSlotModal()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Bloque Horario</span>
              </button>

              {/* Toggle Side Panel Button */}
              <button
                onClick={() => setIsSidePanelOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                  isSidePanelOpen
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100/70'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
                title={isSidePanelOpen ? 'Colapsar panel lateral' : 'Expandir panel lateral'}
              >
                {isSidePanelOpen ? (
                  <>
                    <PanelRightClose className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="hidden sm:inline">Ocultar Panel</span>
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    <span>Mostrar Panel</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Flex Layout: Left Timetable (expands to 100%) + Right Lateral Collapsible Sidebar */}
          <div className="flex flex-col xl:flex-row gap-5 items-start">
            
            {/* ── LEFT: TIMETABLE GRID (Expands laterally) ── */}
            <div className="flex-1 min-w-0 w-full space-y-3 transition-all duration-300">
              <div 
                id="printable-schedule-grid"
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4"
              >
                {/* Institutional Export Header (Branding on captured image/PDF) */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                      {brandingConfig?.siglas || brandingConfig?.nombreInstitucion?.substring(0, 2).toUpperCase() || 'IE'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                          {brandingConfig?.nombreInstitucion || 'Colegio San Juan Bautista'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 uppercase">
                          Año Académico 2026
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Horario Escolar Oficial • Nivel: {currentSection?.grado?.nivel?.toUpperCase() || 'PRIMARIA'} • {currentSection?.grado?.nombre || '3° de Primaria'} &quot;{currentSection?.letra || 'A'}&quot; • Turno Mañana
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Emisión Oficial</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Sistema Central de Horarios</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Vigencia 2026
                    </span>
                  </div>
                </div>

                {/* Desktop Timetable Grid */}
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full border-collapse min-w-[700px]">
                    <thead>
                      <tr>
                        {/* HORA Column Header */}
                        <th className="p-2 text-center w-28 align-middle">
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            HORA
                          </span>
                        </th>

                        {/* Days Headers */}
                        {[
                          { key: 'lunes' as DayOfWeek, label: 'LUNES', date: '12 Feb' },
                          { key: 'martes' as DayOfWeek, label: 'MARTES', date: '13 Feb' },
                          { key: 'miercoles' as DayOfWeek, label: 'MIÉRCOLES', date: '14 Feb' },
                          { key: 'jueves' as DayOfWeek, label: 'JUEVES', date: '15 Feb' },
                          { key: 'viernes' as DayOfWeek, label: 'VIERNES', date: '16 Feb' },
                        ].map((d) => (
                          <th key={d.key} className="p-2 text-center w-[18%]">
                            <span className="block font-black text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                              {d.label}
                            </span>
                            <span className="block text-[11px] text-slate-400 font-medium">
                              {d.date}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="space-y-2">
                      {/* Rows 1, 2, 3 */}
                      {[
                        { id: 'b1', label: '1° Hora', inicio: '08:00', fin: '08:45' },
                        { id: 'b2', label: '2° Hora', inicio: '08:45', fin: '09:30' },
                        { id: 'b3', label: '3° Hora', inicio: '09:30', fin: '10:15' },
                      ].map((block, timeIdx) => (
                        <tr key={block.id} className="border-t border-slate-100 dark:border-slate-800/60">
                          {/* Time Column */}
                          <td className="p-2.5 text-center align-middle">
                            <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 block">
                              {block.label}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 font-medium block mt-0.5">
                              {block.inicio} - {block.fin}
                            </span>
                          </td>

                          {/* 5 Day Cells */}
                          {DAYS.map((day) => {
                            const slot = currentSectionSchedule.find(
                              (s) => s.dia === day.key && s.hora_inicio === block.inicio
                            );

                            return (
                              <td key={day.key} className="p-1.5 align-top">
                                {slot ? (
                                  <ScheduleCard
                                    slot={slot}
                                    inicio={block.inicio}
                                    onDelete={() => removeScheduleSlot(slot.id)}
                                  />
                                ) : (
                                  <button
                                    onClick={() => handleOpenSlotModal(day.key, timeIdx)}
                                    className="w-full min-h-[92px] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-purple-600 transition-all group cursor-pointer"
                                  >
                                    <Plus className="w-4 h-4 transition-transform group-hover:scale-125 text-purple-400" />
                                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-purple-600">Asignar</span>
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Recreo Row */}
                      <tr className="border-y border-amber-200/80 dark:border-amber-900/40">
                        {/* Time Column */}
                        <td className="p-2.5 text-center align-middle bg-amber-50/60 dark:bg-amber-950/20 rounded-l-2xl">
                          <span className="font-extrabold text-xs text-amber-900 dark:text-amber-300 block">
                            10:15 - 10:45
                          </span>
                        </td>

                        {/* Spanning Recreo Banner */}
                        <td colSpan={5} className="p-1">
                          <div className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-amber-100/90 via-orange-50/90 to-amber-100/90 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 border border-amber-200/90 dark:border-amber-900/60 flex items-center justify-between shadow-2xs">
                            {/* Left Apple + Trail */}
                            <div className="flex items-center gap-2">
                              <span className="text-xl">🍎</span>
                              <div className="hidden sm:flex items-center gap-1 text-amber-400 text-xs">
                                <span>- - - - ✈️</span>
                              </div>
                            </div>

                            {/* Center Title */}
                            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-xs sm:text-sm tracking-wide">
                              <span>☕</span>
                              <span>RECREO &amp; DESCANSO ESCOLAR</span>
                            </div>

                            {/* Right Sun */}
                            <div className="flex items-center">
                              <span className="text-xl">☀️</span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Rows 4, 5, 6, 7 */}
                      {[
                        { id: 'b4', label: '4° Hora', inicio: '10:45', fin: '11:30' },
                        { id: 'b5', label: '5° Hora', inicio: '11:30', fin: '12:15' },
                        { id: 'b6', label: '6° Hora', inicio: '12:15', fin: '13:00' },
                        { id: 'b7', label: '7° Hora', inicio: '13:00', fin: '13:45' },
                      ].map((block, timeIdx) => {
                        const actualIdx = timeIdx + 4; // offset for time block indexing
                        return (
                          <tr key={block.id} className="border-t border-slate-100 dark:border-slate-800/60">
                            {/* Time Column */}
                            <td className="p-2.5 text-center align-middle">
                              <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 block">
                                {block.label}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400 font-medium block mt-0.5">
                                {block.inicio} - {block.fin}
                              </span>
                            </td>

                            {/* 5 Day Cells */}
                            {DAYS.map((day) => {
                              const slot = currentSectionSchedule.find(
                                (s) => s.dia === day.key && s.hora_inicio === block.inicio
                              );

                              return (
                                <td key={day.key} className="p-1.5 align-top">
                                  {slot ? (
                                    <ScheduleCard
                                      slot={slot}
                                      inicio={block.inicio}
                                      onDelete={() => removeScheduleSlot(slot.id)}
                                    />
                                  ) : (
                                    <div className="relative min-h-[96px] flex items-center justify-center">
                                      <button
                                        onClick={() => handleOpenSlotModal(day.key, actualIdx)}
                                        data-html2canvas-ignore="true"
                                        className="w-full min-h-[96px] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-purple-600 transition-all group cursor-pointer"
                                      >
                                        <Plus className="w-4 h-4 transition-transform group-hover:scale-125 text-purple-400" />
                                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-purple-600">Asignar</span>
                                      </button>
                                      {/* Clean export placeholder visible only when buttons are ignored */}
                                      <div className="w-full min-h-[96px] rounded-2xl border border-slate-100 bg-slate-50/50 hidden [canvas_&]:flex items-center justify-center text-slate-300 text-xs font-semibold">
                                        —
                                      </div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Bar of Timetable with Quick Export Actions (Excluded from clean export image) */}
                <div 
                  data-html2canvas-ignore="true"
                  className="flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                    <Info className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Malla horaria oficial configurada para el periodo lectivo 2026.</span>
                  </div>

                  {/* Quick Export Shortcuts & Settings */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase text-slate-400 mr-1 hidden sm:inline">Descargar:</span>
                    
                    {/* Direct PNG Export */}
                    <button
                      type="button"
                      onClick={exportScheduleAsImage}
                      disabled={isExporting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-100 transition-all shadow-2xs cursor-pointer"
                      title="Descargar horario como imagen PNG"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      <span>PNG</span>
                    </button>

                    {/* Direct PDF Export */}
                    <button
                      type="button"
                      onClick={exportScheduleAsPdf}
                      disabled={isExporting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 transition-all shadow-2xs cursor-pointer"
                      title="Descargar horario como documento PDF oficial"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    {/* Direct CSV Export */}
                    <button
                      type="button"
                      onClick={exportScheduleAsCsv}
                      disabled={isExporting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-all shadow-2xs cursor-pointer"
                      title="Descargar horario como hoja de cálculo CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>

                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Imprimir</span>
                    </button>
                  </div>
                </div>

                {/* Security and Verification Footer */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 border-t border-dashed border-slate-100 dark:border-slate-800/60">
                  <span>Documento institucional emitido y certificado por el Sistema Central de Gestión Educativa • Código de Validación: SCH-2026-{currentSection?.id || 'SEC01'}</span>
                  <span className="font-mono">Fecha de Generación: {new Date().toLocaleDateString('es-PE')}</span>
                </div>

              </div>
            </div>

            {/* ── RIGHT: LATERAL COLLAPSIBLE SIDEBAR ── */}
            <div className={`transition-all duration-300 ease-in-out shrink-0 w-full ${
              isSidePanelOpen ? 'xl:w-[320px]' : 'xl:w-14'
            }`}>
              {isSidePanelOpen ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
                  
                  {/* Card 1: Resumen del Horario */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          Resumen del Horario
                        </h4>
                      </div>
                      <button
                        onClick={() => setIsSidePanelOpen(false)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Colapsar panel lateral hacia la derecha"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* KPI 1: Horas programadas */}
                      <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-black text-emerald-900 dark:text-emerald-200">
                            35 / 35
                          </span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block mt-0.5">
                          Horas programadas
                        </span>
                      </div>

                      {/* KPI 2: Días de clase */}
                      <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-base font-black text-purple-900 dark:text-purple-200">
                            5
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block mt-0.5">
                          Días de clase
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Materias del Salón */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600 shrink-0" />
                        <div>
                          <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                            Materias del Salón
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Avance de horas semanales
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      {[
                        { name: 'Matemática', hours: '8 / 6 h', color: 'bg-blue-600', barColor: 'bg-blue-600', width: '100%' },
                        { name: 'Comunicación', hours: '7 / 6 h', color: 'bg-pink-500', barColor: 'bg-pink-500', width: '100%' },
                        { name: 'Ciencia y Tecnología', hours: '4 / 4 h', color: 'bg-teal-500', barColor: 'bg-teal-500', width: '100%' },
                        { name: 'Inglés', hours: '3 / 3 h', color: 'bg-indigo-600', barColor: 'bg-indigo-600', width: '100%' },
                        { name: 'Personal Social', hours: '4 / 3 h', color: 'bg-amber-500', barColor: 'bg-amber-500', width: '100%' },
                        { name: 'Arte y Cultura', hours: '2 / 2 h', color: 'bg-purple-600', barColor: 'bg-purple-600', width: '100%' },
                      ].map((c, i) => (
                        <div key={i} className="group cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 p-1.5 rounded-xl transition-all">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-2">
                              {/* Course Icon */}
                              <div className={`w-6 h-6 rounded-lg ${c.color} text-white flex items-center justify-center p-1 shadow-2xs shrink-0`}>
                                <CourseIcon courseName={c.name} className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span className="font-extrabold text-slate-800 dark:text-white text-xs">
                                {c.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-[11px] text-emerald-600 dark:text-emerald-400">
                                {c.hours}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>

                          {/* Colored Progress Bar */}
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${c.barColor} rounded-full`} style={{ width: c.width }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 3: Quote Card */}
                  <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-purple-50/80 dark:from-slate-800 dark:to-indigo-950/40 rounded-3xl p-4 border border-blue-100/80 dark:border-blue-900/40 flex items-center gap-3.5 shadow-2xs">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-serif italic font-bold text-xs text-slate-800 dark:text-slate-200 leading-snug">
                        &quot;Un buen horario construye grandes aprendizajes&quot;
                      </p>
                    </div>
                  </div>

                </div>
              ) : (
                /* Collapsed Vertical Dock / Rail */
                <div 
                  onClick={() => setIsSidePanelOpen(true)}
                  className="hidden xl:flex flex-col items-center py-4 px-1.5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer transition-all group space-y-4 min-h-[460px] animate-in fade-in duration-200 select-none"
                  title="Clic para expandir panel lateral"
                >
                  <button
                    type="button"
                    className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-2xs cursor-pointer"
                    title="Expandir panel lateral"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="h-px w-6 bg-slate-200 dark:bg-slate-800" />

                  {/* Micro Indicators */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center text-[8px] font-black leading-none p-1 shadow-2xs" title="35/35 Horas programadas">
                      <BarChart3 className="w-3 h-3 mb-0.5" />
                      <span>35h</span>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex flex-col items-center justify-center text-[8px] font-black leading-none p-1 shadow-2xs" title="5 Días de clase">
                      <Calendar className="w-3 h-3 mb-0.5" />
                      <span>5d</span>
                    </div>
                  </div>

                  <div className="h-px w-6 bg-slate-200 dark:bg-slate-800" />

                  {/* Micro Stack of Course Icons */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center p-1 shadow-2xs" title="Matemática">
                      <CourseIcon courseName="Matemática" className="w-3 h-3 text-white" />
                    </div>
                    <div className="w-6 h-6 rounded-md bg-pink-500 text-white flex items-center justify-center p-1 shadow-2xs" title="Comunicación">
                      <CourseIcon courseName="Comunicación" className="w-3 h-3 text-white" />
                    </div>
                    <div className="w-6 h-6 rounded-md bg-teal-500 text-white flex items-center justify-center p-1 shadow-2xs" title="Ciencia">
                      <CourseIcon courseName="Ciencia" className="w-3 h-3 text-white" />
                    </div>
                    <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center p-1 shadow-2xs" title="Inglés">
                      <CourseIcon courseName="Inglés" className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Rotated Vertical Label */}
                  <div className="flex-1 flex items-center justify-center pt-2">
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-purple-600 transition-colors">
                      Resumen y Materias
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: ASIGNACIÓN DE MATERIAS Y PROFESORES                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'asignacion' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                Materias y Docentes Asignados a {currentSection?.grado?.nombre} &quot;{currentSection?.letra}&quot;
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cada materia asignada a este salón cuenta con un profesor designado que impartirá las clases en esta sección.
              </p>
            </div>

            <button
              onClick={handleOpenAssignModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition-all w-fit"
            >
              <Plus className="w-3.5 h-3.5" />
              Asignar Nueva Materia
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSectionCourses.map(assignment => {
              const courseColor = assignment.curso?.color_hex || '#8b5cf6';
              const assignedHoursInGrid = currentSectionSchedule.filter(
                s => s.curso_id === assignment.curso_id
              ).length;

              return (
                <div
                  key={assignment.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Top color bar */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: courseColor }}
                  />

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {assignment.curso?.codigo}
                        </span>
                        <h4 className="text-base font-black text-slate-900 dark:text-white">
                          {assignment.curso?.nombre}
                        </h4>
                      </div>
                      <span 
                        className="px-2.5 py-1 rounded-full text-[10px] font-black"
                        style={{
                          backgroundColor: `${courseColor}18`,
                          color: courseColor,
                        }}
                      >
                        {assignment.horas_semanales || 4} hrs/sem
                      </span>
                    </div>

                    {/* Teacher Card Box */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-4">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-purple-600" />
                        Profesor Titular:
                      </div>
                      <div className="flex items-center gap-3">
                        <img
                          src={assignment.docente?.avatar_url || `https://ui-avatars.com/api/?name=${assignment.docente?.nombres}`}
                          alt={assignment.docente?.nombres}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/20 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {assignment.docente?.nombres} {assignment.docente?.apellidos}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                            {assignment.docente?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Location and Grid Sync Status */}
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Aula habitual:</span>
                        <span className="font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {assignment.aula_defecto || 'Aula Principal'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Horas en horario:</span>
                        <span className={`font-black ${
                          assignedHoursInGrid >= (assignment.horas_semanales || 4)
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {assignedHoursInGrid} de {assignment.horas_semanales || 4} hrs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenChangeTeacher(assignment.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-xs transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      Reasignar Docente
                    </button>
                    <button
                      onClick={() => removeSectionCourse(assignment.id)}
                      title="Eliminar materia de este salón"
                      className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}

            {/* Add Card Shortcut */}
            <button
              onClick={handleOpenAssignModal}
              className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-purple-500 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 p-8 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-purple-600 transition-all min-h-[220px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                Asignar otra Materia
              </span>
              <span className="text-xs text-slate-500 text-center max-w-[200px]">
                Vincula un nuevo curso del catálogo a este salón con su profesor.
              </span>
            </button>
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: CARGA HORARIA POR PROFESOR                                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'profesores' && (
        <div className="space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                Matriz de Carga Horaria por Profesor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona un docente para visualizar todos los salones a su cargo y su horario semanal consolidado.
              </p>
            </div>

            {/* Teacher Dropdown */}
            <div className="flex items-center gap-2 min-w-[240px]">
              <SearchableSelect
                value={selectedTeacherId}
                onChange={(val) => setSelectedTeacherId(val)}
                icon={<UserCheck className="w-3.5 h-3.5" />}
                options={teachers.map(t => ({
                  value: t.id,
                  label: `Prof. ${t.nombres} ${t.apellidos}`,
                  sublabel: t.especialidad || 'Docente',
                }))}
                placeholder="Buscar docente..."
              />
            </div>
          </div>

          {/* Teacher Summary Box */}
          {(() => {
            const currentTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
            const teacherSections = getTeacherSections(selectedTeacherId);
            const teacherSchedule = getTeacherSchedule(selectedTeacherId);

            return (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/90 to-indigo-900/90 text-white shadow-xl shadow-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={currentTeacher.avatar_url || `https://ui-avatars.com/api/?name=${currentTeacher.nombres}`}
                      alt={currentTeacher.nombres}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30"
                    />
                    <div>
                      <h4 className="text-lg font-black">{currentTeacher.nombres} {currentTeacher.apellidos}</h4>
                      <p className="text-xs text-blue-200">{currentTeacher.email} • DNI: {currentTeacher.dni}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 font-bold">
                          {teacherSections.length} Salones a cargo
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-bold">
                          {teacherSchedule.length} Horas de clase semanales
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Teacher Schedule Grid */}
                <div className="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm backdrop-blur-xl">
                  <table className="w-full border-collapse text-left min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                        <th className="p-3 text-center w-24">Hora</th>
                        {DAYS.map(d => (
                          <th key={d.key} className="p-3 text-center">{d.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {TIME_BLOCKS.map(block => {
                        if (block.isBreak) {
                          return (
                            <tr key={block.id} className="bg-amber-500/10 dark:bg-amber-950/20 text-center text-xs font-bold text-amber-700 dark:text-amber-400">
                              <td className="p-2">{block.inicio}-{block.fin}</td>
                              <td colSpan={5} className="p-2 uppercase tracking-wider">☕ RECREO</td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={block.id}>
                            <td className="p-2.5 text-center text-xs font-bold text-slate-500 border-r border-slate-100 dark:border-slate-800">
                              {block.inicio}
                            </td>
                            {DAYS.map(d => {
                              const slot = teacherSchedule.find(s => s.dia === d.key && s.hora_inicio === block.inicio);
                              return (
                                <td key={d.key} className="p-1.5 border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                                  {slot ? (
                                    <div 
                                      className="p-2 rounded-xl text-xs font-black shadow-sm"
                                      style={{
                                        backgroundColor: `${slot.curso?.color_hex || '#3b82f6'}18`,
                                        color: slot.curso?.color_hex || '#3b82f6',
                                        border: `1px solid ${slot.curso?.color_hex || '#3b82f6'}40`
                                      }}
                                    >
                                      <div>{slot.curso?.nombre}</div>
                                      <div className="text-[10px] opacity-80 mt-0.5">
                                        {slot.seccion?.grado?.nombre} &quot;{slot.seccion?.letra}&quot;
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-12 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-center text-[10px] text-slate-300 dark:text-slate-700">
                                      Libre
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: ASIGNAR MATERIA A SALÓN                                        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Asignar Materia a {currentSection?.grado?.nombre} &quot;{currentSection?.letra}&quot;
                  </h3>
                  <p className="text-xs text-slate-500">Selecciona el curso del catálogo y el profesor titular responsable</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                    Curso / Área Curricular *
                  </label>
                  <SearchableSelect
                    value={formCourseId}
                    onChange={(val) => setFormCourseId(val)}
                    icon={<BookOpen className="w-4 h-4" />}
                    options={courses.map(c => ({
                      value: c.id,
                      label: c.nombre,
                      sublabel: `Código: ${c.codigo}`,
                    }))}
                    placeholder="Buscar materia..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                    Profesor Responsable *
                  </label>
                  <SearchableSelect
                    value={formTeacherId}
                    onChange={(val) => setFormTeacherId(val)}
                    icon={<UserCheck className="w-4 h-4" />}
                    options={teachers.map(t => ({
                      value: t.id,
                      label: `Prof. ${t.nombres} ${t.apellidos}`,
                      sublabel: t.especialidad || 'Docente',
                    }))}
                    placeholder="Buscar profesor..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    Horas Semanales *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      min={1}
                      max={10}
                      required
                      value={formHours}
                      onChange={(e) => setFormHours(Number(e.target.value))}
                      className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-500" />
                    Aula por Defecto
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={formClassroom}
                      onChange={(e) => setFormClassroom(e.target.value)}
                      placeholder="Ej. Aula 301 / Lab 1"
                      className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all active:scale-95"
                >
                  Guardar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: AÑADIR BLOQUE HORARIO (CON DETECCIÓN DE CRUCE EN VIVO)          */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Programar Bloque de Clase
                  </h3>
                  <p className="text-xs text-slate-500">{currentSection?.grado?.nombre} &quot;{currentSection?.letra}&quot;</p>
                </div>
              </div>
              <button
                onClick={() => setIsSlotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-500" />
                    Día de la Semana *
                  </label>
                  <SearchableSelect
                    value={slotDay}
                    onChange={(val) => setSlotDay(val as DayOfWeek)}
                    icon={<Calendar className="w-4 h-4" />}
                    options={DAYS.map(d => ({
                      value: d.key,
                      label: d.label,
                      sublabel: `Día de clase (${d.short})`,
                    }))}
                    placeholder="Seleccionar día..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    Hora / Bloque *
                  </label>
                  <SearchableSelect
                    value={String(slotTimeIndex)}
                    onChange={(val) => setSlotTimeIndex(Number(val))}
                    icon={<Clock className="w-4 h-4" />}
                    options={TIME_BLOCKS.filter(b => !b.isBreak).map((b) => ({
                      value: String(TIME_BLOCKS.findIndex(tb => tb.id === b.id)),
                      label: b.label,
                      sublabel: `${b.inicio} - ${b.fin}`,
                    }))}
                    placeholder="Seleccionar bloque..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                    Materia Asignada *
                  </label>
                  <SearchableSelect
                    value={slotCourseId}
                    onChange={(val) => {
                      setSlotCourseId(val);
                      const asig = currentSectionCourses.find(sc => sc.curso_id === val);
                      if (asig) setSlotRoom(asig.aula_defecto || 'Aula 301');
                    }}
                    icon={<BookOpen className="w-4 h-4" />}
                    options={currentSectionCourses.map(sc => ({
                      value: sc.curso_id,
                      label: sc.curso?.nombre || 'Curso',
                      sublabel: `Prof. ${sc.docente?.nombres || ''} ${sc.docente?.apellidos || ''}`,
                    }))}
                    placeholder="Seleccionar materia..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-500" />
                    Aula / Laboratorio
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={slotRoom}
                      onChange={(e) => setSlotRoom(e.target.value)}
                      placeholder="Ej. Aula 301 / Lab de Ciencias"
                      className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Conflict warning in real-time */}
              {modalConflictCheck.hasConflict && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-start gap-2.5 animate-bounce-short">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                  <div>
                    <span className="block font-black">¡Alerta de Cruce de Horario Detectado!</span>
                    <span className="text-[11px] font-normal leading-relaxed">
                      {modalConflictCheck.message}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalConflictCheck.hasConflict}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all active:scale-95 ${
                    modalConflictCheck.hasConflict
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  Asignar a la Malla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: AUDITORÍA DE INTEGRIDAD HORARIA & CRUCES DOCENTES              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-600/10 to-indigo-600/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Auditoría de Integridad Horaria Institucional 2026
                  </h3>
                  <p className="text-xs text-slate-500">Verificación cruzada de los 22 salones de Primaria y Secundaria</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-black text-sm text-emerald-900 dark:text-emerald-200">
                    ¡Horarios 100% Libres de Cruces!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Se han verificado {auditResult.totalSlots} bloques horarios asignados. Ningún docente tiene clases duplicadas a la misma hora.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Salones Evaluados</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">22</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Bloques Asignados</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{auditResult.totalSlots}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Conflictos</span>
                  <p className="text-xl font-black text-emerald-600">0</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsAuditModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: REASIGNAR DOCENTE TITULAR                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isChangeTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-600" />
                Reasignar Profesor de la Materia
              </h3>
              <button onClick={() => setIsChangeTeacherModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSaveTeacherChange} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                  Nuevo Profesor Titular
                </label>
                <SearchableSelect
                  value={formTeacherId}
                  onChange={(val) => setFormTeacherId(val)}
                  icon={<UserCheck className="w-4 h-4" />}
                  options={teachers.map(t => ({
                    value: t.id,
                    label: `Prof. ${t.nombres} ${t.apellidos}`,
                    sublabel: t.especialidad || 'Docente',
                  }))}
                  placeholder="Buscar profesor..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangeTeacherModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl"
                >
                  Guardar Cambio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
