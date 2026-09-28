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
  Sparkles,
} from 'lucide-react';

// Dibujo y mensaje de ánimo para cada nota (pensado para estudiantes)
const GRADE_EMOJI = { AD: '🌟', A: '🎉', B: '💪', C: '🌱' } as const;
const GRADE_CHEER = {
  AD: '¡Vas excelente! Estás superando lo esperado. Sigue así. 🏆',
  A: '¡Muy bien! Estás logrando lo que se espera. Puedes llegar a AD. 🚀',
  B: '¡Vas cerca! Repasa un poco cada día y verás cómo subes. 💪',
  C: 'Este bimestre es para aprender: pide ayuda a tus profesores, ¡tú puedes! 🌱',
} as const;

function courseEmoji(name?: string) {
  const n = (name || '').toLowerCase();
  if (n.includes('matem')) return '🔢';
  if (n.includes('comunic')) return '📖';
  if (n.includes('cienc') || n.includes('tecnol')) return '🌱';
  if (n.includes('social') || n.includes('historia')) return '🌎';
  if (n.includes('arte') || n.includes('cultura')) return '🎨';
  if (n.includes('ingl')) return '🗣️';
  if (n.includes('físic') || n.includes('fisic')) return '⚽';
  if (n.includes('relig')) return '🙏';
  if (n.includes('comput') || n.includes('robot')) return '💻';
  return '📘';
}

// Dibujo amigable: libreta con estrella y medalla
function ReportCardIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <circle cx="80" cy="62" r="50" className="fill-white/60 dark:fill-white/5" />
      <rect x="42" y="20" width="64" height="86" rx="10" className="fill-white dark:fill-slate-800" stroke="#a855f7" strokeWidth="3" />
      <rect x="52" y="34" width="30" height="6" rx="3" fill="#d8b4fe" />
      <rect x="52" y="48" width="44" height="5" rx="2.5" fill="#e9d5ff" />
      <rect x="52" y="60" width="44" height="5" rx="2.5" fill="#e9d5ff" />
      <rect x="52" y="72" width="30" height="5" rx="2.5" fill="#e9d5ff" />
      <rect x="84" y="30" width="14" height="14" rx="4" fill="#10b981" />
      <text x="91" y="41" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff">A</text>
      <circle cx="118" cy="82" r="16" fill="#fbbf24" />
      <path d="M118 72 l3 6.5 l7 1 l-5 5 l1.2 7 l-6.2 -3.3 l-6.2 3.3 l1.2 -7 l-5 -5 l7 -1 Z" fill="#fff" />
      <path d="M108 96 l-4 16 l8 -4 l6 6 l2 -14 Z" fill="#f472b6" />
      <path d="M24 30 l3 6 l6 1 l-4.5 4.5 l1 6.5 l-5.5 -3 l-5.5 3 l1 -6.5 l-4.5 -4.5 l6 -1 Z" fill="#a855f7" />
    </svg>
  );
}

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
    { letter: 'AD', label: 'Logro destacado', desc: 'Supera lo esperado para su grado', kid: '¡Lo haces genial!', dot: 'bg-purple-500' },
    { letter: 'A', label: 'Logro esperado', desc: 'Logra lo que se espera en su grado', kid: '¡Lo lograste!', dot: 'bg-emerald-500' },
    { letter: 'B', label: 'En proceso', desc: 'Está cerca; necesita practicar un poco más', kid: 'Ya casi, practica un poco más', dot: 'bg-amber-500' },
    { letter: 'C', label: 'En inicio', desc: 'Necesita apoyo para lograrlo', kid: 'Pide ayuda, ¡tú puedes!', dot: 'bg-rose-500' },
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

      {/* ── CABECERA AMIGABLE: título, resumen en chips y acciones ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-100 via-amber-50 to-sky-100 dark:from-purple-950/50 dark:via-slate-900 dark:to-sky-950/40 border border-purple-200/70 dark:border-purple-900/60 px-5 py-4 sm:px-6 print:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {isApoderadoOrAdmin ? 'Libreta de notas de ' : 'Mi libreta de notas'}
              <span className="text-purple-600 dark:text-purple-300">{isApoderadoOrAdmin ? studentFirstName : ` · ${studentFirstName}`}</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {isApoderadoOrAdmin ? 'Así va en cada curso.' : 'Aquí ves cómo vas en cada curso y qué puedes mejorar.'} Año {annualReportCard.academicYear} · {classroomName}
              {tutorDisplayName !== 'No asignado' ? ` · Tutor(a): ${tutorDisplayName}` : ''}
            </p>
            <div className="flex flex-wrap gap-2 pt-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200">
                {hasAnyGrades ? <>{GRADE_EMOJI[averageLetter as keyof typeof GRADE_EMOJI]} Promedio {averageLetter} · {averageMeta.label.replace(/^\w+ \((.*)\)$/, '$1')}</> : <>⏳ Aún sin notas</>}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200">
                📚 {gradedCourses.length} de {analyzedCourses.length} cursos con nota
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200">
                ✅ Asistencia {hasAttendance ? `${attendanceShown}%` : 'sin registros'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200">
                🎓 {hasAnyGrades ? annualReportCard.finalAcademicStatus : 'Año en curso'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <ReportCardIllustration className="hidden md:block w-28 h-20 animate-float" />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="Imprimir la libreta"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Descargar la libreta oficial en PDF"
              >
                <Download className="w-3.5 h-3.5" /> Descargar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de ánimo según el promedio */}
      <p className="px-1 text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 print:hidden">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
        {!hasAnyGrades
          ? 'Cuando tus profesores registren tus notas, aparecerán aquí. ¡Sigue esforzándote!'
          : GRADE_CHEER[averageLetter as keyof typeof GRADE_CHEER]}
      </p>

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
                {child.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={child.avatar_url} alt={child.nombre} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center text-[10px] font-black">
                    {`${child.nombre?.[0] || ''}${child.apellidos?.[0] || ''}`.toUpperCase()}
                  </span>
                )}
                <span>{child.nombre}</span>
                <span className={`text-[10px] font-medium ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {child.grado_nombre} &quot;{child.seccion_letra}&quot;
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── LEYENDA CON DIBUJOS: qué significa cada nota ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 print:hidden">
        {SCALE.map(s => (
          <div key={s.letter} className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800" title={s.desc}>
            <span className="text-2xl" aria-hidden="true">{GRADE_EMOJI[s.letter]}</span>
            <GradeBadge grade={s.letter} size="sm" />
            <span className="min-w-0">
              <span className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">{s.label}</span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{s.kid}</span>
            </span>
          </div>
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
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${course.color_hex || '#8b5cf6'}22` }}
                      >
                        <span className="text-xl" aria-hidden="true">{courseEmoji(course.nombre)}</span>
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
