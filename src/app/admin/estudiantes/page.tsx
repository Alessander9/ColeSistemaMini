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
  const [activeTab, setActiveTab] = useState<'todas' | 'inicial' | 'primaria' | 'secundaria' | 'activas'>('todas');
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
    seccionId: 'sec-ini3-a',
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

  // Calculate Counters for Tabs
  const tabCounts = useMemo(() => {
    let todas = students.length;
    let inicial = 0;
    let primaria = 0;
    let secundaria = 0;
    let activas = 0;

    students.forEach((s) => {
      const enr = enrollments.find((e) => e.estudiante_id === s.id);
      const nivel = enr?.seccion?.grado?.nivel || 'inicial';
      if (nivel === 'inicial') inicial++;
      else if (nivel === 'primaria') primaria++;
      else if (nivel === 'secundaria') secundaria++;

      const isActivo = enr ? enr.estado === 'activo' : s.profile?.activo ?? true;
      if (isActivo) activas++;
    });

    return { todas, inicial, primaria, secundaria, activas };
  }, [students, enrollments]);

  // Filtered & Sorted Student List
  const filteredStudents = useMemo(() => {
    let list = [...students];

    // Filter by Tab
    if (activeTab === 'inicial') {
      list = list.filter((s) => {
        const enr = enrollments.find((e) => e.estudiante_id === s.id);
        return enr?.seccion?.grado?.nivel === 'inicial';
      });
    } else if (activeTab === 'primaria') {
      list = list.filter((s) => {
        const enr = enrollments.find((e) => e.estudiante_id === s.id);
        return enr?.seccion?.grado?.nivel === 'primaria';
      });
    } else if (activeTab === 'secundaria') {
      list = list.filter((s) => {
        const enr = enrollments.find((e) => e.estudiante_id === s.id);
        return enr?.seccion?.grado?.nivel === 'secundaria';
      });
    } else if (activeTab === 'activas') {
      list = list.filter((s) => {
        const enr = enrollments.find((e) => e.estudiante_id === s.id);
        return enr ? enr.estado === 'activo' : s.profile?.activo ?? true;
      });
    }

    // Filter by Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((s) => {
        const fullName = `${s.profile?.apellidos} ${s.profile?.nombres}`.toLowerCase();
        const dni = s.profile?.dni || '';
        const code = s.codigo_estudiante.toLowerCase();
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
        return enr?.seccion_id === filterSection;
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
  }, [students, enrollments, activeTab, searchTerm, filterGrade, filterSection, sortField, sortAsc]);

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

  // Create Student Handler
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombres || !formData.apellidos || !formData.dni) return;

    const result = addStudent(formData);
    setIsAddModalOpen(false);
    setSelectedStudentForQr(result.student);
    setFormData({
      nombres: '',
      apellidos: '',
      dni: '',
      fechaNacimiento: '2016-05-15',
      seccionId: 'sec-ini3-a',
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
    const cleanFirst = (formData.nombres.trim().split(' ')[0] || 'Est').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanLast = (formData.apellidos.trim().split(' ')[0] || 'Cole').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const dniPart = formData.dni.trim().slice(-4) || '2026';
    const gen = `Est${cleanFirst[0].toUpperCase()}${cleanLast.slice(0, 3)}${dniPart}!`;
    setFormData(prev => ({ ...prev, password: gen }));
    showToast('Contraseña de estudiante sugerida generada.', 'info', 'Contraseña');
  };

  // Open Edit Modal
  const handleOpenEdit = (student: Student) => {
    const enr = enrollments.find((e) => e.estudiante_id === student.id);
    setEditingStudent(student);
    setEditFormData({
      nombres: student.profile?.nombres || '',
      apellidos: student.profile?.apellidos || '',
      dni: student.profile?.dni || '',
      fechaNacimiento: student.fecha_nacimiento || '2016-05-15',
      seccionId: enr?.seccion_id || 'sec-ini3-a',
      nombreApoderado: student.nombre_apoderado || '',
      telefonoApoderado: student.telefono_apoderado || '',
      avatar_url: student.profile?.avatar_url || '',
      genero: student.genero || 'Masculino',
    });
  };

  // Submit Edit Handler
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
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
    <div className="space-y-3.5 w-full mx-auto animate-in fade-in duration-300 pb-8 font-sans">
      
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-0.5">
        {/* Left: Icon, Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Estudiantes
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Gestiona las matriculas, niveles, secciones y estados de tus estudiantes.
            </p>
          </div>
        </div>

        {/* Right: Search Input, Filtros Button, + Nuevo Estudiante */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64 md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar estudiante, DNI o apoderado..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filtros Button */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs ${
              filterGrade !== 'todos' || filterSection !== 'todos'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Filtros</span>
            {(filterGrade !== 'todos' || filterSection !== 'todos') && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            )}
          </button>

            <button
              type="button"
              onClick={() => setIsMassPromotionOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>🎓 Promoción Masiva</span>
            </button>

            {/* + Nuevo Estudiante Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Estudiante</span>
            </button>
          </div>
        </div>

      {/* ── FILTER TABS / PILLS ROW ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none">
        {/* Todas las Matrículas */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('todas');
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
            activeTab === 'todas'
              ? 'bg-blue-600 text-white shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Luggage className="w-3.5 h-3.5" />
          <span>Todas las Matrículas</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'todas'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {tabCounts.todas}
          </span>
        </button>

        {/* Inicial */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('inicial');
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
            activeTab === 'inicial'
              ? 'bg-blue-600 text-white shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="text-xs">🧒</span>
          <span>Inicial</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'inicial'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {tabCounts.inicial}
          </span>
        </button>

        {/* Primaria */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('primaria');
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
            activeTab === 'primaria'
              ? 'bg-blue-600 text-white shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
          <span>Primaria</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'primaria'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {tabCounts.primaria}
          </span>
        </button>

        {/* Secundaria */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('secundaria');
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
            activeTab === 'secundaria'
              ? 'bg-blue-600 text-white shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
          <span>Secundaria</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'secundaria'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {tabCounts.secundaria}
          </span>
        </button>

        {/* Activas */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('activas');
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
            activeTab === 'activas'
              ? 'bg-blue-600 text-white shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Activas</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'activas'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {tabCounts.activas}
          </span>
        </button>
      </div>

      {/* ── MAIN TABLE CONTAINER ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* TABLE */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            {/* Headers */}
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                {/* Select All Checkbox */}
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer bg-white dark:bg-slate-800"
                  />
                </th>
                
                {/* ESTUDIANTE */}
                <th
                  onClick={() => handleToggleSort('nombre')}
                  className="py-2.5 px-3 sm:px-4 whitespace-nowrap cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors min-w-[240px]"
                >
                  <div className="flex items-center gap-1">
                    <span>ESTUDIANTE</span>
                    {sortField === 'nombre' && <ArrowUpDown className="w-3 h-3 text-blue-500" />}
                  </div>
                </th>

                {/* NIVEL / GRADO */}
                <th className="py-2.5 px-3 sm:px-4 whitespace-nowrap min-w-[120px]">NIVEL / GRADO</th>

                {/* SECCIÓN */}
                <th className="py-2.5 px-3 sm:px-4 whitespace-nowrap min-w-[110px]">SECCIÓN</th>

                {/* APODERADO / CONTACTO */}
                <th className="py-2.5 px-3 sm:px-4 whitespace-nowrap min-w-[170px]">APODERADO / CONTACTO</th>

                {/* FECHA MATRÍCULA */}
                <th
                  onClick={() => handleToggleSort('fecha')}
                  className="py-2.5 px-3 sm:px-4 whitespace-nowrap cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors min-w-[130px]"
                >
                  <div className="flex items-center gap-1">
                    <span>FECHA MATRÍCULA</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* ESTADO */}
                <th
                  onClick={() => handleToggleSort('estado')}
                  className="py-2.5 px-3 sm:px-4 whitespace-nowrap cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors min-w-[90px]"
                >
                  <div className="flex items-center gap-1">
                    <span>ESTADO</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* ACCIONES */}
                <th className="py-2.5 px-3 sm:px-4 text-center whitespace-nowrap min-w-[150px]">ACCIONES</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {pagedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                        {students.length === 0 ? 'No hay estudiantes registrados' : 'No se encontraron estudiantes'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {students.length === 0 
                          ? 'Comienza matriculando alumnos usando el botón "+ Nuevo Estudiante".' 
                          : 'Prueba ajustando los términos de búsqueda o filtros.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedStudents.map((student) => {
                  const enr = enrollments.find((e) => e.estudiante_id === student.id);
                  const isSelected = selectedIds.includes(student.id);

                  // Extract Names
                  const fullName = `${student.profile?.apellidos || ''}, ${student.profile?.nombres || ''}`;
                  const avatarUrl =
                    student.profile?.avatar_url ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                  const dni = student.profile?.dni || 'Sin DNI';
                  const codigo = student.codigo_estudiante;

                  // Grade & Level
                  const nivel = enr?.seccion?.grado?.nivel || 'inicial';
                  const gradoNombre =
                    enr?.seccion?.grado?.nombre ||
                    (nivel === 'inicial' ? '3 Años' : nivel === 'primaria' ? '3° de Primaria' : '1° de Secundaria');
                  
                  // Section
                  const letraSeccion = enr?.seccion?.letra || 'A';
                  const capacidad = enr?.seccion?.capacidad_maxima || 20;

                  // Guardian
                  const apoderadoName = student.nombre_apoderado || 'Sin apoderado';
                  const apoderadoPhone = student.telefono_apoderado || '-';

                  // Matricula Date & Status
                  const fechaMatricula = enr?.fecha_matricula || '2026-02-10';
                  const isActivo = enr ? enr.estado === 'activo' : student.profile?.activo ?? true;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group ${
                        isSelected ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(student.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer bg-white dark:bg-slate-800"
                        />
                      </td>

                      {/* ESTUDIANTE: Avatar + Full Name + Code + DNI */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={avatarUrl}
                            alt={fullName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 dark:text-white text-xs leading-tight truncate">
                              {fullName}
                            </p>
                            <p className="text-[10px] font-mono font-medium text-slate-400 mt-0.5 truncate">
                              {codigo} <span className="mx-0.5 text-slate-300 dark:text-slate-600">|</span> DNI {dni}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* NIVEL / GRADO: Level Badge + Grade Name */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <div>
                          {nivel === 'inicial' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[11px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60">
                              <span className="text-[9px]">🧒</span>
                              Inicial
                            </span>
                          )}
                          {nivel === 'primaria' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60">
                              <BookOpen className="w-2.5 h-2.5" />
                              Primaria
                            </span>
                          )}
                          {nivel === 'secundaria' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/60">
                              <GraduationCap className="w-2.5 h-2.5" />
                              Secundaria
                            </span>
                          )}
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">
                            {gradoNombre}
                          </p>
                        </div>
                      </td>

                      {/* SECCIÓN: Pill + Vacancies */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <div>
                          <span className="inline-block px-2 py-0.2 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60">
                            Aula {letraSeccion}
                          </span>
                          <p className="text-[10px] font-medium text-blue-500 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                            <span className="text-[10px]">👥</span>
                            <span>{capacidad} vacantes</span>
                          </p>
                        </div>
                      </td>

                      {/* APODERADO / CONTACTO: Name + Phone */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate">
                            {apoderadoName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{apoderadoPhone}</span>
                          </p>
                        </div>
                      </td>

                      {/* FECHA MATRÍCULA: Calendar icon + Date */}
                      <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          <span className="font-mono">{fechaMatricula}</span>
                        </div>
                      </td>

                      {/* ESTADO: Rounded Pill with Dot */}
                      <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                        {isActivo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* ACCIONES: 5 Rounded Action Buttons */}
                      <td className="py-2.5 px-3 sm:px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* 1. Eye (Perfil 360°) */}
                          <Link
                            href={`/admin/estudiantes/${student.id}`}
                            title="Ver perfil 360°"
                            className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3 h-3" />
                          </Link>

                          {/* 2. QR Carnet */}
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForQr(student)}
                            title="Ver Carnet QR"
                            className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all cursor-pointer shadow-2xs"
                          >
                            <QrCode className="w-3 h-3" />
                          </button>

                          {/* 3. Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(student)}
                            title="Editar estudiante"
                            className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer shadow-2xs"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>

                          {/* 4. Ban / Toggle Active */}
                          <button
                            type="button"
                            onClick={() => toggleStudentStatus(student.id)}
                            title={isActivo ? 'Desactivar estudiante' : 'Activar estudiante'}
                            className={`p-1 rounded-md border transition-all cursor-pointer shadow-2xs ${
                              isActivo
                                ? 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/40'
                                : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            <Ban className="w-3 h-3" />
                          </button>

                          {/* 5. Trash / Delete */}
                          <button
                            type="button"
                            onClick={() => setDeletingStudent(student)}
                            title="Eliminar estudiante"
                            className="p-1 rounded-md border border-red-200 dark:border-red-900/60 text-red-500 hover:text-red-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer shadow-2xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION FOOTER ── */}
        <div className="px-3.5 py-2.5 sm:px-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          {/* Left: Mostrando X de Y estudiantes */}
          <div className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
            Mostrando <span className="font-bold text-slate-800 dark:text-slate-200">{filteredStudents.length === 0 ? 0 : pagedStudents.length}</span> de{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{filteredStudents.length}</span> estudiantes
          </div>

          {/* Right: Pagination Controls + Page Size Dropdown */}
          <div className="flex items-center gap-2.5">
            {/* Prev & Next Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isCurrent = page === validCurrentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-6 h-6 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-2xs shadow-blue-600/30'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={validCurrentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                aria-label="Página siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Items Per Page Select */}
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none pl-2.5 pr-7 py-0.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                <option value={5}>5 por pág.</option>
                <option value={10}>10 por pág.</option>
                <option value={20}>20 por pág.</option>
                <option value={50}>50 por pág.</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

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
        title="Registrar Nuevo Estudiante"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Nombres *
              </label>
              <input
                required
                type="text"
                placeholder="Ej. Héctor Raúl"
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Apellidos *
              </label>
              <input
                required
                type="text"
                placeholder="Ej. Salazar Portero"
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-500" />
                DNI del Alumno *
              </label>
              <input
                required
                type="text"
                maxLength={8}
                placeholder="8 dígitos"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-blue-500" />
                Sección de Matrícula *
              </label>
              <SearchableSelect
                value={formData.seccionId}
                onChange={(val) => setFormData({ ...formData, seccionId: val })}
                icon={<School className="w-4 h-4" />}
                options={[
                  { value: 'sec-ini3-a', label: '3 Años "A"', sublabel: 'Nivel Inicial' },
                  { value: 'sec-ini3-b', label: '3 Años "B"', sublabel: 'Nivel Inicial' },
                  { value: 'sec-ini5-a', label: '5 Años "A"', sublabel: 'Nivel Inicial' },
                  { value: 'sec-3pri-a', label: '3° de Primaria "A"', sublabel: 'Nivel Primaria' },
                  { value: 'sec-3pri-b', label: '3° de Primaria "B"', sublabel: 'Nivel Primaria' },
                  { value: 'sec-5pri-a', label: '5° de Primaria "A"', sublabel: 'Nivel Primaria' },
                  { value: 'sec-1sec-a', label: '1° de Secundaria "A"', sublabel: 'Nivel Secundaria' },
                  { value: 'sec-5sec-a', label: '5° de Secundaria "A"', sublabel: 'Nivel Secundaria' },
                ]}
                placeholder="Seleccionar aula..."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                Nombre del Apoderado
              </label>
              <input
                type="text"
                placeholder="Ej. Jorge Silva Rodríguez"
                value={formData.nombreApoderado}
                onChange={(e) => setFormData({ ...formData, nombreApoderado: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                Teléfono de Contacto
              </label>
              <input
                type="text"
                placeholder="Ej. 955443322"
                value={formData.telefonoApoderado}
                onChange={(e) => setFormData({ ...formData, telefonoApoderado: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
              />
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Guardar y Generar QR
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  Nombres *
                </label>
                <input
                  required
                  type="text"
                  value={editFormData.nombres}
                  onChange={(e) => setEditFormData({ ...editFormData, nombres: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  Apellidos *
                </label>
                <input
                  required
                  type="text"
                  value={editFormData.apellidos}
                  onChange={(e) => setEditFormData({ ...editFormData, apellidos: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-blue-500" />
                  DNI *
                </label>
                <input
                  required
                  type="text"
                  maxLength={8}
                  value={editFormData.dni}
                  onChange={(e) => setEditFormData({ ...editFormData, dni: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-blue-500" />
                  Sección *
                </label>
                <SearchableSelect
                  value={editFormData.seccionId}
                  onChange={(val) => setEditFormData({ ...editFormData, seccionId: val })}
                  icon={<School className="w-4 h-4" />}
                  options={[
                    { value: 'sec-ini3-a', label: '3 Años "A"', sublabel: 'Nivel Inicial' },
                    { value: 'sec-ini3-b', label: '3 Años "B"', sublabel: 'Nivel Inicial' },
                    { value: 'sec-ini5-a', label: '5 Años "A"', sublabel: 'Nivel Inicial' },
                    { value: 'sec-3pri-a', label: '3° de Primaria "A"', sublabel: 'Nivel Primaria' },
                    { value: 'sec-3pri-b', label: '3° de Primaria "B"', sublabel: 'Nivel Primaria' },
                    { value: 'sec-5pri-a', label: '5° de Primaria "A"', sublabel: 'Nivel Primaria' },
                    { value: 'sec-1sec-a', label: '1° de Secundaria "A"', sublabel: 'Nivel Secundaria' },
                    { value: 'sec-5sec-a', label: '5° de Secundaria "A"', sublabel: 'Nivel Secundaria' },
                  ]}
                  placeholder="Seleccionar aula..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                  Apoderado
                </label>
                <input
                  type="text"
                  value={editFormData.nombreApoderado}
                  onChange={(e) => setEditFormData({ ...editFormData, nombreApoderado: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  Teléfono
                </label>
                <input
                  type="text"
                  value={editFormData.telefonoApoderado}
                  onChange={(e) => setEditFormData({ ...editFormData, telefonoApoderado: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                />
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
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
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
          title="Confirmar Eliminación"
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
