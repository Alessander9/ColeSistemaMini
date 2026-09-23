'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { AvatarUploader } from '@/components/ui/AvatarUploader';
import { DataTable } from '@/components/ui/DataTable';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { CourseFormModal } from '@/components/academico/CourseFormModal';
import { SectionCourseAssignment, UserProfile } from '@/types';
import { 
  Users, 
  UserPlus, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  CheckCircle2, 
  Copy, 
  Key, 
  Mail, 
  Phone, 
  Sparkles, 
  Building2, 
  School,
  Award,
  Layers,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  UserCheck,
  User,
  Hash,
  MoreVertical,
  BookMarked,
  Edit2,
  X,
  AlertTriangle,
  FileText,
  Check,
  Filter,
  LayoutList,
  LayoutGrid,
  Download,
  Calculator,
  FlaskConical,
  Languages,
  Dumbbell,
  Palette,
  Laptop
} from 'lucide-react';

function getSpecialtyBadge(specialty: string = '') {
  const norm = (specialty || '').toLowerCase();
  if (norm.includes('matem') || norm.includes('álgebra') || norm.includes('geometría') || norm.includes('arit')) {
    return {
      label: 'Matemática',
      icon: <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />,
      style: 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/60',
    };
  }
  if (norm.includes('comunic') || norm.includes('lengu') || norm.includes('literat') || norm.includes('redac')) {
    return {
      label: 'Comunicación',
      icon: <BookOpen className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400 shrink-0" />,
      style: 'bg-pink-50/90 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200/70 dark:border-pink-800/60',
    };
  }
  if (norm.includes('ciencia') || norm.includes('tecnolog') || norm.includes('cta') || norm.includes('química') || norm.includes('biolog') || norm.includes('físic')) {
    return {
      label: 'Ciencias',
      icon: <FlaskConical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      style: 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/60',
    };
  }
  if (norm.includes('ingl') || norm.includes('idioma') || norm.includes('english')) {
    return {
      label: 'Inglés',
      icon: <Languages className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />,
      style: 'bg-rose-50/90 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/60',
    };
  }
  if (norm.includes('educación física') || norm.includes('deporte') || norm.includes('educ. física') || norm.includes('ed. física') || norm.includes('psicomotricidad')) {
    return {
      label: 'Educ. Física',
      icon: <Dumbbell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />,
      style: 'bg-amber-50/90 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/60',
    };
  }
  if (norm.includes('social') || norm.includes('personal') || norm.includes('historia') || norm.includes('geografía') || norm.includes('cívica')) {
    return {
      label: 'Personal Social',
      icon: <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />,
      style: 'bg-purple-50/90 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/60',
    };
  }
  if (norm.includes('arte') || norm.includes('cultura') || norm.includes('música') || norm.includes('danza')) {
    return {
      label: 'Arte y Cultura',
      icon: <Palette className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400 shrink-0" />,
      style: 'bg-fuchsia-50/90 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200/70 dark:border-fuchsia-800/60',
    };
  }
  if (norm.includes('comput') || norm.includes('robót') || norm.includes('sistemas') || norm.includes('tic') || norm.includes('informát')) {
    return {
      label: 'Computación',
      icon: <Laptop className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />,
      style: 'bg-cyan-50/90 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200/70 dark:border-cyan-800/60',
    };
  }
  return {
    label: specialty || 'General',
    icon: <Award className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />,
    style: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };
}

