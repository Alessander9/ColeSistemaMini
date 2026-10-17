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
  Loader2,
  Copy
} from 'lucide-react';
import { initialsAvatarUrl } from '@/lib/avatar';

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
  // Horas que pide cada materia (si la asignación no las tiene, se usan las sugeridas del curso)
  const hoursOfAssignment = (sc: { horas_semanales?: number; curso_id: string }) => sc.horas_semanales || courses.find(c => c.id === sc.curso_id)?.horas_semanales_sugeridas || 0;
  const targetTotalHours = currentSectionCourses.reduce((acc, curr) => acc + hoursOfAssignment(curr), 0);

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
    // Sin docente asignado no hay cruce que revisar (antes se usaba el primer docente de la lista)
    const teacherId = assignment?.docente_id;
    const timeBlock = TIME_BLOCKS[slotTimeIndex];
    if (!teacherId || !timeBlock || timeBlock.isBreak) return { hasConflict: false };

    return checkTeacherConflict(teacherId, slotDay, timeBlock.inicio);
  }, [slotCourseId, slotDay, slotTimeIndex, currentSectionCourses, checkTeacherConflict]);

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
    setSlotRoom(assignment?.aula_defecto || currentSection?.aula || '');
    
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotCourseId) return;

    const assignment = currentSectionCourses.find(sc => sc.curso_id === slotCourseId);
    const docenteId = assignment?.docente_id;
    if (!docenteId) {
      showToast('Este curso aún no tiene docente en el aula. Asígnalo en Docentes antes de ponerlo en el horario.', 'warning', 'Falta docente');
      return;
    }
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
    <div className="space-y-5 pb-12 animate-fade-in max-w-[1600px] mx-auto">
      
      {/* ══════════ 1. ENCABEZADO: título simple + acciones principales ══════════ */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-8 h-8 text-purple-600" /> Horarios
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Elige un aula y arma su semana: toca un espacio vacío para poner una clase. El sistema avisa si un docente queda en dos aulas a la misma hora.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Exportar (PNG / PDF / CSV) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(prev => !prev)}
              disabled={isExporting}
              aria-expanded={isExportMenuOpen}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 ${isExporting ? 'opacity-70 cursor-wait' : 'hover:border-purple-300 cursor-pointer'}`}
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <Download className="w-4 h-4 text-purple-600" />}
              Descargar
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isExportMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsExportMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1">
                  <p className="px-3 py-1.5 text-xs text-slate-500">Horario de {currentSection?.grado?.nombre} &quot;{currentSection?.letra}&quot;</p>
                  {[
                    { onClick: exportScheduleAsImage, icon: FileImage, tone: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40', label: 'Imagen (PNG)', hint: 'Para enviar por WhatsApp' },
                    { onClick: exportScheduleAsPdf, icon: FileText, tone: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40', label: 'Documento (PDF)', hint: 'A4 horizontal con membrete' },
                    { onClick: exportScheduleAsCsv, icon: FileSpreadsheet, tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40', label: 'Hoja de cálculo (CSV)', hint: 'Para abrir en Excel' },
                  ].map(o => (
                    <button key={o.label} type="button" onClick={o.onClick} disabled={isExporting} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${o.tone}`}><o.icon className="w-4 h-4" /></span>
                      <span><span className="block text-sm font-black text-slate-800 dark:text-slate-100">{o.label}</span><span className="block text-xs text-slate-500">{o.hint}</span></span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button type="button" onClick={handleOpenAssignModal} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-black shadow-md shadow-purple-600/25 cursor-pointer">
            <Plus className="w-4 h-4" /> Asignar materia
          </button>
        </div>
      </div>

      {/* ══════════ 2. ELEGIR AULA: nivel → grado → sección ══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex flex-col xl:flex-row xl:items-center gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 w-14">Nivel</span>
          {([
            { k: 'inicial', label: 'Inicial' },
            { k: 'primaria', label: 'Primaria' },
            { k: 'secundaria', label: 'Secundaria' },
            { k: 'todos', label: 'Todos' },
          ] as const).map(l => (
            <button key={l.k} type="button" onClick={() => handleLevelChange(l.k)} aria-pressed={selectedLevel === l.k}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-bold cursor-pointer transition-colors ${selectedLevel === l.k ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              {l.label}
            </button>
          ))}
        </div>

        {selectedLevel !== 'todos' && !searchQuery && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 w-14 xl:w-auto">Grado</span>
            {availableGradeNumbers.map(num => (
              <button key={num} type="button" onClick={() => handleGradeChange(num)} aria-pressed={selectedGradeNum === num}
                className={`min-w-[40px] h-9 px-2.5 rounded-xl text-sm font-black cursor-pointer transition-colors ${selectedGradeNum === num ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                {selectedLevel === 'inicial' ? (currentLevelGrades.find(g => g.numero_grado === num)?.nombre || num) : `${num}°`}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 w-14 xl:w-auto">{searchQuery || selectedLevel === 'todos' ? 'Aula' : 'Sección'}</span>
          {(selectedLevel === 'todos' && !searchQuery ? filteredSections : gradeSections).map(sec => (
            <button key={sec.id} type="button" onClick={() => setSelectedSectionId(sec.id)} aria-pressed={sec.id === selectedSectionId}
              className={`h-9 px-3 rounded-xl text-sm font-black cursor-pointer transition-colors ${sec.id === selectedSectionId ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              {searchQuery || selectedLevel === 'todos' ? `${sec.grado?.nombre?.replace(' de ', ' ')} ${sec.letra}` : sec.letra}
            </button>
          ))}
          {(selectedLevel === 'todos' && !searchQuery ? filteredSections : gradeSections).length === 0 && <span className="text-sm text-slate-400">No hay aulas</span>}
        </div>

        <div className="relative xl:ml-auto xl:w-60">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="text" placeholder="Buscar aula (ej. 3° B)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500" />
          {searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Borrar búsqueda" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      {/* ══════════ 3. AULA ELEGIDA: datos clave en una línea + pestañas ══════════ */}
      {(() => {
        const enrolled = enrollments.filter(e => e.seccion_id === currentSection?.id && e.estado === 'activo').length;
        const conflicts = auditResult.conflictsCount;
        const stats = [
          { icon: Users, label: 'Alumnos', value: `${enrolled} de ${currentSection?.capacidad_maxima || 30}` },
          { icon: BookOpen, label: 'Materias', value: `${currentSectionCourses.length}` },
          { icon: UserCheck, label: 'Docentes', value: `${assignedTeachersCount}` },
          { icon: Clock, label: 'Clases en el horario', value: targetTotalHours > 0 ? `${scheduledHoursCount} de ${targetTotalHours}` : `${scheduledHoursCount}` },
        ];
        return (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl font-black shrink-0">
                  {currentSection?.grado?.numero_grado || ''}{currentSection?.letra}
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight truncate">{currentSection?.grado?.nombre} &quot;{currentSection?.letra}&quot;</h2>
                  <p className="text-sm text-slate-500 capitalize">{currentSection?.grado?.nivel || ''}{currentSection?.aula ? ` · ${currentSection.aula}` : ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                {stats.map(s => (
                  <div key={s.label} className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                    <p className="text-xs text-slate-500 flex items-center gap-1"><s.icon className="w-3.5 h-3.5" /> {s.label}</p>
                    <p className="text-base font-black text-slate-900 dark:text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={() => setIsAuditModalOpen(true)} title="Revisar cruces de horario de todo el colegio"
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold cursor-pointer ${conflicts > 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-2 border-rose-200 dark:border-rose-900' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-2 border-emerald-200 dark:border-emerald-900'}`}>
                  {conflicts > 0 ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  {conflicts > 0 ? `${conflicts} ${conflicts === 1 ? 'cruce' : 'cruces'} de horario` : 'Sin cruces'}
                </button>
                <Link href={`/admin/secciones/${currentSection?.id || ''}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400">
                  <Settings className="w-4 h-4" /> Ver aula
                </Link>
                <button type="button" onClick={handleCopySchedule} title="Copiar este horario para usarlo en otra sección" className="p-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400 cursor-pointer" aria-label="Copiar horario">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isCopiedToast && (
              <div className="mx-5 mb-3 p-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Horario copiado, listo para usar en otra sección.
              </div>
            )}

            {/* Pestañas */}
            <div className="flex gap-1 px-4 sm:px-5 border-t border-slate-100 dark:border-slate-800" role="tablist">
              {([
                { k: 'horario', label: 'Horario de la semana', icon: Calendar },
                { k: 'asignacion', label: `Materias del aula (${currentSectionCourses.length})`, icon: BookOpen },
                { k: 'profesores', label: 'Carga por docente', icon: Users },
              ] as const).map(t => (
                <button key={t.k} type="button" role="tab" aria-selected={activeTab === t.k} onClick={() => setActiveTab(t.k)}
                  className={`inline-flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-black border-b-[3px] -mb-px cursor-pointer transition-colors ${activeTab === t.k ? 'border-purple-600 text-purple-700 dark:text-purple-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                  <t.icon className="w-4 h-4" /> <span className="hidden sm:inline">{t.label}</span><span className="sm:hidden">{t.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ══════════ PESTAÑA 1: HORARIO DE LA SEMANA ══════════ */}
      {activeTab === 'horario' && (
        <div className="flex flex-col xl:flex-row gap-5 items-start">
          <div className="flex-1 min-w-0 w-full space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-500 shrink-0" />
                Toca un espacio con <strong>+</strong> para poner una clase. Pasa el mouse sobre una clase para quitarla.
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleOpenSlotModal()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-black cursor-pointer">
                  <Plus className="w-4 h-4" /> Agregar clase
                </button>
                <button type="button" onClick={() => setIsSidePanelOpen(prev => !prev)} className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer" aria-expanded={isSidePanelOpen}>
                  {isSidePanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />} {isSidePanelOpen ? 'Ocultar resumen' : 'Ver resumen'}
                </button>
              </div>
            </div>

            <div id="printable-schedule-grid" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
              {/* Membrete (sale en la imagen y el PDF) */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shrink-0">
                    {brandingConfig?.siglas || brandingConfig?.nombreInstitucion?.substring(0, 2).toUpperCase() || 'IE'}
                  </span>
                  <div>
                    <p className="text-base font-black text-slate-900 dark:text-white leading-tight">{brandingConfig?.nombreInstitucion || 'Institución Educativa'}</p>
                    <p className="text-xs text-slate-500">Horario escolar {new Date().getFullYear()} · {currentSection?.grado?.nombre} &quot;{currentSection?.letra}&quot;</p>
                  </div>
                </div>
                <span className="hidden sm:block text-xs text-slate-400">Emitido el {new Date().toLocaleDateString('es-PE')}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[720px]">
                  <thead>
                    <tr>
                      <th className="p-2 w-24 text-left text-xs font-black uppercase tracking-wider text-slate-400">Hora</th>
                      {DAYS.map(d => (
                        <th key={d.key} className="p-2 text-center text-sm font-black text-slate-700 dark:text-slate-200">{d.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_BLOCKS.map((block, idx) => (
                      block.isBreak ? (
                        <tr key={block.id}>
                          <td className="p-2 text-xs font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">{block.inicio}–{block.fin}</td>
                          <td colSpan={5} className="p-1.5">
                            <div className="py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-center text-sm font-black text-amber-800 dark:text-amber-300">☕ Recreo</div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={block.id} className="border-t border-slate-100 dark:border-slate-800/60">
                          <td className="p-2 align-middle">
                            <span className="block text-sm font-black text-slate-800 dark:text-slate-200">{block.inicio}</span>
                            <span className="block text-[11px] text-slate-400">a {block.fin}</span>
                          </td>
                          {DAYS.map(day => {
                            const slot = currentSectionSchedule.find(s => s.dia === day.key && s.hora_inicio === block.inicio);
                            return (
                              <td key={day.key} className="p-1.5 align-top">
                                {slot ? (
                                  <ScheduleCard slot={slot} inicio={block.inicio} onDelete={() => removeScheduleSlot(slot.id)} />
                                ) : (
                                  <button type="button" onClick={() => handleOpenSlotModal(day.key, idx)} data-html2canvas-ignore="true"
                                    aria-label={`Agregar clase el ${day.label} a las ${block.inicio}`}
                                    className="w-full min-h-[84px] rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 flex items-center justify-center text-slate-300 hover:text-purple-600 transition-colors cursor-pointer">
                                    <Plus className="w-5 h-5" />
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="pt-2 text-[11px] text-slate-400 border-t border-dashed border-slate-100 dark:border-slate-800">Código de validación: SCH-{new Date().getFullYear()}-{currentSection?.id || 'SEC'}</p>
            </div>
          </div>

          {/* Resumen lateral con datos reales */}
          {isSidePanelOpen && (
            <aside className="w-full xl:w-80 shrink-0 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white">¿Cómo va el horario?</h3>
                {(() => {
                  const pctDone = targetTotalHours > 0 ? Math.min(100, Math.round((scheduledHoursCount / targetTotalHours) * 100)) : 0;
                  const daysWithClasses = new Set(currentSectionSchedule.map(s => s.dia)).size;
                  return (
                    <>
                      <div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-3xl font-black text-slate-900 dark:text-white">{scheduledHoursCount}<span className="text-base text-slate-400"> / {targetTotalHours}</span></span>
                          <span className={`text-sm font-black ${pctDone === 100 ? 'text-emerald-600' : 'text-purple-600'}`}>{pctDone}%</span>
                        </div>
                        <p className="text-xs text-slate-500">clases puestas de las horas que piden sus materias</p>
                        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2"><div className={`h-full rounded-full ${pctDone === 100 ? 'bg-emerald-500' : 'bg-purple-500'}`} style={{ width: `${pctDone}%` }} /></div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Tiene clases <strong>{daysWithClasses} de 5 días</strong> de la semana.</p>
                    </>
                  );
                })()}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Horas por materia</h3>
                  <button type="button" onClick={() => setActiveTab('asignacion')} className="text-xs font-bold text-purple-600 hover:underline cursor-pointer">Ver materias</button>
                </div>
                {currentSectionCourses.length === 0 ? (
                  <div className="text-center space-y-2 py-3">
                    <p className="text-sm text-slate-500">Esta aula aún no tiene materias.</p>
                    <button type="button" onClick={handleOpenAssignModal} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 text-white text-sm font-black cursor-pointer"><Plus className="w-4 h-4" /> Asignar materia</button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {currentSectionCourses.map(sc => {
                      const name = sc.curso?.nombre || courses.find(c => c.id === sc.curso_id)?.nombre || 'Materia';
                      const placed = currentSectionSchedule.filter(s => s.curso_id === sc.curso_id).length;
                      const goal = hoursOfAssignment(sc);
                      const theme = getCourseTheme(name);
                      const done = goal > 0 && placed >= goal;
                      return (
                        <li key={sc.id}>
                          <button type="button" onClick={() => handleOpenSlotModal(undefined, undefined, sc.curso_id)} className="w-full text-left group cursor-pointer" title={`Agregar una clase de ${name}`}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="flex items-center gap-2 min-w-0">
                                <span className={`w-6 h-6 rounded-lg ${theme.iconBg} text-white flex items-center justify-center shrink-0`}><CourseIcon courseName={name} className="w-3.5 h-3.5 text-white" /></span>
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-purple-600">{name}</span>
                              </span>
                              <span className={`text-xs font-black shrink-0 ${done ? 'text-emerald-600' : placed > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{placed} / {goal} h {done ? '✓' : ''}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${done ? 'bg-emerald-500' : theme.iconBg}`} style={{ width: `${goal > 0 ? Math.min(100, (placed / goal) * 100) : 0}%` }} /></div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>
          )}
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
                          src={assignment.docente?.avatar_url || initialsAvatarUrl(assignment.docente?.nombres)}
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
                      src={currentTeacher.avatar_url || initialsAvatarUrl(currentTeacher.nombres)}
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
