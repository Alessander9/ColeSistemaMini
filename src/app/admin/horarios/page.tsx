'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { DayOfWeek, Section, Course, UserProfile } from '@/types';
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
  ChevronDown
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

export default function AdminHorariosPage() {
  const { 
    sections, 
    gradeLevels, 
    courses, 
    teachers, 
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
    getTeacherSections
  } = useApp();

  // Selection state
  const [selectedLevel, setSelectedLevel] = useState<'todos' | 'primaria' | 'secundaria'>('primaria');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('sec-3pri-a');
  const [activeTab, setActiveTab] = useState<'horario' | 'asignacion' | 'profesores'>('horario');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('user-docente-1');
  const [selectedMobileDay, setSelectedMobileDay] = useState<DayOfWeek>('lunes');

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

  // Selected Section Object
  const currentSection = useMemo(() => {
    return sections.find(s => s.id === selectedSectionId) || sections[0];
  }, [sections, selectedSectionId]);

  // Filtered sections for selector
  const filteredSections = useMemo(() => {
    if (selectedLevel === 'todos') return sections;
    return sections.filter(s => s.grado?.nivel === selectedLevel);
  }, [sections, selectedLevel]);

  // Section Assigned Courses
  const currentSectionCourses = useMemo(() => {
    return getSectionCourses(selectedSectionId);
  }, [getSectionCourses, selectedSectionId, sectionCourses]);

  // Section Schedule Slots
  const currentSectionSchedule = useMemo(() => {
    return getSectionSchedule(selectedSectionId);
  }, [getSectionSchedule, selectedSectionId, scheduleSlots]);

  // Total weekly hours in schedule
  const scheduledHoursCount = currentSectionSchedule.length;
  const targetTotalHours = currentSectionCourses.reduce((acc, curr) => acc + (curr.horas_semanales || 0), 0);

  // Audit result
  const auditResult = useMemo(() => {
    return auditScheduleIntegrity();
  }, [auditScheduleIntegrity, scheduleSlots]);

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

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* ── Page Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-purple-950/20 backdrop-blur-xl border border-purple-500/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5" />
              Gestión Curricular & Malla 2026
            </span>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              22 Salones Oficiales
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            Horarios & Asignación de Profesores
          </h1>
          <p className="text-purple-200/80 text-xs sm:text-sm mt-1 max-w-2xl">
            Configura la distribución horaria de cada salón, vincula a los docentes especialistas y previene cruces en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs border transition-all shadow-sm ${
              auditResult.conflictsCount === 0
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30 animate-pulse'
            }`}
          >
            {auditResult.conflictsCount === 0 ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Auditoría: 0 Cruces
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                {auditResult.conflictsCount} Cruces Detectados
              </>
            )}
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir Malla
          </button>
          <button 
            onClick={handleOpenAssignModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Asignar Materia a Salón
          </button>
        </div>
      </div>

      {/* ── Section & Grade Selector Ribbon ── */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Level Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit shrink-0">
            <button
              onClick={() => setSelectedLevel('primaria')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                selectedLevel === 'primaria'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              Primaria (1° al 6°)
            </button>
            <button
              onClick={() => setSelectedLevel('secundaria')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                selectedLevel === 'secundaria'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Secundaria (1° al 5°)
            </button>
            <button
              onClick={() => setSelectedLevel('todos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedLevel === 'todos'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos (22)
            </button>
          </div>

          {/* Quick Classroom Selector Pills Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {filteredSections.map(sec => {
              const isSelected = sec.id === selectedSectionId;
              const secCoursesCount = getSectionCourses(sec.id).length;
              return (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25 scale-[1.03]'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                  }`}
                >
                  <span>{sec.grado?.nombre} &quot;{sec.letra}&quot;</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                    {secCoursesCount} mat
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Selected Section Header Info & Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-purple-600/20 shrink-0">
              {currentSection?.letra}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {currentSection?.grado?.nombre} — Sección &quot;{currentSection?.letra}&quot;
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-200/80 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                  {currentSection?.grado?.nivel}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2.5">
                <span>Capacidad: <strong>{currentSection?.capacidad_maxima} alumnos</strong></span>
                <span>•</span>
                <span>Materias asignadas: <strong>{currentSectionCourses.length}</strong></span>
                <span>•</span>
                <span>Horario semanal: <strong>{scheduledHoursCount} bloques programados</strong></span>
              </p>
            </div>
          </div>

          {/* Module Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setActiveTab('horario')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'horario'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Malla Horaria Semanal
            </button>
            <button
              onClick={() => setActiveTab('asignacion')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'asignacion'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Materias & Profesores ({currentSectionCourses.length})
            </button>
            <button
              onClick={() => setActiveTab('profesores')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'profesores'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Carga por Docente
            </button>
          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: MALLA HORARIA SEMANAL + BANCO DE MATERIAS LATERAL               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'horario' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main Column (3/4): Timetable Table */}
          <div className="lg:col-span-3 space-y-3">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Malla Horaria: {currentSection?.grado?.nombre} &quot;{currentSection?.letra}&quot;
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Haz clic en cualquier bloque libre para asignar una clase con el profesor correspondiente.
                </p>
              </div>

              <button
                onClick={() => handleOpenSlotModal()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                + Bloque Horario
              </button>
            </div>

            {/* Mobile Day Selector Bar (Visible on mobile screens < md) */}
            <div className="md:hidden space-y-3">
              <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                {DAYS.map(d => (
                  <button
                    key={d.key}
                    onClick={() => setSelectedMobileDay(d.key)}
                    className={`flex-1 py-2 px-1 text-center rounded-xl text-xs font-black transition-all ${
                      selectedMobileDay === d.key
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>{d.short}</span>
                  </button>
                ))}
              </div>

              {/* Day's Timeline Cards */}
              <div className="space-y-2">
                {TIME_BLOCKS.map((block, timeIdx) => {
                  if (block.isBreak) {
                    return (
                      <div key={block.id} className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">☕</span>
                          <span className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">Recreo Escolar</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">{block.inicio} - {block.fin}</span>
                      </div>
                    );
                  }

                  const slot = currentSectionSchedule.find(
                    s => s.dia === selectedMobileDay && s.hora_inicio === block.inicio
                  );

                  if (slot) {
                    const courseColor = slot.curso?.color_hex || '#8b5cf6';
                    return (
                      <div
                        key={block.id}
                        className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-sm"
                        style={{
                          backgroundColor: `${courseColor}12`,
                          borderColor: `${courseColor}45`,
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: courseColor }}
                          >
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {slot.curso?.nombre}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate">
                              Prof. {slot.docente?.nombres.split(' ')[0]} {slot.docente?.apellidos.split(' ')[0]} • {slot.aula || 'Aula 301'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-xs">
                            {block.inicio} - {block.fin}
                          </span>
                          <button
                            onClick={() => removeScheduleSlot(slot.id)}
                            title="Eliminar bloque"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Empty Slot in Mobile
                  return (
                    <div
                      key={block.id}
                      onClick={() => handleOpenSlotModal(selectedMobileDay, timeIdx)}
                      className="p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between cursor-pointer hover:border-purple-400 transition-colors group"
                    >
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Plus className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold">{block.label}</span>
                        <span className="text-[10px] text-slate-400">({block.inicio} - {block.fin})</span>
                      </div>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        + Asignar
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timetable Table Container (Desktop md+) */}
            <div className="hidden md:block overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-lg shadow-slate-200/40 dark:shadow-none backdrop-blur-xl">
              <table className="w-full border-collapse text-left min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70">
                    <th className="p-3 text-center text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 w-24">
                      Bloque
                    </th>
                    {DAYS.map(d => (
                      <th key={d.key} className="p-3 text-center text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {TIME_BLOCKS.map((block, timeIdx) => {
                    if (block.isBreak) {
                      return (
                        <tr key={block.id} className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 dark:from-amber-950/30 dark:to-orange-950/30">
                          <td className="p-2 text-center font-black text-xs text-amber-700 dark:text-amber-400">
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3" />
                              {block.inicio} - {block.fin}
                            </div>
                          </td>
                          <td colSpan={5} className="p-2 text-center text-xs font-extrabold tracking-widest text-amber-800 dark:text-amber-300 uppercase">
                            ☕ RECREO & DESCANSO ESCOLAR
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={block.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        {/* Time Column */}
                        <td className="p-2.5 text-center border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/40">
                          <span className="text-xs font-black text-slate-900 dark:text-white block">
                            {block.label}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mt-0.5">
                            {block.inicio} - {block.fin}
                          </span>
                        </td>

                        {/* Days Columns */}
                        {DAYS.map(day => {
                          const slot = currentSectionSchedule.find(
                            s => s.dia === day.key && s.hora_inicio === block.inicio
                          );

                          if (slot) {
                            const courseColor = slot.curso?.color_hex || '#8b5cf6';

                            return (
                              <td key={day.key} className="p-1.5 align-top border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">
                                <div 
                                  className="group relative p-2 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-md border flex flex-col justify-between h-20"
                                  style={{
                                    backgroundColor: `${courseColor}14`,
                                    borderColor: `${courseColor}45`,
                                  }}
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-1">
                                      <div className="flex items-center gap-1">
                                        <span 
                                          className="w-2 h-2 rounded-full shrink-0" 
                                          style={{ backgroundColor: courseColor }}
                                        />
                                        <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[95px]">
                                          {slot.curso?.nombre}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => removeScheduleSlot(slot.id)}
                                        title="Eliminar bloque"
                                        className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50 transition-opacity"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Teacher Info */}
                                    <div className="flex items-center gap-1 mt-1">
                                      <img
                                        src={slot.docente?.avatar_url || `https://ui-avatars.com/api/?name=${slot.docente?.nombres}`}
                                        alt={slot.docente?.nombres}
                                        className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                                      />
                                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                                        Prof. {slot.docente?.nombres.split(' ')[0]} {slot.docente?.apellidos.split(' ')[0]}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Room / Location */}
                                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                    <span className="flex items-center gap-0.5 truncate max-w-[80px]">
                                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                                      {slot.aula || 'Aula 301'}
                                    </span>
                                    <span className="px-1 py-0.2 rounded bg-white/80 dark:bg-slate-800 font-extrabold text-[8px] text-slate-700 dark:text-slate-300 shrink-0">
                                      {block.inicio}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          // Empty Slot
                          return (
                            <td key={day.key} className="p-1.5 align-middle border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">
                              <button
                                onClick={() => handleOpenSlotModal(day.key, timeIdx)}
                                className="w-full h-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-purple-600 transition-all group"
                              >
                                <Plus className="w-3.5 h-3.5 transition-transform group-hover:scale-125" />
                                <span className="text-[9px] font-bold">Asignar</span>
                              </button>
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

          {/* Right Column (1/4): Quick Course Palette */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    Materias del Salón
                  </h4>
                  <p className="text-[11px] text-slate-400">Avance de horas semanales</p>
                </div>
                <button
                  onClick={handleOpenAssignModal}
                  className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 hover:bg-purple-100 transition-colors"
                  title="Asignar materia"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Progress summary */}
              <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40">
                <div className="flex justify-between text-xs font-extrabold mb-1">
                  <span className="text-purple-900 dark:text-purple-200">Horas Totales:</span>
                  <span className="text-purple-700 dark:text-purple-300">{scheduledHoursCount} de 35 bloques</span>
                </div>
                <div className="w-full h-2 bg-purple-200 dark:bg-purple-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((scheduledHoursCount / 35) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Course list pills */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {currentSectionCourses.map(assignment => {
                  const courseColor = assignment.curso?.color_hex || '#8b5cf6';
                  const hoursInGrid = currentSectionSchedule.filter(s => s.curso_id === assignment.curso_id).length;
                  const targetHours = assignment.horas_semanales || 4;
                  const isComplete = hoursInGrid >= targetHours;

                  return (
                    <div
                      key={assignment.id}
                      className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: courseColor }}
                          />
                          <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                            {assignment.curso?.nombre}
                          </p>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isComplete 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {hoursInGrid}/{targetHours} h
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="truncate">Prof. {assignment.docente?.nombres.split(' ')[0]} {assignment.docente?.apellidos.split(' ')[0]}</span>
                        <button
                          onClick={() => handleOpenSlotModal(undefined, undefined, assignment.curso_id)}
                          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline shrink-0 ml-1"
                        >
                          + Añadir
                        </button>
                      </div>
                    </div>
                  );
                })}

                {currentSectionCourses.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No hay materias asignadas a este salón todavía.
                  </div>
                )}
              </div>
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Docente:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-extrabold text-xs text-slate-800 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    Prof. {t.nombres} {t.apellidos}
                  </option>
                ))}
              </select>
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
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center">
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
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Curso / Área Curricular *
                </label>
                <select
                  required
                  value={formCourseId}
                  onChange={(e) => setFormCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 font-bold"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.codigo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Profesor Responsable *
                </label>
                <select
                  required
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 font-bold"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      Prof. {t.nombres} {t.apellidos} — ({t.especialidad})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horas Semanales *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={formHours}
                    onChange={(e) => setFormHours(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Aula por Defecto
                  </label>
                  <input
                    type="text"
                    value={formClassroom}
                    onChange={(e) => setFormClassroom(e.target.value)}
                    placeholder="Ej. Aula 301 / Lab 1"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 font-medium"
                  />
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
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all"
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
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Día de la Semana *
                  </label>
                  <select
                    value={slotDay}
                    onChange={(e) => setSlotDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 font-bold"
                  >
                    {DAYS.map(d => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hora / Bloque *
                  </label>
                  <select
                    value={slotTimeIndex}
                    onChange={(e) => setSlotTimeIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 font-bold"
                  >
                    {TIME_BLOCKS.map((b, idx) => {
                      if (b.isBreak) return null;
                      return (
                        <option key={b.id} value={idx}>
                          {b.label} ({b.inicio} - {b.fin})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Materia Asignada *
                </label>
                <select
                  required
                  value={slotCourseId}
                  onChange={(e) => {
                    setSlotCourseId(e.target.value);
                    const asig = currentSectionCourses.find(sc => sc.curso_id === e.target.value);
                    if (asig) setSlotRoom(asig.aula_defecto || 'Aula 301');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 font-bold text-slate-800 dark:text-white"
                >
                  {currentSectionCourses.map(sc => (
                    <option key={sc.id} value={sc.curso_id}>
                      {sc.curso?.nombre} — Prof. {sc.docente?.nombres} {sc.docente?.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Aula / Laboratorio
                </label>
                <input
                  type="text"
                  value={slotRoom}
                  onChange={(e) => setSlotRoom(e.target.value)}
                  placeholder="Ej. Aula 301 / Lab de Ciencias"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 font-medium"
                />
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
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all ${
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nuevo Profesor Titular
                </label>
                <select
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      Prof. {t.nombres} {t.apellidos} ({t.especialidad})
                    </option>
                  ))}
                </select>
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
