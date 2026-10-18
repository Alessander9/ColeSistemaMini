'use client';

import React from 'react';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { StudentAnnualReportCard } from '@/lib/grades/calculations';
import { Award, Printer, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, QrCode, FileText, UserCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface AnnualReportCardViewProps {
  reportCard: StudentAnnualReportCard;
  showPrintButton?: boolean;
}

export function AnnualReportCardView({ reportCard, showPrintButton = true }: AnnualReportCardViewProps) {
  const { brandingConfig } = useApp();
  const isPromoted = reportCard.finalAcademicStatus === 'PROMOVIDO';
  const isRecovery = reportCard.finalAcademicStatus === 'RECUPERACIÓN';

  const schoolName = brandingConfig?.nombreInstitucion || 'COLEGIO SANTA MARÍA DE LA EXCELENCIA';
  const ugel = brandingConfig?.ugel || 'UGEL N° 03';
  const dre = brandingConfig?.dre || 'DRE Lima Metropolitana';
  const modular = brandingConfig?.codigoModular || '0349281';
  const directorName = brandingConfig?.directorNombre || 'Dirección General';
  const docTitle = brandingConfig?.libretaTitulo || 'INFORME DEL PROGRESO DEL APRENDIZAJE DEL ESTUDIANTE';
  const docSubtitle = brandingConfig?.libretaSubtitulo || 'Consolidado Anual de Calificaciones por Bimestres y Situación Académica Final';
  const accentColor = brandingConfig?.libretaColorCabecera || brandingConfig?.primaryColor || '#4f46e5';
  const estilo = brandingConfig?.libretaEstilo || 'oficial_minedu';
  const logoUrl = brandingConfig?.logoUrl;
  const mostrarEscudo = brandingConfig?.libretaMostrarEscudo !== false;
  const mostrarFoto = brandingConfig?.libretaMostrarFotoEstudiante !== false;
  const mostrarAsistencia = brandingConfig?.libretaMostrarAsistencia !== false;
  const mostrarEscalaCneb = brandingConfig?.libretaMostrarEscalaCneb !== false;
  const mostrarObservaciones = brandingConfig?.libretaMostrarObservaciones !== false;
  const mostrarQr = brandingConfig?.libretaMostrarQrVerificacion !== false;
  const firmaDirector = brandingConfig?.libretaFirmaDirector !== false;
  const firmaTutor = brandingConfig?.libretaFirmaTutor !== false;
  const firmaApoderado = brandingConfig?.libretaFirmaApoderado !== false;
  const mensajePie = brandingConfig?.libretaMensajePie || 'Este documento es un extracto oficial del Sistema Integrado de Matrícula y Evaluación (ColeSistema / SIAGIE).';

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden on Print) */}
      {showPrintButton && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold"
              style={{ backgroundColor: accentColor }}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Libreta Oficial de Fin de Año (Consolidado 4 Bimestres)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Documento oficial generado según normativa MINEDU / SIAGIE 2026.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Guardar PDF Oficial
            </button>
          </div>
        </div>
      )}

      {/* Official Certificate / Report Card Container */}
      <div className={`bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-lg print:border-none print:shadow-none print:p-0 print:m-0 print:text-black ${
        estilo === 'minimalista_compacto' ? 'space-y-4 !p-4 sm:!p-6 text-[11px]' : 'space-y-6'
      }`}>
        
        {/* Header Institucional */}
        <div
          className={`pb-6 border-b-2 ${
            estilo === 'moderno_ejecutivo'
              ? 'border-indigo-500 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-800/40 dark:via-slate-900 dark:to-slate-800/40 p-4 rounded-2xl border'
              : estilo === 'academico_elegante'
              ? 'border-double border-b-4 border-slate-800 dark:border-slate-400'
              : 'border-slate-900 dark:border-slate-700'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4">
              {mostrarEscudo && (
                logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={schoolName}
                    className="w-16 h-16 rounded-2xl object-contain bg-white p-1 border-2 border-slate-200 dark:border-slate-700 shadow-md"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white dark:border-slate-800"
                    style={{ backgroundColor: accentColor }}
                  >
                    {brandingConfig?.siglas || 'IE'}
                  </div>
                )
              )}
              <div>
                <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  República del Perú • Ministerio de Educación
                </p>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {schoolName}
                </h1>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {dre} • {ugel} • Cód. Modular: {modular}
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span
                className="text-[10px] font-extrabold uppercase tracking-wider block"
                style={{ color: accentColor }}
              >
                Acta de Evaluación Final
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                AÑO LECTIVO {reportCard.academicYear}
              </span>
              <span className="text-[10px] block text-slate-400 font-mono mt-0.5">
                R.D. N° 0482-2026-ED
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <h2
              className="text-base sm:text-lg font-black tracking-wide uppercase"
              style={{ color: estilo === 'moderno_ejecutivo' ? accentColor : undefined }}
            >
              {docTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {docSubtitle}
            </p>
          </div>
        </div>

        {/* Student Metadata Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs">
          {mostrarFoto && (
            <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3 pb-3 mb-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <div
                className="w-10 h-10 rounded-xl text-white font-extrabold flex items-center justify-center text-sm shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                {reportCard.studentName.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estudiante Matriculado(a)</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{reportCard.studentName}</p>
              </div>
            </div>
          )}
          {!mostrarFoto && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estudiante</p>
              <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                {reportCard.studentName}
              </p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documento de Identidad</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              DNI: <span className="font-mono font-bold">{reportCard.studentDni}</span> • Cód: <span className="font-mono font-bold">{reportCard.studentCode}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grado y Sección</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {reportCard.gradeLevelName} — Sección &quot;{reportCard.sectionLetter}&quot;
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tutor(a) de Aula</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {reportCard.tutorName}
            </p>
          </div>
        </div>

        {/* Consolidated 4-Bimester Matrix Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-extrabold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">N°</th>
                <th className="py-3 px-4">Área Curricular / Asignatura</th>
                <th className="py-3 px-2 text-center w-16 bg-slate-200/50 dark:bg-slate-700/50">I Bim</th>
                <th className="py-3 px-2 text-center w-16 bg-slate-200/50 dark:bg-slate-700/50">II Bim</th>
                <th className="py-3 px-2 text-center w-16 bg-slate-200/50 dark:bg-slate-700/50">III Bim</th>
                <th className="py-3 px-2 text-center w-16 bg-slate-200/50 dark:bg-slate-700/50">IV Bim</th>
                <th
                  className="py-3 px-3 text-center w-24 border-l border-r"
                  style={{
                    backgroundColor: `${accentColor}15`,
                    borderColor: `${accentColor}40`,
                    color: accentColor,
                  }}
                >
                  CALIF. FINAL
                </th>
                <th className="py-3 px-2 text-center w-16">Puntaje</th>
                <th className="py-3 px-3 text-center w-20">Estado</th>
                {mostrarObservaciones && (
                  <th className="py-3 px-4 min-w-[200px]">Conclusión Descriptiva Anual</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {reportCard.courses.map((course, idx) => {
                const b1 = course.bimesters.find(b => b.bimesterNumber === 1);
                const b2 = course.bimesters.find(b => b.bimesterNumber === 2);
                const b3 = course.bimesters.find(b => b.bimesterNumber === 3);
                const b4 = course.bimesters.find(b => b.bimesterNumber === 4);

                return (
                  <tr key={course.courseId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: course.colorHex || accentColor }}
                        />
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {course.courseName}
                        </span>
                      </div>
                    </td>

                    {/* 4 Bimesters Columns */}
                    <td className="py-3 px-2 text-center font-bold bg-slate-50/50 dark:bg-slate-800/20">
                      {b1?.gradeLetter ? <GradeBadge grade={b1.gradeLetter} size="sm" /> : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-3 px-2 text-center font-bold bg-slate-50/50 dark:bg-slate-800/20">
                      {b2?.gradeLetter ? <GradeBadge grade={b2.gradeLetter} size="sm" /> : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-3 px-2 text-center font-bold bg-slate-50/50 dark:bg-slate-800/20">
                      {b3?.gradeLetter ? <GradeBadge grade={b3.gradeLetter} size="sm" /> : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-3 px-2 text-center font-bold bg-slate-50/50 dark:bg-slate-800/20">
                      {b4?.gradeLetter ? <GradeBadge grade={b4.gradeLetter} size="sm" /> : <span className="text-slate-300">-</span>}
                    </td>

                    {/* Official Final Calculated Grade */}
                    <td
                      className="py-3 px-3 text-center border-l border-r"
                      style={{
                        backgroundColor: `${accentColor}10`,
                        borderColor: `${accentColor}30`,
                      }}
                    >
                      <GradeBadge grade={course.finalGrade} size="md" />
                    </td>

                    {/* Numeric equivalent (0-20) */}
                    <td className="py-3 px-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {course.vigesimalScore.toFixed(1)}
                    </td>

                    {/* Pass/Fail Status */}
                    <td className="py-3 px-3 text-center">
                      {course.status === 'aprobado' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          <AlertTriangle className="w-3 h-3" /> Recuperación
                        </span>
                      )}
                    </td>

                    {/* Annual Descriptive Conclusion */}
                    {mostrarObservaciones && (
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 italic text-[11px] leading-relaxed">
                        &quot;{course.annualConclusion}&quot;
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Statistics & Conduct/Attendance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" style={{ color: accentColor }} />
              Resumen Académico Anual
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Cursos Matriculados:</span>
                <strong className="font-bold text-slate-800 dark:text-slate-200">{reportCard.totalCourses}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cursos Aprobados:</span>
                <strong className="font-bold text-emerald-600">{reportCard.passedCourses}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cursos a Recuperación:</span>
                <strong className="font-bold text-rose-600">{reportCard.failedCourses}</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-300 font-bold">Promedio General Anual:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{reportCard.generalVigesimalScore} / 20</span>
                  <GradeBadge grade={reportCard.generalAverageGrade} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Conduct and Attendance Box */}
          {mostrarAsistencia && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Asistencia & Comportamiento
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Asistencia Anual Acumulada:</span>
                  <strong className="font-bold text-emerald-600">{reportCard.attendancePercentage}%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Días Laborados Totales:</span>
                  <strong className="font-bold text-slate-800 dark:text-slate-200">180 días</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Evaluación del Comportamiento:</span>
                  <GradeBadge grade={reportCard.conductGrade} size="sm" />
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-300 font-bold">Apreciación del Tutor:</span>
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Excelente conducta</span>
                </div>
              </div>
            </div>
          )}

          {/* Final Official Verdict Banner */}
          <div className={`p-4 rounded-2xl border-2 flex flex-col justify-between ${
            !mostrarAsistencia ? 'md:col-span-2' : ''
          } ${
            isPromoted
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
              : isRecovery
              ? 'bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
              : 'bg-rose-50 border-rose-300 text-rose-950 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
          }`}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Situación Académica Final del Año
              </p>
              <h3 className="text-base sm:text-lg font-black tracking-tight mt-1 flex items-center gap-2">
                {isPromoted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : isRecovery ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                {reportCard.statusLabel}
              </h3>
            </div>
            <p className="text-[11px] font-medium leading-tight mt-2 opacity-90">
              {isPromoted
                ? 'El estudiante ha cumplido satisfactoriamente con los estándares y competencias para ser promovido al grado inmediato superior.'
                : isRecovery
                ? 'El estudiante debe rendir las evaluaciones del Programa de Recuperación Pedagógica durante los meses de enero y febrero.'
                : 'El estudiante no ha alcanzado los mínimos requeridos y permanece en el mismo grado lectivo.'}
            </p>
          </div>
        </div>

        {/* CNEB Scale Guide (Optional) */}
        {mostrarEscalaCneb && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">Escala de Calificación CNEB:</span>
            <div className="flex flex-wrap items-center gap-3">
              <span><strong className="text-emerald-600">AD:</strong> Logro Destacado (18-20)</span>
              <span><strong className="text-blue-600">A:</strong> Logro Esperado (14-17)</span>
              <span><strong className="text-amber-600">B:</strong> En Proceso (11-13)</span>
              <span><strong className="text-rose-600">C:</strong> En Inicio (0-10)</span>
            </div>
          </div>
        )}

        {/* Official Signatures & Verification Seal */}
        <div className="pt-8 border-t-2 border-slate-900 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end text-center">
          {/* Signature Director */}
          {firmaDirector && (
            <div>
              <div className="w-36 sm:w-44 h-14 border-b-2 border-dashed border-slate-400 mx-auto flex items-center justify-center overflow-hidden">
                {brandingConfig?.directorFirmaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brandingConfig.directorFirmaUrl}
                    alt="Firma Digital Director"
                    className="h-12 max-w-[140px] object-contain mx-auto"
                  />
                ) : (
                  <span className="text-[9px] font-mono text-slate-300 italic select-none">Firma y Sello</span>
                )}
              </div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white mt-2">
                {directorName}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">
                Dirección General
              </p>
            </div>
          )}

          {/* Verification QR Seal */}
          {mostrarQr && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-1.5 flex items-center justify-center shadow-inner">
                <QrCode className="w-12 h-12 text-slate-800 dark:text-slate-200" />
              </div>
              <p className="text-[8px] font-mono text-slate-400 mt-1">
                TOKEN-{reportCard.academicYear}-{reportCard.studentCode}
              </p>
              <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Verificado SIAGIE
              </p>
            </div>
          )}

          {/* Signature Tutor */}
          {firmaTutor && (
            <div>
              <div className="w-36 sm:w-44 h-14 border-b-2 border-dashed border-slate-400 mx-auto flex items-center justify-center">
                <span className="text-[9px] font-mono text-slate-300 italic select-none">Firma y Sello</span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white mt-2">
                {reportCard.tutorName}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">
                Docente Tutor(a)
              </p>
            </div>
          )}

          {/* Signature Apoderado */}
          {firmaApoderado && (
            <div>
              <div className="w-36 sm:w-44 h-14 border-b-2 border-dashed border-slate-400 mx-auto flex items-center justify-center">
                <span className="text-[9px] font-mono text-slate-300 italic select-none">Firma y Huella</span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white mt-2">
                Padre / Apoderado
              </p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">
                Conformidad del Padre
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400" suppressHydrationWarning>
          {mensajePie} Fecha de emisión: {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}.
        </div>
      </div>
    </div>
  );
}
