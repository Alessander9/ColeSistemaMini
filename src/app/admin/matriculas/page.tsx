'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { GradeLevel, Section, Enrollment, Student } from '@/types';
import {
  UserPlus,
  UserCheck,
  Search,
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Mail,
  User,
  ChevronDown,
  Calendar,
  Phone,
  BadgeCheck,
  AlertCircle,
  Printer,
  Shield,
  Layers,
  BookOpen,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CredentialsModal {
  open: boolean;
  student: Student | null;
  credentials: { username: string; password: string; email: string } | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminMatriculasPage() {
  const { enrollments, addStudent, sections, gradeLevels } = useApp();

  // Enrollments list state
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<'todos' | 'primaria' | 'secundaria'>('todos');

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    fechaNacimiento: '',
    genero: '',
    seccionId: '',
    gradoId: '',
    nombreApoderado: '',
    telefonoApoderado: '',
    emailApoderado: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Credentials modal
  const [credModal, setCredModal] = useState<CredentialsModal>({ open: false, student: null, credentials: null });
  const [showPass, setShowPass] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Filtered sections based on chosen grade
  const availableSections = useMemo(
    () => sections.filter(s => s.grado_id === form.gradoId),
    [sections, form.gradoId]
  );

  // Sort grades by level then number
  const sortedGrades = useMemo(() =>
    [...gradeLevels].sort((a, b) => {
      if (a.nivel !== b.nivel) return a.nivel === 'primaria' ? -1 : 1;
      return a.numero_grado - b.numero_grado;
    }),
    [gradeLevels]
  );

  // Filtered enrollments list
  const filtered = useMemo(() => {
    return enrollments.filter(e => {
      const matchSearch = `${e.estudiante?.profile?.nombres} ${e.estudiante?.profile?.apellidos} ${e.estudiante?.codigo_estudiante}`
        .toLowerCase().includes(search.toLowerCase());
      const matchLevel = filterLevel === 'todos' || e.seccion?.grado?.nivel === filterLevel;
      return matchSearch && matchLevel;
    });
  }, [enrollments, search, filterLevel]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.nombres.trim()) errors.nombres = 'Nombres requerido';
    if (!form.apellidos.trim()) errors.apellidos = 'Apellidos requerido';
    if (!form.dni.trim() || form.dni.length < 8) errors.dni = 'DNI debe tener 8 dígitos';
    if (!form.fechaNacimiento) errors.fechaNacimiento = 'Fecha de nacimiento requerida';
    if (!form.gradoId) errors.gradoId = 'Selecciona un grado';
    if (!form.seccionId) errors.seccionId = 'Selecciona una sección';
    if (!form.nombreApoderado.trim()) errors.nombreApoderado = 'Nombre del apoderado requerido';
    if (!form.telefonoApoderado.trim()) errors.telefonoApoderado = 'Teléfono del apoderado requerido';
    return errors;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = addStudent({
        nombres: form.nombres,
        apellidos: form.apellidos,
        dni: form.dni,
        fechaNacimiento: form.fechaNacimiento,
        genero: form.genero,
        seccionId: form.seccionId,
        nombreApoderado: form.nombreApoderado,
        telefonoApoderado: form.telefonoApoderado,
      });

      setIsSubmitting(false);
      setFormOpen(false);
      setForm({ nombres: '', apellidos: '', dni: '', fechaNacimiento: '', genero: '', seccionId: '', gradoId: '', nombreApoderado: '', telefonoApoderado: '', emailApoderado: '' });
      setFormErrors({});

      // Show credentials modal
      setCredModal({ open: true, student: result.student, credentials: result.credentials });
      setShowPass(false);
    }, 800);
  };

  // ── Copy to clipboard ──────────────────────────────────────────────────────
  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Print card ─────────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  const nivelColors = {
    primaria: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    secundaria: 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{msg}</p> : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Gestión de Matrículas"
        description="Registra nuevos alumnos y genera sus credenciales de acceso automáticamente al matricularlos."
        badge={`${enrollments.length} matrículas`}
        badgeColor="admin"
      >
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-black rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-500/25 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Nueva Matrícula
        </button>
      </PageHeader>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total matriculados', val: enrollments.length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Primaria', val: enrollments.filter(e => e.seccion?.grado?.nivel === 'primaria').length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/40' },
          { label: 'Secundaria', val: enrollments.filter(e => e.seccion?.grado?.nivel === 'secundaria').length, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/40' },
          { label: 'Secciones activas', val: new Set(enrollments.map(e => e.seccion_id)).size, icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
        ].map(({ label, val, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/30 flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{val}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Enrollments DataTable with Pagination, Grid View and Filters */}
      <DataTable
        data={enrollments}
        itemsPerPage={10}
        searchPlaceholder="Buscar por alumno, código o DNI..."
        filterChips={[
          { id: 'todos', label: 'Todas las Matrículas', count: enrollments.length },
          { id: 'primaria', label: 'Nivel Primaria' },
          { id: 'secundaria', label: 'Nivel Secundaria' },
        ]}
        activeFilter={filterLevel}
        onFilterChange={(id) => setFilterLevel(id as 'todos' | 'primaria' | 'secundaria')}
        searchFilter={(e, q) => {
          const matchSearch = `${e.estudiante?.profile?.nombres} ${e.estudiante?.profile?.apellidos} ${e.estudiante?.codigo_estudiante} ${e.estudiante?.profile?.dni} ${e.seccion?.grado?.nombre}`
            .toLowerCase();
          const matchLevel = filterLevel === 'todos' || e.seccion?.grado?.nivel === filterLevel;
          return matchSearch.includes(q) && matchLevel;
        }}
        columns={[
          {
            header: 'Estudiante',
            cell: (enr) => (
              <div className="flex items-center gap-3">
                <img
                  src={enr.estudiante?.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt=""
                  className="w-9 h-9 rounded-xl object-cover shrink-0"
                />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">
                    {enr.estudiante?.profile?.apellidos}, {enr.estudiante?.profile?.nombres}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {enr.estudiante?.codigo_estudiante} · DNI {enr.estudiante?.profile?.dni}
                  </p>
                </div>
              </div>
            ),
          },
          {
            header: 'Grado & Sección',
            cell: (enr) => (
              <div className="space-y-0.5">
                <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                  {enr.seccion?.grado?.nombre}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border capitalize ${nivelColors[enr.seccion?.grado?.nivel as keyof typeof nivelColors] || ''}`}>
                    {enr.seccion?.grado?.nivel}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Sección {enr.seccion?.letra}
                  </span>
                </div>
              </div>
            ),
          },
          {
            header: 'Email Institucional',
            cell: (enr) => (
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {enr.estudiante?.profile?.email || '—'}
              </span>
            ),
          },
          {
            header: 'Fecha Matrícula',
            cell: (enr) => (
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {enr.fecha_matricula}
              </span>
            ),
          },
          {
            header: 'Estado',
            cell: (enr) => (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <BadgeCheck className="w-3 h-3" />
                {enr.estado.toUpperCase()}
              </span>
            ),
          },
        ]}
        gridItemRender={(enr) => (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3.5">
                <div className="flex items-center gap-3">
                  <img
                    src={enr.estudiante?.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt=""
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500/20 group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                      {enr.estudiante?.profile?.apellidos}, {enr.estudiante?.profile?.nombres}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {enr.estudiante?.codigo_estudiante}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                  <BadgeCheck className="w-3 h-3" />
                  {enr.estado.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Grado y Salón:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {enr.seccion?.grado?.nombre} &quot;{enr.seccion?.letra}&quot;
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">DNI:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {enr.estudiante?.profile?.dni}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Email:</span>
                  <span className="font-mono text-[10px] text-slate-500 truncate max-w-[150px]">
                    {enr.estudiante?.profile?.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 mt-3">
              <span>Matriculado el:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{enr.fecha_matricula}</span>
            </div>
          </div>
        )}
      />

      {/* ════════════════ ENROLLMENT FORM MODAL ════════════════════════════════ */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFormOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/70 dark:border-slate-800/70 overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Nueva Matrícula</h2>
                    <p className="text-violet-200 text-xs">Las credenciales de acceso se generarán automáticamente</p>
                  </div>
                </div>
                <button
                  onClick={() => setFormOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Credential Preview Banner */}
              <div className="p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 flex items-start gap-3">
                <KeyRound className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-violet-700 dark:text-violet-400">Generación automática:</span>
                  {' '}La contraseña tendrá <span className="font-bold text-slate-900 dark:text-white">12 caracteres</span> basada en nombre (3) + apellido (3) + día (2) + mes (2) + edad (2).
                  <br />Ejemplo: <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-md font-bold text-violet-600 dark:text-violet-400 text-[11px] ml-1">Mat sil 14 05 10</code>
                </div>
              </div>

              {/* Student Data */}
              <div>
                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Datos del Estudiante
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombres */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Nombres *</label>
                    <input
                      type="text"
                      value={form.nombres}
                      onChange={e => { setForm(f => ({ ...f, nombres: e.target.value })); setFormErrors(f => ({ ...f, nombres: '' })); }}
                      placeholder="Ej: Mateo Alejandro"
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border ${formErrors.nombres ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                    />
                    <FieldError msg={formErrors.nombres} />
                  </div>

                  {/* Apellidos */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Apellidos *</label>
                    <input
                      type="text"
                      value={form.apellidos}
                      onChange={e => { setForm(f => ({ ...f, apellidos: e.target.value })); setFormErrors(f => ({ ...f, apellidos: '' })); }}
                      placeholder="Ej: Silva Quispe"
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border ${formErrors.apellidos ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                    />
                    <FieldError msg={formErrors.apellidos} />
                  </div>

                  {/* DNI */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">DNI *</label>
                    <input
                      type="text"
                      maxLength={8}
                      value={form.dni}
                      onChange={e => { setForm(f => ({ ...f, dni: e.target.value.replace(/\D/g, '') })); setFormErrors(f => ({ ...f, dni: '' })); }}
                      placeholder="12345678"
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono ${formErrors.dni ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                    />
                    <FieldError msg={formErrors.dni} />
                  </div>

                  {/* Fecha Nacimiento */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Fecha de Nacimiento * <span className="text-violet-500 font-normal">(usada para la contraseña)</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={form.fechaNacimiento}
                        onChange={e => { setForm(f => ({ ...f, fechaNacimiento: e.target.value })); setFormErrors(f => ({ ...f, fechaNacimiento: '' })); }}
                        className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border ${formErrors.fechaNacimiento ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                      />
                    </div>
                    <FieldError msg={formErrors.fechaNacimiento} />
                  </div>

                  {/* Género */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Género</label>
                    <select
                      value={form.genero}
                      onChange={e => setForm(f => ({ ...f, genero: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="No especificado">Prefiero no indicar</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Academic placement */}
              <div>
                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Asignación Académica
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Grado */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Grado *</label>
                    <select
                      value={form.gradoId}
                      onChange={e => setForm(f => ({ ...f, gradoId: e.target.value, seccionId: '' }))}
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border ${formErrors.gradoId ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer`}
                    >
                      <option value="">Seleccionar grado...</option>
                      <optgroup label="── Primaria ──">
                        {sortedGrades.filter(g => g.nivel === 'primaria').map(g => (
                          <option key={g.id} value={g.id}>{g.nombre}</option>
                        ))}
                      </optgroup>
                      <optgroup label="── Secundaria ──">
                        {sortedGrades.filter(g => g.nivel === 'secundaria').map(g => (
                          <option key={g.id} value={g.id}>{g.nombre}</option>
                        ))}
                      </optgroup>
                    </select>
                    <FieldError msg={formErrors.gradoId} />
                  </div>

                  {/* Sección */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Sección *
                      {availableSections.length > 0 && (
                        <span className="ml-1 font-normal text-slate-400">({availableSections.length} disponibles)</span>
                      )}
                    </label>
                    <select
                      value={form.seccionId}
                      onChange={e => { setForm(f => ({ ...f, seccionId: e.target.value })); setFormErrors(f => ({ ...f, seccionId: '' })); }}
                      disabled={!form.gradoId}
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border ${formErrors.seccionId ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <option value="">
                        {form.gradoId ? 'Seleccionar sección...' : 'Primero elige un grado'}
                      </option>
                      {availableSections.map(s => (
                        <option key={s.id} value={s.id}>
                          Sección {s.letra} — Cap. {s.capacidad_maxima} alumnos
                        </option>
                      ))}
                    </select>
                    <FieldError msg={formErrors.seccionId} />
                  </div>
                </div>
              </div>

              {/* Apoderado */}
              <div>
                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Datos del Apoderado
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Nombre completo *</label>
                    <input
                      type="text"
                      value={form.nombreApoderado}
                      onChange={e => { setForm(f => ({ ...f, nombreApoderado: e.target.value })); setFormErrors(f => ({ ...f, nombreApoderado: '' })); }}
                      placeholder="Ej: Jorge Silva Rodríguez"
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border ${formErrors.nombreApoderado ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                    />
                    <FieldError msg={formErrors.nombreApoderado} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Teléfono *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={form.telefonoApoderado}
                        onChange={e => { setForm(f => ({ ...f, telefonoApoderado: e.target.value })); setFormErrors(f => ({ ...f, telefonoApoderado: '' })); }}
                        placeholder="9XXXXXXXX"
                        className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border ${formErrors.telefonoApoderado ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                      />
                    </div>
                    <FieldError msg={formErrors.telefonoApoderado} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-black rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-500/25 transition-all active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Matriculando...</>
                  ) : (
                    <><UserPlus className="w-4 h-4" />Matricular y Generar Credenciales</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════ CREDENTIALS MODAL ════════════════════════════════════ */}
      {credModal.open && credModal.credentials && credModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/70 dark:border-slate-800/70 overflow-hidden animate-slide-up">
            
            {/* Success header */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                <BadgeCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-black text-white">¡Alumno Matriculado!</h2>
              <p className="text-emerald-100 text-sm mt-1">
                {credModal.student.profile?.nombres} {credModal.student.profile?.apellidos}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                <KeyRound className="w-3.5 h-3.5" />
                Credenciales generadas automáticamente
              </div>
            </div>

            <div className="p-6 space-y-3">
              {/* Credential rows */}
              {[
                { label: 'Usuario de acceso', value: credModal.credentials.username, field: 'username', icon: User, mono: true },
                { label: 'Contraseña inicial', value: credModal.credentials.password, field: 'password', icon: KeyRound, mono: true, isPass: true },
                { label: 'Correo institucional', value: credModal.credentials.email, field: 'email', icon: Mail, mono: false },
              ].map(({ label, value, field, icon: Icon, mono, isPass }) => (
                <div key={field} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950 dark:to-purple-950 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                      <p className={`font-black text-sm text-slate-900 dark:text-white ${mono ? 'font-mono' : ''} truncate`}>
                        {isPass && !showPass ? '••••••••••••' : value}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isPass && (
                      <button
                        onClick={() => setShowPass(!showPass)}
                        className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                      >
                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(value, field)}
                      className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {copiedField === field ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Formula explanation */}
              <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900">
                <p className="text-[11px] font-bold text-violet-600 dark:text-violet-400 mb-1.5">🔐 Cómo se generó la contraseña:</p>
                <div className="flex items-center gap-1 flex-wrap text-[10px]">
                  {credModal.student.profile?.nombres && (() => {
                    const nombre = credModal.student!.profile!.nombres!.split(' ')[0];
                    const apellido = credModal.student!.profile!.apellidos!.split(' ')[0];
                    const birth = new Date(credModal.student!.fecha_nacimiento || '2016-01-01');
                    const today = new Date();
                    const day = String(birth.getDate()).padStart(2, '0');
                    const month = String(birth.getMonth() + 1).padStart(2, '0');
                    let age = today.getFullYear() - birth.getFullYear();
                    const parts = [
                      { val: (nombre.slice(0,3).charAt(0).toUpperCase() + nombre.slice(1,3).toLowerCase()), label: 'nombre (3)' },
                      { val: apellido.slice(0,3).toLowerCase(), label: 'apellido (3)' },
                      { val: day, label: 'día (2)' },
                      { val: month, label: 'mes (2)' },
                      { val: String(age).padStart(2, '0'), label: 'edad (2)' },
                    ];
                    return parts.map((p, i) => (
                      <React.Fragment key={i}>
                        <span className="font-mono font-black bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                          {p.val}
                        </span>
                        <span className="text-slate-400">{p.label}</span>
                        {i < parts.length - 1 && <span className="text-slate-300">+</span>}
                      </React.Fragment>
                    ));
                  })()}
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  <span className="font-bold">Importante:</span> Comparte estas credenciales con el alumno y su apoderado. El alumno deberá cambiar su contraseña en el primer acceso.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir ficha
                </button>
                <button
                  onClick={() => { setCredModal({ open: false, student: null, credentials: null }); setShowPass(false); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white text-sm font-black transition-all active:scale-95 shadow-lg shadow-emerald-500/25"
                >
                  <Check className="w-4 h-4" />
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
