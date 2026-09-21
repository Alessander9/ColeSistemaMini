'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { AnnualReportCardView } from '@/components/notas/AnnualReportCardView';
import { calculateAverage, calculateAnnualStatus, calculateStudentAnnualReportCard } from '@/lib/grades/calculations';
import { generateReportCardPdf } from '@/lib/pdf/reportCardPdfGenerator';
import { 
  Printer, 
  FileText, 
  Layers, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Search, 
  ChevronRight, 
  Heart, 
  BookOpen, 
  AlertCircle, 
  GraduationCap, 
  BarChart3, 
  HelpCircle,
  FileCheck2,
  CheckSquare,
  Star,
  Flame,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  MessageCircle,
  ArrowUpRight,
  Info,
  Check,
  Download,
  Filter
} from 'lucide-react';

export default function EstudianteLibretaNotasPage() {
  const { 
    users,
    students, 
    enrollments, 
    sections,
    gradeLevels,
    courses, 
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
  const [activeTab, setActiveTab] = useState<'anual' | 'bimestral' | 'diagnostico'>('anual');
  const [selectedBimestreId, setSelectedBimestreId] = useState<string>('todos');
  const [gradeFilter, setGradeFilter] = useState<'todos' | 'AD' | 'A' | 'B' | 'C'>('todos');
  const [courseSearch, setCourseSearch] = useState('');
  const [showScaleHelp, setShowScaleHelp] = useState(false);

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
      courses,
      grades,
      evaluationPeriodIds: evaluationPeriods.map(p => ({ id: p.id, numero_periodo: p.numero_periodo })),
      attendancePercentage: realAttendancePercentage,
      conductGrade: studentGradesAll.length > 0 ? (averageLetter || 'A') : undefined,
    });
  }, [activeEnrollment, activeStudent, studentProfile, activeChild, tutorDisplayName, courses, grades, evaluationPeriods, realAttendancePercentage, studentGradesAll, averageLetter]);

  // Cursos analizados con sus promedios
  const analyzedCourses = useMemo(() => {
    return courses.map(course => {
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
      };
    });
  }, [courses, grades, activeEnrollment?.id, selectedBimestreId]);

  // Cursos filtrados por búsqueda y por escala (AD, A, B, C)
  const filteredCourses = useMemo(() => {
    return analyzedCourses.filter(({ course, avgLetter }) => {
      const matchSearch = !courseSearch.trim() || 
        course.nombre.toLowerCase().includes(courseSearch.toLowerCase()) || 
        course.codigo.toLowerCase().includes(courseSearch.toLowerCase());
      
      const matchGrade = gradeFilter === 'todos' || avgLetter === gradeFilter;

      return matchSearch && matchGrade;
    });
  }, [analyzedCourses, courseSearch, gradeFilter]);

  // Estadísticas para el Diagnóstico
  const performanceStats = useMemo(() => {
    let adCourses: string[] = [];
    let aCourses: string[] = [];
    let bCourses: string[] = [];
    let cCourses: string[] = [];

    analyzedCourses.forEach(({ course, avgLetter }) => {
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
        courses,
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      
      {/* ── HEADER PRINCIPAL ELEGANTE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/25 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Libreta de Calificaciones Escolar
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Año Lectivo 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Boletín oficial del progreso de aprendizaje y competencias según normativa MINEDU / SIAGIE.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-2xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 transition-all active:scale-95 cursor-pointer"
            title="Descargar Libreta Oficial CNEB en PDF vectorizado"
          >
            <Download className="w-4 h-4" />
            <span>Descargar PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setShowScaleHelp(!showScaleHelp)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
              showScaleHelp
                ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
            title="Ver qué significa cada nota (AD, A, B, C)"
          >
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline">Guía de Notas</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
            title="Imprimir libreta oficial o guardar en PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* ── MODAL / DESPLEGABLE: GUÍA DE NOTAS CNEB FÁCIL PARA PADRES ── */}
      {showScaleHelp && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-indigo-700/50 shadow-xl space-y-3 animate-in zoom-in-95 duration-150 print:hidden">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              ¿Qué significan las calificaciones de mi hijo? (Escala Oficial CNEB)
            </h4>
            <button
              onClick={() => setShowScaleHelp(false)}
              className="text-xs text-slate-400 hover:text-white font-bold"
            >
              Entendido ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-700/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-lg bg-purple-500 text-white font-black text-xs flex items-center justify-center">AD</span>
                <strong className="text-purple-300 font-extrabold">Logro Destacado</strong>
              </div>
              <p className="text-[11px] text-purple-200/80 leading-tight">
                Supera con excelencia los aprendizajes esperados para el grado escolar.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-700/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-black text-xs flex items-center justify-center">A</span>
                <strong className="text-emerald-300 font-extrabold">Logro Esperado</strong>
              </div>
              <p className="text-[11px] text-emerald-200/80 leading-tight">
                Alcanza de manera sólida y satisfactoria el nivel y competencias requeridas.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-700/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center">B</span>
                <strong className="text-amber-300 font-extrabold">En Proceso</strong>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-tight">
                Está cerca de lograrlo, pero requiere acompañamiento y práctica adicional.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-700/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-lg bg-rose-500 text-white font-black text-xs flex items-center justify-center">C</span>
                <strong className="text-rose-300 font-extrabold">En Inicio</strong>
              </div>
              <p className="text-[11px] text-rose-200/80 leading-tight">
                Muestra dificultades importantes y requiere un plan de recuperación pedagógica.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SELECTOR MULTI-HIJO EN LA MISMA PESTAÑA (Para Familias con 1 o más hijos) ── */}
      {isApoderadoOrAdmin && availableChildren.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white border border-indigo-700/40 shadow-xl relative overflow-hidden print:hidden">
          {/* Ambient decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
                    <span>Hijos Matriculados (Cambiar Estudiante)</span>
                    <span className="text-[10px] bg-pink-500/30 text-pink-200 px-2 py-0.2 rounded-full font-bold">
                      {availableChildren.length} Hijos
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Haz clic en el estudiante para alternar su libreta, notas y competencias en tiempo real:
                  </p>
                </div>
              </div>
            </div>

            {/* Children Cards Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {availableChildren.map((child) => {
                const isSelected = (activeChild?.id === child.id) || (activeChild?.estudiante_id === child.estudiante_id);
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => handleSelectChild(child.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
                      isSelected
                        ? 'bg-white text-slate-900 border-pink-400 shadow-xl shadow-pink-500/20 ring-2 ring-pink-400/40'
                        : 'bg-white/10 hover:bg-white/15 text-white border-white/15 hover:border-white/30'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={child.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                        alt={child.nombre}
                        className={`w-12 h-12 rounded-2xl object-cover border-2 ${
                          isSelected ? 'border-pink-500 shadow-sm' : 'border-white/30'
                        }`}
                      />
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-black truncate ${isSelected ? 'text-slate-900' : 'text-white'}`}>
                          {child.nombre}
                        </p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                          isSelected 
                            ? 'bg-pink-100 text-pink-700' 
                            : 'bg-white/20 text-pink-300'
                        }`}>
                          {child.promedio_letra || 'AD'}
                        </span>
                      </div>
                      <p className={`text-[11px] font-bold truncate mt-0.5 ${isSelected ? 'text-indigo-700' : 'text-indigo-300'}`}>
                        {child.grado_nombre} &quot;{child.seccion_letra}&quot;
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span className={`font-extrabold flex items-center gap-1 ${isSelected ? 'text-emerald-700' : 'text-emerald-400'}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {child.asistencia_porcentaje}% Asist.
                        </span>
                        <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>•</span>
                        <span className={`font-semibold ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>
                          {child.nivel.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CARD RESUMEN Y ESTADO ACADÉMICO DEL ALUMNO ACTIVO ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={studentProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={studentProfile?.nombres}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-indigo-500 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-indigo-600 text-white shadow-sm border border-white dark:border-slate-900">
              {activeEnrollment?.seccion?.grado?.nivel || 'PRIMARIA'}
            </span>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white truncate">
                {studentProfile?.apellidos}, {studentProfile?.nombres}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {annualReportCard.finalAcademicStatus}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Código: <strong className="font-mono text-slate-700 dark:text-slate-300">{activeStudent?.codigo_estudiante || '—'}</strong></span>
              <span>•</span>
              <span>DNI: <strong className="font-mono text-slate-700 dark:text-slate-300">{studentProfile?.dni || activeStudent?.dni || '—'}</strong></span>
              <span>•</span>
              <span>Salón: <strong className="text-indigo-600 dark:text-indigo-400">{activeEnrollment?.seccion?.grado?.nombre ? `${activeEnrollment.seccion.grado.nombre} "${activeEnrollment.seccion.letra}"` : 'Sin aula asignada'}</strong></span>
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Tutor(a): <strong className="text-slate-700 dark:text-slate-300">{tutorDisplayName}</strong>
            </p>
          </div>
        </div>

        {/* Mini KPIs */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
          
          <div className="flex-1 sm:flex-initial p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 text-center min-w-[100px]">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
              Promedio General
            </span>
            <div className="flex items-center justify-center gap-2">
              <GradeBadge grade={averageLetter} size="md" />
              <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 font-mono">
                {averageScore}
              </span>
            </div>
          </div>

          <div className="flex-1 sm:flex-initial p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 text-center min-w-[100px]">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
              Asistencia Anual
            </span>
            <span className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono">
              {activeChild?.asistencia_porcentaje || 98}%
            </span>
          </div>

          <div className="flex-1 sm:flex-initial p-3 rounded-2xl bg-purple-50/80 dark:bg-purple-950/50 border border-purple-200/80 dark:border-purple-800/60 text-center min-w-[100px]">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-0.5">
              Conducta
            </span>
            <span className="text-base font-black text-purple-700 dark:text-purple-300">
              AD (Excelente)
            </span>
          </div>

        </div>
      </div>

      {/* ── BARRA DE PESTAÑAS PRINCIPALES (TABS) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2 print:hidden">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full">
          
          <button
            onClick={() => setActiveTab('anual')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'anual'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Libreta Anual Consolidada (4 Bimestres)</span>
          </button>
          
          <button
            onClick={() => setActiveTab('bimestral')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'bimestral'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Desglose Bimestral & Competencias</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostico')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'diagnostico'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>3. Diagnóstico & Fortalezas</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════════
          SECCIÓN 1: LIBRETA ANUAL CONSOLIDADA (4 BIMESTRES - MINEDU / SIAGIE)
         ══════════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'anual' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          
          {/* Banner explicativo del consolidado anual */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Acta Oficial de Evaluación Integral {annualReportCard.academicYear}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Consolidado anual de los 4 bimestres lectivos con validación digital y conclusión descriptiva final por materia.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-xs">
                {annualReportCard.finalAcademicStatus}
              </span>
            </div>
          </div>

          {/* Componente de Libreta Oficial */}
          <AnnualReportCardView reportCard={annualReportCard} showPrintButton={false} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════════
          SECCIÓN 2: DESGLOSE BIMESTRAL & COMPETENCIAS (INTERACTIVO Y CLARO)
         ══════════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'bimestral' && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          
          {/* Filtros Interactivos: Periodos + Escalas + Buscador */}
          <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 print:hidden">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Selector de Bimestre */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Filtrar por Periodo Escolar:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedBimestreId('todos')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedBimestreId === 'todos'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    ✨ Todos los Bimestres
                  </button>
                  {evaluationPeriods.map((period) => (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => setSelectedBimestreId(period.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedBimestreId === period.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {period.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buscador de Cursos */}
              <div className="space-y-1.5 min-w-[240px]">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-purple-600" />
                  Buscar Materia:
                </span>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ej. Matemática, Comunicación..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

            </div>

            {/* Filtros Rápidos por Nivel de Logro (AD, A, B, C) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-bold mr-1">Filtrar por Logro:</span>
                
                <button
                  type="button"
                  onClick={() => setGradeFilter('todos')}
                  className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                    gradeFilter === 'todos'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  Todas ({analyzedCourses.length})
                </button>

                <button
                  type="button"
                  onClick={() => setGradeFilter('AD')}
                  className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                    gradeFilter === 'AD'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                  }`}
                >
                  AD: Destacado ({analyzedCourses.filter(c => c.avgLetter === 'AD').length})
                </button>

                <button
                  type="button"
                  onClick={() => setGradeFilter('A')}
                  className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                    gradeFilter === 'A'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  A: Esperado ({analyzedCourses.filter(c => c.avgLetter === 'A').length})
                </button>

                <button
                  type="button"
                  onClick={() => setGradeFilter('B')}
                  className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                    gradeFilter === 'B'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                  }`}
                >
                  B: En Proceso ({analyzedCourses.filter(c => c.avgLetter === 'B').length})
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-medium">
                Mostrando {filteredCourses.length} de {analyzedCourses.length} cursos
              </span>
            </div>

          </div>

          {/* Listado de Cursos & Tarjetas de Competencias */}
          <div className="space-y-4">
            {filteredCourses.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
                <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-extrabold text-base text-slate-700 dark:text-slate-300">
                  No se encontraron materias con los filtros seleccionados
                </p>
                <p className="text-xs text-slate-400">
                  Prueba cambiando el filtro de notas o limpiando la búsqueda.
                </p>
                <button
                  onClick={() => { setGradeFilter('todos'); setCourseSearch(''); }}
                  className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Restablecer Filtros
                </button>
              </div>
            ) : (
              filteredCourses.map(({ course, competencies, gradesList, avgLetter, avgScore }) => {
                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-800/60 transition-all"
                  >
                    {/* Course Header Bar */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50/50 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div 
                          className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white shadow-md shrink-0 text-sm"
                          style={{ backgroundColor: course.color_hex || '#4f46e5' }}
                        >
                          {course.nombre.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-base text-slate-900 dark:text-white">
                              {course.nombre}
                            </h4>
                            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                              {course.codigo}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            Área Curricular Oficial • {competencies.length} Competencias evaluadas
                          </p>
                        </div>
                      </div>

                      {/* Grade Badge Summary */}
                      <div className="flex items-center gap-3 self-start sm:self-center">
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            Nivel del Curso
                          </p>
                          <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 font-mono">
                            Puntaje: {avgScore.toFixed(1)} / 20
                          </p>
                        </div>
                        <GradeBadge grade={avgLetter} size="lg" />
                      </div>
                    </div>

                    {/* Competencies Table with descriptive bubbles */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {competencies.map((comp) => {
                        const compGrade = gradesList.find(g => g.competencia_id === comp.id);
                        const letter = compGrade?.nota_letra || 'A';

                        return (
                          <div
                            key={comp.id}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <div className="space-y-2 max-w-2xl">
                              <div className="flex items-start gap-2.5">
                                <span className="mt-0.5 px-2 py-0.5 rounded-md font-mono font-black text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                                  {comp.codigo}
                                </span>
                                <div>
                                  <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                                    {comp.descripcion}
                                  </h5>
                                </div>
                              </div>

                              {/* Teacher Descriptive Conclusion Box */}
                              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs flex items-start gap-2.5">
                                <MessageCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                                    Conclusión Descriptiva Docente
                                  </span>
                                  {compGrade?.conclusion_descriptiva ? (
                                    <p className="text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                                      &quot;{compGrade.conclusion_descriptiva}&quot;
                                    </p>
                                  ) : (
                                    <p className="text-slate-500 dark:text-slate-400 italic">
                                      Demuestra comprensión satisfactoria y progreso constante en las actividades y evaluaciones formativas del aula.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Badge with full label */}
                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                              <div className="text-right hidden md:block">
                                <span className="text-[10px] font-bold text-slate-400 block">Calificación</span>
                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                  {letter === 'AD' ? 'Logro Destacado' :
                                   letter === 'A' ? 'Logro Esperado' :
                                   letter === 'B' ? 'En Proceso' : 'En Inicio'}
                                </span>
                              </div>
                              <GradeBadge grade={letter} size="md" showLabel={true} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════════
          SECCIÓN 3: DIAGNÓSTICO & FORTALEZAS (CLARO Y ACCIONABLE PARA PADRES)
         ══════════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'diagnostico' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          
          {/* 4 Categorías de Logro Visuales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Logro Destacado AD */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-sm">
                  AD
                </span>
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-purple-100 uppercase tracking-wider">Logro Destacado</p>
                <h4 className="text-3xl font-black mt-0.5">
                  {performanceStats.adCourses.length} <span className="text-xs font-medium text-purple-200">Materias</span>
                </h4>
              </div>
              <p className="text-[11px] text-purple-100 leading-tight">
                Supera ampliamente el estándar del grado con gran autonomía.
              </p>
            </div>

            {/* Logro Esperado A */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-sm">
                  A
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Logro Esperado</p>
                <h4 className="text-3xl font-black mt-0.5">
                  {performanceStats.aCourses.length} <span className="text-xs font-medium text-emerald-200">Materias</span>
                </h4>
              </div>
              <p className="text-[11px] text-emerald-100 leading-tight">
                Cumple satisfactoriamente con todos los objetivos del grado.
              </p>
            </div>

            {/* En Proceso B */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-sm">
                  B
                </span>
                <Flame className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-100 uppercase tracking-wider">En Proceso</p>
                <h4 className="text-3xl font-black mt-0.5">
                  {performanceStats.bCourses.length} <span className="text-xs font-medium text-amber-200">Materias</span>
                </h4>
              </div>
              <p className="text-[11px] text-amber-100 leading-tight">
                Requiere acompañamiento para consolidar los aprendizajes.
              </p>
            </div>

            {/* En Inicio C */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-sm">
                  C
                </span>
                <AlertCircle className="w-5 h-5 text-rose-200" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-100 uppercase tracking-wider">En Inicio</p>
                <h4 className="text-3xl font-black mt-0.5">
                  {performanceStats.cCourses.length} <span className="text-xs font-medium text-rose-200">Materias</span>
                </h4>
              </div>
              <p className="text-[11px] text-rose-100 leading-tight">
                Requiere plan de recuperación pedagógica intensivo.
              </p>
            </div>

          </div>

          {/* Gráfico Comparativo de Materias con Barras Visuales */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Mapa Comparativo de Rendimiento por Área Curricular
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Puntaje equivalente sobre la escala vigesimal oficial (0 a 20).
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {analyzedCourses.map(({ course, avgLetter, avgScore }) => {
                const percentage = Math.min(100, Math.max(10, (avgScore / 20) * 100));
                
                return (
                  <div key={course.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: course.color_hex || '#4f46e5' }} 
                        />
                        <span className="text-slate-800 dark:text-slate-200">{course.nombre}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-600 dark:text-slate-400">
                          {avgScore.toFixed(1)} / 20
                        </span>
                        <GradeBadge grade={avgLetter} size="sm" />
                      </div>
                    </div>

                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          avgLetter === 'AD' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
                          avgLetter === 'A' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                          avgLetter === 'B' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                          'bg-gradient-to-r from-rose-500 to-red-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recomendaciones Psicopedagógicas y Acompañamiento Familiar */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white border border-indigo-700/50 shadow-xl space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-lg text-white">
                  Recomendaciones de Tutoría & Acompañamiento en Casa
                </h4>
                <p className="text-xs text-indigo-200">
                  Estrategias recomendadas para potenciar el talento y hábitos de estudio de <strong className="text-white">{studentProfile?.nombres}</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 text-xs">
              
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-extrabold">
                  <Star className="w-4 h-4" />
                  <span>Fortalezas a Fomentar</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Destaca con notas <strong>AD</strong> en materias de razonamiento. Se sugiere motivarlo con proyectos de robótica, lectura científica o clubes escolares.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-extrabold">
                  <Clock className="w-4 h-4" />
                  <span>Hábitos & Rutina</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Mantener un horario fijo de 45 minutos de estudio diario y verificar las entregas en el portal de tareas antes de las 6:00 PM.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5">
                <div className="flex items-center gap-2 text-pink-300 font-extrabold">
                  <Heart className="w-4 h-4" />
                  <span>Bienestar Emocional</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Reconocer positivamente sus logros escolares de cada semana para fortalecer su autoconfianza y motivación formativa.
                </p>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