function getCourseBadgeStyle(courseName: string = '') {
  const norm = courseName.toLowerCase();
  if (norm.includes('matem') || norm.includes('álgebra') || norm.includes('geometría')) {
    return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/60';
  }
  if (norm.includes('comunic') || norm.includes('lengu') || norm.includes('literat')) {
    return 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200/70 dark:border-pink-800/60';
  }
  if (norm.includes('ciencia') || norm.includes('tecnolog') || norm.includes('cta') || norm.includes('química') || norm.includes('biolog')) {
    return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/60';
  }
  if (norm.includes('ingl') || norm.includes('idioma') || norm.includes('english')) {
    return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800/60';
  }
  if (norm.includes('física') || norm.includes('fisica') || norm.includes('educación física') || norm.includes('deporte')) {
    return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/60';
  }
  if (norm.includes('social') || norm.includes('personal') || norm.includes('historia')) {
    return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/60';
  }
  if (norm.includes('arte') || norm.includes('cultura') || norm.includes('música')) {
    return 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200/70 dark:border-fuchsia-800/60';
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
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
    getTeacherSections 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profesores' | 'asignaciones'>('profesores');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPill, setFilterPill] = useState<'todos' | 'activos' | 'inactivos' | 'sin_asignacion'>('todos');
  const [filterEspecialidad, setFilterEspecialidad] = useState('todas');
  const [sortBy, setSortBy] = useState<'nombre_asc' | 'nombre_desc' | 'horas_desc' | 'horas_asc'>('nombre_asc');
  
  // Modals & Popups
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterNivel, setFilterNivel] = useState<'todos' | 'primaria' | 'secundaria'>('todos');

  // Menu ID open
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal Nuevo Docente
  const [isNewTeacherModalOpen, setIsNewTeacherModalOpen] = useState(false);
  const [newTeacherData, setNewTeacherData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    email: '',
    especialidad: 'Matemática',
    avatar_url: '',
  });

  // Modal Editar Docente
  const [editingTeacher, setEditingTeacher] = useState<UserProfile | null>(null);
  const [editFormData, setEditFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    email: '',
    especialidad: '',
    avatar_url: '',
    activo: true,
  });

  // Modal Confirmar Eliminar Docente
  const [deletingTeacher, setDeletingTeacher] = useState<UserProfile | null>(null);

  // Modal Credenciales Creadas
  const [createdCredentials, setCreatedCredentials] = useState<{
    teacherName: string;
    username: string;
    password: string;
    email: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedTeacherForDetail, setSelectedTeacherForDetail] = useState<UserProfile | null>(null);
  const [isQuickCourseModalOpen, setIsQuickCourseModalOpen] = useState(false);

  // Modal Asignar Materia a Salón
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [horasSemanales, setHorasSemanales] = useState<number>(4);
  const [aulaDefecto, setAulaDefecto] = useState<string>('Aula 301');
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Teacher Counts for Pills
  const counts = useMemo(() => {
    const total = teachers.length;
    const activos = teachers.filter(t => t.activo !== false).length;
    const inactivos = teachers.filter(t => t.activo === false).length;
    const sinAsignacion = teachers.filter(t => {
      const asigs = sectionCourses.filter(sc => sc.docente_id === t.id);
      return asigs.length === 0;
    }).length;
    return { total, activos, inactivos, sinAsignacion };
  }, [teachers, sectionCourses]);

  // Specialty category options
  const specialtyOptions = useMemo(() => {
    return [
      { id: 'todas', label: 'Todas las Especialidades', count: teachers.length },
      { id: 'Matemática', label: 'Matemática' },
      { id: 'Comunicación', label: 'Comunicación' },
      { id: 'Ciencias', label: 'Ciencias' },
      { id: 'Inglés', label: 'Inglés' },
      { id: 'Personal Social', label: 'Personal Social' },
      { id: 'Educ. Física', label: 'Educ. Física' },
      { id: 'Arte y Cultura', label: 'Arte y Cultura' },
    ];
  }, [teachers]);

  // Process and Filter Teachers
  const processedTeachers = useMemo(() => {
    return teachers
      .filter((t) => {
        // Search filter
        const query = searchTerm.toLowerCase();
        const asigs = sectionCourses.filter(sc => sc.docente_id === t.id);
        const matchesSearch = 
          `${t.nombres} ${t.apellidos}`.toLowerCase().includes(query) ||
          `${t.apellidos} ${t.nombres}`.toLowerCase().includes(query) ||
          t.dni.includes(query) ||
          (t.especialidad && t.especialidad.toLowerCase().includes(query)) ||
          (t.email && t.email.toLowerCase().includes(query)) ||
          asigs.some(a => a.curso?.nombre?.toLowerCase().includes(query) || a.seccion?.grado?.nombre?.toLowerCase().includes(query));

        // Pill filter
        let matchesPill = true;
        if (filterPill === 'activos') matchesPill = t.activo !== false;
        if (filterPill === 'inactivos') matchesPill = t.activo === false;
        if (filterPill === 'sin_asignacion') matchesPill = asigs.length === 0;

        // Specialty filter
        let matchesEsp = true;
        if (filterEspecialidad !== 'todas') {
          const esp = (t.especialidad || '').toLowerCase();
          if (filterEspecialidad === 'Matemática') matchesEsp = esp.includes('matem') || esp.includes('álgebra');
          else if (filterEspecialidad === 'Comunicación') matchesEsp = esp.includes('comunic') || esp.includes('lengu');
          else if (filterEspecialidad === 'Ciencias') matchesEsp = esp.includes('ciencia') || esp.includes('cta') || esp.includes('química') || esp.includes('biolog') || esp.includes('físic');
          else if (filterEspecialidad === 'Inglés') matchesEsp = esp.includes('ingl') || esp.includes('idioma') || esp.includes('english');
          else if (filterEspecialidad === 'Personal Social') matchesEsp = esp.includes('social') || esp.includes('personal') || esp.includes('historia');
          else if (filterEspecialidad === 'Educ. Física') matchesEsp = esp.includes('física') || esp.includes('deporte') || esp.includes('educación física');
          else if (filterEspecialidad === 'Arte y Cultura') matchesEsp = esp.includes('arte') || esp.includes('música') || esp.includes('cultura');
          else matchesEsp = t.especialidad === filterEspecialidad;
        }

        return matchesSearch && matchesPill && matchesEsp;
      })
      .sort((a, b) => {
        if (sortBy === 'nombre_asc') {
          return `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`);
        }
        if (sortBy === 'nombre_desc') {
          return `${b.apellidos} ${b.nombres}`.localeCompare(`${a.apellidos} ${a.nombres}`);
        }
        const hoursA = sectionCourses.filter(sc => sc.docente_id === a.id).reduce((acc, c) => acc + (c.horas_semanales || 0), 0);
        const hoursB = sectionCourses.filter(sc => sc.docente_id === b.id).reduce((acc, c) => acc + (c.horas_semanales || 0), 0);
        if (sortBy === 'horas_desc') return hoursB - hoursA;
        if (sortBy === 'horas_asc') return hoursA - hoursB;
        return 0;
      });
  }, [teachers, sectionCourses, searchTerm, filterPill, filterEspecialidad, sortBy]);

  // Paginated Teachers
  const totalPages = Math.ceil(processedTeachers.length / pageSize) || 1;
  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedTeachers.slice(start, start + pageSize);
  }, [processedTeachers, currentPage, pageSize]);

  // Filtered assignments for Tab 2
  const filteredAssignments = useMemo(() => {
    return sectionCourses.filter((sca) => {
      const sec = sections.find(s => s.id === sca.seccion_id);
      const crs = courses.find(c => c.id === sca.curso_id);
      const doc = teachers.find(t => t.id === sca.docente_id);

      const matchesNivel = filterNivel === 'todos' || sec?.grado?.nivel === filterNivel;
      const matchesSearch = 
        `${doc?.nombres} ${doc?.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crs?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sec?.grado?.nombre.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesNivel && matchesSearch;
    });
  }, [sectionCourses, sections, courses, teachers, filterNivel, searchTerm]);

  const handleRegisterTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherData.nombres || !newTeacherData.apellidos || !newTeacherData.dni) return;

    const res = addTeacher({
      nombres: newTeacherData.nombres,
      apellidos: newTeacherData.apellidos,
      dni: newTeacherData.dni,
      telefono: newTeacherData.telefono,
      email: newTeacherData.email,
      especialidad: newTeacherData.especialidad,
      avatar_url: newTeacherData.avatar_url,
    });

    setCreatedCredentials({
      teacherName: `${res.teacher.nombres} ${res.teacher.apellidos}`,
      username: res.credentials.username,
      password: res.credentials.password,
      email: res.credentials.email,
    });

    setNewTeacherData({
      nombres: '',
      apellidos: '',
      dni: '',
      telefono: '',
      email: '',
      especialidad: 'Matemática',
      avatar_url: '',
    });
    setIsNewTeacherModalOpen(false);
  };

  const handleOpenEdit = (teacher: UserProfile) => {
    setEditingTeacher(teacher);
    setEditFormData({
      nombres: teacher.nombres,
      apellidos: teacher.apellidos,
      dni: teacher.dni,
      telefono: teacher.telefono || '',
      email: teacher.email || '',
      especialidad: teacher.especialidad || 'Matemática',
      avatar_url: teacher.avatar_url || '',
      activo: teacher.activo !== false,
    });
    setOpenMenuId(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    updateTeacher(editingTeacher.id, editFormData);
    setEditingTeacher(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingTeacher) return;
    deleteTeacher(deletingTeacher.id);
    setDeletingTeacher(null);
    setOpenMenuId(null);
  };

  const handleAssignCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedSectionId || !selectedCourseId) return;

    assignCourseToSection({
      seccionId: selectedSectionId,
      cursoId: selectedCourseId,
      docenteId: selectedTeacherId,
      horasSemanales: Number(horasSemanales),
      aulaDefecto,
    });

    setAssignSuccess(true);
    setTimeout(() => {
      setAssignSuccess(false);
      setIsAssignModalOpen(false);
    }, 1200);
  };

  const openAssignForTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    if (sections.length > 0) setSelectedSectionId(sections[0]?.id || '');
    if (courses.length > 0) setSelectedCourseId(courses[0]?.id || '');
    setIsAssignModalOpen(true);
    setOpenMenuId(null);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Apellidos y Nombres', 'DNI', 'Telefono', 'Email', 'Especialidad', 'Horas Semanales', 'Estado'];
    const rows = processedTeachers.map(t => {
      const asigs = sectionCourses.filter(sc => sc.docente_id === t.id);
      const hours = asigs.reduce((acc, c) => acc + (c.horas_semanales || 0), 0);
      return [
        t.id,
        `"${t.apellidos}, ${t.nombres}"`,
        t.dni,
        t.telefono || '',
        t.email || `${t.nombres.toLowerCase()[0]}${t.apellidos.toLowerCase().split(' ')[0]}@colegio.edu.pe`,
        t.especialidad || '',
        hours,
        t.activo !== false ? 'Activo' : 'Inactivo'
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `plana_docente_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 animate-fade-in pb-10">
      
      {/* ── 1. TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        
        {/* Title & Icon */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100/90 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Docentes
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">
              Gestiona y asigna profesores a las clases de tu institución.
            </p>
          </div>
        </div>

        {/* Right Action: + Nuevo Docente */}
        <button
          onClick={() => setIsNewTeacherModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Docente</span>
        </button>
      </div>

      {/* ── 2. SEARCH & SPECIALTY FILTER TOOLBAR ── */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2.5 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar docente por nombre, apellidos, DNI o email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Specialty Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 xl:pb-0 scrollbar-none flex-wrap">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-0.5 shrink-0">
            <Filter className="w-3 h-3 text-blue-600" />
            <span>Filtro:</span>
          </div>

          {specialtyOptions.map((opt) => {
            const isActive = filterEspecialidad === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setFilterEspecialidad(opt.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>{opt.label}</span>
                {opt.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* ── 3. RESULTS BAR: COUNT + SORT + VIEW SWITCHER + EXPORT ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 py-0.5">
        
        {/* Left: Result Counter */}
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="font-black text-slate-800 dark:text-white">{processedTeachers.length}</span> resultados
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Ordenar por:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="nombre_asc">Nombre A - Z</option>
              <option value="nombre_desc">Nombre Z - A</option>
              <option value="horas_desc">Mayor carga horaria</option>
              <option value="horas_asc">Menor carga horaria</option>
            </select>
          </div>

          {/* View Mode Toggle: List (≡) vs Grid (☵) */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 gap-0.5">
            <button
              onClick={() => {
                setViewMode('list');
                setPageSize(10);
                setCurrentPage(1);
              }}
              className={`p-1 rounded-md text-xs transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Modo Lista"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setViewMode('grid');
                setPageSize(6);
                setCurrentPage(1);
              }}
              className={`p-1 rounded-md text-xs transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Modo Cuadrícula"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs cursor-pointer"
            title="Exportar a CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Exportar</span>
          </button>

        </div>

      </div>

      {/* ── 4. VIEW CONTENT (LIST MODE OR GRID MODE) ── */}
      {paginatedTeachers.length > 0 ? (
        viewMode === 'list' ? (
          /* ── MODO LISTA COMPACTO (Sin espacios muertos) ── */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3.5">DOCENTE</th>
                    <th className="py-2.5 px-3">CONTACTO</th>
                    <th className="py-2.5 px-3">CARGA SEMANAL</th>
                    <th className="py-2.5 px-3">SALONES ASIGNADOS</th>
                    <th className="py-2.5 px-3">ESPECIALIDADES</th>
                    <th className="py-2.5 px-3">ESTADO</th>
                    <th className="py-2.5 px-3.5 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {paginatedTeachers.map((docente) => {
                    const teacherAssignments = sectionCourses.filter(s => s.docente_id === docente.id);
                    const teacherHours = teacherAssignments.reduce((acc, c) => acc + (c.horas_semanales || 0), 0);
                    const uniqueSections = Array.from(new Set(teacherAssignments.map(s => `${s.seccion?.grado?.nombre} "${s.seccion?.letra}"`)));
                    const specialtyBadge = getSpecialtyBadge(docente.especialidad);

                    const emailDisplay = docente.email || `${docente.nombres.toLowerCase()[0]}${docente.apellidos.toLowerCase().split(' ')[0]}@colegio.edu.pe`;
                    const phoneDisplay = docente.telefono || 'Sin teléfono';
                    const roleTitle = docente.cargo || (docente.nombres.endsWith('a') ? 'Profesora Especialista' : 'Profesor Especialista');

                    return (
                      <tr 
                        key={docente.id} 
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        {/* DOCENTE */}
                        <td className="py-2 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={docente.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(docente.nombres)}`}
                              alt={docente.nombres}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white text-xs truncate leading-tight">
                                {docente.apellidos}, {docente.nombres}
                              </div>
                              <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 truncate leading-none mt-0.5">
                                {roleTitle}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CONTACTO */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-tight">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{phoneDisplay}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] leading-tight">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{emailDisplay}</span>
                            </div>
                          </div>
                        </td>

                        {/* CARGA SEMANAL */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                            {teacherHours} hrs/sem
                          </span>
                        </td>

                        {/* SALONES ASIGNADOS */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {uniqueSections.length > 0 ? (
                              <>
                                {uniqueSections.slice(0, 2).map((sec, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                  >
                                    {sec}
                                  </span>
                                ))}
                                {uniqueSections.length > 2 && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                                    +{uniqueSections.length - 2}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Sin salones</span>
                            )}
                          </div>
                        </td>

                        {/* ESPECIALIDADES */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${specialtyBadge.style}`}>
                            {specialtyBadge.icon}
                            <span>{specialtyBadge.label}</span>
                          </span>
                        </td>

                        {/* ESTADO */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                            docente.activo !== false
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${docente.activo !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span>{docente.activo !== false ? 'Activo' : 'Inactivo'}</span>
                          </span>
                        </td>

                        {/* ACCIONES */}
                        <td className="py-2 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedTeacherForDetail(docente)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-800/60 transition-all cursor-pointer"
                            >
                              Ficha 360°
                            </button>
                            <button
                              onClick={() => openAssignForTeacher(docente.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Asignar</span>
                            </button>
                            
                            {/* 3 dots menu */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === docente.id ? null : docente.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {openMenuId === docente.id && (
                                <div className="absolute right-0 top-7 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 text-left">
                                  <button
                                    onClick={() => {
                                      setSelectedTeacherForDetail(docente);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <BookMarked className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Ver Ficha 360°</span>
                                  </button>
                                  <button
                                    onClick={() => openAssignForTeacher(docente.id)}
                                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Asignar Materia</span>
                                  </button>
                                  <Link
                                    href="/admin/horarios"
                                    onClick={() => setOpenMenuId(null)}
                                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <Calendar className="w-3.5 h-3.5 text-purple-500" />
                                    <span>Malla de Horarios</span>
                                  </Link>
                                  <button
                                    onClick={() => handleOpenEdit(docente)}
                                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Editar Información</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      toggleTeacherStatus(docente.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>{docente.activo !== false ? 'Marcar como Inactivo' : 'Activar Docente'}</span>
                                  </button>
                                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                                  <button
                                    onClick={() => {
                                      setDeletingTeacher(docente);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Eliminar Docente</span>
                                  </button>
                                </div>
                              )}
                            </div>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── MODO CUADRÍCULA (GRID VIEW) ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {paginatedTeachers.map((docente) => {
              const teacherAssignments = sectionCourses.filter(s => s.docente_id === docente.id);
              const teacherHours = teacherAssignments.reduce((acc, c) => acc + (c.horas_semanales || 0), 0);
              const uniqueSections = Array.from(new Set(teacherAssignments.map(s => `${s.seccion?.grado?.nombre} "${s.seccion?.letra}"`)));
              
              const displayedAssignments = teacherAssignments.slice(0, 2);
              const remainingCount = teacherAssignments.length - displayedAssignments.length;
              const roleTitle = docente.cargo || (docente.nombres.endsWith('a') ? 'Profesora Especialista' : 'Profesor Especialista');

              return (
                <div 
                  key={docente.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                >
                  <div>
                    {/* Top: Avatar + Name/Role + Status Badge + 3-dots */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={docente.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(docente.nombres)}`}
                          alt={docente.nombres}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-100 dark:ring-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate leading-tight">
                            {docente.nombres} {docente.apellidos}
                          </h3>
                          <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 truncate mt-0.5">
                            {roleTitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          docente.activo !== false
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${docente.activo !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{docente.activo !== false ? 'Activo' : 'Inactivo'}</span>
                        </span>

                        {/* 3 dots menu */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === docente.id ? null : docente.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Más opciones"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === docente.id && (
                            <div className="absolute right-0 top-7 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95">
                              <button
                                onClick={() => {
                                  setSelectedTeacherForDetail(docente);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                              >
                                <BookMarked className="w-3.5 h-3.5 text-blue-500" />
                                <span>Ver Ficha 360°</span>
                              </button>
                              <button
                                onClick={() => openAssignForTeacher(docente.id)}
                                className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                              >
                                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Asignar Materia</span>
                              </button>
                              <Link
                                href="/admin/horarios"
                                onClick={() => setOpenMenuId(null)}
                                className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                              >
                                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                                <span>Malla de Horarios</span>
                              </Link>
                              <button
                                onClick={() => handleOpenEdit(docente)}
                                className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                                <span>Editar Información</span>
                              </button>
                              <button
                                onClick={() => {
                                  toggleTeacherStatus(docente.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{docente.activo !== false ? 'Marcar como Inactivo' : 'Activar Docente'}</span>
                              </button>
                              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                              <button
                                onClick={() => {
                                  setDeletingTeacher(docente);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Eliminar Docente</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Stats Row (Clock + Users) */}
                    <div className="flex items-center gap-5 text-xs text-slate-700 dark:text-slate-300 font-bold mb-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{teacherHours} hrs/sem</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{uniqueSections.length} salones</span>
                      </div>
                    </div>

                    {/* Materias asignadas section */}
                    <div className="space-y-1 mb-4">
                      <span className="text-[10px] font-medium text-slate-400 block">
                        Materias asignadas
                      </span>
                      <div className="flex flex-wrap items-center gap-1 min-h-[24px]">
                        {displayedAssignments.map(asig => (
                          <span
                            key={asig.id}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCourseBadgeStyle(asig.curso?.nombre)}`}
                          >
                            {asig.curso?.nombre} ({asig.seccion?.grado?.numero_grado}° {asig.seccion?.letra})
                          </span>
                        ))}
                        {remainingCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            +{remainingCount} más
                          </span>
                        )}
                        {teacherAssignments.length === 0 && (
                          <span className="text-[11px] text-slate-400 italic">Sin materias asignadas</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: 2 Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => setSelectedTeacherForDetail(docente)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-50/60 dark:hover:bg-slate-700/60 shadow-2xs transition-all cursor-pointer"
                    >
                      <BookMarked className="w-3 h-3" />
                      <span>Ficha 360°</span>
                    </button>
                    <button
                      onClick={() => openAssignForTeacher(docente.id)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Asignar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 mx-auto flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-black text-sm text-slate-800 dark:text-white">
            {teachers.length === 0 ? 'No hay docentes registrados' : 'No se encontraron docentes'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {teachers.length === 0 
              ? 'Comienza registrando profesores haciendo clic en "+ Nuevo Docente".' 
              : 'Intenta cambiar los términos de búsqueda o los filtros seleccionados para visualizar a los profesores.'}
          </p>
          {teachers.length > 0 && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterPill('todos');
                setFilterEspecialidad('todas');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      )}

      {/* ── 5. FOOTER PAGINATION (Compacto) ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
        {/* Left count */}
        <div>
          Mostrando {processedTeachers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(processedTeachers.length, currentPage * pageSize)} de {processedTeachers.length} docentes
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Pagination Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-lg font-black text-xs transition-all flex items-center justify-center cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Página siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page size dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              <option value={6}>6 por página</option>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
            </select>
          </div>
        </div>
      </div>

      {/* TAB 2: MATRIZ DE ASIGNACIONES TABLE */}
      {activeTab === 'asignaciones' && (
        <DataTable
          data={filteredAssignments}
          itemsPerPage={10}
          searchPlaceholder="Buscar asignación por docente, curso o salón..."
          filterChips={[
            { id: 'todos', label: 'Todos los Niveles', count: sectionCourses.length },
            { id: 'primaria', label: 'Primaria (1° a 6°)' },
            { id: 'secundaria', label: 'Secundaria (1° a 5°)' },
          ]}
          activeFilter={filterNivel}
          onFilterChange={(id: string) => setFilterNivel(id as 'todos' | 'primaria' | 'secundaria')}
          searchFilter={(asig: SectionCourseAssignment, q: string) => {
            const doc = teachers.find(t => t.id === asig.docente_id);
            const crs = courses.find(c => c.id === asig.curso_id);
            const sec = sections.find(s => s.id === asig.seccion_id);
            return `${doc?.nombres} ${doc?.apellidos} ${crs?.nombre} ${sec?.grado?.nombre} ${sec?.letra}`
              .toLowerCase()
              .includes(q);
          }}
          columns={[
            {
              header: 'Salón / Grado',
              cell: (asig: SectionCourseAssignment) => {
                const sec = sections.find(s => s.id === asig.seccion_id);
                return (
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <span className={`w-2 h-2 rounded-full ${sec?.grado?.nivel === 'primaria' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                    {sec?.grado?.nombre} — Sección &quot;{sec?.letra}&quot;
                  </span>
                );
              },
            },
            {
              header: 'Materia / Curso',
              cell: (asig: SectionCourseAssignment) => {
                const crs = courses.find(c => c.id === asig.curso_id);
                return (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{
                      backgroundColor: `${crs?.color_hex || '#3b82f6'}15`,
                      color: crs?.color_hex || '#3b82f6',
                    }}
                  >
                    {crs?.nombre}
                  </span>
                );
              },
            },
            {
              header: 'Docente Responsable',
              cell: (asig: SectionCourseAssignment) => {
                const doc = teachers.find(t => t.id === asig.docente_id);
                return (
                  <div className="flex items-center gap-2">
                    <img
                      src={doc?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc?.nombres || 'Docente')}`}
                      alt={doc?.nombres}
                      className="w-7 h-7 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {doc?.nombres} {doc?.apellidos}
                      </p>
                      <p className="text-[10px] text-slate-400">{doc?.especialidad}</p>
                    </div>
                  </div>
                );
              },
            },
            {
              header: 'Horas/Sem',
              cell: (asig: SectionCourseAssignment) => (
                <span className="font-black text-slate-800 dark:text-slate-200">
                  {asig.horas_semanales} hrs
                </span>
              ),
            },
            {
              header: 'Aula Asignada',
              cell: (asig: SectionCourseAssignment) => (
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {asig.aula_defecto || 'Aula regular'}
                </span>
              ),
            },
            {
              header: 'Acciones',
              cell: (asig: SectionCourseAssignment) => (
                <button
                  onClick={() => removeSectionCourse(asig.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  title="Eliminar asignación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ),
            },
          ]}
        />
      )}

      {/* MODAL 1: REGISTRAR NUEVO DOCENTE */}
      {isNewTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Registrar Nuevo Profesor
                  </h3>
                  <p className="text-xs text-slate-500">Se generará automáticamente su usuario institucional y contraseña</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewTeacherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterTeacher} className="p-6 space-y-4">
              {/* Foto de Perfil con Cloudinary */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                <AvatarUploader
                  currentAvatarUrl={newTeacherData.avatar_url}
                  userName={`${newTeacherData.nombres || 'Docente'} ${newTeacherData.apellidos || ''}`.trim()}
                  onAvatarUpdated={(url) => setNewTeacherData((prev) => ({ ...prev, avatar_url: url }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    Nombres *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Carlos"
                      value={newTeacherData.nombres}
                      onChange={(e) => setNewTeacherData({ ...newTeacherData, nombres: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    Apellidos *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Quispe Flores"
                      value={newTeacherData.apellidos}
                      onChange={(e) => setNewTeacherData({ ...newTeacherData, apellidos: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-500" />
                    DNI (8 dígitos) *
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      maxLength={8}
                      placeholder="Ej. 45678912"
                      value={newTeacherData.dni}
                      onChange={(e) => setNewTeacherData({ ...newTeacherData, dni: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                    Teléfono Celular
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="Ej. 987654321"
                      value={newTeacherData.telefono}
                      onChange={(e) => setNewTeacherData({ ...newTeacherData, telefono: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-500" />
                    Especialidad / Área Principal *
                  </label>
                  <SearchableSelect
                    value={newTeacherData.especialidad}
                    onChange={(val) => setNewTeacherData({ ...newTeacherData, especialidad: val })}
                    icon={<Award className="w-4 h-4" />}
                    allowCustomOption={true}
                    customOptionLabel="Usar especialidad personalizada"
                    options={[
                      { value: 'Matemática', label: 'Matemática', sublabel: 'Aritmética, Álgebra, Geometría' },
                      { value: 'Comunicación', label: 'Comunicación', sublabel: 'Lenguaje y Literatura' },
                      { value: 'Ciencia y Tecnología', label: 'Ciencia y Tecnología', sublabel: 'Biología, Física, Química' },
                      { value: 'Inglés', label: 'Inglés', sublabel: 'Lengua Extranjera' },
                      { value: 'Personal Social', label: 'Personal Social', sublabel: 'Ciencias Sociales e Historia' },
                      { value: 'Educación Física', label: 'Educación Física', sublabel: 'Deportes y Psicomotricidad' },
                      { value: 'Arte y Cultura', label: 'Arte y Cultura', sublabel: 'Artes Visuales y Música' },
                      { value: 'Computación y Robótica', label: 'Computación y Robótica', sublabel: 'TIC y Tecnología' },
                      { value: 'Educación Religiosa', label: 'Educación Religiosa', sublabel: 'Valores y Fe' },
                    ]}
                    placeholder="Buscar o escribir especialidad..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    Correo Electrónico (Opcional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="nombre.apellido@colegio.edu.pe"
                      value={newTeacherData.email}
                      onChange={(e) => setNewTeacherData({ ...newTeacherData, email: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewTeacherModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all active:scale-95"
                >
                  Guardar y Emitir Credenciales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASIGNAR CURSO Y SALÓN A DOCENTE */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Asignar Materia y Salón a Profesor
                  </h3>
                  <p className="text-xs text-slate-500">Vincula al docente con la sección y define sus horas pedagógicas</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignCourse} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Docente */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                    Profesor Responsable *
                  </label>
                  <SearchableSelect
                    value={selectedTeacherId}
                    onChange={(val) => setSelectedTeacherId(val)}
                    icon={<UserCheck className="w-4 h-4" />}
                    options={teachers.map((t) => ({
                      value: t.id,
                      label: `${t.nombres} ${t.apellidos}`,
                      sublabel: t.especialidad || 'Docente',
                    }))}
                    placeholder="Buscar profesor..."
                  />
                </div>

                {/* Salón / Sección */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-purple-500" />
                    Salón / Sección *
                  </label>
                  <SearchableSelect
                    value={selectedSectionId}
                    onChange={(val) => setSelectedSectionId(val)}
                    icon={<School className="w-4 h-4" />}
                    options={sections.map((s) => {
                      const lvl = s.grado?.nivel === 'inicial' ? 'Inicial' : s.grado?.nivel === 'primaria' ? 'Primaria' : 'Secundaria';
                      return {
                        value: s.id,
                        label: `${s.grado?.nombre} "${s.letra}"`,
                        sublabel: `Nivel ${lvl} (Cap. ${s.capacidad_maxima})`,
                      };
                    })}
                    placeholder="Buscar salón..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Curso / Materia */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                      Área Curricular / Materia *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickCourseModalOpen(true)}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nuevo Curso</span>
                    </button>
                  </div>
                  <SearchableSelect
                    value={selectedCourseId}
                    onChange={(val) => setSelectedCourseId(val)}
                    icon={<BookOpen className="w-4 h-4" />}
                    options={courses.map((c) => ({
                      value: c.id,
                      label: c.nombre,
                      sublabel: `Código: ${c.codigo} • Nivel: ${c.nivel}`,
                    }))}
                    placeholder="Buscar materia..."
                  />
                </div>

                {/* Horas Semanales */}
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
                      max={12}
                      required
                      value={horasSemanales}
                      onChange={(e) => setHorasSemanales(Number(e.target.value))}
                      className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-500" />
                    Aula por Defecto
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={aulaDefecto}
                      onChange={(e) => setAulaDefecto(e.target.value)}
                      placeholder="Ej. Aula 301 / Lab 1"
                      className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {assignSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ¡Materia asignada correctamente al salón!
                </div>
              )}

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

      {/* MODAL 4: FICHA 360° DEL DOCENTE (POP-UP EXPEDIENTE) */}
      {selectedTeacherForDetail && (() => {
        const teacherAssignments = sectionCourses.filter(s => s.docente_id === selectedTeacherForDetail.id);
        const teacherHours = teacherAssignments.reduce((acc, c) => acc + (c.horas_semanales || 0), 0);
        const uniqueSections = Array.from(new Set(teacherAssignments.map(s => s.seccion?.grado?.nombre + ' ' + s.seccion?.letra)));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
              
              {/* Header Modal */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      Expediente Digital del Docente
                    </h3>
                    <p className="text-xs text-slate-500">Ficha curricular 360°, carga horaria y salones asignados</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeacherForDetail(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Teacher Profile Card */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                  <img
                    src={selectedTeacherForDetail.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedTeacherForDetail.nombres)}`}
                    alt={selectedTeacherForDetail.nombres}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md"
                  />
                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {selectedTeacherForDetail.nombres} {selectedTeacherForDetail.apellidos}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                        Docente Activo
                      </span>
                    </div>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Especialidad: {selectedTeacherForDetail.especialidad || 'Educación General'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 font-medium">
                      <span className="font-mono"><strong>DNI:</strong> {selectedTeacherForDetail.dni}</span>
                      <span><strong>Email:</strong> {selectedTeacherForDetail.email}</span>
                      {selectedTeacherForDetail.telefono && (
                        <span><strong>Tel:</strong> {selectedTeacherForDetail.telefono}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
                    <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">Carga Total</span>
                    <span className="text-lg font-black text-indigo-900 dark:text-indigo-200">{teacherHours} hrs/sem</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900">
                    <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">Salones</span>
                    <span className="text-lg font-black text-purple-900 dark:text-purple-200">{uniqueSections.length} aulas</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">Asignaturas</span>
                    <span className="text-lg font-black text-emerald-900 dark:text-emerald-200">{teacherAssignments.length} cursos</span>
                  </div>
                </div>

                {/* Assigned Courses Detailed List */}
                <div className="space-y-2.5">
                  <h5 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Materias y Salones a su Cargo ({teacherAssignments.length})
                  </h5>

                  {teacherAssignments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {teacherAssignments.map((asig) => (
                        <div
                          key={asig.id}
                          className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ backgroundColor: asig.curso?.color_hex || '#6366f1' }}
                            >
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                                {asig.curso?.nombre}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {asig.seccion?.grado?.nombre} &quot;{asig.seccion?.letra}&quot; ({asig.aula_defecto || 'Aula 301'})
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                            {asig.horas_semanales} hrs
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                      Este profesor aún no tiene asignaturas ni salones asignados.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Modal */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeacherForDetail(null)}
                  className="px-4 py-2 font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cerrar
                </button>
                <div className="flex items-center gap-2">
                  <Link
                    href="/admin/horarios"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Ver Horario Completo
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      const tId = selectedTeacherForDetail.id;
                      setSelectedTeacherForDetail(null);
                      openAssignForTeacher(tId);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Asignar Salón/Materia
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ── MODAL: REGISTRO RÁPIDO DE CURSO ── */}
      <CourseFormModal
        isOpen={isQuickCourseModalOpen}
        onClose={() => setIsQuickCourseModalOpen(false)}
        onSuccess={(newCourse) => {
          setSelectedCourseId(newCourse.id);
        }}
      />
    </div>
  );
}
