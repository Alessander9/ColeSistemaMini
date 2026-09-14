'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { EducationalLevel } from '@/types';
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
  GraduationCap,
  Sparkles,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { 
    students, 
    enrollments, 
    attendances, 
    grades, 
    courses, 
    gradeLevels, 
    sections,
    academicContext,
    setAcademicLevel,
    simulacros,
    rankings
  } = useApp();

  const currentLevel = academicContext.nivel;

  // Filtrar estudiantes según nivel seleccionado
  const filteredStudents = currentLevel === 'todos'
    ? students
    : students.filter(s => {
        const enr = enrollments.find(e => e.estudiante_id === s.id);
        const sec = sections.find(sc => sc.id === enr?.seccion_id);
        const grd = gradeLevels.find(g => g.id === sec?.grado_id);
        return grd?.nivel === currentLevel;
      });

  const totalStudents = currentLevel === 'todos' ? students.length : filteredStudents.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => a.fecha === todayStr);
  const presentStudents = todayAttendances.filter(a => a.estado === 'presente').length;
  const lateStudents = todayAttendances.filter(a => a.estado === 'tardanza').length;
  const absentStudents = Math.max(0, totalStudents - presentStudents - lateStudents);
  const attendanceRate = totalStudents > 0 ? Math.round(((presentStudents + lateStudents) / totalStudents) * 100) : 0;

  const adGrades = grades.filter(g => g.nota_letra === 'AD').length;
  const aGrades = grades.filter(g => g.nota_letra === 'A').length;
  const bGrades = grades.filter(g => g.nota_letra === 'B').length;
  const cGrades = grades.filter(g => g.nota_letra === 'C').length;
  const totalGrades = adGrades + aGrades + bGrades + cGrades;

  const levelTabs: { id: EducationalLevel | 'todos'; label: string; icon: string }[] = [
    { id: 'todos', label: 'Toda la Institución', icon: '🏛️' },
    { id: 'inicial', label: 'Inicial (3–5 años)', icon: '🎨' },
    { id: 'primaria', label: 'Primaria (1°–6°)', icon: '👦' },
    { id: 'secundaria', label: 'Secundaria (1°–5°)', icon: '🎓' },
    { id: 'preuniversitario', label: 'Preuniversitario', icon: '🚀' },
  ];

  const quickActions = [
    { href: '/admin/docentes', label: 'Docentes & Plana', desc: 'Asignación de materias por salón', icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
    { href: '/admin/academico', label: 'Explorador Escolar', desc: 'Inicial, Primaria, Secundaria y Preuni', icon: School, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
    { href: '/admin/horarios', label: 'Horarios & Asignación', desc: 'Motor anti-cruce y malla semanal', icon: Calendar, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
    { href: '/admin/notas-salon', label: 'Notas por Salón', desc: 'Evaluación por competencias CNEB', icon: BarChart3, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
    { href: '/admin/estudiantes', label: 'Padrón & Carnets QR', desc: 'Generación digital con foto y código', icon: QrCode, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800' },
    { href: '/admin/matriculas', label: 'Matrículas 2026', desc: 'Registro de vacantes y credenciales', icon: Users, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header Estratégico y Selector de Nivel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dirección General & Backoffice</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {academicContext.institucion}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Plataforma Integral de Gestión Escolar y Rendimiento Académico — Año 2026
          </p>
        </div>

        {/* Level Switcher Segmented Control */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto scrollbar-none">
          {levelTabs.map((tab) => {
            const isSelected = currentLevel === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAcademicLevel(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 select-none ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Hero KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Matrícula Activa"
          value={totalStudents}
          subtitle={`Nivel: ${currentLevel === 'todos' ? 'Global' : currentLevel}`}
          icon={Users}
          color="blue"
          trend={{ value: "+8.4%", positive: true }}
          delay={50}
        />
        <StatCard
          title="Asistencia Hoy"
          value={`${attendanceRate}%`}
          subtitle={`${presentStudents} en aula · ${lateStudents} tardanzas`}
          icon={UserCheck}
          color="emerald"
          trend={{ value: "En rango", positive: true }}
          delay={100}
        />
        <StatCard
          title="Logro Destacado (AD)"
          value={`${totalGrades > 0 ? Math.round((adGrades / totalGrades) * 100) : 0}%`}
          subtitle={`${adGrades} notas AD registradas`}
          icon={Award}
          color="purple"
          trend={{ value: "+3.2%", positive: true }}
          delay={150}
        />
        <StatCard
          title="Simulacros Preuni"
          value={simulacros.length}
          subtitle="Evaluaciones tipo admisión"
          icon={Activity}
          color="amber"
          trend={{ value: "412.5 top", positive: true }}
          delay={200}
        />
      </div>

      {/* 3. Panel Central de Operaciones & Asistencia en Vivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (2 spans): Distribución de Calificaciones & Métricas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Escala Pedagógica CNEB */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Rendimiento Institucional por Competencias
                </h3>
                <p className="text-xs text-slate-400">Escala cualitativa oficial del Ministerio de Educación</p>
              </div>
              <Link
                href="/admin/notas-salon"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                Ver matriz
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { letter: 'AD' as const, label: 'Logro Destacado', count: adGrades, bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/60', text: 'text-emerald-700 dark:text-emerald-300' },
                { letter: 'A' as const, label: 'Logro Esperado', count: aGrades, bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800/60', text: 'text-blue-700 dark:text-blue-300' },
                { letter: 'B' as const, label: 'En Proceso', count: bGrades, bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800/60', text: 'text-amber-700 dark:text-amber-300' },
                { letter: 'C' as const, label: 'En Inicio', count: cGrades, bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800/60', text: 'text-rose-700 dark:text-rose-300' },
              ].map(({ letter, label, count, bg, border, text }) => (
                <div key={letter} className={`p-3.5 rounded-2xl border ${bg} ${border}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xl font-black ${text}`}>{letter}</span>
                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                      {count} reg.
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Módulo Preuniversitario Especializado */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  🚀
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Cuadro de Mérito Preuniversitario (Top Simulacros)
                  </h3>
                  <p className="text-xs text-slate-400">Puntajes y preparación tipo examen de admisión</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold">
                Ciclos 2026
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-3">Puesto</th>
                    <th className="py-2 px-3">Estudiante</th>
                    <th className="py-2 px-3">Carrera / Meta</th>
                    <th className="py-2 px-3">Puntaje</th>
                    <th className="py-2 px-3 text-right">Aula</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rankings.slice(0, 4).map((entry) => (
                    <tr key={entry.puesto} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                          entry.puesto === 1 ? 'bg-amber-400 text-amber-950' :
                          entry.puesto === 2 ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white' :
                          entry.puesto === 3 ? 'bg-amber-700/20 text-amber-700 dark:text-amber-400' :
                          'text-slate-500'
                        }`}>
                          #{entry.puesto}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {entry.nombre}
                        <span className="block text-[10px] font-normal text-slate-400">{entry.codigo}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {entry.carrera_objetivo}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {entry.puntaje_total} <span className="text-slate-400 text-[10px]">/ {entry.puntaje_maximo}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[10px]">
                          {entry.aula}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Columna Derecha (1 span): Accesos Rápidos & Asistencia del Día */}
        <div className="space-y-6">
          
          {/* Tarjeta de Control Diario de Asistencia */}
          <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  Control en Puerta
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h4 className="text-lg font-black text-white mb-1">
                Terminal de Asistencia QR
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Registro en tiempo real con cámara óptica y carnet escolar.
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-mono text-base font-black text-emerald-400">{presentStudents}</div>
                  <div className="text-[9px] text-slate-400 font-medium">A tiempo</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-mono text-base font-black text-amber-400">{lateStudents}</div>
                  <div className="text-[9px] text-slate-400 font-medium">Tardanza</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-mono text-base font-black text-rose-400">{absentStudents > 0 ? absentStudents : 0}</div>
                  <div className="text-[9px] text-slate-400 font-medium">Ausente</div>
                </div>
              </div>

              <Link
                href="/asistencia"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                Abrir Kiosko de Portería
              </Link>
            </div>
          </div>

          {/* Accesos Directos de Administración */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Módulos de Gestión
            </h3>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${action.color} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {action.label}
                        </p>
                        <p className="text-[10px] text-slate-400">{action.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
