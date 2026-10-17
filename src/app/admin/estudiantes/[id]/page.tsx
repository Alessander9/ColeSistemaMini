'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { calculateAverage, GRADE_SCALE } from '@/lib/grades/calculations';
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
  FolderOpen,
  Sparkles,
  Inbox
} from 'lucide-react';
import Link from 'next/link';

// Se carga solo al generar el PDF (así jsPDF no pesa en la carga inicial de la página)
const downloadEnrollmentFichaPdf = async (...args: Parameters<typeof import('@/lib/pdf/generateEnrollmentFichaPdf').downloadEnrollmentFichaPdf>) =>
  (await import('@/lib/pdf/generateEnrollmentFichaPdf')).downloadEnrollmentFichaPdf(...args);

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
    courses,
    evaluationPeriods,
    brandingConfig,
    behaviorLogs,
    addBehaviorLog,
    updateEnrollmentDocuments,
    showToast,
    payments,
    users
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'resumen' | 'academico' | 'notas' | 'asistencia' | 'conducta' | 'tareas' | 'evaluaciones' | 'matricula' | 'documentos' | 'apoderados' | 'historial' | 'finanzas'
  >('resumen');

  // Behavior log form state
  const [newLogData, setNewLogData] = useState({
    titulo: '',
    tipo: 'merito' as 'merito' | 'demerito' | 'observacion' | 'citacion',
    descripcion: '',
    visibleApoderado: true,
  });

  const student = useMemo(() => {
    return students.find(s => s.id === studentId || s.profile_id === studentId);
  }, [students, studentId]);

  // Cuenta de acceso real del alumno (el perfil embebido no siempre trae usuario y contraseña)
  const account = useMemo(() => {
    return users.find(u => u.id === student?.profile_id) || student?.profile;
  }, [users, student]);

  const enrollment = useMemo(() => {
    return enrollments.find(e => e.estudiante_id === student?.id);
  }, [enrollments, student]);

  const section = useMemo(() => {
    return sections.find(s => s.id === enrollment?.seccion_id);
  }, [sections, enrollment]);

  const gradeLevel = useMemo(() => {
    return gradeLevels.find(g => g.id === section?.grado_id);
  }, [gradeLevels, section]);

  // ── Métricas 100% reales calculadas del estado ──
  const studentGrades = useMemo(() => {
    if (!enrollment?.id) return [];
    return grades.filter(g => g.matricula_id === enrollment.id);
  }, [grades, enrollment]);

  const gradeLetters = useMemo(() => {
    return studentGrades.map(g => g.nota_letra).filter(Boolean);
  }, [studentGrades]);

  const averageInfo = useMemo(() => {
    const result = calculateAverage(gradeLetters);
    if (!result.averageLetter) return null;
    return { ...result, averageLetter: result.averageLetter };
  }, [gradeLetters]);

  const studentAttendances = useMemo(() => {
    if (!enrollment?.id) return [];
    return attendances.filter(a => a.matricula_id === enrollment.id);
  }, [attendances, enrollment]);

  const totalAttendances = studentAttendances.length;
  const presentCount = studentAttendances.filter(a => a.estado === 'presente' || a.estado === 'tardanza').length;
  const attendanceRate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : null;

  const sectionTasks = useMemo(() => {
    if (!enrollment?.seccion_id) return [];
    return tasks.filter(t => t.seccion_id === enrollment.seccion_id);
  }, [tasks, enrollment]);

  const studentSubmissions = useMemo(() => {
    if (!enrollment?.id) return [];
    return submissions.filter(s => s.matricula_id === enrollment.id);
  }, [submissions, enrollment]);

  const studentExams = useMemo(() => {
    if (!enrollment?.seccion_id) return [];
    return exams.filter(e => e.seccion_id === enrollment.seccion_id);
  }, [exams, enrollment]);

  const assignedCourses = useMemo(() => {
    const currentNivel = gradeLevel?.nivel || 'primaria';
    return courses.filter(c => c.nivel === currentNivel);
  }, [courses, gradeLevel]);

  const activeAlertsCount = useMemo(() => {
    const faltas = studentAttendances.filter(a => a.estado === 'falta').length;
    const bajasNotas = studentGrades.filter(g => g.nota_letra === 'C').length;
    return faltas + bajasNotas;
  }, [studentAttendances, studentGrades]);

  const studentPayments = useMemo(() => {
    if (!student?.id) return [];
    return payments.filter(p => p.estudiante_id === student.id || p.matricula_id === enrollment?.id);
  }, [payments, student, enrollment]);

  const handleDownloadFicha = async () => {
    if (!student) return;
    try {
      showToast('Generando Ficha Oficial de Matrícula en PDF...', 'info', 'PDF');
      await downloadEnrollmentFichaPdf({
        student,
        enrollment,
        section,
        credentials: {
          username: account?.username || account?.dni || student.dni || student.codigo_estudiante,
          password: account?.password || '',
          email: account?.email,
        },
        parentName: student.nombre_apoderado,
        parentPhone: student.telefono_apoderado,
        parentEmail: student.email_apoderado,
        brandingConfig,
      });
      showToast('Ficha de Matrícula descargada con éxito.', 'success', 'PDF Descargado');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      showToast('Error al generar el PDF de matrícula.', 'error');
    }
  };

  const tabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'academico', label: 'Académico' },
    { id: 'notas', label: 'Notas' },
    { id: 'asistencia', label: 'Asistencia' },
    { id: 'conducta', label: 'Conducta / Anecdotario' },
    { id: 'tareas', label: 'Tareas' },
    { id: 'evaluaciones', label: 'Evaluaciones' },
    { id: 'matricula', label: 'Matrícula' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'apoderados', label: 'Apoderados' },
    { id: 'historial', label: 'Historial' },
    // [DESACTIVADO: El colegio no gestiona pagos ni pensiones]
    // { id: 'finanzas', label: 'Finanzas & Pensiones' },
  ] as const;

  if (students.length > 0 && !student) notFound();
  if (!student) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
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
                {student?.profile?.nombres || student?.nombres} {student?.profile?.apellidos || student?.apellidos}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
                Matrícula Activa
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>DNI: <strong className="text-slate-700 dark:text-slate-300 font-mono">{student?.profile?.dni || student?.dni || 'Sin DNI'}</strong></span>
              <span>•</span>
              <span>Código: <strong className="text-slate-700 dark:text-slate-300 font-mono">{student?.codigo_estudiante}</strong></span>
              <span>•</span>
              <span>Nivel: <strong className="capitalize text-indigo-600 dark:text-indigo-400">{gradeLevel?.nivel || 'Primaria'}</strong></span>
              <span>•</span>
              <span>{gradeLevel?.nombre || 'Grado sin asignar'} — Sección &quot;{section?.letra || 'A'}&quot;</span>
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadFicha}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            title="Descargar Ficha Oficial de Matrícula en PDF"
          >
            <Download className="w-4 h-4" /> Ficha Matrícula PDF
          </button>
          <Link
            href="/estudiante/carnet-qr"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all active:scale-95"
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
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
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
              
              {/* Promedio Anual */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Promedio Anual</span>
                {averageInfo ? (
                  <>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                      {GRADE_SCALE[averageInfo.averageLetter]?.defaultNumeric || '—'} <GradeBadge grade={averageInfo.averageLetter} size="sm" />
                    </div>
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                      {GRADE_SCALE[averageInfo.averageLetter]?.label || 'Calificado'} ({averageInfo.count} notas)
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-black text-slate-400 mt-1">
                      —
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">Sin notas registradas</p>
                  </>
                )}
              </div>

              {/* Asistencia Global */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asistencia Global</span>
                {attendanceRate !== null ? (
                  <>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {attendanceRate}%
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {presentCount} de {totalAttendances} asistencias registradas
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-black text-slate-400 mt-1">
                      0%
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">0 asistencias registradas</p>
                  </>
                )}
              </div>

              {/* Tareas Entregadas */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tareas Entregadas</span>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  {studentSubmissions.length}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {sectionTasks.length > 0 
                    ? `${studentSubmissions.length} de ${sectionTasks.length} tareas (${Math.round((studentSubmissions.length / sectionTasks.length) * 100)}%)`
                    : '0 tareas asignadas'}
                </p>
              </div>

              {/* Alertas Activas */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alertas Activas</span>
                <div className={`text-2xl font-black mt-1 ${activeAlertsCount > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                  {activeAlertsCount}
                </div>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  {activeAlertsCount === 0 ? 'Sin observaciones disciplinarias' : `${activeAlertsCount} alertas de inasistencia/notas`}
                </p>
              </div>

            </div>

            {/* Accesos a la Plataforma */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Estado de Cuenta y Credenciales de Acceso</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-slate-600 dark:text-slate-300 font-mono">
                <div>
                  <span className="text-slate-400 font-sans block text-[11px]">Usuario Alumno:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{account?.username || account?.dni || student?.dni || student?.codigo_estudiante}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans block text-[11px]">Correo Institucional:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{account?.email || 'No configurado'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans block text-[11px]">Contraseña Asignada:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{account?.password || 'Sin contraseña registrada'}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ACADÉMICO / CURSOS */}
        {activeTab === 'academico' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Carga Curricular Asignada ({assignedCourses.length} Cursos del Nivel {gradeLevel?.nivel || 'Primaria'})
            </h3>
            {assignedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assignedCourses.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color_hex || '#4f46e5' }} />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.nombre}</h4>
                        <p className="text-[11px] text-slate-500">Código: {c.codigo} • 4 Horas semanales</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      Matriculado
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs">No hay cursos asignados a este nivel educativo.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOTAS */}
        {activeTab === 'notas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Registro de Calificaciones por Bimestre (CNEB)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {studentGrades.length > 0 
                    ? `Se registran ${studentGrades.length} evaluaciones evaluadas para este estudiante.`
                    : 'Aún no se han registrado notas para este estudiante. Las calificaciones ingresadas por los docentes aparecerán aquí en tiempo real.'}
                </p>
              </div>
              <Link
                href="/estudiante/libreta-notas"
                className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                <Award className="w-3.5 h-3.5" />
                Ver Libreta Oficial (PDF)
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Curso</th>
                    <th className="py-2.5 px-3 text-center">I Bimestre</th>
                    <th className="py-2.5 px-3 text-center">II Bimestre</th>
                    <th className="py-2.5 px-3 text-center">III Bimestre</th>
                    <th className="py-2.5 px-3 text-center">IV Bimestre</th>
                    <th className="py-2.5 px-3 text-center">Promedio Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {assignedCourses.map((course) => {
                    const courseGrades = studentGrades.filter(g => {
                      const comp = course.competencias?.find(c => c.id === g.competencia_id);
                      return comp !== undefined;
                    });
                    
                    const courseLetters = courseGrades.map(g => g.nota_letra);
                    const courseResult = calculateAverage(courseLetters);
                    const courseAvg = courseResult.averageLetter
                      ? { ...courseResult, averageLetter: courseResult.averageLetter }
                      : null;

                    return (
                      <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                          {course.nombre}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                          {courseGrades[0]?.nota_letra ? <GradeBadge grade={courseGrades[0].nota_letra} size="sm" /> : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                          {courseGrades[1]?.nota_letra ? <GradeBadge grade={courseGrades[1].nota_letra} size="sm" /> : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                          {courseGrades[2]?.nota_letra ? <GradeBadge grade={courseGrades[2].nota_letra} size="sm" /> : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                          {courseGrades[3]?.nota_letra ? <GradeBadge grade={courseGrades[3].nota_letra} size="sm" /> : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          {courseAvg ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-black">
                              {GRADE_SCALE[courseAvg.averageLetter]?.defaultNumeric} ({courseAvg.averageLetter})
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ASISTENCIA */}
        {activeTab === 'asistencia' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Historial de Asistencias y Puntualidad
            </h3>
            {studentAttendances.length > 0 ? (
              <div className="space-y-2">
                {studentAttendances.map((att) => (
                  <div key={att.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">Fecha: {att.fecha}</p>
                      <p className="text-[11px] text-slate-500">{att.observacion || 'Sin observaciones'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase ${
                      att.estado === 'presente' ? 'bg-emerald-100 text-emerald-700' :
                      att.estado === 'tardanza' ? 'bg-amber-100 text-amber-700' :
                      att.estado === 'justificado' ? 'bg-blue-100 text-blue-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {att.estado}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sin asistencias registradas todavía
                </p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Los registros de asistencia aparecerán automáticamente cuando el estudiante escanee su <strong>Carnet QR</strong> en portería o el docente tome asistencia desde el aula.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB: CONDUCTA / ANECDOTARIO */}
        {activeTab === 'conducta' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Cuaderno de Control & Anecdotario Conductual
                </h3>
                <p className="text-xs text-slate-500">
                  Registro pedagógico de méritos, felicitaciones, deméritos y compromisos familiares.
                </p>
              </div>
            </div>

            {/* Form to add behavior entry */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                + Registrar Nueva Anotación Conductual
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Título (Ej. Felicitación por liderazgo)"
                  value={newLogData.titulo}
                  onChange={(e) => setNewLogData(prev => ({ ...prev, titulo: e.target.value }))}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                />
                <select
                  value={newLogData.tipo}
                  onChange={(e) => setNewLogData(prev => ({ ...prev, tipo: e.target.value as any }))}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                >
                  <option value="merito">⭐ Mérito / Felicitación</option>
                  <option value="demerito">⚠️ Demérito / Falta</option>
                  <option value="observacion">📝 Observación Pedagógica</option>
                  <option value="citacion">📅 Citación a Apoderado</option>
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="visApoderado"
                    checked={newLogData.visibleApoderado}
                    onChange={(e) => setNewLogData(prev => ({ ...prev, visibleApoderado: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="visApoderado" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Visible para apoderado
                  </label>
                </div>
              </div>
              <textarea
                rows={2}
                placeholder="Detalle de la anotación conductual..."
                value={newLogData.descripcion}
                onChange={(e) => setNewLogData(prev => ({ ...prev, descripcion: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!newLogData.titulo.trim() || !newLogData.descripcion.trim()) {
                      showToast('Completa el título y detalle de la anotación', 'warning');
                      return;
                    }
                    if (enrollment?.id) {
                      addBehaviorLog({
                        matricula_id: enrollment.id,
                        fecha: new Date().toISOString().split('T')[0],
                        tipo: newLogData.tipo,
                        titulo: newLogData.titulo.trim(),
                        descripcion: newLogData.descripcion.trim(),
                        visible_apoderado: newLogData.visibleApoderado,
                        autor_nombre: 'Dirección Académica',
                      });
                      setNewLogData({
                        titulo: '',
                        tipo: 'merito',
                        descripcion: '',
                        visibleApoderado: true,
                      });
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Guardar Anotación
                </button>
              </div>
            </div>

            {/* List of entries */}
            <div className="space-y-2">
              {behaviorLogs.filter(b => b.matricula_id === enrollment?.id).length > 0 ? (
                behaviorLogs.filter(b => b.matricula_id === enrollment?.id).map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          log.tipo === 'merito' ? 'bg-emerald-100 text-emerald-800' :
                          log.tipo === 'demerito' ? 'bg-rose-100 text-rose-800' :
                          log.tipo === 'citacion' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {log.tipo}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white">{log.titulo}</h4>
                        {log.visible_apoderado && (
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                            Visible al apoderado
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">{log.descripcion}</p>
                      <div className="text-[10px] text-slate-400 mt-2">
                        Registrado el {log.fecha} por {log.autor_nombre || 'Docente'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <ShieldCheck className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Sin anotaciones conductuales registradas
                  </p>
                  <p className="text-[11px] text-slate-500">
                    El estudiante mantiene un expediente intachable.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: TAREAS */}
        {activeTab === 'tareas' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tareas y Asignaciones Escolares
            </h3>
            {sectionTasks.length > 0 ? (
              <div className="space-y-2">
                {sectionTasks.map((t) => {
                  const sub = studentSubmissions.find(s => s.tarea_id === t.id);
                  return (
                    <div key={t.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{t.titulo}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{t.descripcion} • Límite: {t.fecha_limite}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                        sub 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {sub ? 'Entregada' : 'Pendiente'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sin tareas asignadas en esta sección
                </p>
                <p className="text-[11px] text-slate-500">
                  Las tareas creadas por los profesores para el aula &quot;{section?.letra || 'A'}&quot; aparecerán listadas aquí.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: EVALUACIONES */}
        {activeTab === 'evaluaciones' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Exámenes y Evaluaciones Programadas
            </h3>
            {studentExams.length > 0 ? (
              <div className="space-y-2">
                {studentExams.map((ex) => (
                  <div key={ex.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{ex.titulo}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Fecha: {ex.fecha_programada} • {ex.tipo}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg font-bold text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Programada
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <Award className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sin evaluaciones programadas
                </p>
                <p className="text-[11px] text-slate-500">
                  No hay exámenes pendientes para esta sección en el calendario actual.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: MATRÍCULA */}
        {activeTab === 'matricula' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Constancia y Expediente de Matrícula 2026
              </h3>
              <button
                type="button"
                onClick={handleDownloadFicha}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Descargar Ficha PDF
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-slate-400">N° Folio / Matrícula:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{enrollment?.id || 'MAT-2026-001'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-slate-400">Fecha de Registro:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{enrollment?.fecha_matricula || '2026-03-01'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-slate-400">Grado y Sección:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{gradeLevel?.nombre || '3° de Primaria'} — Sección &quot;{section?.letra || 'A'}&quot;</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estado de Matrícula:</span>
                <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-emerald-100 text-emerald-700">
                  {enrollment?.estado || 'activo'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: DOCUMENTOS */}
        {activeTab === 'documentos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Checklist de Documentos de Matrícula
                </h3>
                <p className="text-xs text-slate-500">
                  Verificación física y digital del expediente del estudiante.
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { id: 'doc_dni_est', name: 'Copia Simple de DNI del Estudiante', required: true },
                { id: 'doc_dni_apod', name: 'Copia Simple de DNI del Padre / Apoderado', required: true },
                { id: 'doc_partida', name: 'Partida de Nacimiento Original / Copia Legalizada', required: true },
                { id: 'doc_cert_estudios', name: 'Certificado Oficial de Estudios del Grado Anterior', required: true },
                { id: 'doc_vacunas', name: 'Cartilla de Vacunación / Ficha Médica de Salud', required: false },
                { id: 'doc_ficha_firmada', name: 'Ficha Única de Matrícula Firmada y Huella Dactilar', required: true },
              ].map((doc) => {
                const currentDocs: string[] = enrollment?.documentos_entregados || ['doc_dni_est', 'doc_dni_apod', 'doc_cert_estudios'];
                const isChecked = currentDocs.includes(doc.id);
                return (
                  <div key={doc.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={doc.id}
                        checked={isChecked}
                        onChange={(e) => {
                          if (enrollment?.id) {
                            const nextDocs = e.target.checked
                              ? [...currentDocs, doc.id]
                              : currentDocs.filter((d: string) => d !== doc.id);
                            updateEnrollmentDocuments(enrollment.id, nextDocs);
                          }
                        }}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor={doc.id} className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                        {doc.name}
                        {doc.required && <span className="text-rose-500 ml-1">*</span>}
                      </label>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${
                      isChecked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isChecked ? '✓ Conforme / Entregado' : 'Pendiente'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 9: APODERADOS */}
        {activeTab === 'apoderados' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Datos de los Apoderados y Contactos de Emergencia
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nombre del Apoderado:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{student?.nombre_apoderado || 'No registrado'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Teléfono / WhatsApp:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{student?.telefono_apoderado || 'No registrado'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Correo Electrónico:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{student?.email_apoderado || 'No registrado'}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: HISTORIAL */}
        {activeTab === 'historial' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Historial de Eventos del Alumno
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Matrícula Registrada</span>
                  <p className="text-[11px] text-slate-500">Asignación al aula {section?.letra || 'A'}</p>
                </div>
                <span className="text-slate-400 font-mono">{enrollment?.fecha_matricula || '2026-03-01'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Emisión de Carnet QR</span>
                  <p className="text-[11px] text-slate-500">Código {student?.codigo_estudiante}</p>
                </div>
                <span className="text-slate-400 font-mono">2026</span>
              </div>
            </div>
          </div>
        )}

        {/* [DESACTIVADO: Finanzas & Pensiones no requeridas en esta institución] */}

      </div>

    </div>
  );
}
