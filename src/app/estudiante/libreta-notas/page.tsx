'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { AnnualReportCardView } from '@/components/notas/AnnualReportCardView';
import { calculateAverage, calculateStudentAnnualReportCard, getGradeMeta } from '@/lib/grades/calculations';
import { generateReportCardPdf } from '@/lib/pdf/reportCardPdfGenerator';
import {
  Printer,
  FileText,
  Layers,
  Award,
  Users,
  Calendar,
  TrendingUp,
  Search,
  ChevronRight,
  BookOpen,
  BarChart3,
  HelpCircle,
  Star,
  Flame,
  ShieldCheck,
  Lightbulb,
  MessageCircle,
  Download,
  ChevronDown,
} from 'lucide-react';

export default function EstudianteLibretaNotasPage() {
  const { 
    users,
    students, 
    enrollments, 
    sections,
    gradeLevels,
    courses, 
    sectionCourses,
    grades, 
    attendances,
    teachers,
    evaluationPeriods, 
    currentUser, 
    childrenList, 
    selectedChildId, 
    setSelectedChildId,
    showToast,
    brandingConfig
  } = useApp();

  const isApoderadoOrAdmin = currentUser.rol === 'apoderado' || currentUser.rol === 'admin';

  // Lista de hijos/estudiantes disponibles
  const availableChildren = useMemo(() => {
    if (childrenList && childrenList.length > 0) {
      return childrenList;
    }
    return students.map((s, idx) => {
      const enr = enrollments.find(e => e.estudiante_id === s.id);
      const sec = sections.find(sc => sc.id === enr?.seccion_id);
      const grd = gradeLevels.find(g => g.id === sec?.grado_id);
      const studentAtts = enr ? attendances.filter(a => a.matricula_id === enr.id) : [];
      const attPct = studentAtts.length > 0 ? Math.round((studentAtts.filter(a => a.estado === 'presente').length / studentAtts.length) * 100) : 0;
      const studentGrds = enr ? grades.filter(g => g.matricula_id === enr.id).map(g => g.nota_letra) : [];
      const { averageLetter } = calculateAverage(studentGrds);
      const tutor = teachers.find(t => t.id === sec?.tutor_id);

      return {
        id: s.id,
        estudiante_id: s.id,
        nombre: s.profile?.nombres || s.nombres || '',
        apellidos: s.profile?.apellidos || s.apellidos || '',
        nivel: grd?.nivel || 'primaria',
        grado_nombre: grd?.nombre || 'Grado no asignado',
        seccion_letra: sec?.letra || '-',
        avatar_url: s.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        promedio_letra: (averageLetter || '—') as any,
        asistencia_porcentaje: attPct,
        tareas_pendientes: 0,
        tutor_nombre: tutor ? `${tutor.nombres} ${tutor.apellidos}` : 'No asignado',
        tutor_email: tutor?.email || '',
        tutor_avatar: tutor?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      };
    });
  }, [childrenList, students, enrollments, sections, gradeLevels, attendances, grades, teachers]);

  // Estudiante/Hijo activo
  const activeChild = useMemo(() => {
    if (isApoderadoOrAdmin && availableChildren.length > 0) {
      return availableChildren.find(c => c.id === selectedChildId || c.estudiante_id === selectedChildId) || availableChildren[0];
    }
    return null;
  }, [isApoderadoOrAdmin, availableChildren, selectedChildId]);

  const activeStudent = useMemo(() => {
    if (activeChild) {
      return students.find(s => s.id === activeChild.estudiante_id) || students.find(s => s.id === activeChild.id) || null;
    }
    return students.find(s => s.profile_id === currentUser.id || s.id === currentUser.id) || null;
  }, [activeChild, students, currentUser.id]);

  const studentProfile = useMemo(() => {
    if (!activeStudent) return null;
    return activeStudent?.profile || (users || []).find(u => u.id === activeStudent?.profile_id) || null;
  }, [activeStudent, users]);

  const activeEnrollment = useMemo(() => {
    if (!activeStudent?.id) return null;
    return enrollments.find(e => e.estudiante_id === activeStudent.id) || null;
  }, [enrollments, activeStudent?.id]);

  // Estados de navegación y filtros
  const [activeTab, setActiveTab] = useState<'cursos' | 'resumen' | 'anual'>('cursos');
  const [selectedBimestreId, setSelectedBimestreId] = useState<string>('todos');
  const [gradeFilter, setGradeFilter] = useState<'todos' | 'AD' | 'A' | 'B' | 'C'>('todos');
  const [courseSearch, setCourseSearch] = useState('');
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  // Notas calculadas del estudiante activo
  const studentGradesAll = useMemo(() => {
    if (!activeEnrollment?.id) return [];
    return grades.filter(g => g.matricula_id === activeEnrollment.id).map(g => g.nota_letra);
  }, [grades, activeEnrollment?.id]);

  const { averageLetter, averageScore } = useMemo(() => {
    return calculateAverage(studentGradesAll);
  }, [studentGradesAll]);

  // Asistencia real del estudiante activo
  const studentAttendances = useMemo(() => {
    if (!activeEnrollment?.id) return [];
    return attendances.filter(a => a.matricula_id === activeEnrollment.id);
  }, [attendances, activeEnrollment?.id]);

  const realAttendancePercentage = useMemo(() => {
    if (studentAttendances.length === 0) return 0;
    const presents = studentAttendances.filter(a => a.estado === 'presente').length;
    return Math.round((presents / studentAttendances.length) * 100);
  }, [studentAttendances]);

  // Tutor del estudiante
  const activeTutor = useMemo(() => {
    const tutorId = activeEnrollment?.seccion?.tutor_id;
    return teachers.find(t => t.id === tutorId) || null;
  }, [activeEnrollment, teachers]);

  const tutorDisplayName = activeTutor ? `${activeTutor.nombres} ${activeTutor.apellidos}` : 'No asignado';

  // Cursos del alumno: los asignados a su sección (o los de su nivel) y cualquiera donde ya tenga notas
  const studentCourses = useMemo(() => {
    const sectionId = activeEnrollment?.seccion_id;
    const level = activeEnrollment?.seccion?.grado?.nivel || activeChild?.nivel;
    const assigned = new Set(sectionCourses.filter(sc => sc.seccion_id === sectionId).map(sc => sc.curso_id));
    const gradedCompetencies = new Set(
      grades.filter(g => g.matricula_id === activeEnrollment?.id).map(g => g.competencia_id)
    );
    return courses.filter(c => {
      const hasGrades = (c.competencias || []).some(comp => gradedCompetencies.has(comp.id));
      if (hasGrades) return true;
      if (assigned.size > 0) return assigned.has(c.id);
      return !level || c.nivel === level;
    });
  }, [courses, sectionCourses, grades, activeEnrollment, activeChild]);

  // Consolidado Anual para reporte oficial
  const annualReportCard = useMemo(() => {
    return calculateStudentAnnualReportCard({
      enrollmentId: activeEnrollment?.id || '',
      studentId: activeStudent?.id || '',
      studentName: studentProfile ? `${studentProfile.apellidos}, ${studentProfile.nombres}` : `${activeStudent?.apellidos || ''}, ${activeStudent?.nombres || ''}`.trim() || 'Estudiante',
      studentDni: studentProfile?.dni || activeStudent?.dni || '—',
      studentCode: activeStudent?.codigo_estudiante || '—',
      gradeLevelName: activeEnrollment?.seccion?.grado?.nombre || activeChild?.grado_nombre || 'Sin grado asignado',
      sectionLetter: activeEnrollment?.seccion?.letra || activeChild?.seccion_letra || '-',
      academicYear: 2026,
      tutorName: tutorDisplayName,
      courses: studentCourses,
      grades,
      evaluationPeriodIds: evaluationPeriods.map(p => ({ id: p.id, numero_periodo: p.numero_periodo })),
      attendancePercentage: realAttendancePercentage,
      conductGrade: studentGradesAll.length > 0 ? (averageLetter || 'A') : undefined,
    });
  }, [activeEnrollment, activeStudent, studentProfile, activeChild, tutorDisplayName, studentCourses, grades, evaluationPeriods, realAttendancePercentage, studentGradesAll, averageLetter]);

  // Cursos analizados con sus promedios
  const analyzedCourses = useMemo(() => {
    return studentCourses.map(course => {
      const courseCompetencies = course.competencias || [];
      const courseGrades = grades.filter(g => {
        const matchEnrollment = g.matricula_id === activeEnrollment?.id;
        const matchComp = courseCompetencies.some(c => c.id === g.competencia_id);
        const matchPeriod = selectedBimestreId === 'todos' || g.periodo_evaluacion_id === selectedBimestreId;
        return matchEnrollment && matchComp && matchPeriod;
      });

      const letters = courseGrades.map(g => g.nota_letra);
      const avg = calculateAverage(letters);

      return {
        course,
        competencies: courseCompetencies,
        gradesList: courseGrades,
        avgLetter: avg.averageLetter,
        avgScore: avg.averageScore,
        gradeCount: avg.count,
      };
    });
  }, [studentCourses, grades, activeEnrollment?.id, selectedBimestreId]);

  // Cursos filtrados por búsqueda y por escala (AD, A, B, C)
  const filteredCourses = useMemo(() => {
    return analyzedCourses.filter(({ course, avgLetter, gradeCount }) => {
      const matchSearch = !courseSearch.trim() || 
        course.nombre.toLowerCase().includes(courseSearch.toLowerCase()) || 
        course.codigo.toLowerCase().includes(courseSearch.toLowerCase());
      
      const matchGrade = gradeFilter === 'todos' || (gradeCount > 0 && avgLetter === gradeFilter);

      return matchSearch && matchGrade;
    });
  }, [analyzedCourses, courseSearch, gradeFilter]);

  // Estadísticas para el Diagnóstico
  const performanceStats = useMemo(() => {
    let adCourses: string[] = [];
    let aCourses: string[] = [];
    let bCourses: string[] = [];
    let cCourses: string[] = [];

    analyzedCourses.forEach(({ course, avgLetter, gradeCount }) => {
      if (gradeCount === 0) return;
      if (avgLetter === 'AD') adCourses.push(course.nombre);
      else if (avgLetter === 'A') aCourses.push(course.nombre);
      else if (avgLetter === 'B') bCourses.push(course.nombre);
      else if (avgLetter === 'C') cCourses.push(course.nombre);
    });

    return {
      adCourses,
      aCourses,
      bCourses,
      cCourses,
      total: analyzedCourses.length,
      promoted: annualReportCard.finalAcademicStatus === 'PROMOVIDO'
    };
  }, [analyzedCourses, annualReportCard]);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    const childObj = availableChildren.find(c => c.id === childId || c.estudiante_id === childId);
    if (childObj) {
      showToast(
        `Viendo calificaciones de ${childObj.nombre} ${childObj.apellidos} (${childObj.grado_nombre})`,
        'info',
        'Estudiante Seleccionado'
      );
    }
  };

  const handleDownloadPdf = async () => {
    if (!activeEnrollment || !activeStudent) return;
    try {
      const studentGradesFiltered = grades.filter(g => g.matricula_id === activeEnrollment.id);
      const doc = await generateReportCardPdf({
        student: activeStudent,
        enrollment: activeEnrollment,
        courses: studentCourses,
        grades: studentGradesFiltered,
        evaluationPeriods,
        brandingConfig,
        tutorName: activeChild?.tutor_nombre,
      });
      doc.save(`Libreta_Oficial_CNEB_${activeStudent.apellidos || ''}_${activeStudent.nombres || ''}.pdf`);
      showToast('Libreta Oficial CNEB descargada en PDF', 'success', 'Descarga');
    } catch (err) {
      console.error(err);
      showToast('Error al generar la libreta PDF', 'error');
    }
  };

  const hasAnyGrades = studentGradesAll.length > 0;
  const averageMeta = getGradeMeta(averageLetter);
  const attendanceShown = activeChild ? activeChild.asistencia_porcentaje : realAttendancePercentage;
  const hasAttendance = activeChild ? true : studentAttendances.length > 0;
  const studentFirstName = studentProfile?.nombres?.split(' ')[0] || activeStudent?.nombres || 'Estudiante';
  const classroomName = activeEnrollment?.seccion?.grado?.nombre
    ? `${activeEnrollment.seccion.grado.nombre} "${activeEnrollment.seccion.letra}"`
    : 'Sin aula asignada';

  const gradedCourses = analyzedCourses.filter(c => c.gradeCount > 0);
  const countByLetter = (letter: 'AD' | 'A' | 'B' | 'C') => gradedCourses.filter(c => c.avgLetter === letter).length;

  const toggleCourse = (id: string) => {
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const allExpanded = filteredCourses.length > 0 && filteredCourses.every(c => expandedCourses.has(c.course.id));

  // Informe oficial: se muestra recortado al alto disponible y, solo si no entra, aparece el botón para desplegarlo
  const informeRef = useRef<HTMLDivElement>(null);
  const [informeMaxHeight, setInformeMaxHeight] = useState<number | null>(null);
  const [informeOverflows, setInformeOverflows] = useState(false);
  const [informeExpanded, setInformeExpanded] = useState(false);

  useEffect(() => {
    if (activeTab !== 'anual') return;
    const el = informeRef.current;
    if (!el) return;
    const BUTTON_SPACE = 56;
    const compute = () => {
      const main = el.closest('main');
      const top = el.getBoundingClientRect().top + (main?.scrollTop ?? 0);
      const mainPad = main ? parseFloat(getComputedStyle(main).paddingBottom) || 0 : 0;
      const available = Math.max(320, Math.floor(window.innerHeight - top - mainPad - BUTTON_SPACE));
      setInformeMaxHeight(available);
      setInformeOverflows(el.scrollHeight > available + 1);
    };
    compute();
    window.addEventListener('resize', compute);
    const observer = new ResizeObserver(compute);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      window.removeEventListener('resize', compute);
      observer.disconnect();
    };
  }, [activeTab, annualReportCard]);

  const informeCollapsed = informeOverflows && !informeExpanded && informeMaxHeight !== null;

  const SCALE = [
    { letter: 'AD', label: 'Logro destacado', desc: 'Supera lo esperado para su grado', dot: 'bg-purple-500' },
    { letter: 'A', label: 'Logro esperado', desc: 'Logra lo que se espera en su grado', dot: 'bg-emerald-500' },
    { letter: 'B', label: 'En proceso', desc: 'Está cerca; necesita practicar un poco más', dot: 'bg-amber-500' },
    { letter: 'C', label: 'En inicio', desc: 'Necesita apoyo para lograrlo', dot: 'bg-rose-500' },
  ] as const;

  const barColor = (letter: string | null) =>
    letter === 'AD' ? 'bg-purple-500' : letter === 'A' ? 'bg-emerald-500' : letter === 'B' ? 'bg-amber-500' : 'bg-rose-500';

  const tabs = [
    { id: 'cursos' as const, label: isApoderadoOrAdmin ? 'Notas por curso' : 'Mis cursos', icon: Layers },
    { id: 'resumen' as const, label: 'Resumen', icon: BarChart3 },
    { id: 'anual' as const, label: 'Libreta oficial', icon: FileText },
  ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in duration-200">

      {/* ── ENCABEZADO: título + acciones ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {isApoderadoOrAdmin ? `Libreta de notas de ${studentFirstName}` : 'Mi libreta de notas'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Año escolar {annualReportCard.academicYear} · {classroomName} · Escala CNEB (MINEDU)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Imprimir la libreta"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            title="Descargar la libreta oficial CNEB en PDF"
          >
            <Download className="w-4 h-4" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* ── SELECTOR DE HIJO (apoderado / admin) ── */}
      {isApoderadoOrAdmin && availableChildren.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Ver libreta de:
          </span>
          {availableChildren.map((child) => {
            const isSelected = (activeChild?.id === child.id) || (activeChild?.estudiante_id === child.estudiante_id);
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => handleSelectChild(child.id)}
                className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={child.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                  alt={child.nombre}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span>{child.nombre}</span>
                <span className={`text-[10px] font-medium ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {child.grado_nombre} &quot;{child.seccion_letra}&quot;
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── RESUMEN DEL AÑO: 4 datos clave ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="col-span-2 lg:col-span-1 flex items-center gap-3 p-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={studentProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={studentProfile?.nombres || 'Estudiante'}
            className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 dark:text-white truncate">
              {studentProfile?.nombres} {studentProfile?.apellidos}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Tutor(a): {tutorDisplayName}</p>
            <p className="text-[11px] text-slate-400 font-mono truncate">Código {activeStudent?.codigo_estudiante || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-3xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/60">
          {hasAnyGrades ? <GradeBadge grade={averageLetter} size="lg" /> : (
            <span className="w-11 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 font-black flex items-center justify-center">—</span>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Promedio general</p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {hasAnyGrades ? averageMeta.label.replace(/^\w+ \((.*)\)$/, '$1') : 'Aún sin notas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/60">
          <span className="w-11 h-9 rounded-lg bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Asistencia</p>
            <p className="text-base font-black text-emerald-700 dark:text-emerald-300 leading-tight">
              {hasAttendance ? `${attendanceShown}%` : 'Sin registros'}
            </p>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 flex items-center gap-3 p-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="w-11 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Situación del año</p>
            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{hasAnyGrades ? annualReportCard.finalAcademicStatus : 'Año en curso'}</p>
            {hasAnyGrades && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Conducta: {annualReportCard.conductGrade}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── LEYENDA SIEMPRE VISIBLE: qué significa cada nota ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs print:hidden">
        <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-indigo-500" /> ¿Qué significa cada nota?
        </span>
        {SCALE.map(s => (
          <span key={s.letter} className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300" title={s.desc}>
            <GradeBadge grade={s.letter} size="sm" />
            <span className="font-semibold">{s.label}</span>
          </span>
        ))}
      </div>

      {/* ── PESTAÑAS ── */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl w-full sm:w-fit overflow-x-auto print:hidden">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === id
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ══ PESTAÑA: MIS CURSOS (acordeón compacto por curso) ══ */}
      {activeTab === 'cursos' && (
        <div className="space-y-3 animate-in fade-in-50 duration-200">

          {/* Barra de filtros en una sola fila */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 print:hidden">
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedBimestreId('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedBimestreId === 'todos' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
                }`}
              >
                Todo el año
              </button>
              {evaluationPeriods.map((period) => (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => setSelectedBimestreId(period.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedBimestreId === period.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
                  }`}
                >
                  {period.nombre}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto lg:ml-2">
              {(['todos', 'AD', 'A', 'B', 'C'] as const).map(letter => {
                const count = letter === 'todos' ? analyzedCourses.length : countByLetter(letter);
                const active = gradeFilter === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setGradeFilter(letter)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                      active
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {letter === 'todos' ? 'Todos' : letter} ({count})
                  </button>
                );
              })}
            </div>

            <div className="relative lg:ml-auto lg:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar curso"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              {filteredCourses.length} {filteredCourses.length === 1 ? 'curso' : 'cursos'} · toca un curso para ver sus competencias
            </span>
            {filteredCourses.length > 0 && (
              <button
                type="button"
                onClick={() => setExpandedCourses(allExpanded ? new Set() : new Set(filteredCourses.map(c => c.course.id)))}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer print:hidden"
              >
                {allExpanded ? 'Contraer todo' : 'Ver todo'}
              </button>
            )}
          </div>

          {filteredCourses.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">No hay cursos con esos filtros</p>
              <button
                type="button"
                onClick={() => { setGradeFilter('todos'); setCourseSearch(''); }}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer"
              >
                Quitar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-start">
              {filteredCourses.map(({ course, competencies, gradesList, avgLetter, avgScore, gradeCount }) => {
                const isOpen = expandedCourses.has(course.id);
                const graded = gradeCount > 0;
                const pct = graded ? Math.round((avgScore / 4) * 100) : 0;
                return (
                  <div
                    key={course.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden transition-colors ${
                      isOpen ? 'border-indigo-300 dark:border-indigo-800' : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCourse(course.id)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center gap-3 px-3.5 py-3 text-left cursor-pointer"
                    >
                      <span
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0"
                        style={{ backgroundColor: course.color_hex || '#4f46e5' }}
                      >
                        {course.nombre.substring(0, 2).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{course.nombre}</p>
                        {graded ? (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div className={`h-full rounded-full ${barColor(avgLetter)}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                              {competencies.length} comp.
                            </span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 mt-0.5">Aún sin notas · {competencies.length} competencias</p>
                        )}
                      </div>
                      {graded ? <GradeBadge grade={avgLetter} size="md" /> : (
                        <span className="min-w-[34px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-sm font-black text-center">—</span>
                      )}
                      <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {isOpen && (
                      <ul className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 animate-in fade-in-50">
                        {competencies.map((comp) => {
                          const compGrade = gradesList.find(g => g.competencia_id === comp.id);
                          return (
                            <li key={comp.id} className="px-3.5 py-2.5 flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{comp.descripcion}</p>
                                {compGrade?.conclusion_descriptiva && (
                                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed flex gap-1.5">
                                    <MessageCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                    <span>&ldquo;{compGrade.conclusion_descriptiva}&rdquo;</span>
                                  </p>
                                )}
                              </div>
                              {compGrade ? <GradeBadge grade={compGrade.nota_letra} size="sm" /> : (
                                <span className="text-[11px] font-semibold text-slate-400 shrink-0">Sin calificar</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ PESTAÑA: RESUMEN (fortalezas y qué reforzar, con datos reales) ══ */}
      {activeTab === 'resumen' && (
        <div className="space-y-3 animate-in fade-in-50 duration-200">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {SCALE.map(s => (
              <button
                key={s.letter}
                type="button"
                onClick={() => { setGradeFilter(s.letter); setActiveTab('cursos'); }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 text-left transition-colors cursor-pointer"
                title={`Ver cursos con ${s.letter}`}
              >
                <GradeBadge grade={s.letter} size="lg" />
                <div className="min-w-0">
                  <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{countByLetter(s.letter)}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{s.label}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Cómo voy en cada curso
              </h3>
              {gradedCourses.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">Cuando tus profesores registren notas, aquí verás tu avance por curso.</p>
              ) : (
                <div className="space-y-2">
                  {gradedCourses.map(({ course, avgLetter, avgScore }) => (
                    <div key={course.id} className="flex items-center gap-3">
                      <span className="w-28 sm:w-36 text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{course.nombre}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(avgLetter)}`} style={{ width: `${Math.round((avgScore / 4) * 100)}%` }} />
                      </div>
                      <GradeBadge grade={avgLetter} size="sm" />
                    </div>
                  ))}
                  {analyzedCourses.length > gradedCourses.length && (
                    <p className="pt-1 text-[11px] text-slate-400">
                      {analyzedCourses.length - gradedCourses.length} cursos aún sin notas.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div className="p-4 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50">
                <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <Star className="w-4 h-4" /> {isApoderadoOrAdmin ? 'Sus fortalezas' : 'Tus fortalezas'}
                </h3>
                <p className="mt-1 text-xs text-emerald-900/80 dark:text-emerald-200/80">
                  {performanceStats.adCourses.length + performanceStats.aCourses.length > 0
                    ? [...performanceStats.adCourses, ...performanceStats.aCourses].join(', ')
                    : 'Aún no hay cursos con logro A o AD.'}
                </p>
              </div>
              <div className="p-4 rounded-3xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
                <h3 className="text-sm font-black text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <Flame className="w-4 h-4" /> Para reforzar
                </h3>
                <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
                  {performanceStats.bCourses.length + performanceStats.cCourses.length > 0
                    ? `${[...performanceStats.cCourses, ...performanceStats.bCourses].join(', ')}. Pide ayuda a tu profesor y practica un poco cada día.`
                    : hasAnyGrades ? '¡Nada por ahora! Sigue así.' : 'Todavía no hay notas registradas.'}
                </p>
              </div>
              <div className="p-4 rounded-3xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50">
                <h3 className="text-sm font-black text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Consejo
                </h3>
                <p className="mt-1 text-xs text-indigo-900/80 dark:text-indigo-200/80">
                  Estudia un rato fijo cada día y revisa tus tareas pendientes antes de dormir.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PESTAÑA: LIBRETA OFICIAL (consolidado anual MINEDU / SIAGIE) ══ */}
      {activeTab === 'anual' && (
        <div className="space-y-3 animate-in fade-in-50 duration-200">
          <div className="relative">
            <div
              ref={informeRef}
              className={informeCollapsed ? 'overflow-hidden max-h-[var(--informe-max)] print:max-h-none print:overflow-visible' : ''}
              style={informeCollapsed ? ({ '--informe-max': `${informeMaxHeight}px` } as React.CSSProperties) : undefined}
            >
              <AnnualReportCardView reportCard={annualReportCard} showPrintButton={false} />
            </div>
            {informeCollapsed && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent print:hidden" />
            )}
          </div>

          {informeOverflows && (
            <div className="flex justify-center print:hidden">
              <button
                type="button"
                onClick={() => setInformeExpanded(v => !v)}
                aria-expanded={informeExpanded}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs font-black text-indigo-600 dark:text-indigo-400 shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${informeExpanded ? 'rotate-180' : ''}`} />
                {informeExpanded ? 'Contraer informe' : 'Ver informe completo'}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
