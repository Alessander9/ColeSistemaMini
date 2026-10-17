'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { AvatarUploader } from '@/components/ui/AvatarUploader';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Modal } from '@/components/ui/Modal';
import { CourseFormModal } from '@/components/academico/CourseFormModal';
import { Course, Section, UserProfile } from '@/types';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit2,
  GraduationCap,
  Key,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Power,
  School,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

// Carga semanal recomendada para un docente (horas pedagógicas)
const RECOMMENDED_HOURS = 30;
const SPECIALTIES = [
  { value: 'Matemática', label: 'Matemática', sublabel: 'Aritmética, Álgebra, Geometría' },
  { value: 'Comunicación', label: 'Comunicación', sublabel: 'Lenguaje y Literatura' },
  { value: 'Ciencia y Tecnología', label: 'Ciencia y Tecnología', sublabel: 'Biología, Física, Química' },
  { value: 'Inglés', label: 'Inglés', sublabel: 'Lengua extranjera' },
  { value: 'Personal Social', label: 'Personal Social', sublabel: 'Ciencias Sociales e Historia' },
  { value: 'Educación Física', label: 'Educación Física', sublabel: 'Deportes y Psicomotricidad' },
  { value: 'Arte y Cultura', label: 'Arte y Cultura', sublabel: 'Artes visuales y Música' },
  { value: 'Computación y Robótica', label: 'Computación y Robótica', sublabel: 'TIC y Tecnología' },
  { value: 'Educación Religiosa', label: 'Educación Religiosa', sublabel: 'Valores y Fe' },
];
const LEVEL_LABEL: Record<string, string> = { inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' };

type StatusFilter = 'todos' | 'activos' | 'sin_cursos' | 'sobrecargados' | 'inactivos';
type Level = 'todos' | 'inicial' | 'primaria' | 'secundaria';

const initials = (t?: Pick<UserProfile, 'nombres' | 'apellidos'>) => `${t?.nombres?.[0] || ''}${t?.apellidos?.[0] || ''}`.toUpperCase();

// Estado de la carga horaria en palabras y colores
function loadInfo(hours: number) {
  if (hours === 0) return { label: 'Sin cursos', bar: 'bg-slate-300 dark:bg-slate-600', text: 'text-slate-500', chip: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' };
  if (hours > RECOMMENDED_HOURS) return { label: 'Sobrecargado', bar: 'bg-rose-500', text: 'text-rose-600', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' };
  if (hours >= RECOMMENDED_HOURS - 6) return { label: 'Carga alta', bar: 'bg-amber-500', text: 'text-amber-600', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' };
  return { label: 'Carga normal', bar: 'bg-emerald-500', text: 'text-emerald-600', chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' };
}

export default function AdminDocentesPage() {
  const {
    teachers,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    toggleTeacherStatus,
    courses,
    sections,
    gradeLevels,
    sectionCourses,
    assignCourseToSection,
    removeSectionCourse,
  } = useApp();

  const [view, setView] = useState<'docentes' | 'aulas'>('docentes');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [level, setLevel] = useState<Level>('todos');
  const [onlyGaps, setOnlyGaps] = useState(false);
  const [visibleClassrooms, setVisibleClassrooms] = useState(8);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const levelOfSection = useMemo(() => {
    const byGrade = new Map(gradeLevels.map(g => [g.id, g.nivel]));
    return new Map(sections.map(s => [s.id, (s.grado?.nivel || byGrade.get(s.grado_id) || '') as string]));
  }, [sections, gradeLevels]);
  const sectionLabel = (s?: Section) => (s ? `${s.grado?.nombre || 'Grado'} "${s.letra}"` : 'Aula');

  // ── Datos por docente ──
  const teacherData = useMemo(() => {
    const map = new Map<string, { hours: number; assignments: typeof sectionCourses; classrooms: number }>();
    teachers.forEach(t => {
      const assignments = sectionCourses.filter(sc => sc.docente_id === t.id);
      map.set(t.id, {
        hours: assignments.reduce((a, c) => a + (c.horas_semanales || 0), 0),
        assignments,
        classrooms: new Set(assignments.map(a => a.seccion_id)).size,
      });
    });
    return map;
  }, [teachers, sectionCourses]);
  const dataOf = (id: string) => teacherData.get(id) || { hours: 0, assignments: [], classrooms: 0 };

  // ── Cobertura por aula: cada curso del nivel, con o sin docente ──
  const coverage = useMemo(() => {
    return sections
      .map(s => {
        const lvl = levelOfSection.get(s.id) || '';
        const levelCourses = courses.filter(c => c.nivel === lvl);
        const rows = levelCourses.map(c => {
          const asg = sectionCourses.find(sc => sc.seccion_id === s.id && sc.curso_id === c.id);
          const teacher = asg ? teachers.find(t => t.id === asg.docente_id) : undefined;
          return { course: c, assignment: asg, teacher };
        });
        const covered = rows.filter(r => r.teacher).length;
        return { section: s, level: lvl, rows, covered, total: rows.length };
      })
      .sort((a, b) =>
        ['inicial', 'primaria', 'secundaria'].indexOf(a.level) - ['inicial', 'primaria', 'secundaria'].indexOf(b.level) ||
        (a.section.grado?.numero_grado ?? 0) - (b.section.grado?.numero_grado ?? 0) ||
        a.section.letra.localeCompare(b.section.letra));
  }, [sections, courses, sectionCourses, teachers, levelOfSection]);

  const totalSlots = coverage.reduce((a, c) => a + c.total, 0);
  const coveredSlots = coverage.reduce((a, c) => a + c.covered, 0);
  const missingSlots = totalSlots - coveredSlots;

  const counts = {
    todos: teachers.length,
    activos: teachers.filter(t => t.activo !== false).length,
    sin_cursos: teachers.filter(t => dataOf(t.id).assignments.length === 0).length,
    sobrecargados: teachers.filter(t => dataOf(t.id).hours > RECOMMENDED_HOURS).length,
    inactivos: teachers.filter(t => t.activo === false).length,
  };
  const activeTeachers = teachers.filter(t => t.activo !== false);
  const avgHours = activeTeachers.length > 0 ? Math.round(activeTeachers.reduce((a, t) => a + dataOf(t.id).hours, 0) / activeTeachers.length) : 0;

  // ── Lista filtrada de docentes ──
  const q = search.trim().toLowerCase();
  const filteredTeachers = teachers
    .filter(t => {
      const d = dataOf(t.id);
      if (statusFilter === 'activos' && t.activo === false) return false;
      if (statusFilter === 'inactivos' && t.activo !== false) return false;
      if (statusFilter === 'sin_cursos' && d.assignments.length > 0) return false;
      if (statusFilter === 'sobrecargados' && d.hours <= RECOMMENDED_HOURS) return false;
      if (level !== 'todos' && !d.assignments.some(a => levelOfSection.get(a.seccion_id) === level)) return false;
      if (!q) return true;
      const courseNames = d.assignments.map(a => courses.find(c => c.id === a.curso_id)?.nombre || '').join(' ');
      return `${t.nombres} ${t.apellidos} ${t.apellidos} ${t.nombres} ${t.dni} ${t.especialidad || ''} ${t.email || ''} ${courseNames}`.toLowerCase().includes(q);
    })
    .sort((a, b) => Number(a.activo === false) - Number(b.activo === false) || `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`));

  const filteredCoverage = coverage.filter(c =>
    (level === 'todos' || c.level === level) &&
    (!onlyGaps || c.covered < c.total) &&
    (!q || sectionLabel(c.section).toLowerCase().includes(q) || c.rows.some(r => r.course.nombre.toLowerCase().includes(q) || `${r.teacher?.nombres || ''} ${r.teacher?.apellidos || ''}`.toLowerCase().includes(q))));

  // ── Registrar docente ──
  const emptyTeacher = { nombres: '', apellidos: '', dni: '', telefono: '', email: '', especialidad: 'Matemática', avatar_url: '' };
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState(emptyTeacher);
  const [credentials, setCredentials] = useState<{ name: string; username: string; password: string; email: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const dniValid = /^\d{8}$/.test(newTeacher.dni);
  const dniTaken = teachers.some(t => t.dni === newTeacher.dni);
  const canRegister = newTeacher.nombres.trim() !== '' && newTeacher.apellidos.trim() !== '' && dniValid && !dniTaken;

  const registerTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRegister) return;
    const res = addTeacher({ ...newTeacher, nombres: newTeacher.nombres.trim(), apellidos: newTeacher.apellidos.trim() });
    setCredentials({ name: `${res.teacher.nombres} ${res.teacher.apellidos}`, username: res.credentials.username, password: res.credentials.password, email: res.credentials.email });
    setNewTeacher(emptyTeacher);
    setIsNewOpen(false);
  };
  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  // ── Editar / eliminar ──
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({ nombres: '', apellidos: '', dni: '', telefono: '', email: '', especialidad: '', avatar_url: '' });
  const openEdit = (t: UserProfile) => {
    setEditing(t);
    setEditForm({ nombres: t.nombres, apellidos: t.apellidos, dni: t.dni, telefono: t.telefono || '', email: t.email || '', especialidad: t.especialidad || 'Matemática', avatar_url: t.avatar_url || '' });
    setOpenMenuId(null);
  };
  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editForm.nombres.trim() || !editForm.apellidos.trim()) return;
    updateTeacher(editing.id, editForm);
    setEditing(null);
  };
  const [deleting, setDeleting] = useState<UserProfile | null>(null);

  // ── Asignar curso en un aula ──
  const [assignOpen, setAssignOpen] = useState(false);
  const [assign, setAssign] = useState({ teacherId: '', sectionId: '', courseId: '', hours: 4, aula: '' });
  const [quickCourseOpen, setQuickCourseOpen] = useState(false);
  const openAssign = (preset: Partial<typeof assign>) => {
    const sectionId = preset.sectionId || '';
    const course = courses.find(c => c.id === preset.courseId);
    const sec = sections.find(s => s.id === sectionId);
    setAssign({ teacherId: preset.teacherId || '', sectionId, courseId: preset.courseId || '', hours: course?.horas_semanales_sugeridas || 4, aula: sec?.aula || '' });
    setAssignOpen(true);
    setOpenMenuId(null);
  };
  const assignLevel = levelOfSection.get(assign.sectionId) || '';
  const assignCourses = courses.filter(c => !assignLevel || c.nivel === assignLevel);
  const existingAssignment = sectionCourses.find(sc => sc.seccion_id === assign.sectionId && sc.curso_id === assign.courseId);
  const previousTeacher = existingAssignment ? teachers.find(t => t.id === existingAssignment.docente_id) : undefined;
  const projectedHours = assign.teacherId
    ? dataOf(assign.teacherId).hours - (existingAssignment?.docente_id === assign.teacherId ? existingAssignment.horas_semanales || 0 : 0) + (Number(assign.hours) || 0)
    : 0;
  const canAssign = !!assign.teacherId && !!assign.sectionId && !!assign.courseId && Number(assign.hours) > 0;
  const saveAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAssign) return;
    assignCourseToSection({ seccionId: assign.sectionId, cursoId: assign.courseId, docenteId: assign.teacherId, horasSemanales: Number(assign.hours), aulaDefecto: assign.aula || undefined });
    setAssignOpen(false);
  };

  // ── Ficha del docente ──
  const [detail, setDetail] = useState<UserProfile | null>(null);

  const exportCSV = () => {
    const headers = ['Apellidos y nombres', 'DNI', 'Teléfono', 'Email', 'Especialidad', 'Horas semanales', 'Aulas', 'Estado'];
    const rows = filteredTeachers.map(t => {
      const d = dataOf(t.id);
      return [`"${t.apellidos}, ${t.nombres}"`, t.dni, t.telefono || '', t.email || '', `"${t.especialidad || ''}"`, d.hours, d.classrooms, t.activo !== false ? 'Activo' : 'Inactivo'].join(',');
    });
    const blob = new Blob(['﻿' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const d = new Date();
    a.download = `docentes_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const card = 'rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm';
  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500';

  const teacherForm = (form: typeof newTeacher, set: (f: typeof newTeacher) => void, dniLocked = false) => (
    <div className="space-y-4">
      <div className="flex justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
        <AvatarUploader currentAvatarUrl={form.avatar_url} userName={`${form.nombres || 'Docente'} ${form.apellidos}`.trim()} onAvatarUpdated={url => set({ ...form, avatar_url: url })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block"><span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Nombres *</span>
          <input required value={form.nombres} onChange={e => set({ ...form, nombres: e.target.value })} placeholder="Ej. Juan Carlos" className={inputCls} />
        </label>
        <label className="block"><span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Apellidos *</span>
          <input required value={form.apellidos} onChange={e => set({ ...form, apellidos: e.target.value })} placeholder="Ej. Quispe Flores" className={inputCls} />
        </label>
        <label className="block"><span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">DNI (8 dígitos) *</span>
          <input required inputMode="numeric" maxLength={8} disabled={dniLocked} value={form.dni} onChange={e => set({ ...form, dni: e.target.value.replace(/\D/g, '') })} placeholder="Ej. 45678912" className={`${inputCls} font-mono disabled:opacity-60`} />
        </label>
        <label className="block"><span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Celular</span>
          <input type="tel" value={form.telefono} onChange={e => set({ ...form, telefono: e.target.value })} placeholder="Ej. 987654321" className={`${inputCls} font-mono`} />
        </label>
        <div><span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Especialidad *</span>
          <SearchableSelect value={form.especialidad} onChange={val => set({ ...form, especialidad: val })} icon={<GraduationCap className="w-4 h-4" />} allowCustomOption customOptionLabel="Usar otra especialidad" options={SPECIALTIES} placeholder="Buscar o escribir…" />
        </div>
        <label className="block"><span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Correo <span className="font-normal text-slate-400">(opcional)</span></span>
          <input type="email" value={form.email} onChange={e => set({ ...form, email: e.target.value })} placeholder="nombre@colegio.edu.pe" className={inputCls} />
        </label>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in-50">
      {/* ══════════ Encabezado ══════════ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-indigo-600" /> Docentes
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Registra a tus profesores, <strong>asígnales cursos en cada aula</strong> y revisa que nadie tenga demasiadas horas ni que falten cursos por cubrir.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer">
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button type="button" onClick={() => openAssign({})} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-black shadow-md cursor-pointer">
            <BookOpen className="w-4 h-4" /> Asignar curso
          </button>
          <button type="button" onClick={() => { setNewTeacher(emptyTeacher); setIsNewOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-md cursor-pointer">
            <UserPlus className="w-4 h-4" /> Nuevo docente
          </button>
        </div>
      </div>

      {/* ══════════ Resumen (se puede tocar) ══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button type="button" onClick={() => { setView('docentes'); setStatusFilter('activos'); }} className={`${card} p-4 text-left hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer`}>
          <div className="flex items-center justify-between"><Users className="w-6 h-6 text-indigo-600" /><span className="text-3xl font-black text-slate-900 dark:text-white">{counts.activos}</span></div>
          <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2">{counts.activos === 1 ? 'docente activo' : 'docentes activos'}</p>
          <p className="text-xs text-slate-500">{counts.inactivos > 0 ? `${counts.inactivos} inactivos` : 'Todos en actividad'}</p>
        </button>
        <button type="button" onClick={() => { setView('aulas'); setOnlyGaps(true); }} className={`${card} p-4 text-left hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer ${missingSlots > 0 ? 'ring-2 ring-rose-200 dark:ring-rose-900' : ''}`}>
          <div className="flex items-center justify-between"><AlertTriangle className={`w-6 h-6 ${missingSlots > 0 ? 'text-rose-500' : 'text-emerald-500'}`} /><span className={`text-3xl font-black ${missingSlots > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{missingSlots}</span></div>
          <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2">cursos por aula sin docente</p>
          <p className="text-xs text-slate-500">{totalSlots > 0 ? `${coveredSlots} de ${totalSlots} ya tienen docente` : 'Crea cursos y aulas primero'}</p>
        </button>
        <button type="button" onClick={() => { setView('docentes'); setStatusFilter('sin_cursos'); }} className={`${card} p-4 text-left hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer`}>
          <div className="flex items-center justify-between"><BookOpen className="w-6 h-6 text-amber-500" /><span className="text-3xl font-black text-slate-900 dark:text-white">{counts.sin_cursos}</span></div>
          <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2">{counts.sin_cursos === 1 ? 'docente sin cursos' : 'docentes sin cursos'}</p>
          <p className="text-xs text-slate-500">Aún no dictan en ninguna aula</p>
        </button>
        <button type="button" onClick={() => { setView('docentes'); setStatusFilter('sobrecargados'); }} className={`${card} p-4 text-left hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer`}>
          <div className="flex items-center justify-between"><Calendar className="w-6 h-6 text-sky-500" /><span className="text-3xl font-black text-slate-900 dark:text-white">{avgHours}<span className="text-base text-slate-400"> h</span></span></div>
          <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2">carga promedio por semana</p>
          <p className={`text-xs ${counts.sobrecargados > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>{counts.sobrecargados > 0 ? `${counts.sobrecargados} con más de ${RECOMMENDED_HOURS} h` : `Recomendado: hasta ${RECOMMENDED_HOURS} h`}</p>
        </button>
      </div>

      {/* ══════════ Vista + filtros ══════════ */}
      <div className={`${card} p-4 space-y-3`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 lg:w-[420px]" role="tablist">
            {[
              { k: 'docentes' as const, label: 'Por docente', hint: '¿Qué dicta cada uno?', icon: Users },
              { k: 'aulas' as const, label: 'Por aula', hint: '¿Qué cursos faltan cubrir?', icon: School },
            ].map(v => (
              <button key={v.k} type="button" role="tab" aria-selected={view === v.k} onClick={() => setView(v.k)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left cursor-pointer transition-all ${view === v.k ? 'bg-white dark:bg-slate-900 shadow-sm' : 'hover:bg-white/60 dark:hover:bg-slate-900/40'}`}>
                <v.icon className={`w-5 h-5 shrink-0 ${view === v.k ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="min-w-0">
                  <span className={`block text-sm font-black ${view === v.k ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{v.label}</span>
                  <span className="block text-[11px] text-slate-500 truncate">{v.hint}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={view === 'docentes' ? 'Buscar por nombre, DNI, curso o especialidad' : 'Buscar un aula, curso o docente'}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Borrar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-sm font-bold text-slate-500 mr-1">Nivel:</span>
          {(['todos', 'inicial', 'primaria', 'secundaria'] as Level[]).map(l => (
            <button key={l} type="button" onClick={() => setLevel(l)} aria-pressed={level === l}
              className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold cursor-pointer ${level === l ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'}`}>
              {l === 'todos' ? 'Todos' : LEVEL_LABEL[l]}
            </button>
          ))}
          <span className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
          {view === 'docentes' ? (
            ([
              { k: 'todos', label: 'Todos' },
              { k: 'activos', label: 'Activos' },
              { k: 'sin_cursos', label: 'Sin cursos' },
              { k: 'sobrecargados', label: 'Sobrecargados' },
              { k: 'inactivos', label: 'Inactivos' },
            ] as { k: StatusFilter; label: string }[]).map(f => (
              <button key={f.k} type="button" onClick={() => setStatusFilter(f.k)} aria-pressed={statusFilter === f.k}
                className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold cursor-pointer ${statusFilter === f.k ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'}`}>
                {f.label} <span className="opacity-70">({counts[f.k]})</span>
              </button>
            ))
          ) : (
            <button type="button" onClick={() => setOnlyGaps(v => !v)} aria-pressed={onlyGaps}
              className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold cursor-pointer ${onlyGaps ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300'}`}>
              Solo aulas con cursos sin docente
            </button>
          )}
        </div>
      </div>

      {/* ══════════ VISTA: POR DOCENTE ══════════ */}
      {view === 'docentes' && (
        filteredTeachers.length === 0 ? (
          <div className={`${card} p-10 text-center space-y-3`}>
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-lg font-black text-slate-900 dark:text-white">{teachers.length === 0 ? 'Aún no hay docentes' : 'No hay docentes con estos filtros'}</p>
            <p className="text-sm text-slate-500">{teachers.length === 0 ? 'Registra al primero para asignarle cursos y aulas.' : 'Prueba con otro filtro o borra la búsqueda.'}</p>
            {teachers.length === 0 && (
              <button type="button" onClick={() => setIsNewOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-black cursor-pointer"><UserPlus className="w-4 h-4" /> Registrar docente</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTeachers.map(t => {
              const d = dataOf(t.id);
              const load = loadInfo(d.hours);
              const inactive = t.activo === false;
              const loadPct = Math.min(100, Math.round((d.hours / RECOMMENDED_HOURS) * 100));
              // Agrupa por curso: "Matemática · 3° A, 3° B"
              const byCourse = new Map<string, { course?: Course; sections: string[] }>();
              d.assignments.forEach(a => {
                const row = byCourse.get(a.curso_id) || { course: courses.find(c => c.id === a.curso_id), sections: [] };
                const s = sections.find(x => x.id === a.seccion_id);
                row.sections.push(s ? `${s.grado?.nombre?.replace(' de ', ' ')} "${s.letra}"` : 'Aula');
                byCourse.set(a.curso_id, row);
              });
              return (
                <div key={t.id} className={`${card} p-5 flex flex-col gap-4 ${inactive ? 'opacity-70' : ''}`}>
                  <div className="flex items-start gap-3">
                    {t.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <span className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-lg font-black flex items-center justify-center shrink-0">{initials(t)}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <button type="button" onClick={() => setDetail(t)} className="text-left text-base font-black text-slate-900 dark:text-white hover:text-indigo-600 leading-tight cursor-pointer">{t.nombres} {t.apellidos}</button>
                      <p className="text-xs text-slate-500">{t.especialidad || 'Docente'} · DNI {t.dni}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${inactive ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : load.chip}`}>{inactive ? 'Inactivo' : load.label}</span>
                        {d.classrooms > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{d.classrooms} {d.classrooms === 1 ? 'aula' : 'aulas'}</span>}
                      </div>
                    </div>
                    <div className="relative">
                      <button type="button" onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)} aria-label={`Más opciones de ${t.nombres}`} aria-expanded={openMenuId === t.id}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><MoreVertical className="w-5 h-5" /></button>
                      {openMenuId === t.id && (
                        <div className="absolute right-0 top-full mt-1 z-30 w-52 p-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl">
                          <button type="button" onClick={() => openEdit(t)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"><Edit2 className="w-4 h-4" /> Editar datos</button>
                          <button type="button" onClick={() => { toggleTeacherStatus(t.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"><Power className="w-4 h-4" /> {inactive ? 'Activar' : 'Desactivar'}</button>
                          <button type="button" onClick={() => { setDeleting(t); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"><Trash2 className="w-4 h-4" /> Eliminar</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Carga semanal */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-bold text-slate-700 dark:text-slate-200">Carga semanal</span>
                      <span className={`font-black ${load.text}`}>{d.hours} de {RECOMMENDED_HOURS} h</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${load.bar}`} style={{ width: `${loadPct}%` }} /></div>
                  </div>

                  {/* Qué dicta */}
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 mb-1.5">Dicta</p>
                    {byCourse.size === 0 ? (
                      <p className="text-sm text-amber-700 dark:text-amber-300 font-bold">Aún no tiene cursos asignados.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {Array.from(byCourse.values()).slice(0, 4).map((row, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: row.course?.color_hex || '#6366f1' }} />
                            <span className="min-w-0"><strong className="text-slate-800 dark:text-slate-100">{row.course?.nombre || 'Curso'}</strong> <span className="text-slate-500">· {row.sections.join(', ')}</span></span>
                          </li>
                        ))}
                        {byCourse.size > 4 && <li className="text-xs text-slate-500">y {byCourse.size - 4} cursos más…</li>}
                      </ul>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" onClick={() => openAssign({ teacherId: t.id })} disabled={inactive}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                      <Plus className="w-4 h-4" /> Asignar curso
                    </button>
                    <button type="button" onClick={() => setDetail(t)} className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 cursor-pointer">Ver ficha</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ══════════ VISTA: POR AULA ══════════ */}
      {view === 'aulas' && (
        filteredCoverage.length === 0 ? (
          <div className={`${card} p-10 text-center space-y-2`}>
            <p className="text-4xl">{onlyGaps ? '🎉' : '🏫'}</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{onlyGaps ? '¡Todas las aulas tienen sus cursos cubiertos!' : 'No hay aulas con estos filtros'}</p>
            <p className="text-sm text-slate-500">{onlyGaps ? 'Cada curso tiene un docente asignado.' : 'Prueba con otro nivel o borra la búsqueda.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">Cada aula muestra los cursos de su nivel. Los que están en <strong className="text-rose-600">rojo</strong> no tienen docente: toca <strong>Asignar</strong> para elegir quién los dicta.</p>
            {filteredCoverage.slice(0, visibleClassrooms).map(c => {
              const pctCovered = c.total > 0 ? Math.round((c.covered / c.total) * 100) : 0;
              return (
                <div key={c.section.id} className={`${card} p-4 sm:p-5`}>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${c.level === 'inicial' ? 'bg-amber-100 text-amber-800' : c.level === 'primaria' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'} dark:bg-slate-800 dark:text-slate-200`}>{LEVEL_LABEL[c.level] || 'Nivel'}</span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{sectionLabel(c.section)}</h3>
                    <span className="flex-1" />
                    <span className={`text-sm font-black ${c.covered === c.total && c.total > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {c.total === 0 ? 'Sin cursos en este nivel' : c.covered === c.total ? '✓ Todos los cursos cubiertos' : `${c.total - c.covered} sin docente`}
                    </span>
                    <div className="w-28 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${pctCovered === 100 ? 'bg-emerald-500' : 'bg-rose-400'}`} style={{ width: `${pctCovered}%` }} /></div>
                  </div>
                  {c.total === 0 ? (
                    <p className="text-sm text-slate-500">Primero crea los cursos de {LEVEL_LABEL[c.level] || 'este nivel'} en <Link href="/admin/academico?tab=cursos" className="font-bold text-indigo-600 hover:underline">Cursos del colegio</Link>.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {c.rows.map(r => (
                        r.teacher ? (
                          <div key={r.course.id} className="group flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <span className="w-1.5 self-stretch rounded-full" style={{ backgroundColor: r.course.color_hex || '#6366f1' }} />
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-black text-slate-900 dark:text-white truncate">{r.course.nombre}</span>
                              <span className="block text-xs text-slate-500 truncate">{r.teacher.nombres.split(' ')[0]} {r.teacher.apellidos.split(' ')[0]} · {r.assignment?.horas_semanales || 0} h</span>
                            </span>
                            <button type="button" onClick={() => openAssign({ sectionId: c.section.id, courseId: r.course.id, teacherId: r.teacher?.id })} title="Cambiar docente o horas"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 cursor-pointer" aria-label={`Cambiar docente de ${r.course.nombre} en ${sectionLabel(c.section)}`}><Edit2 className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div key={r.course.id} className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border-2 border-dashed border-rose-200 dark:border-rose-900">
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-black text-slate-900 dark:text-white truncate">{r.course.nombre}</span>
                              <span className="block text-xs font-bold text-rose-600">Sin docente</span>
                            </span>
                            <button type="button" onClick={() => openAssign({ sectionId: c.section.id, courseId: r.course.id })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer"><Plus className="w-3.5 h-3.5" /> Asignar</button>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredCoverage.length > visibleClassrooms && (
              <button type="button" onClick={() => setVisibleClassrooms(v => v + 8)} className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-400 cursor-pointer">
                Ver más aulas ({filteredCoverage.length - visibleClassrooms} más)
              </button>
            )}
          </div>
        )
      )}

      {/* ══════════ Ventana: nuevo docente ══════════ */}
      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Registrar nuevo docente" maxWidth="xl">
        <form onSubmit={registerTeacher} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30">Al guardar, el sistema crea <strong>su usuario y contraseña</strong> para que entre a la plataforma. Te los mostraremos para que se los entregues.</p>
          {teacherForm(newTeacher, setNewTeacher)}
          {newTeacher.dni && !dniValid && <p className="text-sm font-bold text-rose-600">El DNI debe tener 8 números.</p>}
          {dniValid && dniTaken && <p className="text-sm font-bold text-rose-600">Ya existe un docente con ese DNI.</p>}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => setIsNewOpen(false)} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">Cancelar</button>
            <button type="submit" disabled={!canRegister} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"><Key className="w-4 h-4" /> Guardar y crear acceso</button>
          </div>
        </form>
      </Modal>

      {/* ══════════ Ventana: credenciales creadas ══════════ */}
      {credentials && (
        <Modal isOpen onClose={() => setCredentials(null)} title="¡Docente registrado!" maxWidth="md">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-4xl">🎉</p>
              <p className="text-base font-black text-slate-900 dark:text-white">{credentials.name} ya puede entrar a la plataforma</p>
              <p className="text-sm text-slate-500">Entrégale estos datos. Por seguridad, pídele que cambie su contraseña al ingresar.</p>
            </div>
            {[
              { k: 'user', label: 'Usuario', value: credentials.username, icon: Users },
              { k: 'mail', label: 'Correo', value: credentials.email, icon: Mail },
              { k: 'pass', label: 'Contraseña', value: credentials.password, icon: Key },
            ].map(f => (
              <div key={f.k} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <f.icon className="w-5 h-5 text-indigo-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500">{f.label}</p>
                  <p className="text-sm font-mono font-black text-slate-900 dark:text-white truncate">{f.value}</p>
                </div>
                <button type="button" onClick={() => copy(f.k, f.value)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                  {copied === f.k ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                </button>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={() => copy('all', `Usuario: ${credentials.username}\nCorreo: ${credentials.email}\nContraseña: ${credentials.password}`)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                {copied === 'all' ? <><Check className="w-4 h-4 text-emerald-600" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar todo</>}
              </button>
              <button type="button" onClick={() => setCredentials(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black cursor-pointer">Listo</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════ Ventana: editar docente ══════════ */}
      {editing && (
        <Modal isOpen onClose={() => setEditing(null)} title={`Editar a ${editing.nombres}`} maxWidth="xl">
          <form onSubmit={saveEdit} className="space-y-4">
            {teacherForm(editForm, setEditForm, true)}
            <p className="text-xs text-slate-500">El DNI no se puede cambiar porque identifica al docente en el sistema.</p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black cursor-pointer">Guardar cambios</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════ Ventana: eliminar docente ══════════ */}
      {deleting && (() => {
        const d = dataOf(deleting.id);
        return (
          <Modal isOpen onClose={() => setDeleting(null)} title="¿Eliminar docente?" maxWidth="md">
            <div className="space-y-4">
              <p className="text-sm text-slate-700 dark:text-slate-200">Vas a eliminar a <strong>{deleting.nombres} {deleting.apellidos}</strong>.</p>
              {d.assignments.length > 0 && (
                <p className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ Dicta <strong>{d.assignments.length} {d.assignments.length === 1 ? 'curso' : 'cursos'}</strong> en {d.classrooms} {d.classrooms === 1 ? 'aula' : 'aulas'}. Esos cursos quedarán <strong>sin docente</strong>.
                </p>
              )}
              <p className="text-xs text-slate-500">Si solo dejará de trabajar un tiempo, es mejor <strong>desactivarlo</strong>: conserva sus datos.</p>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button type="button" onClick={() => setDeleting(null)} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">No, volver</button>
                {deleting.activo !== false && (
                  <button type="button" onClick={() => { toggleTeacherStatus(deleting.id); setDeleting(null); }} className="px-4 py-2.5 rounded-xl border-2 border-amber-400 text-sm font-bold text-amber-700 dark:text-amber-300 cursor-pointer">Mejor desactivarlo</button>
                )}
                <button type="button" onClick={() => { deleteTeacher(deleting.id); setDeleting(null); }} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-black cursor-pointer"><Trash2 className="w-4 h-4" /> Sí, eliminar</button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ══════════ Ventana: asignar curso ══════════ */}
      <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Asignar un curso a un docente" maxWidth="xl">
        <form onSubmit={saveAssign} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">Elige <strong>el aula</strong>, <strong>el curso</strong> y <strong>quién lo dicta</strong>. Si el curso ya tenía docente en esa aula, se reemplaza.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">1. Aula *</span>
              <SearchableSelect value={assign.sectionId} onChange={val => {
                const lvl = levelOfSection.get(val);
                const keepCourse = courses.find(c => c.id === assign.courseId)?.nivel === lvl;
                const sec = sections.find(s => s.id === val);
                setAssign(a => ({ ...a, sectionId: val, courseId: keepCourse ? a.courseId : '', aula: a.aula || sec?.aula || '' }));
              }} icon={<School className="w-4 h-4" />}
                options={coverage.map(c => ({ value: c.section.id, label: sectionLabel(c.section), sublabel: `${LEVEL_LABEL[c.level] || ''} · ${c.total - c.covered} cursos sin docente` }))} placeholder="Buscar aula…" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">2. Curso *</span>
                <button type="button" onClick={() => setQuickCourseOpen(true)} className="text-xs font-bold text-purple-600 hover:underline cursor-pointer">+ Crear curso</button>
              </div>
              <SearchableSelect value={assign.courseId} onChange={val => {
                const c = courses.find(x => x.id === val);
                setAssign(a => ({ ...a, courseId: val, hours: c?.horas_semanales_sugeridas || a.hours }));
              }} icon={<BookOpen className="w-4 h-4" />}
                options={assignCourses.map(c => {
                  const taken = sectionCourses.find(sc => sc.seccion_id === assign.sectionId && sc.curso_id === c.id);
                  const who = taken ? teachers.find(t => t.id === taken.docente_id) : undefined;
                  return { value: c.id, label: c.nombre, sublabel: who ? `Ahora: ${who.nombres} ${who.apellidos}` : assign.sectionId ? 'Sin docente en esta aula' : LEVEL_LABEL[c.nivel] };
                })} placeholder={assign.sectionId ? 'Buscar curso…' : 'Primero elige el aula'} />
            </div>
            <div className="sm:col-span-2"><span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">3. Docente *</span>
              <SearchableSelect value={assign.teacherId} onChange={val => setAssign(a => ({ ...a, teacherId: val }))} icon={<GraduationCap className="w-4 h-4" />}
                options={teachers.filter(t => t.activo !== false).map(t => ({ value: t.id, label: `${t.nombres} ${t.apellidos}`, sublabel: `${t.especialidad || 'Docente'} · ${dataOf(t.id).hours} h por semana` }))} placeholder="Buscar docente…" />
            </div>
            <label className="block"><span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Horas por semana *</span>
              <input type="number" min={1} max={12} value={assign.hours} onChange={e => setAssign(a => ({ ...a, hours: Number(e.target.value) }))} className={inputCls} />
            </label>
            <label className="block"><span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Salón donde se dicta <span className="font-normal text-slate-400">(opcional)</span></span>
              <input value={assign.aula} onChange={e => setAssign(a => ({ ...a, aula: e.target.value }))} placeholder="Ej. Aula 201 / Laboratorio" className={inputCls} />
            </label>
          </div>

          {previousTeacher && previousTeacher.id !== assign.teacherId && (
            <p className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-sm text-amber-800 dark:text-amber-200">Este curso lo dicta ahora <strong>{previousTeacher.nombres} {previousTeacher.apellidos}</strong>. Al guardar, pasará al docente elegido.</p>
          )}
          {assign.teacherId && (
            <p className={`p-3 rounded-2xl text-sm ${projectedHours > RECOMMENDED_HOURS ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'}`}>
              Con esta asignación, el docente tendrá <strong>{projectedHours} h por semana</strong>{projectedHours > RECOMMENDED_HOURS ? ` (más de las ${RECOMMENDED_HOURS} h recomendadas)` : ''}.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => setAssignOpen(false)} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">Cancelar</button>
            {existingAssignment && (
              <button type="button" onClick={() => { removeSectionCourse(existingAssignment.id); setAssignOpen(false); }} className="px-4 py-2.5 rounded-xl border-2 border-rose-200 text-sm font-bold text-rose-600 hover:border-rose-400 cursor-pointer">Quitar asignación</button>
            )}
            <button type="submit" disabled={!canAssign} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"><CheckCircle2 className="w-4 h-4" /> Guardar</button>
          </div>
        </form>
      </Modal>

      {/* ══════════ Ventana: ficha del docente ══════════ */}
      {detail && (() => {
        const d = dataOf(detail.id);
        const load = loadInfo(d.hours);
        return (
          <Modal isOpen onClose={() => setDetail(null)} title="Ficha del docente" maxWidth="2xl">
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {detail.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detail.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                ) : (
                  <span className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-2xl font-black flex items-center justify-center">{initials(detail)}</span>
                )}
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <p className="text-xl font-black text-slate-900 dark:text-white">{detail.nombres} {detail.apellidos}</p>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{detail.especialidad || 'Docente'}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <span>DNI {detail.dni}</span>
                    {detail.email && <span className="inline-flex items-center gap-1"><Mail className="w-4 h-4" /> {detail.email}</span>}
                    {detail.telefono && <a href={`tel:${detail.telefono}`} className="inline-flex items-center gap-1 text-indigo-600 hover:underline"><Phone className="w-4 h-4" /> {detail.telefono}</a>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60"><p className={`text-2xl font-black ${load.text}`}>{d.hours} h</p><p className="text-xs text-slate-500">por semana · {load.label.toLowerCase()}</p></div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60"><p className="text-2xl font-black text-slate-900 dark:text-white">{d.classrooms}</p><p className="text-xs text-slate-500">{d.classrooms === 1 ? 'aula' : 'aulas'}</p></div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60"><p className="text-2xl font-black text-slate-900 dark:text-white">{d.assignments.length}</p><p className="text-xs text-slate-500">cursos a cargo</p></div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black text-slate-800 dark:text-slate-100">Cursos y aulas a su cargo</p>
                {d.assignments.length === 0 ? (
                  <p className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500">Aún no tiene cursos asignados.</p>
                ) : (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {d.assignments.map(a => {
                      const c = courses.find(x => x.id === a.curso_id);
                      const s = sections.find(x => x.id === a.seccion_id);
                      return (
                        <li key={a.id} className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <span className="w-1.5 self-stretch rounded-full" style={{ backgroundColor: c?.color_hex || '#6366f1' }} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-black text-slate-900 dark:text-white truncate">{c?.nombre || 'Curso'}</span>
                            <span className="block text-xs text-slate-500 truncate">{sectionLabel(s)}{a.aula_defecto ? ` · ${a.aula_defecto}` : ''}</span>
                          </span>
                          <span className="text-sm font-black text-indigo-600">{a.horas_semanales} h</span>
                          <button type="button" onClick={() => removeSectionCourse(a.id)} aria-label={`Quitar ${c?.nombre} de ${sectionLabel(s)}`} title="Quitar esta asignación" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => { const t = detail; setDetail(null); openEdit(t); }} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer"><Edit2 className="w-4 h-4" /> Editar datos</button>
                <div className="flex gap-2">
                  <Link href="/admin/horarios" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200"><Calendar className="w-4 h-4" /> Horarios</Link>
                  <button type="button" onClick={() => { const id = detail.id; setDetail(null); openAssign({ teacherId: id }); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-black cursor-pointer"><Plus className="w-4 h-4" /> Asignar curso</button>
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Registro rápido de curso desde la ventana de asignación */}
      <CourseFormModal
        isOpen={quickCourseOpen}
        onClose={() => setQuickCourseOpen(false)}
        onSuccess={newCourse => setAssign(a => ({ ...a, courseId: newCourse.id, hours: newCourse.horas_semanales_sugeridas || a.hours }))}
      />
    </div>
  );
}
