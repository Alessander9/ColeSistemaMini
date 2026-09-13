'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { 
  User, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  BookOpen, 
  GraduationCap, 
  ChevronDown, 
  Mail, 
  Phone, 
  School, 
  Calendar,
  CheckCircle2,
  Sparkles,
  Bell,
  Moon,
  Sun,
  KeyRound
} from 'lucide-react';

export function ProfileDropdown() {
  const { currentUser, students, enrollments } = useApp();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Settings form states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    router.push('/login');
  };

  const handleOpenProfile = () => {
    setIsOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleOpenSettings = () => {
    setIsOpen(false);
    setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSettingsModalOpen(false);
    }, 1200);
  };

  const roleConfig: Record<UserRole, { label: string; icon: React.ReactNode; gradient: string; dot: string; bgBadge: string }> = {
    admin: {
      label: 'Administrador',
      icon: <ShieldCheck className="w-3 h-3" />,
      gradient: 'from-purple-500 to-violet-600',
      dot: 'bg-purple-500',
      bgBadge: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    },
    docente: {
      label: 'Docente',
      icon: <BookOpen className="w-3 h-3" />,
      gradient: 'from-blue-500 to-sky-600',
      dot: 'bg-blue-500',
      bgBadge: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    estudiante: {
      label: 'Estudiante',
      icon: <User className="w-3 h-3" />,
      gradient: 'from-emerald-500 to-teal-600',
      dot: 'bg-emerald-500',
      bgBadge: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
  };

  const cfg = roleConfig[currentUser.rol];

  // Specific student info if applicable
  const currentStudent = students.find(s => s.profile_id === currentUser.id);
  const currentEnrollment = enrollments.find(e => e.estudiante_id === currentStudent?.id);

  return (
    <>
      {/* Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        >
          {/* Avatar with indicator */}
          <div className="relative shrink-0">
            <img
              src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nombres)}&background=6366f1&color=fff&size=80`}
              alt={currentUser.nombres}
              className="w-8 h-8 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-purple-500 transition-all shadow-sm"
            />
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${cfg.dot} rounded-full border-2 border-white dark:border-slate-950`} />
          </div>

          {/* Name & Role Tag (Desktop) */}
          <div className="hidden sm:block text-left min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[110px]">
              {currentUser.nombres.split(' ')[0]}
            </p>
            <div className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-extrabold bg-gradient-to-r ${cfg.gradient} text-white shadow-xs`}>
              {cfg.icon}
              <span>{cfg.label}</span>
            </div>
          </div>

          {/* Arrow Indicator */}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu Modal */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in zoom-in-95 fade-in duration-150">
            
            {/* Header User Card */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 mb-1.5">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nombres)}&background=6366f1&color=fff&size=80`}
                  alt={currentUser.nombres}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {currentUser.nombres} {currentUser.apellidos}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.email || `${currentUser.nombres.toLowerCase().split(' ')[0]}.${currentUser.apellidos.toLowerCase().split(' ')[0]}@colegio.edu.pe`}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/40 flex items-center justify-between">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cfg.bgBadge}`}>
                  {cfg.label}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Activo 2026
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-0.5">
              
              {/* Option: Ver Perfil */}
              <button
                type="button"
                onClick={handleOpenProfile}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black text-slate-900 dark:text-white">Ver Perfil</span>
                  <span className="block text-[10px] text-slate-400 font-normal">Datos personales y académicos</span>
                </div>
              </button>

              {/* Option: Configuración */}
              <button
                type="button"
                onClick={handleOpenSettings}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black text-slate-900 dark:text-white">Configuración</span>
                  <span className="block text-[10px] text-slate-400 font-normal">Preferencias y notificaciones</span>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

            {/* Option: Cerrar Sesión */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-black text-rose-600 dark:text-rose-400">Cerrar Sesión</span>
                <span className="block text-[10px] text-rose-400 dark:text-rose-500 font-normal">Salir de la cuenta actual</span>
              </div>
            </button>

          </div>
        )}
      </div>

      {/* ── MODAL 1: VER PERFIL ── */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Perfil de Usuario Institucional"
        maxWidth="md"
      >
        <div className="space-y-5">
          {/* Header Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-700">
            <div className="relative">
              <img
                src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nombres)}&background=6366f1&color=fff&size=100`}
                alt={currentUser.nombres}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-800 shadow-md"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 ${cfg.dot} rounded-full border-2 border-white dark:border-slate-900`} />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {currentUser.nombres} {currentUser.apellidos}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                DNI / Identificación: <strong className="text-slate-700 dark:text-slate-300">{currentUser.dni || currentUser.id}</strong>
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                {cfg.icon}
                <span>{cfg.label}</span>
              </div>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Correo Institucional</span>
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                <span className="truncate">{currentUser.email || `${currentUser.nombres.toLowerCase().split(' ')[0]}@colegio.edu.pe`}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Documento / ID</span>
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentUser.dni || currentUser.id.toUpperCase()}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Año Académico</span>
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>2026 (II Bimestre Activo)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Estado de Cuenta</span>
              <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Activo y Verificado</span>
              </div>
            </div>
          </div>

          {/* Student/Teacher extra info */}
          {currentEnrollment && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                Salón & Matrícula Asignada
              </span>
              <p className="text-xs font-black text-slate-900 dark:text-white">
                {currentEnrollment.seccion?.grado?.nombre} — Sección &quot;{currentEnrollment.seccion?.letra}&quot; ({currentEnrollment.seccion?.grado?.nivel})
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsProfileModalOpen(false);
                setIsSettingsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors"
            >
              Configurar Cuenta
            </button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL 2: CONFIGURACIÓN ── */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Configuración de la Cuenta"
        maxWidth="md"
      >
        <form onSubmit={handleSaveSettings} className="space-y-4">
          
          {saveSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ¡Preferencias guardadas exitosamente!
            </div>
          )}

          {/* Section: Notificaciones */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" />
              Notificaciones y Avisos
            </h5>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Notificaciones en la plataforma
              </span>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Alertas por Correo Electrónico
              </span>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sonidos de Alerta al Escanear QR
              </span>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
            </label>
          </div>

          {/* Section: Seguridad */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Seguridad y Credenciales
            </h5>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Contraseña actual
              </label>
              <input
                type="password"
                defaultValue="••••••••••••"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-600/20 transition-all"
            >
              Guardar Cambios
            </button>
          </div>

        </form>
      </Modal>
    </>
  );
}
