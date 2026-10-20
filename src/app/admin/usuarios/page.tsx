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
import { generateSecurePassword } from '@/lib/auth/generateCredentials';
import { FormField } from '@/components/ui/FormField';
import { validateDni, validatePeruPhone } from '@/lib/validation/businessRules';

const PAGE_SIZE = 20;

export default function GestionUsuariosPage() {
  const {
    users,
    addUser,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    currentUser,
    showToast
  } = useApp();

  // Estados de búsqueda y filtrado
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

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

  // Validaciones en tiempo real para creación de usuario
  const createDniVal = useMemo(
    () => validateDni(formData.dni, { existingDnis: users.map(u => u.dni).filter(Boolean) }),
    [formData.dni, users]
  );

  const createPhoneVal = useMemo(
    () => validatePeruPhone(formData.telefono, { isOptional: true }),
    [formData.telefono]
  );

  const isCreateValid = Boolean(
    formData.nombres.trim() &&
    formData.apellidos.trim() &&
    createDniVal.valid &&
    createPhoneVal.valid
  );

  // Filtrado reactivo de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${user.nombres} ${user.apellidos}`.toLowerCase();
        const dni = user.dni.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const id = user.id.toLowerCase();
        const username = (user.username || '').toLowerCase();
        if (!fullName.includes(query) && !dni.includes(query) && !email.includes(query) && !id.includes(query) && !username.includes(query)) {
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
    if (!createDniVal.valid) {
      errors.dni = createDniVal.error || 'DNI inválido.';
    }
    if (!createPhoneVal.valid) {
      errors.telefono = createPhoneVal.error || 'Teléfono celular inválido.';
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
    const gen = generateSecurePassword();
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

  const ROLE_ORDER: UserRole[] = ['admin', 'docente', 'estudiante', 'apoderado', 'asistencia'];
  // Colores y una frase sencilla de qué puede hacer cada rol
  const ROLE_THEME: Record<UserRole, { plural: string; short: string; icon: React.ElementType; tile: string; chip: string; avatar: string; ring: string }> = {
    admin: { plural: 'Administradores', short: 'Manejan todo el sistema', icon: Shield, tile: 'bg-indigo-600 text-white', chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300', avatar: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', ring: 'ring-indigo-500' },
    docente: { plural: 'Docentes', short: 'Notas, asistencia y tareas', icon: GraduationCap, tile: 'bg-purple-600 text-white', chip: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300', avatar: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', ring: 'ring-purple-500' },
    estudiante: { plural: 'Alumnos', short: 'Ven sus notas, horario y tareas', icon: BookOpen, tile: 'bg-blue-600 text-white', chip: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300', avatar: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', ring: 'ring-blue-500' },
    apoderado: { plural: 'Padres / apoderados', short: 'Siguen el avance de sus hijos', icon: HeartHandshake, tile: 'bg-amber-500 text-white', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300', avatar: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', ring: 'ring-amber-500' },
    asistencia: { plural: 'Portería', short: 'Registran ingresos con el QR', icon: QrCode, tile: 'bg-emerald-600 text-white', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', avatar: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', ring: 'ring-emerald-500' },
  };
  const roleCount: Record<string, number> = { admin: adminCount, docente: docenteCount, estudiante: estudianteCount, apoderado: apoderadoCount, asistencia: asistenciaCount };
  const activeCount = users.filter(u => u.activo).length;
  const initials = (u: UserProfile) => `${(u.nombres || '?')[0] || ''}${(u.apellidos || '')[0] || ''}`.toUpperCase();
  const isMe = (u: UserProfile) => u.id === currentUser?.id;
  const visibleUsers = filteredUsers.slice(0, visibleCount);
  const hasFilters = !!searchQuery || selectedRoleFilter !== 'todos' || selectedStatusFilter !== 'todos';

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 font-sans">

      {/* ── 1. ENCABEZADO ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 via-blue-500 via-amber-400 to-emerald-500" />
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> {activeCount} de {users.length} con acceso activo
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-indigo-600" /> Usuarios y accesos
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Aquí decides quién puede entrar al sistema y qué puede hacer. Cada persona tiene un <strong>rol</strong>; puedes cambiarlo o bloquear su acceso cuando quieras.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setFormErrors({}); setIsCreateModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Crear usuario
          </button>
        </div>
      </div>

      {/* ── 2. ROLES: qué hace cada uno (tócalo para filtrar) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ROLE_ORDER.map(r => {
          const t = ROLE_THEME[r];
          const active = selectedRoleFilter === r;
          return (
            <button
              key={r}
              type="button"
              aria-pressed={active}
              onClick={() => { setSelectedRoleFilter(active ? 'todos' : r); setVisibleCount(PAGE_SIZE); }}
              className={`text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs hover:shadow-md transition-all cursor-pointer ${active ? `border-transparent ring-2 ${t.ring}` : 'border-slate-200/80 dark:border-slate-800'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.tile}`}><t.icon className="w-5 h-5" /></span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{roleCount[r]}</span>
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2">{t.plural}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.short}</p>
            </button>
          );
        })}
      </div>

      {/* ── 3. BUSCAR Y FILTRAR ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
              placeholder="Buscar por nombre, DNI, correo o usuario..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer" aria-label="Borrar búsqueda">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
            {([
              ['todos', `Todos (${users.length})`],
              ['activos', `Con acceso (${activeCount})`],
              ['inactivos', `Bloqueados (${users.length - activeCount})`],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => { setSelectedStatusFilter(id); setVisibleCount(PAGE_SIZE); }}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${selectedStatusFilter === id ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span><strong className="text-slate-900 dark:text-white">{filteredUsers.length}</strong> {filteredUsers.length === 1 ? 'usuario' : 'usuarios'}{selectedRoleFilter !== 'todos' ? ` · ${ROLE_THEME[selectedRoleFilter as UserRole]?.plural}` : ''}</span>
          {hasFilters && (
            <button type="button" onClick={() => { setSearchQuery(''); setSelectedRoleFilter('todos'); setSelectedStatusFilter('todos'); }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 cursor-pointer">
              <X className="w-3.5 h-3.5" /> Quitar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── 4. LISTA DE USUARIOS ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {filteredUsers.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 dark:text-slate-200">No hay usuarios con estos filtros</p>
            <p className="text-sm text-slate-500">Prueba con otro nombre o quita los filtros.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleUsers.map(user => {
              const t = ROLE_THEME[user.rol] || ROLE_THEME.docente;
              const me = isMe(user);
              return (
                <li key={user.id} className="flex flex-col md:flex-row md:items-center gap-3 px-4 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Persona */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar_url} alt={user.nombres} className={`w-11 h-11 rounded-2xl object-cover shrink-0 ${user.activo ? '' : 'grayscale opacity-60'}`} />
                    ) : (
                      <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${user.activo ? t.avatar : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>{initials(user)}</span>
                    )}
                    <div className="min-w-0">
                      <p className={`font-bold truncate ${user.activo ? 'text-slate-900 dark:text-white' : 'text-slate-400 line-through decoration-slate-300'}`}>
                        {user.nombres} {user.apellidos}
                        {me && <span className="ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900 align-middle no-underline">Tú</span>}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>DNI {user.dni}</span>
                        {user.email && <span className="inline-flex items-center gap-1 truncate max-w-[220px]"><Mail className="w-3 h-3" /> {user.email}</span>}
                        {user.telefono && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {user.telefono}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Rol */}
                  <div className="md:w-48 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${t.chip}`}>
                      <t.icon className="w-3.5 h-3.5" /> {roleConfig[user.rol]?.label || user.rol}
                    </span>
                    {(user.especialidad || user.cargo) && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{user.especialidad || user.cargo}</p>}
                  </div>

                  {/* Acceso */}
                  <div className="md:w-44 shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={user.activo}
                      disabled={me}
                      onClick={() => toggleUserStatus(user.id)}
                      title={me ? 'No puedes bloquear tu propia cuenta' : user.activo ? 'Bloquear su acceso' : 'Devolverle el acceso'}
                      className="inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className={`relative w-10 h-6 rounded-full transition-colors ${user.activo ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${user.activo ? 'left-5' : 'left-1'}`} />
                      </span>
                      <span className={`text-xs font-bold ${user.activo ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}`}>{user.activo ? 'Puede entrar' : 'Bloqueado'}</span>
                    </button>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 shrink-0 md:justify-end">
                    <button
                      type="button"
                      disabled={me}
                      onClick={() => { setSelectedUserForEdit(user); setNewRoleSelection(user.rol); setIsEditRoleModalOpen(true); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title={me ? 'No puedes cambiar tu propio rol' : 'Cambiar su rol'}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Cambiar rol
                    </button>
                    <button
                      type="button"
                      disabled={me}
                      onClick={() => setUserToDelete(user)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title={me ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                      aria-label="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {filteredUsers.length > visibleCount && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1">
            <button type="button" onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
              <ChevronDown className="w-4 h-4" /> Ver más usuarios
            </button>
            <span className="text-xs text-slate-500">Mostrando {visibleCount} de {filteredUsers.length}</span>
          </div>
        )}
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
              <FormField
                label="Nombres"
                required
                error={formErrors.nombres || (!formData.nombres.trim() && formData.dni ? 'Ingresa los nombres.' : undefined)}
              >
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                  placeholder="Ej. Carlos Alberto"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </FormField>

              {/* Apellidos */}
              <FormField
                label="Apellidos"
                required
                error={formErrors.apellidos || (!formData.apellidos.trim() && formData.dni ? 'Ingresa los apellidos.' : undefined)}
              >
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                  placeholder="Ej. Mendoza Rojas"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </FormField>

              {/* DNI */}
              <FormField
                label="DNI / Documento de Identidad"
                required
                hint="8 dígitos numéricos"
                error={formErrors.dni || createDniVal.error}
              >
                <input
                  type="text"
                  maxLength={8}
                  value={formData.dni}
                  onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value.replace(/\D/g, '') }))}
                  placeholder="8 dígitos (Ej. 44556677)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </FormField>

              {/* Teléfono */}
              <FormField
                label="Teléfono Celular"
                hint="9 dígitos comenzando con 9 (opcional)"
                error={formErrors.telefono || createPhoneVal.error}
              >
                <input
                  type="text"
                  maxLength={9}
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value.replace(/\D/g, '') }))}
                  placeholder="Ej. 987654321"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </FormField>

              {/* Correo */}
              <div className="sm:col-span-2">
                <FormField
                  label="Correo Electrónico"
                  hint="Opcional - Se autogenera si se deja vacío"
                >
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Ej. cmendoza@colegio.edu.pe"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </FormField>
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
              disabled={!isCreateValid}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
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

      {/* ── CONFIRMAR ELIMINACIÓN ── */}
      {userToDelete && (
        <Modal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} title="¿Eliminar usuario?" maxWidth="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-900 dark:text-rose-200">
                <strong>{userToDelete.nombres} {userToDelete.apellidos}</strong> ya no podrá entrar al sistema y se borrará su cuenta. Si solo quieres impedirle el acceso por un tiempo, mejor <strong>bloquéalo</strong>.
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setUserToDelete(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">Cancelar</button>
              {userToDelete.activo && (
                <button type="button" onClick={() => { toggleUserStatus(userToDelete.id); setUserToDelete(null); }} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">Solo bloquear</button>
              )}
              <button type="button" onClick={() => { deleteUser(userToDelete.id); setUserToDelete(null); }} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-black cursor-pointer">Sí, eliminar</button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
