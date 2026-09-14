'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { 
  QrCode, 
  Award, 
  Users, 
  ShieldCheck, 
  BookOpen, 
  User, 
  ArrowRight, 
  Sparkles,
  Zap,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Lock,
} from 'lucide-react';
import { UserRole } from '@/types';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { currentUser, students, attendances } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (currentUser?.rol) {
      const roleHomeUrl: Record<UserRole, string> = {
        admin: '/admin',
        docente: '/docente',
        estudiante: '/estudiante',
        apoderado: '/apoderado',
        asistencia: '/asistencia',
      };
      const target = roleHomeUrl[currentUser.rol] || '/login';
      router.replace(target);
    }
  }, [currentUser, router]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => a.fecha === todayStr);
  const presentCount = todayAttendances.filter(a => a.estado === 'presente' || a.estado === 'tardanza').length;
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const portals = [
    {
      role: 'admin' as UserRole,
      href: '/admin',
      title: 'Portal Administrador',
      desc: 'Control total del colegio: matrículas, carnets QR masivos, reportes consolidados y asignación de docentes.',
      gradient: 'from-purple-600 via-violet-600 to-indigo-600',
      glow: 'group-hover:shadow-purple-500/30',
      icon: ShieldCheck,
      badge: 'Admin',
      badgeBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
      features: ['Carnets QR en Lote', 'Gestión de Matrículas', 'Reportes Consolidados', 'Gestión Docentes'],
      stat: `${students.length} estudiantes`,
      statIcon: Users,
    },
    {
      role: 'docente' as UserRole,
      href: '/docente',
      title: 'Portal Docente',
      desc: 'Toma de asistencia con cámara QR, registro de notas AD–A–B–C, tareas, evaluaciones y promedio automático.',
      gradient: 'from-blue-600 via-sky-600 to-cyan-600',
      glow: 'group-hover:shadow-blue-500/30',
      icon: BookOpen,
      badge: 'Docente',
      badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
      features: ['Escáner QR con Cámara', 'Notas AD–A–B–C', 'Tareas Escolares', 'Evaluaciones'],
      stat: `${attendanceRate}% asistencia`,
      statIcon: CheckCircle2,
    },
    {
      role: 'estudiante' as UserRole,
      href: '/estudiante',
      title: 'Portal Estudiante',
      desc: 'Carnet Digital QR de ingreso, libreta de calificaciones por competencias e historial de asistencias.',
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      glow: 'group-hover:shadow-emerald-500/30',
      icon: User,
      badge: 'Alumno',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
      features: ['Carnet QR Digital', 'Libreta de Notas', 'Historial Asistencias', 'Ver Tareas'],
      stat: 'I Bimestre 2026',
      statIcon: Award,
    },
    {
      role: 'apoderado' as UserRole,
      href: '/apoderado',
      title: 'Portal Apoderado',
      desc: 'Monitoreo integral de hijos: asistencia en tiempo real, libreta oficial de notas y comunicación directa con tutores.',
      gradient: 'from-pink-600 via-rose-600 to-red-600',
      glow: 'group-hover:shadow-pink-500/30',
      icon: Users,
      badge: 'Familia',
      badgeBg: 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300',
      features: ['Multi-hijo Unificado', 'Alertas de Asistencia', 'Boletín de Notas', 'Canal con Tutores'],
      stat: 'Seguimiento 24/7',
      statIcon: Sparkles,
    },
  ];

  const highlights = [
    { icon: QrCode, title: 'Asistencia QR Instantánea', desc: 'Escaneo con cámara web o móvil en segundos', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Award, title: 'Sistema AD–A–B–C', desc: 'Calificación por competencias con promedios automáticos', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: BarChart3, title: 'Reportes Consolidados', desc: 'Informes completos descargables en PDF por periodo', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Lock, title: 'Listo para Supabase', desc: 'PostgreSQL + Row Level Security + Auth integrada', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-2xl border border-slate-800/60">
        {/* Animated blobs */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Sistema Escolar · Año 2026
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Gestión Escolar
            <span className="block shimmer-text">Inteligente & Moderna</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Asistencia mediante <strong className="text-white">código QR</strong>, sistema de calificación
            {' '}<strong className="text-white">AD – A – B – C</strong> por competencias y portales dedicados para Administrador, Docente y Estudiante.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 font-black text-sm shadow-xl hover:bg-slate-100 transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 text-indigo-600" />
              Iniciar Sesión
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/asistencia"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              Terminal Asistencia QR
            </Link>
          </div>

          {/* Live Metrics Row */}
          <div className="flex flex-wrap gap-4 pt-2">
            {[
              { val: students.length, label: 'Estudiantes' },
              { val: `${attendanceRate}%`, label: 'Asistencia hoy' },
              { val: 'AD–A–B–C', label: 'Escala de logros' },
            ].map(({ val, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-lg font-black text-white">{val}</span>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portal Cards */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Acceso por Portal</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Ingresa con tus credenciales asignadas según tu rol
            </p>
          </div>
          <Link href="/login" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Ir al login
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {portals.map(({ role, href, title, desc, gradient, glow, icon: Icon, badge, badgeBg, features, stat, statIcon: StatIcon }) => (
            <Link
              key={role}
              href="/login"
              className={`group relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-800/70 shadow-sm hover:shadow-2xl ${glow} transition-all duration-300 card-lift`}
            >
              {/* Top gradient strip */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
              
              {/* Gradient blob */}
              <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${badgeBg}`}>
                    {badge}
                  </span>
                </div>

                <h3 className="font-black text-base text-slate-900 dark:text-white mb-2">
                  {title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {desc}
                </p>

                {/* Feature list */}
                <div className="space-y-1.5 mb-5">
                  {features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <StatIcon className="w-3.5 h-3.5" />
                    {stat}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                    Entrar
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {highlights.map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm flex items-start gap-4 card-lift animate-slide-up">
            <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-xs text-slate-800 dark:text-white mb-1">{title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
