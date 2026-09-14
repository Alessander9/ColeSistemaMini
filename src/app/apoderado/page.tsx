'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { 
  HeartHandshake, 
  Users, 
  Award, 
  Clock, 
  FileText, 
  Calendar, 
  ChevronRight, 
  ArrowRight, 
  Sparkles, 
  QrCode, 
  MessageSquare, 
  AlertCircle, 
  Phone, 
  Mail, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function ApoderadoDashboardPage() {
  const { 
    childrenList, 
    selectedChildId, 
    setSelectedChildId, 
    selectedChild,
    courses,
    grades,
    attendances,
    tasks,
    submissions,
    exams
  } = useApp();

  const currentChild = selectedChild || childrenList[0];

  // Saludo dinámico según la hora
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Buenos días' : currentHour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* ── 1. HERO COCKPIT DE FAMILIAS & APODERADOS ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl shadow-pink-950/20 border border-pink-700/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-pink-200 text-xs font-semibold">
              <HeartHandshake className="w-3.5 h-3.5 text-pink-400" />
              <span>Portal de Familias • Seguimiento Escolar 2026</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span suppressHydrationWarning>{greeting}</span>, Estimada Familia <span className="inline-block animate-wave origin-bottom-right">👨‍👩‍👧</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Monitoreo en tiempo real de asistencia, calificaciones oficiales CNEB y avisos de tutoría de sus hijos.
            </p>

            <div className="pt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-semibold text-pink-200 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-pink-300" />
                Modo Solo Consulta Familiar Protegida
              </span>
            </div>
          </div>

          {/* Quick Direct Family Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <Link
              href="/estudiante/libreta-notas"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-102 active:scale-98"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>Libreta Oficial de Notas</span>
            </Link>
            <Link
              href="/estudiante/carnet-qr"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition-all hover:scale-102"
            >
              <QrCode className="w-4 h-4 text-emerald-300" />
              <span>Carnet QR del Estudiante</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. SELECTOR MULTI-HIJO INTERACTIVO ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Hijos Matriculados ({childrenList.length})
          </h3>
          <span className="text-xs text-slate-500">Selecciona para ver el detalle</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {childrenList.map((child) => {
            const isSelected = child.id === selectedChildId;
            return (
              <div
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-600/20 scale-102'
                    : 'bg-white/70 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={child.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'}
                      alt={child.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {child.nombre} {child.apellidos}
                      </h4>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {child.grado_nombre} — Sección &quot;{child.seccion_letra}&quot;
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                      Nivel {child.nivel}
                    </span>
                  </div>
                </div>

                {/* Micro indicators */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block">Promedio</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{child.promedio_letra || 'AD'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block">Asistencia</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{child.asistencia_porcentaje}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block">Deberes</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{child.tareas_pendientes} pend.</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. MÉTRICAS Y DETALLE DEL HIJO SELECCIONADO ── */}
      {currentChild && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-600/20">
                  {currentChild.nombre[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Progreso Integral de {currentChild.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentChild.grado_nombre} • Sección &quot;{currentChild.seccion_letra}&quot; • Año Escolar 2026
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href="/estudiante/libreta-notas"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-all shadow-2xs"
                >
                  <Award className="w-4 h-4" /> Libreta Completa
                </Link>
                <Link
                  href="/estudiante/carnet-qr"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-2xs"
                >
                  <QrCode className="w-4 h-4" /> Carnet QR
                </Link>
              </div>
            </div>

            {/* 4 Cards de Resumen del Hijo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Promedio Ponderado</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
                  {currentChild.promedio_score || 18.5}
                  <GradeBadge grade={currentChild.promedio_letra || 'AD'} size="sm" />
                </div>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Logro Destacado CNEB
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Puntualidad</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
                  {currentChild.asistencia_porcentaje}%
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Sin inasistencias injustificadas</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tareas Pendientes</span>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1.5">
                  {currentChild.tareas_pendientes}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Para los próximos 5 días</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Próximos Exámenes</span>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5">
                  {currentChild.proximas_evaluaciones || 2}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Evaluación bimestral</p>
              </div>
            </div>
          </div>

          {/* ── 4. CANALES DE COMUNICACIÓN CON TUTORES ── */}
          <div className="p-6 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Canal de Comunicación con la Tutoría y Secretaría
                </h3>
              </div>
              <span className="text-xs text-slate-500">Horario de atención: 8:00 AM - 1:00 PM</span>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Para justificaciones de inasistencia, constancias médicas o consultas psicopedagógicas, comuníquese directamente con la secretaría académica o el tutor de aula.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <a
                href="tel:012345678"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors"
              >
                <Phone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Llamar a Secretaría (01) 234-5678</span>
              </a>
              <a
                href="mailto:tutoria@colegio.edu.pe"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors"
              >
                <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Enviar Justificación por Correo</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
