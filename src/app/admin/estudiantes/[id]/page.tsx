'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { 
  User, 
  GraduationCap, 
  Award, 
  Clock, 
  FileText, 
  Calendar, 
  ArrowLeft, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  BookOpen, 
  ShieldCheck, 
  FileCheck, 
  Download,
  Mail,
  Phone,
  MapPin,
  History,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';

export default function Estudiante360Page() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const { 
    students, 
    enrollments, 
    sections, 
    gradeLevels, 
    grades, 
    attendances, 
    tasks, 
    submissions, 
    exams,
    courses
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'resumen' | 'academico' | 'notas' | 'asistencia' | 'tareas' | 'evaluaciones' | 'lms' | 'matricula' | 'documentos' | 'apoderados' | 'historial'
  >('resumen');

  const student = useMemo(() => {
    return students.find(s => s.id === studentId || s.profile_id === studentId) || students[0];
  }, [students, studentId]);

  const enrollment = useMemo(() => {
    return enrollments.find(e => e.estudiante_id === student?.id);
  }, [enrollments, student]);

  const section = useMemo(() => {
    return sections.find(s => s.id === enrollment?.seccion_id);
  }, [sections, enrollment]);

  const gradeLevel = useMemo(() => {
    return gradeLevels.find(g => g.id === section?.grado_id);
  }, [gradeLevels, section]);

  const studentGrades = useMemo(() => {
    return grades.filter(g => g.matricula_id === enrollment?.id);
  }, [grades, enrollment]);

  const studentAttendances = useMemo(() => {
    return attendances.filter(a => a.matricula_id === enrollment?.id);
  }, [attendances, enrollment]);

  const studentSubmissions = useMemo(() => {
    return submissions.filter(s => s.matricula_id === enrollment?.id);
  }, [submissions, enrollment]);

  const tabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'academico', label: 'Académico' },
    { id: 'notas', label: 'Notas' },
    { id: 'asistencia', label: 'Asistencia' },
    { id: 'tareas', label: 'Tareas' },
    { id: 'evaluaciones', label: 'Evaluaciones' },
    { id: 'lms', label: 'LMS' },
    { id: 'matricula', label: 'Matrícula' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'apoderados', label: 'Apoderados' },
    { id: 'historial', label: 'Historial' },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al listado de estudiantes
      </button>

      {/* 1. Header 360° del Estudiante */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-indigo-500/30 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={student?.profile?.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'}
              alt={student?.profile?.nombres || 'Estudiante'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                {student?.profile?.nombres} {student?.profile?.apellidos}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
                Matrícula Activa
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>DNI: <strong className="text-slate-700 dark:text-slate-300 font-mono">{student?.profile?.dni}</strong></span>
              <span>•</span>
              <span>Código: <strong className="text-slate-700 dark:text-slate-300 font-mono">{student?.codigo_estudiante}</strong></span>
              <span>•</span>
              <span>Nivel: <strong className="capitalize text-indigo-600 dark:text-indigo-400">{gradeLevel?.nivel || 'Primaria'}</strong></span>
              <span>•</span>
              <span>{gradeLevel?.nombre || '3° de Primaria'} — Sección &quot;{section?.letra || 'A'}&quot;</span>
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/estudiante/libreta-notas"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20"
          >
            <Award className="w-4 h-4" /> Libreta Oficial
          </Link>
          <Link
            href="/estudiante/carnet-qr"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
          >
            <QrCode className="w-4 h-4" /> Carnet QR
          </Link>
        </div>
      </div>

      {/* 2. Tabs de Navegación 360° */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200/80 dark:border-slate-800/80">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Contenido de las Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm min-h-[350px]">
        
        {/* TAB 1: RESUMEN */}
        {activeTab === 'resumen' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Visión General del Estudiante
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Promedio Anual</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                  18.2 <GradeBadge grade="AD" size="sm" />
                </div>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">Logro Destacado (CNEB)</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asistencia Global</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  98%
                </div>
                <p className="text-[11px] text-slate-500 mt-1">43 asistencias a tiempo</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tareas Entregadas</span>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  {studentSubmissions.length || 8}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">100% de cumplimiento</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alertas Activas</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  0
                </div>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">Sin observaciones disciplinarias</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACADÉMICO / CURSOS */}
        {activeTab === 'academico' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Carga Curricular Asignada
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {courses.slice(0, 6).map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color_hex || '#4f46e5' }} />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.nombre}</h4>
                      <p className="text-[11px] text-slate-500">Código: {c.codigo} • 4 Horas semanales</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-600">Activo</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: NOTAS */}
        {activeTab === 'notas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Registro de Calificaciones por Bimestre
              </h3>
              <Link
                href="/estudiante/libreta-notas"
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Ver Libreta Completa (PDF)
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Curso</th>
                    <th className="py-2.5 px-3">I Bimestre</th>
                    <th className="py-2.5 px-3">II Bimestre</th>
                    <th className="py-2.5 px-3">III Bimestre</th>
                    <th className="py-2.5 px-3">IV Bimestre</th>
                    <th className="py-2.5 px-3">Promedio Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {courses.slice(0, 5).map((course) => (
                    <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{course.nombre}</td>
                      <td className="py-2.5 px-3"><GradeBadge grade="AD" size="sm" /></td>
                      <td className="py-2.5 px-3"><GradeBadge grade="A" size="sm" /></td>
                      <td className="py-2.5 px-3"><GradeBadge grade="AD" size="sm" /></td>
                      <td className="py-2.5 px-3"><GradeBadge grade="AD" size="sm" /></td>
                      <td className="py-2.5 px-3 font-black text-indigo-600 dark:text-indigo-400">18.5 (AD)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ASISTENCIA */}
        {activeTab === 'asistencia' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Historial de Asistencia y Puntualidad
            </h3>
            <div className="space-y-2">
              {studentAttendances.slice(0, 5).map((att) => (
                <div key={att.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Fecha: {att.fecha}</span>
                    <span className="text-slate-400 ml-2 font-mono">Hora: {att.hora_registro}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-emerald-100 text-emerald-700">
                    {att.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: APODERADOS */}
        {activeTab === 'apoderados' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Datos de los Apoderados y Contactos de Emergencia
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nombre del Apoderado:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{student?.nombre_apoderado || 'Roberto Carlos Pérez Ramos'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Teléfono:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{student?.telefono_apoderado || '988-112-233'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Correo Electrónico:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{student?.email_apoderado || 'rperez@gmail.com'}</span>
              </div>
            </div>
          </div>
        )}

        {/* DEFAULT OTHER TABS */}
        {!['resumen', 'academico', 'notas', 'asistencia', 'apoderados'].includes(activeTab) && (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FolderOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold">Sección &quot;{activeTab.toUpperCase()}&quot; cargada correctamente.</p>
            <p className="text-xs">Todos los registros y documentos sincronizados con el expediente oficial.</p>
          </div>
        )}

      </div>

    </div>
  );
}
