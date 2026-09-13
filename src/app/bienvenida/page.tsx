'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';
import { 
  GraduationCap, 
  ShieldCheck, 
  BookOpen, 
  User, 
  ArrowRight, 
  Sparkles, 
  QrCode, 
  Calendar, 
  Award, 
  Clock, 
  CheckCircle2,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

export default function BienvenidaPage() {
  const { currentUser } = useApp();
  const router = useRouter();
  const [countdown, setCountdown] = useState(6);
  const [autoRedirect, setAutoRedirect] = useState(true);

  const getDashboardUrl = (rol: UserRole) => {
    switch (rol) {
      case 'admin':
        return '/admin';
      case 'docente':
        return '/docente';
      case 'estudiante':
        return '/estudiante';
      case 'asistencia':
        return '/asistencia';
      default:
        return '/';
    }
  };

  useEffect(() => {
    // Launch celebratory confetti
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (!autoRedirect) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(getDashboardUrl(currentUser.rol));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirect, currentUser.rol, router]);

  const roleConfig: Record<UserRole, { label: string; icon: React.ReactNode; gradient: string; badgeBg: string }> = {
    admin: {
      label: 'Administrador del Sistema',
      icon: <ShieldCheck className="w-5 h-5 text-purple-400" />,
      gradient: 'from-purple-600 via-indigo-600 to-blue-600',
      badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    },
    docente: {
      label: 'Profesor Especialista',
      icon: <BookOpen className="w-5 h-5 text-blue-400" />,
      gradient: 'from-blue-600 via-sky-600 to-teal-600',
      badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    },
    estudiante: {
      label: 'Estudiante Matriculado',
      icon: <User className="w-5 h-5 text-emerald-400" />,
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    },
    asistencia: {
      label: 'Operador de Control QR & Portería',
      icon: <QrCode className="w-5 h-5 text-amber-400" />,
      gradient: 'from-amber-500 via-orange-500 to-emerald-600',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    },
  };

  const currentRoleConfig = roleConfig[currentUser.rol] || roleConfig.admin;

  const quickShortcuts = {
    admin: [
      { title: 'Gestión de Docentes', desc: 'Asignar materias y salones', href: '/admin/docentes', icon: Users },
      { title: 'Horarios Escolares', desc: 'Validación anti-cruce de clases', href: '/admin/horarios', icon: Calendar },
      { title: 'Padrón & Carnets QR', desc: 'Credenciales y carnet digital', href: '/admin/estudiantes', icon: QrCode },
    ],
    docente: [
      { title: 'Lector de Asistencia QR', desc: 'Registro en vivo por aula', href: '/docente/asistencia', icon: QrCode },
      { title: 'Calificaciones CNEB', desc: 'Escala oficial AD / A / B / C', href: '/docente/notas', icon: Award },
      { title: 'Tareas & Entregas', desc: 'Publicar tareas y feedback', href: '/docente/tareas', icon: BookOpen },
    ],
    estudiante: [
      { title: 'Mi Carnet Escolar QR', desc: 'Código QR para ingreso escolar', href: '/estudiante/carnet-qr', icon: QrCode },
      { title: 'Mi Libreta de Notas', desc: 'Boleta de competencias CNEB', href: '/estudiante/libreta-notas', icon: Award },
      { title: 'Mis Tareas Escolares', desc: 'Entregas y revisiones', href: '/estudiante/tareas', icon: BookOpen },
    ],
    asistencia: [
      { title: 'Terminal QR Móvil', desc: 'Escanear con cámara de celular', href: '/asistencia', icon: QrCode },
      { title: 'Padrón de Alumnos', desc: 'Consulta de DNI y carnet', href: '/admin/estudiantes', icon: Users },
      { title: 'Reportes de Entrada', desc: 'Resumen de asistencia', href: '/asistencia', icon: Clock },
    ],
  };

  const shortcuts = quickShortcuts[currentUser.rol] || quickShortcuts.admin;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden px-4 py-8 select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Brand Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-none">
              Cole<span className="text-emerald-400">Sistema</span> Mini
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Plataforma Escolar 2026</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Periodo Académico Activo
        </span>
      </div>

      {/* Main Welcome Hero Card */}
      <div className="max-w-2xl w-full mx-auto my-auto z-10 py-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center">
          
          {/* Top highlight ribbon */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${currentRoleConfig.gradient}`} />

          {/* User Avatar & Greeting */}
          <div className="relative inline-block mb-5">
            <img
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.nombres}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-slate-800 shadow-2xl mx-auto"
            />
            <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-lg">
              {currentRoleConfig.icon}
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-3 mx-auto" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300">{currentRoleConfig.label}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            ¡Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-300 to-indigo-300">{currentUser.nombres.split(' ')[0]}</span>!
          </h2>

          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
            Bienvenido al portal institucional. Todo tu entorno escolar, asistencias, horarios y evaluaciones están listos.
          </p>

          {/* Quick Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
            {shortcuts.map((sc, idx) => {
              const Icon = sc.icon;
              return (
                <Link
                  key={idx}
                  href={sc.href}
                  className="p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-slate-700/50 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="font-bold text-xs text-white leading-tight mb-0.5">{sc.title}</p>
                    <p className="text-[11px] text-slate-400 leading-snug">{sc.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Primary CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => router.push(getDashboardUrl(currentUser.rol))}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 group"
            >
              <span>Ingresar a mi Panel</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {autoRedirect && (
              <button
                onClick={() => setAutoRedirect(false)}
                className="text-xs text-slate-400 hover:text-slate-200 px-4 py-2 font-medium rounded-xl hover:bg-slate-800/50 transition-colors"
              >
                Pausar auto-redirección ({countdown}s)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer Information */}
      <div className="max-w-4xl w-full mx-auto text-center z-10">
        <p className="text-xs text-slate-500 font-medium">
          ColeSistema Mini © 2026 • Sistema de Gestión Escolar y Control Académico CNEB
        </p>
      </div>
    </div>
  );
}
