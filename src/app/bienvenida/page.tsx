'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';
import { 
  GraduationCap, 
  ShieldCheck, 
  BookOpen, 
  Users, 
  QrCode, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  School,
  Lock,
  Pause,
  Play
} from 'lucide-react';
import { initialsAvatarUrl } from '@/lib/avatar';
import clsx from 'clsx';

interface RoleSchoolConfig {
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
  welcomeMessage: string;
}

const SCHOOL_ROLES: Record<UserRole, RoleSchoolConfig> = {
  admin: {
    label: 'Dirección & Administración',
    category: 'Equipo Directivo',
    icon: ShieldCheck,
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    welcomeMessage: 'Panel de supervisión, directiva escolar y control académico.',
  },
  docente: {
    label: 'Plana Docente',
    category: 'Cuerpo Pedagógico',
    icon: GraduationCap,
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    welcomeMessage: 'Gestión de clases, registro de calificaciones y asistencias.',
  },
  estudiante: {
    label: 'Estudiante Regular',
    category: 'Comunidad Estudiantil',
    icon: BookOpen,
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    welcomeMessage: 'Tus cursos, horarios, tareas escolares y libreta de notas al día.',
  },
  apoderado: {
    label: 'Padre de Familia / Apoderado',
    category: 'Familia Educativa',
    icon: Users,
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    welcomeMessage: 'Seguimiento del progreso escolar, comunicados y notas de tus hijos.',
  },
  asistencia: {
    label: 'Control de Asistencia',
    category: 'Personal de Apoyo',
    icon: QrCode,
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    welcomeMessage: 'Módulo de lectura de credenciales QR y registro de accesos.',
  },
};

export default function BienvenidaPage() {
  const { currentUser, brandingConfig } = useApp();
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  const getDashboardUrl = (rol?: UserRole) => {
    switch (rol) {
      case 'admin':
        return '/admin';
      case 'docente':
        return '/docente';
      case 'estudiante':
        return '/estudiante';
      case 'apoderado':
        return '/apoderado';
      case 'asistencia':
        return '/asistencia';
      default:
        return '/';
    }
  };

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    if (countdown === 0 && !isPaused) {
      router.push(getDashboardUrl(currentUser?.rol));
    }
  }, [countdown, isPaused, currentUser?.rol, router]);

  const fullName = currentUser 
    ? `${currentUser.nombres || ''} ${currentUser.apellidos || ''}`.trim() 
    : 'Usuario Institucional';
  const firstName = currentUser?.nombres ? currentUser.nombres.split(' ')[0] : 'Usuario';
  const avatarUrl = currentUser?.avatar_url || initialsAvatarUrl(firstName);
  const roleConfig = (currentUser?.rol && SCHOOL_ROLES[currentUser.rol]) || SCHOOL_ROLES.admin;
  const RoleIcon = roleConfig.icon;
  const schoolName = brandingConfig?.nombreInstitucion || 'Colegio San Martín de Porres';

  const todayFormatted = (() => {
    try {
      const str = new Intl.DateTimeFormat('es-PE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(new Date());
      return str.toUpperCase();
    } catch {
      return '2026';
    }
  })();

  const progressPercent = Math.min(100, Math.max(0, ((3 - countdown) / 3) * 100));

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      
      {/* Sutil halo ambiental minimalista */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Tarjeta Horizontal Minimalista con efecto de caída suave (curtain-drop) */}
      <div className="relative z-10 max-w-2xl w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/70 animate-curtain-drop">
        
        {/* Cabecera horizontal institucional */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide uppercase">
                {schoolName}
              </h2>
              <p className="text-[11px] text-slate-400">
                Sistema Integrado de Gestión Educativa
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/60">
              {todayFormatted} • AÑO 2026
            </span>
          </div>
        </div>

        {/* Cuerpo Bento en dos columnas horizontales */}
        <div className="pt-5 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          
          {/* Columna Izquierda: Avatar y Estado */}
          <div className="flex flex-col items-center flex-shrink-0 text-center">
            <div className="relative mb-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-2 ring-slate-700/80 bg-slate-950 p-1 shadow-md">
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full rounded-xl object-cover"
                />
              </div>
              <div 
                title="Usuario Verificado"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className={clsx(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
              roleConfig.badgeColor
            )}>
              <RoleIcon className="w-3 h-3" />
              <span>{roleConfig.category}</span>
            </div>
          </div>

          {/* Columna Derecha: Saludo, Información y Acción */}
          <div className="flex-1 min-w-0 flex flex-col justify-between w-full text-center sm:text-left">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Acceso Autorizado
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug">
                Bienvenido(a), <span className="text-blue-400">{fullName}</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 mt-1 line-clamp-2">
                {roleConfig.welcomeMessage}
              </p>
            </div>

            {/* Barra de progreso y botón de acción */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  {isPaused ? 'Ingreso automático en pausa' : `Ingresando al sistema en ${countdown}s...`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="flex items-center gap-1 text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
                </button>
              </div>

              {/* Barra de progreso minimalista */}
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Botón de ingreso directo */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Sesión segura</span>
                </div>

                <button
                  onClick={() => router.push(getDashboardUrl(currentUser?.rol))}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs tracking-wide shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Entrar ahora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}



