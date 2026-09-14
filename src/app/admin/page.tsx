'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { 
  Users, 
  QrCode, 
  Award, 
  UserCheck, 
  BookOpen,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  BarChart3,
  Calendar,
  School,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { students, enrollments, attendances, grades, courses } = useApp();

  const totalStudents = students.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => a.fecha === todayStr);
  const presentStudents = todayAttendances.filter(a => a.estado === 'presente').length;
  const lateStudents = todayAttendances.filter(a => a.estado === 'tardanza').length;
  const absentStudents = totalStudents - presentStudents - lateStudents;
  const attendanceRate = totalStudents > 0 ? Math.round(((presentStudents + lateStudents) / totalStudents) * 100) : 0;

  const adGrades = grades.filter(g => g.nota_letra === 'AD').length;
  const aGrades = grades.filter(g => g.nota_letra === 'A').length;
  const bGrades = grades.filter(g => g.nota_letra === 'B').length;
  const cGrades = grades.filter(g => g.nota_letra === 'C').length;
  const totalGrades = adGrades + aGrades + bGrades + cGrades;

  const gradeData = [
    { letter: 'AD' as const, count: adGrades, label: 'Logro Destacado', color: 'emerald', pct: totalGrades > 0 ? Math.round((adGrades/totalGrades)*100) : 0 },
    { letter: 'A' as const, count: aGrades, label: 'Logro Esperado', color: 'blue', pct: totalGrades > 0 ? Math.round((aGrades/totalGrades)*100) : 0 },
    { letter: 'B' as const, count: bGrades, label: 'En Proceso', color: 'amber', pct: totalGrades > 0 ? Math.round((bGrades/totalGrades)*100) : 0 },
    { letter: 'C' as const, count: cGrades, label: 'En Inicio', color: 'rose', pct: totalGrades > 0 ? Math.round((cGrades/totalGrades)*100) : 0 },
  ];

  const progressColors: Record<string, string> = {
    emerald: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    blue: 'bg-gradient-to-r from-blue-400 to-indigo-500',
    amber: 'bg-gradient-to-r from-amber-400 to-orange-500',
    rose: 'bg-gradient-to-r from-rose-400 to-pink-500',
  };

  const quickActions = [
    { href: '/admin/docentes', label: 'Gestión de Docentes & Asignación', desc: 'Registrar profesores y asignar materias por salón', icon: GraduationCap, color: 'from-indigo-600 to-purple-600' },
    { href: '/admin/academico', label: 'Explorador Escolar & Salones', desc: 'Árbol jerárquico 2026 · Primaria y Secundaria', icon: School, color: 'from-purple-600 to-indigo-700' },
    { href: '/admin/horarios', label: 'Horarios & Cursos por Salón', desc: 'Asignar materias y profesores', icon: Calendar, color: 'from-purple-500 to-indigo-600' },
    { href: '/admin/notas-salon', label: 'Notas por Salón', desc: '11 grados · hasta 2 secciones c/u', icon: BarChart3, color: 'from-blue-500 to-indigo-600' },
    { href: '/admin/estudiantes', label: 'Carnets QR en Lote', desc: 'Generar para toda la sección', icon: QrCode, color: 'from-emerald-500 to-teal-600' },
    { href: '/admin/matriculas', label: 'Gestión de Matrículas', desc: 'Asignar secciones y credenciales', icon: Users, color: 'from-purple-500 to-violet-600' },
    { href: '/admin/reportes', label: 'Consolidado de Notas', desc: 'Descargar informe completo', icon: Award, color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-8 border border-slate-800/60 shadow-2xl">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-bold mb-2 sm:mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Panel de Administrador
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight mb-1 sm:mb-2">
              Dashboard General
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md">
              Métricas de la institución en tiempo real — asistencia, calificaciones y gestión escolar centralizada.
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 shrink-0 flex-wrap">
            <Link
              href="/admin/estudiantes"
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              Nuevo Alumno
            </Link>
            <Link
              href="/admin/estudiantes"
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all"
            >
              <QrCode className="w-3.5 h-3.5" />
              Generar Carnets
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Mini KPI strip inside hero */}
        <div className="relative z-10 mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Presentes', value: presentStudents, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Tardanzas', value: lateStudents, icon: Clock, color: 'text-amber-400' },
            { label: 'Ausentes', value: absentStudents > 0 ? absentStudents : 0, icon: XCircle, color: 'text-rose-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-3 rounded-2xl bg-white/5 border border-white/10">
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color} shrink-0`} />
              <div>
                <div className="text-base sm:text-xl font-black text-white">{value}</div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">{label} hoy</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Estudiantes"
          value={totalStudents}
          subtitle="Matriculados 2026"
          icon={Users}
          color="blue"
          trend={{ value: "+12%", positive: true }}
          delay={100}
        />
        <StatCard
          title="Asistencia Hoy"
          value={`${attendanceRate}%`}
          subtitle={`${presentStudents} puntuales • ${lateStudents} tardanzas`}
          icon={UserCheck}
          color="emerald"
          trend={{ value: "+3%", positive: true }}
          delay={200}
        />
        <StatCard
          title="Cursos Activos"
          value={courses.length}
          subtitle="Currículum por competencias"
          icon={BookOpen}
          color="purple"
          delay={300}
        />
        <StatCard
          title="Logros AD"
          value={adGrades}
          subtitle="Nivel destacado este bimestre"
          icon={Award}
          color="amber"
          trend={{ value: "+8%", positive: true }}
          delay={400}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grade Distribution Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-800/70 shadow-sm card-lift animate-slide-up delay-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Distribución por Escala de Logros
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalGrades} calificaciones registradas este bimestre
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              I Bimestre 2026
            </div>
          </div>

          <div className="space-y-4">
            {gradeData.map(({ letter, count, label, color, pct }) => (
              <div key={letter} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <GradeBadge grade={letter} size="sm" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span>{count}</span>
                    <span className="text-slate-400 font-normal">({pct}%)</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${progressColors[color]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Grade cards summary */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {gradeData.map(({ letter, count, pct }) => (
              <div key={letter} className={`grade-${letter.toLowerCase()} rounded-2xl p-3 text-center`}>
                <div className="text-lg font-black">{count}</div>
                <div className="text-[10px] font-bold opacity-75">{letter} • {pct}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-800/70 shadow-sm animate-slide-up delay-300">
            <h3 className="font-black text-sm text-slate-900 dark:text-white mb-4">
              Acciones Rápidas
            </h3>
            <div className="space-y-2.5">
              {quickActions.map(({ href, label, desc, icon: Icon, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{label}</p>
                    <p className="text-[10px] text-slate-400">{desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 ml-auto transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Attendances */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-800/70 shadow-sm animate-slide-up delay-400">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Asistencias Recientes
              </h3>
              <Link href="/admin/reportes" className="text-[10px] font-bold text-blue-600 hover:text-blue-700">
                Ver todo →
              </Link>
            </div>
            <div className="space-y-2">
              {todayAttendances.slice(0, 4).map((att) => {
                const enr = enrollments.find(e => e.id === att.matricula_id);
                const name = enr?.estudiante?.profile
                  ? `${enr.estudiante.profile.nombres?.split(' ')[0]} ${enr.estudiante.profile.apellidos?.split(' ')[0]}`
                  : 'Estudiante';
                const statusConfig = {
                  presente: { bg: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
                  tardanza: { bg: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
                  falta: { bg: 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
                  justificado: { bg: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
                };
                const sc = statusConfig[att.estado as keyof typeof statusConfig] || statusConfig.presente;
                return (
                  <div key={att.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} shrink-0`} />
                      <span className="text-xs font-semibold text-slate-800 dark:text-white">{name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${sc.bg}`}>
                      {att.estado}
                    </span>
                  </div>
                );
              })}
              {todayAttendances.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400">
                  No hay registros de asistencia hoy
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
