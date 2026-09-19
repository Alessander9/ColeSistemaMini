'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { UserRole, UserProfile } from '@/types';
import { 
  UserPlus, 
  Users, 
  ShieldCheck, 
  Search, 
  Filter, 
  Shield, 
  GraduationCap, 
  BookOpen, 
  HeartHandshake, 
  QrCode, 
  Check, 
  X, 
  Copy, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Phone, 
  KeyRound, 
  Lock, 
  Sparkles, 
  FileText,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { AvatarUploader } from '@/components/ui/AvatarUploader';

export default function GestionUsuariosPage() {
  const { 
    users, 
    addUser, 
    updateUserRole, 
    toggleUserStatus, 
    deleteUser,
    showToast 
  } = useApp();

  // Estados de búsqueda y filtrado
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [newRoleSelection, setNewRoleSelection] = useState<UserRole>('docente');

  // Modal de credenciales generadas
  const [createdCredentials, setCreatedCredentials] = useState<{
    user: UserProfile;
    credentials: { username: string; password: string; email: string };
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordCreate, setShowPasswordCreate] = useState(false);

  // Formulario de creación
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    rol: 'docente' as UserRole,
    email: '',
    username: '',
    password: '',
    telefono: '',
    especialidad: '',
    cargo: '',
    activo: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filtrado reactivo de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${user.nombres} ${user.apellidos}`.toLowerCase();
        const dni = user.dni.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const id = user.id.toLowerCase();
        if (!fullName.includes(query) && !dni.includes(query) && !email.includes(query) && !id.includes(query)) {
          return false;
        }
      }

      if (selectedRoleFilter !== 'todos' && user.rol !== selectedRoleFilter) {
        return false;
      }

      if (selectedStatusFilter === 'activos' && !user.activo) return false;
      if (selectedStatusFilter === 'inactivos' && user.activo) return false;

      return true;
    });
  }, [users, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Contadores por rol
  const adminCount = useMemo(() => users.filter(u => u.rol === 'admin').length, [users]);
  const docenteCount = useMemo(() => users.filter(u => u.rol === 'docente').length, [users]);
  const estudianteCount = useMemo(() => users.filter(u => u.rol === 'estudiante').length, [users]);
  const apoderadoCount = useMemo(() => users.filter(u => u.rol === 'apoderado').length, [users]);
  const asistenciaCount = useMemo(() => users.filter(u => u.rol === 'asistencia').length, [users]);

  // Configuración visual por Rol
  const roleConfig: Record<UserRole, { label: string; badge: string; icon: React.ReactNode; desc: string }> = {
    admin: {
      label: 'Administrador',
      badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
      icon: <Shield className="w-3.5 h-3.5 text-indigo-600" />,
      desc: 'Control total del sistema, configuración institucional, matrículas, usuarios y auditoría.'
    },
    docente: {
      label: 'Docente',
      badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
      icon: <GraduationCap className="w-3.5 h-3.5 text-purple-600" />,
      desc: 'Registro de calificaciones CNEB, pase de asistencia rápida de salón, tareas y horarios.'
    },
    estudiante: {
      label: 'Estudiante',
      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
      icon: <BookOpen className="w-3.5 h-3.5 text-blue-600" />,
      desc: 'Consulta de calificaciones bimestrales, horario escolar, entrega de tareas y carnet QR.'
    },
    apoderado: {
      label: 'Apoderado',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      icon: <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />,
      desc: 'Monitoreo del rendimiento de sus hijos, registro de asistencias y comunicados oficiales.'
    },
    asistencia: {
      label: 'Control / Portería',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
      icon: <QrCode className="w-3.5 h-3.5 text-emerald-600" />,
      desc: 'Operación del Terminal Kiosko QR en portería y registro biométrico de ingresos.'
    }
  };

  // Manejo de envío del formulario
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.nombres.trim()) errors.nombres = 'Ingresa los nombres del usuario.';
    if (!formData.apellidos.trim()) errors.apellidos = 'Ingresa los apellidos del usuario.';
    if (!formData.dni.trim()) {
      errors.dni = 'Ingresa el número de DNI o documento.';
    } else if (!/^\d{8}$/.test(formData.dni.trim())) {
      errors.dni = 'El DNI debe contener exactamente 8 dígitos numéricos.';
    }

    // Verificar DNI duplicado
    const dniExists = users.some(u => u.dni === formData.dni.trim());
    if (dniExists) {
      errors.dni = 'Ya existe un usuario registrado con este número de DNI.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const result = addUser({
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      dni: formData.dni.trim(),
      rol: formData.rol,
      email: formData.email.trim() || undefined,
      username: formData.username.trim() || undefined,
      password: formData.password.trim() || undefined,
      telefono: formData.telefono.trim() || undefined,
      especialidad: formData.especialidad.trim() || undefined,
      cargo: formData.cargo.trim() || undefined,
      activo: formData.activo,
    });

    setIsCreateModalOpen(false);
    setCreatedCredentials(result);

    // Resetear form
    setFormData({
      nombres: '',
      apellidos: '',
      dni: '',
      rol: 'docente',
      email: '',
      username: '',
      password: '',
      telefono: '',
      especialidad: '',
      cargo: '',
      activo: true,
    });
  };

  const generateAutoPassword = () => {
    const rolePrefix = formData.rol === 'admin' ? 'Adm' : formData.rol === 'docente' ? 'Doc' : formData.rol === 'estudiante' ? 'Est' : formData.rol === 'apoderado' ? 'Apo' : 'Ast';
    const cleanFirst = (formData.nombres.trim().split(' ')[0] || 'User').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanLast = (formData.apellidos.trim().split(' ')[0] || 'Cole').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const dniPart = formData.dni.trim().slice(-4) || '2026';
    const gen = `${rolePrefix}${cleanFirst[0].toUpperCase()}${cleanLast.slice(0, 3)}${dniPart}!`;
    setFormData(prev => ({ ...prev, password: gen }));
    showToast('Contraseña segura sugerida generada.', 'info', 'Contraseña');
  };

  // Copiar al portapapeles
  const handleCopy = (text: string, fieldKey: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Guardar cambio de rol
  const handleSaveRoleChange = () => {
    if (selectedUserForEdit) {
      updateUserRole(selectedUserForEdit.id, newRoleSelection);
      setIsEditRoleModalOpen(false);
      setSelectedUserForEdit(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━
          1. ENCABEZADO PRINCIPAL
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Gestión de Usuarios y Roles (RBAC)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 pl-10.5">
            Crea, administra y asigna roles y permisos a directivos, docentes, estudiantes, apoderados y personal de control.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormErrors({});
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer self-start md:self-auto shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Crear Nuevo Usuario</span>
        </button>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          2. TARJETAS RESUMEN DE ROLES
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Admin */}
        <div 
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === 'admin' ? 'todos' : 'admin')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRoleFilter === 'admin'
              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              Administradores
            </span>
            <div className="w-7 h-7 rounded-xl bg-indigo-100/70 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {adminCount}
            </span>
            <span className="text-[11px] text-slate-400">usuarios</span>
          </div>
        </div>

        {/* Docente */}
        <div 
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === 'docente' ? 'todos' : 'docente')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRoleFilter === 'docente'
              ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              Docentes
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-100/70 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {docenteCount}
            </span>
            <span className="text-[11px] text-slate-400">profesores</span>
          </div>
        </div>

        {/* Estudiante */}
        <div 
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === 'estudiante' ? 'todos' : 'estudiante')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRoleFilter === 'estudiante'
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Estudiantes
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-100/70 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {estudianteCount}
            </span>
            <span className="text-[11px] text-slate-400">alumnos</span>
          </div>
        </div>

        {/* Apoderado */}
        <div 
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === 'apoderado' ? 'todos' : 'apoderado')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRoleFilter === 'apoderado'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Apoderados
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-100/70 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <HeartHandshake className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {apoderadoCount}
            </span>
            <span className="text-[11px] text-slate-400">padres</span>
          </div>
        </div>

        {/* Portería / Control */}
        <div 
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === 'asistencia' ? 'todos' : 'asistencia')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            selectedRoleFilter === 'asistencia'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Control / QR
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100/70 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <QrCode className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {asistenciaCount}
            </span>
            <span className="text-[11px] text-slate-400">operadores</span>
          </div>
        </div>

      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          3. BARRA DE BÚSQUEDA Y FILTROS
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombres, apellidos, DNI, correo o ID..."
            className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros por Rol y Estado */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Selector Rol */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="docente">Docente</option>
            <option value="estudiante">Estudiante</option>
            <option value="apoderado">Apoderado</option>
            <option value="asistencia">Control / Portería</option>
          </select>

          {/* Selector Estado */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>

        </div>

      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          4. TABLA DE USUARIOS
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Usuario</th>
                <th className="py-3.5 px-4">DNI / Documento</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4">Rol Asignado</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Users className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        No se encontraron usuarios coincidentes
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Prueba ajustando los términos de búsqueda o los filtros de rol.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const cfg = roleConfig[user.rol] || roleConfig.docente;
                  return (
                    <tr 
                      key={user.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Avatar y Nombre */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombres)}&background=6366f1&color=fff&size=80`}
                            alt={user.nombres}
                            className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-black text-slate-900 dark:text-white truncate">
                              {user.nombres} {user.apellidos}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* DNI */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {user.dni}
                      </td>

                      {/* Contacto */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5 truncate max-w-[200px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{user.email || 'Sin correo'}</span>
                        </div>
                        {user.telefono && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{user.telefono}</span>
                          </div>
                        )}
                      </td>

                      {/* Rol */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold shadow-2xs">
                          {cfg.icon}
                          <span className={cfg.badge.split(' ')[1]}>{cfg.label}</span>
                        </div>
                        {user.especialidad && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {user.especialidad}
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(user.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            user.activo
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 hover:bg-emerald-100'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                          title="Haz clic para cambiar estado activo/inactivo"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.activo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{user.activo ? 'Activo' : 'Inactivo'}</span>
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Cambiar Rol */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForEdit(user);
                              setNewRoleSelection(user.rol);
                              setIsEditRoleModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Cambiar rol y permisos de este usuario"
                          >
                            <Shield className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="hidden sm:inline">Asignar Rol</span>
                          </button>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar al usuario ${user.nombres} ${user.apellidos}?`)) {
                                deleteUser(user.id);
                              }
                            }}
                            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs transition-colors cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          5. MODAL FORMULARIO: CREAR NUEVO USUARIO
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Usuario y Asignar Rol"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5 text-xs">
          
          {/* Paso 1: Selección visual del Rol */}
          <div className="space-y-2">
            <label className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              1. Selecciona el Rol Institucional (RBAC) <span className="text-rose-500">*</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(['admin', 'docente', 'estudiante', 'apoderado', 'asistencia'] as UserRole[]).map((r) => {
                const isSelected = formData.rol === r;
                const cfg = roleConfig[r];
                return (
                  <div
                    key={r}
                    onClick={() => setFormData(prev => ({ ...prev, rol: r }))}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                          {cfg.icon}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {cfg.label}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {cfg.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Paso 2: Datos Personales */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              2. Datos del Usuario
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Nombres */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombres <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                  placeholder="Ej. Carlos Alberto"
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white focus:outline-hidden ${
                    formErrors.nombres ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.nombres && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{formErrors.nombres}</p>
                )}
              </div>

              {/* Apellidos */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Apellidos <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                  placeholder="Ej. Mendoza Rojas"
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white focus:outline-hidden ${
                    formErrors.apellidos ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.apellidos && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{formErrors.apellidos}</p>
                )}
              </div>

              {/* DNI */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  DNI / Documento de Identidad <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={formData.dni}
                  onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value.replace(/\D/g, '') }))}
                  placeholder="8 dígitos (Ej. 44556677)"
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-xs text-slate-900 dark:text-white focus:outline-hidden ${
                    formErrors.dni ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.dni && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{formErrors.dni}</p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono / Celular (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Ej. 987654321"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              {/* Correo */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico (Opcional - Se autogenera si se deja vacío)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ej. cmendoza@colegio.edu.pe"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              {/* Especialidad o Cargo si aplica */}
              {formData.rol === 'docente' && (
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Especialidad / Área Pedagógica
                  </label>
                  <input
                    type="text"
                    value={formData.especialidad}
                    onChange={(e) => setFormData(prev => ({ ...prev, especialidad: e.target.value }))}
                    placeholder="Ej. Matemática y Física, Comunicación Integral, etc."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              )}

              {formData.rol === 'admin' && (
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo Directivo / Administrativo
                  </label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                    placeholder="Ej. Director General, Subdirector Académico, Coordinador"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              )}

            </div>
          </div>

          {/* Paso 3: Acceso a la Plataforma y Contraseña */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>3. Credenciales de Acceso a la Plataforma</span>
              </label>
              <button
                type="button"
                onClick={generateAutoPassword}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generar Contraseña</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              {/* Usuario sugerido / personalizado */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de Usuario (Login)
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Dejar vacío para autogenerar"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Contraseña de Acceso</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opcional (se autogenera)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswordCreate ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Ej. DocCarlos4455!"
                    className="w-full px-3 py-2 pr-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordCreate(!showPasswordCreate)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showPasswordCreate ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPasswordCreate ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Crear Usuario</span>
            </button>
          </div>

        </form>
      </Modal>

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          6. MODAL: CREDENCIALES GENERADAS
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      {createdCredentials && (
        <Modal
          isOpen={!!createdCredentials}
          onClose={() => setCreatedCredentials(null)}
          title="Credenciales de Acceso Generadas"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold">¡Usuario creado y credenciales activadas!</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Entrega estas credenciales al usuario para su primer inicio de sesión.
                </p>
              </div>
            </div>

            {/* Tarjeta de Credenciales */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 font-mono border border-slate-800 shadow-lg">
              
              {/* Usuario */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">USUARIO / USERNAME</span>
                  <span className="font-bold text-sm text-emerald-400">
                    {createdCredentials.credentials.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(createdCredentials.credentials.username, 'usr')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans flex items-center gap-1"
                >
                  {copiedField === 'usr' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'usr' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

              {/* Contraseña Temporal */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">CONTRASEÑA TEMPORAL</span>
                  <span className="font-bold text-sm text-amber-400">
                    {showPassword ? createdCredentials.credentials.password : '••••••••••••'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title={showPassword ? "Ocultar" : "Mostrar"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(createdCredentials.credentials.password, 'pwd')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans flex items-center gap-1"
                  >
                    {copiedField === 'pwd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'pwd' ? 'Copiada' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Correo */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">CORREO ASOCIADO</span>
                  <span className="text-xs text-slate-200">
                    {createdCredentials.credentials.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(createdCredentials.credentials.email, 'eml')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans flex items-center gap-1"
                >
                  {copiedField === 'eml' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'eml' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Entendido y Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          7. MODAL: ASIGNAR / CAMBIAR ROL
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      {isEditRoleModalOpen && selectedUserForEdit && (
        <Modal
          isOpen={isEditRoleModalOpen}
          onClose={() => setIsEditRoleModalOpen(false)}
          title={`Asignar Rol a ${selectedUserForEdit.nombres}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Selecciona el nuevo rol con el que <strong className="text-slate-900 dark:text-white">{selectedUserForEdit.nombres} {selectedUserForEdit.apellidos}</strong> operará en el sistema escolar.
            </p>

            <div className="space-y-2">
              {(['admin', 'docente', 'estudiante', 'apoderado', 'asistencia'] as UserRole[]).map((r) => {
                const isSelected = newRoleSelection === r;
                const cfg = roleConfig[r];
                return (
                  <div
                    key={r}
                    onClick={() => setNewRoleSelection(r)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {cfg.icon}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{cfg.label}</div>
                        <div className="text-[10px] text-slate-400">{cfg.desc}</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditRoleModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRoleChange}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                Guardar Nuevo Rol
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
