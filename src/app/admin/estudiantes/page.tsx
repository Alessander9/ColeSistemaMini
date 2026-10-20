'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { QrCard } from '@/components/qr/QrCard';
import { AvatarUploader } from '@/components/ui/AvatarUploader';
import { Student } from '@/types';
import {
  GraduationCap,
  Search,
  SlidersHorizontal,
  Plus,
  BookOpen,
  CheckCircle2,
  Phone,
  Calendar,
  Eye,
  QrCode,
  Pencil,
  Ban,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  User,
  Users,
  Hash,
  School,
  UserCheck,
  X,
  Luggage,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { MassPromotionModal } from '@/components/academico/MassPromotionModal';
import { generateSecurePassword } from '@/lib/auth/generateCredentials';
import { FormField } from '@/components/ui/FormField';
import { AgeBadge } from '@/components/ui/AgeBadge';
import { validateDni, validatePeruPhone, validateStudentBirthDate } from '@/lib/validation/businessRules';
import { EducationalLevel } from '@/types';

export default function AdminEstudiantesPage() {
  const {
    students,
    enrollments,
    sections,
    gradeLevels,
    addStudent,
    updateStudent,
    deleteStudent,
    toggleStudentStatus,
    showToast,
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todas' | 'inicial' | 'primaria' | 'secundaria' | 'activas' | 'retirados' | 'sin_aula'>('todas');
  const [visibleCount, setVisibleCount] = useState(12);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterGrade, setFilterGrade] = useState<string>('todos');
  const [filterSection, setFilterSection] = useState<string>('todos');

  // Sorting
  const [sortField, setSortField] = useState<'nombre' | 'fecha' | 'estado'>('fecha');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [selectedStudentForQr, setSelectedStudentForQr] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMassPromotionOpen, setIsMassPromotionOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Form State for Create
  const [showPasswordStudent, setShowPasswordStudent] = useState(false);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    fechaNacimiento: '2016-05-15',
    seccionId: '',
    nombreApoderado: '',
    telefonoApoderado: '',
    emailApoderado: '',
    dniApoderado: '',
    username: '',
    password: '',
    parentPassword: '',
    avatar_url: '',
    genero: 'Masculino',
  });

  // Form State for Edit
  const [editFormData, setEditFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    fechaNacimiento: '',
    seccionId: '',
    nombreApoderado: '',
    telefonoApoderado: '',
    avatar_url: '',
    genero: '',
  });

  // Aulas reales ordenadas, con vacantes libres
  const LEVEL_ORDER: Record<string, number> = { inicial: 0, primaria: 1, secundaria: 2 };
  const LEVEL_LABEL: Record<string, string> = { inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' };
  const levelOfSec = (secId?: string) => {
    const sec = sections.find(x => x.id === secId);
    return sec?.grado?.nivel || gradeLevels.find(g => g.id === sec?.grado_id)?.nivel || '';
  };
  const sectionOptions = [...sections]
    .sort((a, b) => (LEVEL_ORDER[levelOfSec(a.id)] ?? 9) - (LEVEL_ORDER[levelOfSec(b.id)] ?? 9) || (a.grado?.numero_grado ?? 0) - (b.grado?.numero_grado ?? 0) || a.letra.localeCompare(b.letra))
    .map(sec => {
      const taken = enrollments.filter(e => e.seccion_id === sec.id && e.estado === 'activo').length;
      const free = Math.max(0, (sec.capacidad_maxima || 30) - taken);
      return { value: sec.id, label: `${sec.grado?.nombre || 'Grado'} "${sec.letra}"`, sublabel: `${LEVEL_LABEL[levelOfSec(sec.id)] || ''} · ${free > 0 ? `${free} vacantes libres` : 'sin vacantes'}` };
    });
  // Matrícula vigente de cada alumno (la activa, o la más reciente)
  const enrollmentOf = (studentId: string) => {
    const list = enrollments.filter(e => e.estudiante_id === studentId);
    return list.find(e => e.estado === 'activo') || list.sort((a, b) => (b.fecha_matricula || '').localeCompare(a.fecha_matricula || ''))[0];
  };

  // Calculate Counters for Tabs
  const tabCounts = useMemo(() => {
    let todas = students.length;
    let inicial = 0;
    let primaria = 0;
    let secundaria = 0;
    let activas = 0;
    let retirados = 0;
    let sinAula = 0;

    students.forEach((s) => {
      const enr = enrollmentOf(s.id);
      const nivel = enr ? levelOfSec(enr.seccion_id) : '';
      if (!enr) sinAula++;
      else if (nivel === 'inicial') inicial++;
      else if (nivel === 'primaria') primaria++;
      else if (nivel === 'secundaria') secundaria++;
      if (enr?.estado === 'activo') activas++;
      else if (enr) retirados++;
    });

    return { todas, inicial, primaria, secundaria, activas, retirados, sin_aula: sinAula };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, enrollments, sections]);

  // Filtered & Sorted Student List
  const filteredStudents = useMemo(() => {
    let list = [...students];

    // Filter by Tab
    if (activeTab === 'inicial' || activeTab === 'primaria' || activeTab === 'secundaria') {
      list = list.filter((s) => { const enr = enrollmentOf(s.id); return !!enr && levelOfSec(enr.seccion_id) === activeTab; });
    } else if (activeTab === 'activas') {
      list = list.filter((s) => enrollmentOf(s.id)?.estado === 'activo');
    } else if (activeTab === 'retirados') {
      list = list.filter((s) => { const enr = enrollmentOf(s.id); return !!enr && enr.estado !== 'activo'; });
    } else if (activeTab === 'sin_aula') {
      list = list.filter((s) => !enrollmentOf(s.id));
    }

    // Filter by Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((s) => {
        const fullName = `${s.profile?.apellidos || s.apellidos || ''} ${s.profile?.nombres || s.nombres || ''}`.toLowerCase();
        const dni = s.profile?.dni || s.dni || '';
        const code = (s.codigo_estudiante || '').toLowerCase();
        const apoderado = (s.nombre_apoderado || '').toLowerCase();
        const phone = s.telefono_apoderado || '';
        return (
          fullName.includes(q) ||
          dni.includes(q) ||
          code.includes(q) ||
          apoderado.includes(q) ||
          phone.includes(q)
        );
      });
    }

    // Additional Filters from Modal
    if (filterGrade !== 'todos') {
      list = list.filter((s) => {
        const enr = enrollments.find((e) => e.estudiante_id === s.id);
        return enr?.seccion?.grado_id === filterGrade;
      });
    }

    if (filterSection !== 'todos') {
      list = list.filter((s) => {
        const enr = enrollments.find((e) => e.estudiante_id === s.id);
        return enrollmentOf(s.id)?.seccion_id === filterSection;
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortField === 'nombre') {
        const nameA = `${a.profile?.apellidos} ${a.profile?.nombres}`.toLowerCase();
        const nameB = `${b.profile?.apellidos} ${b.profile?.nombres}`.toLowerCase();
        return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortField === 'fecha') {
        const enrA = enrollments.find((e) => e.estudiante_id === a.id)?.fecha_matricula || '2026-01-01';
        const enrB = enrollments.find((e) => e.estudiante_id === b.id)?.fecha_matricula || '2026-01-01';
        return sortAsc ? enrA.localeCompare(enrB) : enrB.localeCompare(enrA);
      }
      if (sortField === 'estado') {
        const enrA = enrollments.find((e) => e.estudiante_id === a.id);
        const enrB = enrollments.find((e) => e.estudiante_id === b.id);
        const statA = enrA?.estado || 'activo';
        const statB = enrB?.estado || 'activo';
        return sortAsc ? statA.localeCompare(statB) : statB.localeCompare(statA);
      }
      return 0;
    });

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, enrollments, sections, activeTab, searchTerm, filterGrade, filterSection, sortField, sortAsc]);

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const pagedStudents = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, validCurrentPage, pageSize]);

  const startRecord = filteredStudents.length === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(validCurrentPage * pageSize, filteredStudents.length);

  // Selection handlers
  const isAllSelected = pagedStudents.length > 0 && pagedStudents.every((s) => selectedIds.includes(s.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pagedStudents.some((s) => s.id === id)));
    } else {
      const newIds = Array.from(new Set([...selectedIds, ...pagedStudents.map((s) => s.id)]));
      setSelectedIds(newIds);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // ── Validaciones en Tiempo Real: Crear Estudiante ──
  const [createTouched, setCreateTouched] = useState<Record<string, boolean>>({});
  const createSelectedLevel = (levelOfSec(formData.seccionId) || null) as EducationalLevel | null;
  const createDniVal = validateDni(formData.dni, {
    required: true,
    existingDnis: students.map(s => s.profile?.dni || s.dni),
    entityName: 'estudiante'
  });
  const createBirthVal = validateStudentBirthDate(formData.fechaNacimiento, createSelectedLevel);
  const createPhoneVal = validatePeruPhone(formData.telefonoApoderado, { required: false, fieldName: 'El teléfono' });
  const createNamesValid = formData.nombres.trim().length >= 2;
  const createLastNamesValid = formData.apellidos.trim().length >= 2;
  const canCreateStudent = createNamesValid && createLastNamesValid && createDniVal.isValid && createBirthVal.isValid && createPhoneVal.isValid && !!formData.seccionId;

  // Create Student Handler
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateStudent) return;

    const result = addStudent(formData);
    setIsAddModalOpen(false);
    setSelectedStudentForQr(result.student);
    setCreateTouched({});
    setFormData({
      nombres: '',
      apellidos: '',
      dni: '',
      fechaNacimiento: '2016-05-15',
      seccionId: '',
      nombreApoderado: '',
      telefonoApoderado: '',
      emailApoderado: '',
      dniApoderado: '',
      username: '',
      password: '',
      parentPassword: '',
      avatar_url: '',
      genero: 'Masculino',
    });
  };

  const handleGenerateStudentPassword = () => {
    const gen = generateSecurePassword();
    setFormData(prev => ({ ...prev, password: gen }));
    showToast('Contraseña de estudiante sugerida generada.', 'info', 'Contraseña');
  };

  // ── Validaciones en Tiempo Real: Editar Estudiante ──
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});
  const editSelectedLevel = (levelOfSec(editFormData.seccionId) || null) as EducationalLevel | null;
  const otherStudentDnis = useMemo(() => {
    return students.filter(s => s.id !== editingStudent?.id).map(s => s.profile?.dni || s.dni);
  }, [students, editingStudent]);
  const editDniVal = validateDni(editFormData.dni, {
    required: true,
    existingDnis: otherStudentDnis,
    entityName: 'estudiante'
  });
  const editBirthVal = validateStudentBirthDate(editFormData.fechaNacimiento, editSelectedLevel);
  const editPhoneVal = validatePeruPhone(editFormData.telefonoApoderado, { required: false, fieldName: 'El teléfono' });
  const editNamesValid = editFormData.nombres.trim().length >= 2;
  const editLastNamesValid = editFormData.apellidos.trim().length >= 2;
  const canSaveStudentEdit = editNamesValid && editLastNamesValid && editDniVal.isValid && editBirthVal.isValid && editPhoneVal.isValid && !!editFormData.seccionId;

  // Open Edit Modal
  const handleOpenEdit = (student: Student) => {
    const enr = enrollments.find((e) => e.estudiante_id === student.id);
    setEditingStudent(student);
    setEditTouched({});
    setEditFormData({
      nombres: student.profile?.nombres || '',
      apellidos: student.profile?.apellidos || '',
      dni: student.profile?.dni || '',
      fechaNacimiento: student.fecha_nacimiento || '2016-05-15',
      seccionId: enr?.seccion_id || '',
      nombreApoderado: student.nombre_apoderado || '',
      telefonoApoderado: student.telefono_apoderado || '',
      avatar_url: student.profile?.avatar_url || '',
      genero: student.genero || 'Masculino',
    });
  };

  // Submit Edit Handler
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !canSaveStudentEdit) return;
    updateStudent(editingStudent.id, editFormData);
    setEditingStudent(null);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = () => {
    if (!deletingStudent) return;
    deleteStudent(deletingStudent.id);
    setDeletingStudent(null);
  };

  // Sort Toggle Helper
  const handleToggleSort = (field: 'nombre' | 'fecha' | 'estado') => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-in fade-in duration-300 pb-12">
      
      {/* ══════════ Encabezado ══════════ */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-blue-600" /> Alumnos
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            El directorio de todos tus alumnos. Busca a cualquiera y mira en qué aula está, quién es su apoderado y cómo contactarlo. Desde aquí abres su ficha, su carnet o corriges sus datos.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => setIsMassPromotionOpen(true)} title="Pasa a los alumnos al grado siguiente al terminar el año"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-amber-400 cursor-pointer">
            <Luggage className="w-4 h-4 text-amber-500" /> Pasar de año
          </button>
          <button type="button" onClick={() => setIsAddModalOpen(true)} title="Registro corto: solo datos básicos y aula"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-blue-400 cursor-pointer">
            <Plus className="w-4 h-4 text-blue-600" /> Registro rápido
          </button>
          <Link href="/admin/matriculas?nuevo=true" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-md shadow-blue-600/25">
            <GraduationCap className="w-4 h-4" /> Matricular alumno
          </Link>
        </div>
      </div>

      {/* ══════════ Resumen por nivel (se puede tocar para filtrar) ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { k: 'todas', label: 'Todos los alumnos', count: tabCounts.todas, dot: 'bg-slate-400', hint: `${tabCounts.activas} estudiando` },
          { k: 'inicial', label: 'Inicial', count: tabCounts.inicial, dot: 'bg-amber-500', hint: '3 a 5 años' },
          { k: 'primaria', label: 'Primaria', count: tabCounts.primaria, dot: 'bg-blue-500', hint: '1° a 6° grado' },
          { k: 'secundaria', label: 'Secundaria', count: tabCounts.secundaria, dot: 'bg-purple-500', hint: '1° a 5° año' },
        ] as const).map(t => {
          const active = activeTab === t.k;
          return (
            <button key={t.k} type="button" onClick={() => { setActiveTab(t.k); setCurrentPage(1); setVisibleCount(12); }} aria-pressed={active}
              className={`text-left p-4 rounded-3xl border-2 cursor-pointer transition-all ${active ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300'}`}>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} /> {t.label}</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{t.count}</p>
              <p className="text-xs text-slate-500">{t.hint}</p>
            </button>
          );
        })}
      </div>

      {/* ══════════ Buscar y filtrar ══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(12); }} placeholder="Buscar por nombre, DNI, código o apoderado"
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
            {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label="Borrar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>}
          </div>
          <div className="lg:w-64">
            <SearchableSelect value={filterSection} onChange={(v) => { setFilterSection(v); setVisibleCount(12); }} icon={<School className="w-4 h-4" />}
              options={[{ value: 'todos', label: 'Todas las aulas', sublabel: 'Sin filtro' }, ...sectionOptions]} placeholder="Filtrar por aula" searchPlaceholder="Escribe 3°, A, 5 años…" />
          </div>
          <select value={`${sortField}-${sortAsc ? 'asc' : 'desc'}`} onChange={(e) => { const [f, d] = e.target.value.split('-'); setSortField(f as 'nombre' | 'fecha' | 'estado'); setSortAsc(d === 'asc'); }}
            className="lg:w-52 px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer" aria-label="Ordenar">
            <option value="nombre-asc">Ordenar: A → Z</option>
            <option value="nombre-desc">Ordenar: Z → A</option>
            <option value="fecha-desc">Matriculados recientes</option>
            <option value="fecha-asc">Matriculados antiguos</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-500">Estado:</span>
          {([
            { k: 'todas', label: 'Todos' },
            { k: 'activas', label: `Estudiando (${tabCounts.activas})` },
            { k: 'retirados', label: `Retirados (${tabCounts.retirados})` },
            ...(tabCounts.sin_aula > 0 ? [{ k: 'sin_aula' as const, label: `Sin aula (${tabCounts.sin_aula})` }] : []),
          ] as { k: typeof activeTab; label: string }[]).map(f => (
            <button key={f.k} type="button" onClick={() => { setActiveTab(f.k); setVisibleCount(12); }} aria-pressed={activeTab === f.k}
              className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold cursor-pointer ${activeTab === f.k ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'}`}>
              {f.label}
            </button>
          ))}
          {(filterSection !== 'todos' || searchTerm || activeTab !== 'todas') && (
            <button type="button" onClick={() => { setFilterSection('todos'); setFilterGrade('todos'); setSearchTerm(''); setActiveTab('todas'); }} className="ml-auto text-sm font-bold text-blue-600 hover:underline cursor-pointer">Quitar filtros</button>
          )}
        </div>
      </div>

      {/* ══════════ Lista ══════════ */}
      <p className="text-sm text-slate-500">
        {filteredStudents.length === 0 ? 'No hay alumnos con estos filtros.' : `Mostrando ${Math.min(visibleCount, filteredStudents.length)} de ${filteredStudents.length} ${filteredStudents.length === 1 ? 'alumno' : 'alumnos'}`}
      </p>
      {filteredStudents.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-lg font-black text-slate-800 dark:text-slate-100">{students.length === 0 ? 'Aún no hay alumnos' : 'No encontramos alumnos'}</p>
          <p className="text-sm text-slate-500">{students.length === 0 ? 'Empieza matriculando al primero.' : 'Prueba con otro nombre o quita los filtros.'}</p>
          {students.length === 0 && <Link href="/admin/matriculas?nuevo=true" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-black">Matricular alumno</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.slice(0, visibleCount).map((student) => {
            const enr = enrollmentOf(student.id);
            const sec = sections.find(x => x.id === enr?.seccion_id) || enr?.seccion;
            const nivel = levelOfSec(enr?.seccion_id);
            const nombres = student.profile?.nombres || student.nombres || '';
            const apellidos = student.profile?.apellidos || student.apellidos || '';
            const dni = student.profile?.dni || student.dni || '';
            const avatar = student.profile?.avatar_url || '';
            const activo = enr?.estado === 'activo';
            const estado = !enr ? { label: 'Sin aula', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' }
              : activo ? { label: 'Estudiando', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' }
              : { label: enr.estado === 'trasladado' ? 'Trasladado' : 'Retirado', cls: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300' };
            const nivelCls = nivel === 'inicial' ? 'bg-amber-100 text-amber-800' : nivel === 'primaria' ? 'bg-blue-100 text-blue-800' : nivel === 'secundaria' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600';
            return (
              <div key={student.id} className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-3 ${!activo && enr ? 'opacity-75' : ''}`}>
                <div className="flex items-start gap-3">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                  ) : (
                    <span className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-base font-black flex items-center justify-center shrink-0">{`${nombres[0] || ''}${apellidos[0] || ''}`.toUpperCase() || '?'}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/estudiantes/${student.id}`} className="block text-base font-black text-slate-900 dark:text-white leading-tight hover:text-blue-600 truncate">{apellidos}, {nombres}</Link>
                    <p className="text-xs text-slate-500">{dni ? `DNI ${dni}` : 'Sin DNI'} · {student.codigo_estudiante}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-black ${estado.cls}`}>{estado.label}</span>
                  </div>
                  <div className="relative">
                    <button type="button" onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)} aria-label={`Más opciones de ${nombres}`} aria-expanded={openMenuId === student.id}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><ChevronDown className="w-5 h-5" /></button>
                    {openMenuId === student.id && (
                      <div className="absolute right-0 top-full mt-1 z-30 w-52 p-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl">
                        <button type="button" onClick={() => { handleOpenEdit(student); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"><Pencil className="w-4 h-4" /> Editar datos</button>
                        {enr && (
                          <button type="button" onClick={() => { toggleStudentStatus(student.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                            {activo ? <><Ban className="w-4 h-4" /> Marcar como retirado</> : <><CheckCircle2 className="w-4 h-4" /> Volver a activar</>}
                          </button>
                        )}
                        <button type="button" onClick={() => { setDeletingStudent(student); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"><Trash2 className="w-4 h-4" /> Eliminar</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 min-w-0">
                    <p className="text-[11px] text-slate-500">Aula</p>
                    {sec ? (
                      <>
                        <p className="font-black text-slate-800 dark:text-slate-100 truncate">{sec.grado?.nombre || 'Grado'} &quot;{sec.letra}&quot;</p>
                        <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${nivelCls}`}>{LEVEL_LABEL[nivel] || '—'}</span>
                      </>
                    ) : (
                      <Link href="/admin/matriculas?nuevo=true" className="font-bold text-amber-700 hover:underline">Matricular →</Link>
                    )}
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 min-w-0">
                    <p className="text-[11px] text-slate-500">Apoderado</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{student.nombre_apoderado || 'No registrado'}</p>
                    {student.telefono_apoderado && <a href={`tel:${student.telefono_apoderado}`} className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {student.telefono_apoderado}</a>}
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <Link href={`/admin/estudiantes/${student.id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black">
                    <Eye className="w-4 h-4" /> Ver ficha
                  </Link>
                  <button type="button" onClick={() => setSelectedStudentForQr(student)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-400 cursor-pointer">
                    <QrCode className="w-4 h-4 text-blue-600" /> Carnet
                  </button>
                  <button type="button" onClick={() => handleOpenEdit(student)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-400 cursor-pointer">
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {filteredStudents.length > visibleCount && (
        <button type="button" onClick={() => setVisibleCount(c => c + 12)} className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-blue-400 cursor-pointer">
          Ver más alumnos ({filteredStudents.length - visibleCount} más)
        </button>
      )}

      {/* ── MODAL: VIEW QR CARNET ── */}
      {selectedStudentForQr && (
        <Modal
          isOpen={!!selectedStudentForQr}
          onClose={() => setSelectedStudentForQr(null)}
          title="Carnet Escolar con Código QR"
          maxWidth="md"
        >
          <QrCard student={selectedStudentForQr} showActions={true} />
        </Modal>
      )}

      {/* ── MODAL: NUEVO ESTUDIANTE ── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Registro rápido de alumno"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          {/* Avatar Uploader */}
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
            <AvatarUploader
              currentAvatarUrl={formData.avatar_url}
              userName={`${formData.nombres || 'Alumno'} ${formData.apellidos || ''}`.trim()}
              onAvatarUpdated={(url) => setFormData((prev) => ({ ...prev, avatar_url: url }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField
              label="Nombres"
              required
              icon={<User className="w-3.5 h-3.5 text-blue-500" />}
              error={createTouched.nombres && formData.nombres.trim().length < 2 ? 'Ingresa los nombres del alumno (mínimo 2 letras).' : undefined}
            >
              <input
                required
                type="text"
                placeholder="Ej. Héctor Raúl"
                value={formData.nombres}
                onBlur={() => setCreateTouched(prev => ({ ...prev, nombres: true }))}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </FormField>

            <FormField
              label="Apellidos"
              required
              icon={<User className="w-3.5 h-3.5 text-blue-500" />}
              error={createTouched.apellidos && formData.apellidos.trim().length < 2 ? 'Ingresa los apellidos del alumno (mínimo 2 letras).' : undefined}
            >
              <input
                required
                type="text"
                placeholder="Ej. Salazar Portero"
                value={formData.apellidos}
                onBlur={() => setCreateTouched(prev => ({ ...prev, apellidos: true }))}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </FormField>

            <FormField
              label="DNI del Alumno"
              required
              icon={<Hash className="w-3.5 h-3.5 text-blue-500" />}
              error={(createTouched.dni || formData.dni.length === 8) && !createDniVal.isValid ? createDniVal.message : undefined}
            >
              <input
                required
                type="text"
                maxLength={8}
                inputMode="numeric"
                placeholder="8 dígitos numéricos"
                value={formData.dni}
                onBlur={() => setCreateTouched(prev => ({ ...prev, dni: true }))}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono outline-none"
              />
            </FormField>

            <FormField
              label="Fecha de Nacimiento"
              required
              icon={<Calendar className="w-3.5 h-3.5 text-blue-500" />}
              badge={<AgeBadge birthDate={formData.fechaNacimiento} level={createSelectedLevel} />}
              error={(createTouched.fechaNacimiento || !!formData.fechaNacimiento) && !createBirthVal.isValid ? createBirthVal.message : undefined}
            >
              <input
                required
                type="date"
                value={formData.fechaNacimiento}
                onBlur={() => setCreateTouched(prev => ({ ...prev, fechaNacimiento: true }))}
                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono outline-none"
              />
            </FormField>

            <FormField
              label="Sección de Matrícula"
              required
              icon={<School className="w-3.5 h-3.5 text-blue-500" />}
              error={createTouched.seccionId && !formData.seccionId ? 'Elige el aula donde estudiará el alumno.' : undefined}
            >
              <SearchableSelect
                value={formData.seccionId}
                onChange={(val) => {
                  setFormData({ ...formData, seccionId: val });
                  setCreateTouched(prev => ({ ...prev, seccionId: true }));
                }}
                icon={<School className="w-4 h-4" />}
                options={sectionOptions}
                placeholder="Seleccionar aula..."
              />
            </FormField>

            <FormField
              label="Nombre del Apoderado"
              icon={<UserCheck className="w-3.5 h-3.5 text-blue-500" />}
            >
              <input
                type="text"
                placeholder="Ej. Jorge Silva Rodríguez"
                value={formData.nombreApoderado}
                onChange={(e) => setFormData({ ...formData, nombreApoderado: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField
                label="Teléfono / WhatsApp de Contacto"
                icon={<Phone className="w-3.5 h-3.5 text-blue-500" />}
                hint="9 dígitos (formato celular peruano, ej. 987654321)"
                error={(createTouched.telefonoApoderado || formData.telefonoApoderado.length > 0) && !createPhoneVal.isValid ? createPhoneVal.message : undefined}
              >
                <input
                  type="tel"
                  maxLength={9}
                  inputMode="numeric"
                  placeholder="Ej. 955443322"
                  value={formData.telefonoApoderado}
                  onBlur={() => setCreateTouched(prev => ({ ...prev, telefonoApoderado: true }))}
                  onChange={(e) => setFormData({ ...formData, telefonoApoderado: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono outline-none"
                />
              </FormField>
            </div>
          </div>

          {/* ── Sección de Acceso a la Plataforma y Contraseña ── */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Credenciales de Acceso a la Plataforma
              </span>
              <button
                type="button"
                onClick={handleGenerateStudentPassword}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/60 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Generar Contraseña
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Usuario del Estudiante (Login)
                </label>
                <input
                  type="text"
                  placeholder="Dejar vacío para autogenerar"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña del Estudiante
                </label>
                <div className="relative">
                  <input
                    type={showPasswordStudent ? 'text' : 'password'}
                    placeholder="Ej. EstLucas2026!"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2 pr-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordStudent(!showPasswordStudent)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPasswordStudent ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canCreateStudent}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Guardar y ver su carnet
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: EDITAR ESTUDIANTE ── */}
      {editingStudent && (
        <Modal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          title={`Editar Estudiante: ${editingStudent.profile?.nombres} ${editingStudent.profile?.apellidos}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            {/* Avatar Uploader */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
              <AvatarUploader
                currentAvatarUrl={editFormData.avatar_url}
                userName={`${editFormData.nombres} ${editFormData.apellidos}`}
                onAvatarUpdated={(url) => setEditFormData((prev) => ({ ...prev, avatar_url: url }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <FormField
                label="Nombres"
                required
                icon={<User className="w-3.5 h-3.5 text-blue-500" />}
                error={editTouched.nombres && editFormData.nombres.trim().length < 2 ? 'Ingresa los nombres del alumno (mínimo 2 letras).' : undefined}
              >
                <input
                  required
                  type="text"
                  value={editFormData.nombres}
                  onBlur={() => setEditTouched(prev => ({ ...prev, nombres: true }))}
                  onChange={(e) => setEditFormData({ ...editFormData, nombres: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </FormField>

              <FormField
                label="Apellidos"
                required
                icon={<User className="w-3.5 h-3.5 text-blue-500" />}
                error={editTouched.apellidos && editFormData.apellidos.trim().length < 2 ? 'Ingresa los apellidos del alumno (mínimo 2 letras).' : undefined}
              >
                <input
                  required
                  type="text"
                  value={editFormData.apellidos}
                  onBlur={() => setEditTouched(prev => ({ ...prev, apellidos: true }))}
                  onChange={(e) => setEditFormData({ ...editFormData, apellidos: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </FormField>

              <FormField
                label="DNI del Alumno"
                required
                icon={<Hash className="w-3.5 h-3.5 text-blue-500" />}
                error={(editTouched.dni || editFormData.dni.length === 8) && !editDniVal.isValid ? editDniVal.message : undefined}
              >
                <input
                  required
                  type="text"
                  maxLength={8}
                  inputMode="numeric"
                  value={editFormData.dni}
                  onBlur={() => setEditTouched(prev => ({ ...prev, dni: true }))}
                  onChange={(e) => setEditFormData({ ...editFormData, dni: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono outline-none"
                />
              </FormField>

              <FormField
                label="Fecha de Nacimiento"
                required
                icon={<Calendar className="w-3.5 h-3.5 text-blue-500" />}
                badge={<AgeBadge birthDate={editFormData.fechaNacimiento} level={editSelectedLevel} />}
                error={(editTouched.fechaNacimiento || !!editFormData.fechaNacimiento) && !editBirthVal.isValid ? editBirthVal.message : undefined}
              >
                <input
                  required
                  type="date"
                  value={editFormData.fechaNacimiento}
                  onBlur={() => setEditTouched(prev => ({ ...prev, fechaNacimiento: true }))}
                  onChange={(e) => setEditFormData({ ...editFormData, fechaNacimiento: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono outline-none"
                />
              </FormField>

              <FormField
                label="Sección de Matrícula"
                required
                icon={<School className="w-3.5 h-3.5 text-blue-500" />}
                error={editTouched.seccionId && !editFormData.seccionId ? 'Elige el aula donde estudiará el alumno.' : undefined}
              >
                <SearchableSelect
                  value={editFormData.seccionId}
                  onChange={(val) => {
                    setEditFormData({ ...editFormData, seccionId: val });
                    setEditTouched(prev => ({ ...prev, seccionId: true }));
                  }}
                  icon={<School className="w-4 h-4" />}
                  options={sectionOptions}
                  placeholder="Seleccionar aula..."
                />
              </FormField>

              <FormField
                label="Nombre del Apoderado"
                icon={<UserCheck className="w-3.5 h-3.5 text-blue-500" />}
              >
                <input
                  type="text"
                  value={editFormData.nombreApoderado}
                  onChange={(e) => setEditFormData({ ...editFormData, nombreApoderado: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField
                  label="Teléfono de Contacto"
                  icon={<Phone className="w-3.5 h-3.5 text-blue-500" />}
                  hint="9 dígitos (formato celular peruano, ej. 987654321)"
                  error={(editTouched.telefonoApoderado || editFormData.telefonoApoderado.length > 0) && !editPhoneVal.isValid ? editPhoneVal.message : undefined}
                >
                  <input
                    type="tel"
                    maxLength={9}
                    inputMode="numeric"
                    value={editFormData.telefonoApoderado}
                    onBlur={() => setEditTouched(prev => ({ ...prev, telefonoApoderado: true }))}
                    onChange={(e) => setEditFormData({ ...editFormData, telefonoApoderado: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono outline-none"
                  />
                </FormField>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canSaveStudentEdit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: CONFIRMAR ELIMINACIÓN ── */}
      {deletingStudent && (
        <Modal
          isOpen={!!deletingStudent}
          onClose={() => setDeletingStudent(null)}
          title="¿Eliminar alumno?"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
              <p className="font-semibold leading-relaxed">
                ¿Estás seguro de que deseas eliminar a{' '}
                <span className="font-extrabold">{deletingStudent.profile?.nombres} {deletingStudent.profile?.apellidos}</span>?
                Esta acción eliminará su matrícula y carnet QR.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Eliminar Estudiante
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: PANEL DE FILTROS AVANZADOS ── */}
      {isFilterModalOpen && (
        <Modal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          title="Filtros Avanzados de Estudiantes"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Filtrar por Grado:
              </label>
              <SearchableSelect
                value={filterGrade}
                onChange={setFilterGrade}
                icon={<GraduationCap className="w-4 h-4" />}
                options={[
                  { value: 'todos', label: 'Todos los Grados', sublabel: 'Sin filtro de grado' },
                  ...gradeLevels.map((g) => ({
                    value: g.id,
                    label: g.nombre,
                    sublabel: `Nivel ${g.nivel}`,
                  })),
                ]}
                placeholder="Seleccionar grado..."
                searchPlaceholder="Escribe 1°, 2°, inicial..."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Filtrar por Salón / Sección:
              </label>
              <SearchableSelect
                value={filterSection}
                onChange={setFilterSection}
                icon={<Users className="w-4 h-4" />}
                options={[
                  { value: 'todos', label: 'Todas las Secciones', sublabel: 'Sin filtro de salón' },
                  ...sections.map((s) => ({
                    value: s.id,
                    label: `${s.grado?.nombre || 'Grado'} "${s.letra}"`,
                    sublabel: `Nivel ${s.grado?.nivel || 'Nivel'} · Cap. ${s.capacidad_maxima}`,
                  })),
                ]}
                placeholder="Seleccionar sección..."
                searchPlaceholder="Escribe A, B, grado..."
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setFilterGrade('todos');
                  setFilterSection('todos');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Restablecer filtros
              </button>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL DE PROMOCIÓN ESCOLAR MASIVA ── */}
      <MassPromotionModal
        isOpen={isMassPromotionOpen}
        onClose={() => setIsMassPromotionOpen(false)}
      />

    </div>
  );
}
