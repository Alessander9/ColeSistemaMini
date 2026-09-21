'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  HeartHandshake, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  MessageCircle, 
  ShieldAlert, 
  FileText, 
  Search, 
  GraduationCap,
  Calendar,
  Sparkles,
  School,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function DocenteTutoriaPage() {
  const { 
    currentUser, 
    sections, 
    gradeLevels, 
    students, 
    enrollments, 
    grades, 
    attendances, 
    behaviorLogs, 
    courses,
    justificationRequests,
    approveJustification,
    rejectJustification,
    addBehaviorLog,
    showToast 
  } = useApp();

  // Find sections where the current teacher is tutor
  const tutoredSections = useMemo(() => {
    if (!currentUser?.id) return [];
    return sections.filter(s => s.tutor_id === currentUser.id);
  }, [sections, currentUser]);

  const [selectedSectionId, setSelectedSectionId] = useState<string>(() => {
    return tutoredSections[0]?.id || sections[0]?.id || '';
  });

  const activeSection = useMemo(() => {
    return sections.find(s => s.id === selectedSectionId) || tutoredSections[0] || sections[0];
  }, [sections, selectedSectionId, tutoredSections]);

  const activeGrade = useMemo(() => {
    return gradeLevels.find(g => g.id === activeSection?.grado_id);
  }, [gradeLevels, activeSection]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'alumnos' | 'conducta' | 'justificaciones'>('alumnos');

  // Modal State for new Behavior Log
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedStudentForLog, setSelectedStudentForLog] = useState<string>('');
  const [logType, setLogType] = useState<'merito' | 'demerito' | 'observacion'>('observacion');
  const [logDescription, setLogDescription] = useState('');

  // Enrolled students in active section
  const sectionEnrollments = useMemo(() => {
    if (!activeSection?.id) return [];
    return enrollments.filter(e => e.seccion_id === activeSection.id && e.estado === 'activo');
  }, [enrollments, activeSection]);

  const studentDetailsList = useMemo(() => {
    return sectionEnrollments.map(enr => {
      const student = students.find(s => s.id === enr.estudiante_id);
      const studentName = `${student?.profile?.apellidos || student?.apellidos || ''} ${student?.profile?.nombres || student?.nombres || ''}`.trim();

      // Grades summary: find all 'C' grades in any course
      const studentGrades = grades.filter(g => g.matricula_id === enr.id);
      const lowGrades = studentGrades.filter(g => g.nota_letra === 'C');
      const lowCourses = lowGrades.map(g => {
        const c = courses.find(course => course.competencias?.some(comp => comp.id === g.competencia_id));
        return c?.nombre || 'Curso Regular';
      });

      // Attendance summary
      const studentAtts = attendances.filter(a => a.matricula_id === enr.id);
      const tardanzas = studentAtts.filter(a => a.estado === 'tardanza').length;
      const faltas = studentAtts.filter(a => a.estado === 'falta').length;
      const totalAtts = studentAtts.length;
      const pctAsistencia = totalAtts > 0 ? Math.round(((totalAtts - faltas) / totalAtts) * 100) : 100;

      // Behavior summary
      const studentLogs = behaviorLogs.filter(b => b.estudiante_id === student?.id);
      const meritos = studentLogs.filter(b => b.tipo === 'merito').length;
      const demeritos = studentLogs.filter(b => b.tipo === 'demerito').length;

      // Risk score: High if >= 2 'C' or >= 3 faltas
      const isHighRisk = lowCourses.length >= 2 || faltas >= 3;
      const isMediumRisk = lowCourses.length === 1 || tardanzas >= 3 || faltas === 1 || faltas === 2;

      return {
        enrollment: enr,
        student,
        studentName,
        lowCourses,
        tardanzas,
        faltas,
        pctAsistencia,
        meritos,
        demeritos,
        isHighRisk,
        isMediumRisk,
        parentName: student?.nombre_apoderado || 'Apoderado no registrado',
        parentPhone: student?.telefono_apoderado || '',
      };
    });
  }, [sectionEnrollments, students, grades, attendances, behaviorLogs, courses]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return studentDetailsList;
    const term = searchTerm.toLowerCase();
    return studentDetailsList.filter(s => 
      s.studentName.toLowerCase().includes(term) ||
      (s.student?.profile?.dni || s.student?.dni || '').includes(term)
    );
  }, [studentDetailsList, searchTerm]);

  // Section KPIs
  const highRiskCount = studentDetailsList.filter(s => s.isHighRisk).length;
  const totalLowGradesCount = studentDetailsList.reduce((acc, s) => acc + s.lowCourses.length, 0);

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForLog || !logDescription.trim()) return;

    const studentEnr = enrollments.find(enr => enr.estudiante_id === selectedStudentForLog);

    addBehaviorLog({
      matricula_id: studentEnr?.id || `enr-${selectedStudentForLog}`,
      estudiante_id: selectedStudentForLog,
      tipo: logType,
      titulo: logType === 'merito' ? 'Reconocimiento / Mérito' : logType === 'demerito' ? 'Falta / Incidencia' : 'Observación de Tutoría',
      descripcion: logDescription.trim(),
      fecha: new Date().toISOString().split('T')[0],
      docente_id: currentUser?.id,
      docente_nombre: currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : 'Docente Tutor',
      visible_apoderado: true,
    });

    setIsLogModalOpen(false);
    setLogDescription('');
    showToast('Incidencia/Observación registrada con éxito', 'success', '📘 Tutoría');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-indigo-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Panel de Tutoría & Bienestar Estudiantil
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Tutor de Salón
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Seguimiento integral del aula: rendimiento transversal en todas las materias, alertas de inasistencias y contacto con familias.
              </p>
            </div>
          </div>

          {/* Section Selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-400">Aula asignada:</label>
            <select
              value={activeSection?.id || ''}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {sections.map(s => (
                <option key={s.id} value={s.id}>
                  {s.grado?.nombre || 'Grado'} &quot;{s.letra}&quot; {s.tutor_id === currentUser?.id ? '★ Mi Tutoría' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Estudiantes</span>
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-white mt-2">{studentDetailsList.length}</p>
            <p className="text-xs text-slate-500 mt-1">Matriculados en {activeGrade?.nombre || 'el grado'} &quot;{activeSection?.letra}&quot;</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">En Riesgo Académico</span>
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-rose-400 mt-2">{highRiskCount}</p>
            <p className="text-xs text-rose-300/80 mt-1">Alumnos con 2 o más &apos;C&apos; o ausentismo</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cursos en Inicio (&apos;C&apos;)</span>
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400 mt-2">{totalLowGradesCount}</p>
            <p className="text-xs text-slate-500 mt-1">Registros que requieren reforzamiento</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones de Tutoría</span>
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <button
              onClick={() => {
                setSelectedStudentForLog(studentDetailsList[0]?.student?.id || '');
                setIsLogModalOpen(true);
              }}
              className="mt-2 w-full py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>+ Registrar Incidencia</span>
            </button>
          </div>
        </div>

        {/* Tabs Bar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('alumnos')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'alumnos'
                  ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👥 Alumnos ({studentDetailsList.length})
            </button>
            <button
              onClick={() => setActiveTab('conducta')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'conducta'
                  ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📘 Anecdotario ({behaviorLogs.filter(b => sectionEnrollments.some(e => e.id === b.matricula_id)).length})
            </button>
            <button
              onClick={() => setActiveTab('justificaciones')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === 'justificaciones'
                  ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📋 Justificaciones</span>
              {justificationRequests.filter(j => sectionEnrollments.some(e => e.id === j.matricula_id) && j.estado === 'pendiente').length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500 text-slate-950 font-black animate-pulse">
                  {justificationRequests.filter(j => sectionEnrollments.some(e => e.id === j.matricula_id) && j.estado === 'pendiente').length}
                </span>
              )}
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar estudiante por nombre o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Tab 1: Student Table */}
        {activeTab === 'alumnos' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Estudiante</th>
                    <th className="py-3.5 px-4">Estado CNEB</th>
                    <th className="py-3.5 px-4">Asistencia</th>
                    <th className="py-3.5 px-4">Conducta</th>
                    <th className="py-3.5 px-4">Contacto Apoderado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredStudents.map(({ student, studentName, lowCourses, tardanzas, faltas, pctAsistencia, meritos, demeritos, isHighRisk, parentName, parentPhone }) => (
                    <tr key={student?.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                            {studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white">{studentName}</p>
                            <p className="text-[11px] text-slate-400">DNI: {student?.profile?.dni || student?.dni || '---'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {lowCourses.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Logro adecuado
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                              isHighRisk ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              <AlertTriangle className="w-3 h-3" /> {lowCourses.length} curso(s) en &apos;C&apos;
                            </span>
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">{lowCourses.join(', ')}</p>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className={`font-bold ${pctAsistencia < 80 ? 'text-rose-400' : 'text-slate-200'}`}>
                            {pctAsistencia}% asistencia
                          </span>
                          <p className="text-[10px] text-slate-400">{tardanzas} tardanzas · {faltas} faltas</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold" title="Méritos">+{meritos}</span>
                          <span className="text-slate-600">/</span>
                          <span className="text-rose-400 font-bold" title="Deméritos">-{demeritos}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-medium text-slate-300">{parentName}</p>
                          {parentPhone ? (
                            <div className="flex items-center gap-2 mt-0.5">
                              <a 
                                href={`tel:${parentPhone}`}
                                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 text-[11px]"
                              >
                                <Phone className="w-3 h-3" /> {parentPhone}
                              </a>
                              <a
                                href={`https://wa.me/51${parentPhone.replace(/\D/g, '')}?text=Estimado(a)%20${encodeURIComponent(parentName)},%20le%20escribe%20el%20tutor%20de%20aula%20de%20su%20hijo(a)%20${encodeURIComponent(studentName)}.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 text-[11px]"
                                title="Enviar WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" /> WhatsApp
                              </a>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500">Sin teléfono</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedStudentForLog(student?.id || '');
                            setIsLogModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          + Observación
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Anecdotario */}
        {activeTab === 'conducta' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Historial de Anecdotario y Observaciones de Aula</h3>
            <div className="space-y-3">
              {behaviorLogs
                .filter(b => sectionEnrollments.some(e => e.id === b.matricula_id))
                .map(log => {
                  const student = students.find(s => s.id === log.estudiante_id);
                  const name = `${student?.profile?.nombres || student?.nombres || ''} ${student?.profile?.apellidos || student?.apellidos || ''}`;
                  return (
                    <div key={log.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            log.tipo === 'merito' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            log.tipo === 'demerito' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {log.tipo.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-white">{name}</span>
                          <span className="text-[10px] text-slate-400">· {log.fecha}</span>
                        </div>
                        <p className="text-xs text-slate-300">{log.descripcion}</p>
                      </div>
                    </div>
                  );
                })}
              {behaviorLogs.filter(b => sectionEnrollments.some(e => e.id === b.matricula_id)).length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-xs">No hay incidencias registradas para esta aula.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Justificaciones de Inasistencia / Tardanzas */}
        {activeTab === 'justificaciones' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Bandeja de Justificaciones de Inasistencia y Tardanzas</h3>
                <p className="text-xs text-slate-400">Revisa y aprueba las solicitudes enviadas por los apoderados para regularizar la asistencia en el sistema.</p>
              </div>
            </div>

            <div className="space-y-3">
              {justificationRequests
                .filter(j => sectionEnrollments.some(e => e.id === j.matricula_id))
                .map(req => {
                  const student = students.find(s => s.id === req.estudiante_id);
                  const name = `${student?.profile?.nombres || student?.nombres || ''} ${student?.profile?.apellidos || student?.apellidos || ''}`;
                  return (
                    <div key={req.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            req.estado === 'aprobada' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            req.estado === 'rechazada' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {req.estado.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-white">{name}</span>
                          <span className="text-xs text-slate-400">· Fecha: <strong className="text-slate-200">{req.fecha}</strong></span>
                          <span className="text-[10px] text-slate-400">({req.tipo === 'falta' ? 'Inasistencia' : 'Tardanza'})</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1"><strong>Motivo:</strong> {req.motivo}</p>
                        {req.apoderado_nombre && (
                          <p className="text-[10px] text-slate-400">Solicitado por apoderado: {req.apoderado_nombre}</p>
                        )}
                        {req.respuesta_colegio && (
                          <p className="text-[11px] text-indigo-300 italic mt-0.5">Respuesta: {req.respuesta_colegio}</p>
                        )}
                      </div>

                      {req.estado === 'pendiente' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => approveJustification(req.id, 'Justificación médica/familiar aprobada por el tutor')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            ✓ Aprobar
                          </button>
                          <button
                            onClick={() => rejectJustification(req.id, 'Falta de sustento documentario')}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            ✕ Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

              {justificationRequests.filter(j => sectionEnrollments.some(e => e.id === j.matricula_id)).length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-xs">No hay solicitudes de justificación registradas para esta aula.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Registrar Observación de Tutoría */}
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-rose-400" />
                  Registro de Tutoría / Anecdotario
                </h3>
                <button
                  onClick={() => setIsLogModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveLog} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Estudiante</label>
                  <select
                    value={selectedStudentForLog}
                    onChange={(e) => setSelectedStudentForLog(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {studentDetailsList.map(s => (
                      <option key={s.student?.id} value={s.student?.id}>
                        {s.studentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Tipo de Registro</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setLogType('observacion')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        logType === 'observacion'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      Observación
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogType('merito')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        logType === 'merito'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      Mérito
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogType('demerito')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        logType === 'demerito'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      Demérito
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Detalle del Hecho / Entrevista</label>
                  <textarea
                    rows={3}
                    value={logDescription}
                    onChange={(e) => setLogDescription(e.target.value)}
                    placeholder="Describa el acuerdo de tutoría, compromiso del estudiante o motivo..."
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                  >
                    Guardar Registro
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
