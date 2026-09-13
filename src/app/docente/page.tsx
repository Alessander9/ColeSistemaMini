'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { 
  QrCode, 
  Award, 
  BookOpen, 
  Users, 
  ArrowRight, 
  CheckCircle2,
  FileText,
  Calendar,
  Clock,
  Zap,
  TrendingUp,
  Sparkles,
  MapPin,
  ClipboardList,
  Check,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function DocenteDashboardPage() {
  const { 
    courses, 
    students, 
    enrollments, 
    attendances, 
    grades, 
    currentUser,
    getCurrentOrNextClass,
    saveClassSessionLog
  } = useApp();

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionObs, setSessionObs] = useState('');
  const [sessionSuccess, setSessionSuccess] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => a.fecha === todayStr || a.fecha === '2026-09-12');
  const presentCount = todayAttendances.filter(a => a.estado === 'presente').length;
  const lateCount = todayAttendances.filter(a => a.estado === 'tardanza').length;
  const attendancePct = students.length > 0 ? Math.round(((presentCount + lateCount) / students.length) * 100) : 0;

  const pendingGrades = students.length - grades.filter(g => g.nota_letra).length;
  const adCount = grades.filter(g => g.nota_letra === 'AD').length;

  const { currentSlot, nextSlot, todaySlots } = getCurrentOrNextClass(currentUser.id);

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSlot || !sessionTopic) return;

    saveClassSessionLog({
      slotId: currentSlot.id,
      seccionId: currentSlot.seccion_id,
      cursoId: currentSlot.curso_id,
      docenteId: currentUser.id,
      temaTratado: sessionTopic,
      observaciones: sessionObs,
    });

    setSessionSuccess(true);
    setTimeout(() => {
      setSessionSuccess(false);
      setIsSessionModalOpen(false);
      setSessionTopic('');
      setSessionObs('');
    }, 1200);
  };

  const modules = [
    {
      href: '/docente/horario',
      title: 'Mi Horario & Salones',
      desc: 'Consulta tu distribución semanal de clases, salones a tu cargo y materias asignadas por la administración.',
      icon: Calendar,
      color: 'from-purple-500 to-indigo-600',
      shadow: 'shadow-purple-500/25',
      badge: 'Semanal',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      metric: `${todaySlots.length} clases hoy`,
      metricColor: 'text-purple-400',
    },
    {
      href: '/docente/asistencia',
      title: 'Control de Asistencia QR',
      desc: 'Escanea con cámara los carnets digitales de tus alumnos al inicio del aula. Registro instantáneo.',
      icon: QrCode,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
      badge: '● En Vivo',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      metric: `${attendancePct}% hoy`,
      metricColor: 'text-emerald-400',
    },
    {
      href: '/docente/notas',
      title: 'Registro de Notas AD–A–B–C',
      desc: 'Ingresa y modifica calificaciones por competencias. El sistema recalcula promedios en tiempo real.',
      icon: Award,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
      badge: `${pendingGrades} pendientes`,
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      metric: `${adCount} logros AD`,
      metricColor: 'text-blue-400',
    },
    {
      href: '/docente/tareas',
      title: 'Gestión de Tareas',
      desc: 'Publica y revisa tareas escolares asignadas a tu sección. Seguimiento de entregas y estado.',
      icon: FileText,
      color: 'from-purple-500 to-violet-600',
      shadow: 'shadow-purple-500/25',
      badge: 'Ver tareas',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      metric: `${courses.length} cursos`,
      metricColor: 'text-purple-400',
    },
    {
      href: '/docente/evaluaciones',
      title: 'Exámenes y Evaluaciones',
      desc: 'Programa fechas de evaluaciones, exámenes parciales y actividades de competencias.',
      icon: Calendar,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
      badge: 'Programar',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      metric: 'I Bimestre',
      metricColor: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-900 p-6 sm:p-8 border border-blue-900/40 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Panel Docente · Año 2026
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              ¡Hola, Prof. {currentUser.nombres.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-400 text-sm max-w-md">
              Tienes <span className="text-blue-400 font-bold">{todaySlots.length} bloques de clase</span> programados para hoy.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link
              href="/docente/horario"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              Ver Mi Horario
            </Link>
            <Link
              href="/docente/asistencia"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all active:scale-95 shrink-0"
            >
              <QrCode className="w-4 h-4" />
              Escanear QR
            </Link>
          </div>
        </div>
      </div>

      {/* ── Contextual Class Banner (Mi Clase Actual / Siguiente) ── */}
      {currentSlot && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-slate-900 border border-purple-500/30 shadow-lg relative overflow-hidden backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg shrink-0"
                style={{ backgroundColor: currentSlot.curso?.color_hex || '#8b5cf6' }}
              >
                {currentSlot.seccion?.letra}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    Clase en Curso / Próxima
                  </span>
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {currentSlot.hora_inicio} - {currentSlot.hora_fin} ({currentSlot.dia})
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">
                  {currentSlot.curso?.nombre} — {currentSlot.seccion?.grado?.nombre} &quot;{currentSlot.seccion?.letra}&quot;
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Ubicación: <strong>{currentSlot.aula || 'Aula 301'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                onClick={() => setIsSessionModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02]"
              >
                <ClipboardList className="w-4 h-4" />
                Registrar Tema / Asistencia
              </button>
              <Link
                href="/docente/notas"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
              >
                <Award className="w-4 h-4" />
                Evaluar Salón
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Cursos Asignados"
          value={courses.length}
          subtitle="Matemática, Comunicación, Ciencia…"
          icon={BookOpen}
          color="blue"
          delay={100}
        />
        <StatCard
          title="Alumnos a Cargo"
          value={students.length}
          subtitle="Sección 3° Primaria 'A'"
          icon={Users}
          color="purple"
          delay={200}
        />
        <StatCard
          title="Asistencia Hoy"
          value={`${attendancePct}%`}
          subtitle={`${presentCount} puntuales · ${lateCount} tardanzas`}
          icon={CheckCircle2}
          color="emerald"
          trend={{ value: "+5%", positive: true }}
          delay={300}
        />
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modules.map(({ href, title, desc, icon: Icon, color, shadow, badge, badgeBg, metric, metricColor }) => (
          <Link
            key={href}
            href={href}
            className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-800/70 shadow-sm hover:shadow-xl transition-all duration-300 card-lift block"
          >
            {/* Top gradient strip */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color} rounded-t-3xl`} />
            
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg ${shadow} group-hover:scale-105 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${badgeBg}`}>
                {badge}
              </span>
            </div>

            <h3 className="font-black text-base text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
              {desc}
            </p>

            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${metricColor}`}>
                {metric}
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                Abrir
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Modal Registro de Sesión ── */}
      {isSessionModalOpen && currentSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Registro de Clase
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentSlot.curso?.nombre} · {currentSlot.seccion?.grado?.nombre} &quot;{currentSlot.seccion?.letra}&quot;
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSessionModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sessionSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-lg">¡Sesión Registrada!</h4>
                <p className="text-xs text-slate-500">El avance pedagógico se ha guardado en el cuaderno de campo.</p>
              </div>
            ) : (
              <form onSubmit={handleSaveSession} className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tema / Contenido Desarrollado *
                  </label>
                  <input
                    type="text"
                    required
                    value={sessionTopic}
                    onChange={(e) => setSessionTopic(e.target.value)}
                    placeholder="Ej: Fracciones equivalentes y resolución de problemas"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Observaciones / Tarea Asignada
                  </label>
                  <textarea
                    rows={3}
                    value={sessionObs}
                    onChange={(e) => setSessionObs(e.target.value)}
                    placeholder="Ej: Se reforzó el concepto con material concreto. Tarea página 45 del cuaderno de trabajo."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:text-white resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSessionModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all"
                  >
                    Guardar Registro
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
