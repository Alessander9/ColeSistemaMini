'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { DataTable, Column, FilterChip } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Student, Enrollment } from '@/types';
import { AvatarUploader } from '@/components/ui/AvatarUploader';
import { QrCard } from '@/components/qr/QrCard';
import {
  UserPlus,
  Search,
  Check,
  GraduationCap,
  KeyRound,
  Mail,
  User,
  Users,
  Calendar,
  Phone,
  Printer,
  ShieldCheck,
  Layers,
  ArrowRight,
  ArrowLeft,
  FileText,
  Upload,
  Sparkles,
  QrCode,
  Copy,
  ExternalLink,
  Building2,
  Lock,
  Download,
  CreditCard
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { generateSecurePassword } from '@/lib/auth/generateCredentials';
import { useEscapeKey } from '@/hooks/useEscapeKey';

// Se carga solo al generar el PDF (así jsPDF no pesa en la carga inicial de la página)
const downloadEnrollmentFichaPdf = async (...args: Parameters<typeof import('@/lib/pdf/generateEnrollmentFichaPdf').downloadEnrollmentFichaPdf>) =>
  (await import('@/lib/pdf/generateEnrollmentFichaPdf')).downloadEnrollmentFichaPdf(...args);
// Se carga solo al generar el PDF (así jsPDF no pesa en la carga inicial de la página)
const generateBatchQrCardsPdf = async (...args: Parameters<typeof import('@/lib/pdf/batchQrCardsPdfGenerator').generateBatchQrCardsPdf>) =>
  (await import('@/lib/pdf/batchQrCardsPdfGenerator')).generateBatchQrCardsPdf(...args);

function MatriculasContent() {
  const { enrollments, addStudent, sections, gradeLevels, students, users, showToast, brandingConfig } = useApp();
  const searchParams = useSearchParams();

  // Selected Enrollment for QR Modal
  const [selectedEnrollmentForQr, setSelectedEnrollmentForQr] = useState<Enrollment | null>(null);

  // Active filter tab (todos, inicial, primaria, secundaria, activo)
  const [activeFilter, setActiveFilter] = useState<string>('todos');

  // Wizard State (Steps 1 to 6)
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [batchCsvText, setBatchCsvText] = useState('');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [wizardData, setWizardData] = useState({
    // Step 1: Estudiante
    tipoRegistro: 'nuevo' as 'nuevo' | 'existente',
    estudianteExistenteId: '',
    nombres: '',
    apellidos: '',
    dni: '',
    fechaNacimiento: '2016-05-15',
    genero: 'M',
    avatar_url: '',
    // Step 2: Académico
    nivel: 'primaria' as 'inicial' | 'primaria' | 'secundaria',
    gradoId: '',
    seccionId: '',
    // Step 3: Apoderado
    nombreApoderado: '',
    dniApoderado: '',
    telefonoApoderado: '',
    emailApoderado: '',
    parentesco: 'Padre',
    // Step 4: Documentos
    certificadoEstudios: true,
    dniEscaneado: true,
    fichaMedica: true,
    // Credenciales
    studentUsername: '',
    studentPassword: '',
    parentPassword: '',
  });

  const [showPassStudent, setShowPassStudent] = useState(false);
  const [showPassParent, setShowPassParent] = useState(false);

  const [generatedResult, setGeneratedResult] = useState<{
    student: Student | null;
    enrollment: Enrollment | null;
    credentials: { username: string; password: string; email: string } | null;
    parentCredentials: { username: string; password: string; email: string; existing?: boolean } | null;
  }>({ student: null, enrollment: null, credentials: null, parentCredentials: null });

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Auto-open wizard and pre-fill fields when query params are present
  useEffect(() => {
    const isNuevo = searchParams.get('nuevo') === 'true';
    const paramSeccionId = searchParams.get('seccionId');
    const paramGradoId = searchParams.get('gradoId');
    const paramNivel = searchParams.get('nivel') as 'inicial' | 'primaria' | 'secundaria' | null;

    if (isNuevo || paramSeccionId || paramGradoId) {
      setIsWizardOpen(true);
      setCurrentStep(1);
      setWizardData(prev => ({
        ...prev,
        ...(paramNivel ? { nivel: paramNivel } : {}),
        ...(paramGradoId ? { gradoId: paramGradoId } : {}),
        ...(paramSeccionId ? { seccionId: paramSeccionId } : {}),
      }));
    }
  }, [searchParams]);

  // Si no hay grado elegido (o no existe), usar el primero del nivel y su primera sección con vacantes
  useEffect(() => {
    if (!isWizardOpen) return;
    if (gradeLevels.some(g => g.id === wizardData.gradoId)) return;
    const g = gradeLevels.find(x => x.nivel === wizardData.nivel) || gradeLevels[0];
    if (!g) return;
    const sec = sections.find(x => x.grado_id === g.id);
    setWizardData(prev => ({ ...prev, nivel: g.nivel as typeof prev.nivel, gradoId: g.id, seccionId: prev.seccionId || sec?.id || '' }));
  }, [isWizardOpen, wizardData.gradoId, wizardData.nivel, gradeLevels, sections]);

  // Vacantes libres reales por sección
  const freeSeats = (secId: string) => {
    const sec = sections.find(x => x.id === secId);
    const taken = enrollments.filter(e => e.seccion_id === secId && e.estado === 'activo').length;
    return Math.max(0, (sec?.capacidad_maxima || 30) - taken);
  };

  // Available sections for chosen grade in wizard
  const availableSections = useMemo(
    () => sections.filter(s => s.grado_id === wizardData.gradoId),
    [sections, wizardData.gradoId]
  );

  const availableGrades = useMemo(
    () => gradeLevels.filter(g => g.nivel === wizardData.nivel),
    [gradeLevels, wizardData.nivel]
  );

  const handleGenerateWizardPasswords = () => {
    const sPass = generateSecurePassword();
    const pPass = generateSecurePassword();
    setWizardData(prev => ({
      ...prev,
      studentPassword: sPass,
      parentPassword: pPass,
    }));
    showToast('Contraseñas seguras sugeridas generadas.', 'info', 'Contraseñas');
  };

  const handleDownloadFicha = async (customResult?: {
    student: Student | null;
    enrollment: Enrollment | null;
    credentials: any;
    parentCredentials: any;
  }) => {
    const targetStudent = customResult?.student || generatedResult.student;
    const targetEnrollment = customResult?.enrollment || generatedResult.enrollment;
    if (!targetStudent) return;

    try {
      showToast('Generando Ficha Oficial de Matrícula en PDF...', 'info', 'PDF');
      await downloadEnrollmentFichaPdf({
        student: targetStudent,
        enrollment: targetEnrollment,
        section: sections.find(s => s.id === wizardData.seccionId) || targetEnrollment?.seccion,
        credentials: customResult?.credentials || generatedResult.credentials,
        parentCredentials: customResult?.parentCredentials || generatedResult.parentCredentials,
        parentName: wizardData.nombreApoderado || targetStudent.nombre_apoderado,
        parentDni: wizardData.dniApoderado,
        parentPhone: wizardData.telefonoApoderado || targetStudent.telefono_apoderado,
        parentEmail: wizardData.emailApoderado || targetStudent.email_apoderado,
        parentRelationship: wizardData.parentesco,
        brandingConfig,
      });
      showToast('Ficha de Matrícula descargada con éxito.', 'success', 'PDF Descargado');
    } catch (err) {
      console.error('Error al generar PDF de matrícula:', err);
      showToast('Error al generar la ficha en PDF.', 'error');
    }
  };

  const handleDownloadExistingEnrollmentPdf = async (enr: Enrollment) => {
    if (!enr.estudiante) return;
    const account = users.find(u => u.id === enr.estudiante?.profile_id) || enr.estudiante.profile;
    try {
      showToast('Generando Ficha de Matrícula en PDF...', 'info', 'PDF');
      await downloadEnrollmentFichaPdf({
        student: enr.estudiante,
        enrollment: enr,
        section: enr.seccion,
        credentials: {
          username: account?.username || account?.dni || enr.estudiante.dni || enr.estudiante.codigo_estudiante,
          password: account?.password || '',
          email: account?.email,
        },
        parentName: enr.estudiante.nombre_apoderado,
        parentPhone: enr.estudiante.telefono_apoderado,
        parentEmail: enr.estudiante.email_apoderado,
        brandingConfig,
      });
      showToast('Ficha de Matrícula descargada con éxito.', 'success', 'Descarga Completa');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      showToast('Error al generar la ficha en PDF.', 'error');
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!wizardData.nombres || !wizardData.apellidos || !wizardData.dni) {
        showToast('Por favor completa los nombres, apellidos y DNI', 'error');
        return;
      }
      if (!/^\d{8}$/.test(wizardData.dni.trim())) {
        showToast('El DNI del alumno debe tener 8 números', 'error');
        return;
      }
      const existingStudent = students.find(s => s.dni === wizardData.dni.trim());
      if (existingStudent) {
        showToast(`Ya existe un alumno registrado con el DNI ${wizardData.dni}: ${existingStudent.nombres} ${existingStudent.apellidos}`, 'error', 'DNI Duplicado');
        return;
      }
    }
    if (currentStep === 2) {
      if (!wizardData.seccionId) {
        showToast('Elige la sección donde estudiará el alumno', 'error');
        return;
      }
      if (freeSeats(wizardData.seccionId) === 0) {
        showToast('Esa sección ya no tiene vacantes. Elige otra.', 'error', 'Aula llena');
        return;
      }
    }
    if (currentStep === 3) {
      if (!wizardData.nombreApoderado || !wizardData.telefonoApoderado) {
        showToast('Por favor completa el nombre y teléfono del apoderado', 'error');
        return;
      }
    }
    if (currentStep === 5) {
      // Confirm and submit enrollment!
      const res = addStudent({
        nombres: wizardData.nombres,
        apellidos: wizardData.apellidos,
        dni: wizardData.dni,
        fechaNacimiento: wizardData.fechaNacimiento,
        seccionId: wizardData.seccionId || sections[0]?.id || '',
        nombreApoderado: wizardData.nombreApoderado,
        telefonoApoderado: wizardData.telefonoApoderado,
        dniApoderado: wizardData.dniApoderado || undefined,
        emailApoderado: wizardData.emailApoderado || undefined,
        parentesco: wizardData.parentesco,
        username: wizardData.studentUsername || undefined,
        password: wizardData.studentPassword || undefined,
        parentPassword: wizardData.parentPassword || undefined,
        genero: wizardData.genero,
        avatar_url: wizardData.avatar_url,
      });

      const resultPayload = {
        student: res.student,
        enrollment: res.enrollment,
        credentials: res.credentials,
        parentCredentials: res.parentCredentials || null,
      };

      setGeneratedResult(resultPayload);
      setCurrentStep(6);

      // ── DESCARGA AUTOMÁTICA DE FICHA PDF ──
      try {
        await downloadEnrollmentFichaPdf({
          student: res.student,
          enrollment: res.enrollment,
          section: sections.find(s => s.id === wizardData.seccionId),
          credentials: res.credentials,
          parentCredentials: res.parentCredentials,
          parentName: wizardData.nombreApoderado,
          parentDni: wizardData.dniApoderado,
          parentPhone: wizardData.telefonoApoderado,
          parentEmail: wizardData.emailApoderado,
          parentRelationship: wizardData.parentesco,
          brandingConfig,
        });
      } catch (err) {
        console.warn('Error en auto-descarga de PDF:', err);
      }

      showToast('¡Matrícula 2026 registrada y Ficha PDF descargada automáticamente!', 'success', 'Matrícula Completada');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setWizardData({
      tipoRegistro: 'nuevo',
      estudianteExistenteId: '',
      nombres: '',
      apellidos: '',
      dni: '',
      fechaNacimiento: '2016-05-15',
      genero: 'M',
      avatar_url: '',
      nivel: 'primaria',
      gradoId: '',
      seccionId: '',
      nombreApoderado: '',
      dniApoderado: '',
      telefonoApoderado: '',
      emailApoderado: '',
      parentesco: 'Padre',
      certificadoEstudios: true,
      dniEscaneado: true,
      fichaMedica: true,
      studentUsername: '',
      studentPassword: '',
      parentPassword: '',
    });
    setGeneratedResult({ student: null, enrollment: null, credentials: null, parentCredentials: null });
    setIsWizardOpen(false);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Copiado: ${text}`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filter chips with dynamic counts
  const filterChips: FilterChip[] = useMemo(() => [
    { id: 'todos', label: 'Todas las Matrículas', count: enrollments.length },
    { id: 'inicial', label: '🧸 Inicial', count: enrollments.filter(e => e.seccion?.grado?.nivel === 'inicial').length },
    { id: 'primaria', label: '📚 Primaria', count: enrollments.filter(e => e.seccion?.grado?.nivel === 'primaria').length },
    { id: 'secundaria', label: '🎓 Secundaria', count: enrollments.filter(e => e.seccion?.grado?.nivel === 'secundaria').length },
    { id: 'activo', label: '✅ Activas', count: enrollments.filter(e => e.estado === 'activo').length },
  ], [enrollments]);

  // Filtered enrollments list based on active tab
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enr) => {
      if (activeFilter === 'todos') return true;
      if (activeFilter === 'inicial') return enr.seccion?.grado?.nivel === 'inicial';
      if (activeFilter === 'primaria') return enr.seccion?.grado?.nivel === 'primaria';
      if (activeFilter === 'secundaria') return enr.seccion?.grado?.nivel === 'secundaria';
      if (activeFilter === 'activo') return enr.estado === 'activo';
      return true;
    });
  }, [enrollments, activeFilter]);

  // Level badge styling helper
  const getLevelBadgeClass = (nivel?: string) => {
    switch (nivel) {
      case 'inicial':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
      case 'primaria':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
      case 'secundaria':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  // Datos de apoyo para la lista
  const LEVEL_LABEL: Record<string, string> = { inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' };
  const studentName = (enr: Enrollment) => {
    const st = enr.estudiante || students.find(x => x.id === enr.estudiante_id);
    return {
      nombres: st?.profile?.nombres || st?.nombres || '',
      apellidos: st?.profile?.apellidos || st?.apellidos || '',
      dni: st?.profile?.dni || st?.dni || '',
      avatar: st?.profile?.avatar_url || '',
      codigo: st?.codigo_estudiante || '',
      apoderado: st?.nombre_apoderado || '',
      telefono: st?.telefono_apoderado || '',
    };
  };
  const sectionOfEnr = (enr: Enrollment) => enr.seccion || sections.find(x => x.id === enr.seccion_id);
  const niceDate = (iso?: string) => {
    if (!iso) return '—';
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const Avatar = ({ enr, size = 'w-10 h-10' }: { enr: Enrollment; size?: string }) => {
    const n = studentName(enr);
    return n.avatar ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={n.avatar} alt="" className={`${size} rounded-2xl object-cover shrink-0`} />
    ) : (
      <span className={`${size} rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-sm font-black flex items-center justify-center shrink-0`}>
        {`${n.nombres[0] || ''}${n.apellidos[0] || ''}`.toUpperCase() || '?'}
      </span>
    );
  };
  const actionButtons = (enr: Enrollment, compact = false) => (
    <div className={`flex items-center gap-1.5 ${compact ? '' : 'flex-wrap'}`}>
      <button type="button" onClick={() => handleDownloadExistingEnrollmentPdf(enr)} title="Descargar la ficha de matrícula en PDF"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 cursor-pointer">
        <FileText className="w-4 h-4 text-indigo-600" /> Ficha
      </button>
      {enr.estudiante && (
        <button type="button" onClick={() => setSelectedEnrollmentForQr(enr)} title="Ver e imprimir el carnet con código QR"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 cursor-pointer">
          <QrCode className="w-4 h-4 text-indigo-600" /> Carnet
        </button>
      )}
      {enr.estudiante_id && (
        <Link href={`/admin/estudiantes/${enr.estudiante_id}`} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white">
          Ver alumno <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );

  const columns: Column<Enrollment>[] = [
    {
      header: 'Alumno',
      cell: (enr) => {
        const n = studentName(enr);
        return (
          <div className="flex items-center gap-3">
            <Avatar enr={enr} />
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900 dark:text-white truncate">{n.apellidos}, {n.nombres}</p>
              <p className="text-xs text-slate-500">{n.dni ? `DNI ${n.dni}` : n.codigo}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Aula',
      cell: (enr) => {
        const sec = sectionOfEnr(enr);
        const nivel = sec?.grado?.nivel || '';
        return (
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{sec?.grado?.nombre || 'Grado'} &quot;{sec?.letra || '?'}&quot;</p>
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-black ${getLevelBadgeClass(nivel)}`}>{LEVEL_LABEL[nivel] || nivel || '—'}</span>
          </div>
        );
      },
    },
    {
      header: 'Apoderado',
      cell: (enr) => {
        const n = studentName(enr);
        return (
          <div className="text-sm">
            <p className="font-bold text-slate-700 dark:text-slate-200">{n.apoderado || 'No registrado'}</p>
            {n.telefono && <a href={`tel:${n.telefono}`} className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {n.telefono}</a>}
          </div>
        );
      },
    },
    {
      header: 'Matriculado',
      cell: (enr) => (
        <div className="text-sm">
          <p className="text-slate-700 dark:text-slate-200">{niceDate(enr.fecha_matricula)}</p>
          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-black ${enr.estado === 'activo' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
            {enr.estado === 'activo' ? 'Estudiando' : enr.estado === 'retirado' ? 'Retirado' : enr.estado === 'trasladado' ? 'Trasladado' : enr.estado}
          </span>
        </div>
      ),
    },
    { header: '', cell: (enr) => actionButtons(enr, true) },
  ];

  // Vacantes por nivel (matriculados activos frente a la capacidad de sus aulas)
  const levelStats = (['inicial', 'primaria', 'secundaria'] as const).map(lvl => {
    const secs = sections.filter(sec => sec.grado?.nivel === lvl || gradeLevels.find(g => g.id === sec.grado_id)?.nivel === lvl);
    const ids = new Set(secs.map(x => x.id));
    const enrolled = enrollments.filter(e => ids.has(e.seccion_id) && e.estado === 'activo').length;
    const capacity = secs.reduce((a, x) => a + (x.capacidad_maxima || 30), 0);
    return { lvl, enrolled, capacity, free: Math.max(0, capacity - enrolled), classrooms: secs.length };
  });
  const totalEnrolled = levelStats.reduce((a, l) => a + l.enrolled, 0);
  const totalFree = levelStats.reduce((a, l) => a + l.free, 0);

  const openWizard = () => { setIsWizardOpen(true); setCurrentStep(1); };
  const printAllCards = async () => {
    const activeEnrs = enrollments.filter(e => e.estado === 'activo' && (activeFilter === 'todos' || activeFilter === 'activo' || e.seccion?.grado?.nivel === activeFilter));
    if (activeEnrs.length === 0) { showToast('No hay alumnos matriculados para imprimir', 'warning'); return; }
    const items = activeEnrs.map(enr => ({
      student: enr.estudiante || students.find(x => x.id === enr.estudiante_id)!,
      enrollment: enr,
      section: enr.seccion || sections.find(x => x.id === enr.seccion_id),
    })).filter(item => Boolean(item.student));
    const doc = await generateBatchQrCardsPdf({ items, brandingConfig, sectionName: activeFilter === 'todos' || activeFilter === 'activo' ? 'TODAS LAS SECCIONES' : (LEVEL_LABEL[activeFilter] || '').toUpperCase() });
    doc.save('Carnets_Escolares.pdf');
    showToast(`Se generaron ${items.length} carnets (8 por hoja A4)`, 'success', '📇 Carnets');
  };


  useEscapeKey(isWizardOpen, resetWizard);
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in-50">
      
      {/* ══════════ Encabezado ══════════ */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-8 h-8 text-indigo-600" /> Matrículas
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Inscribe a cada alumno en su aula. El sistema crea al instante su <strong>carnet con QR</strong>, sus <strong>accesos</strong> y los de su apoderado, y descarga la <strong>ficha de matrícula</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={printAllCards} title="Descarga un PDF con los carnets listos para imprimir (8 por hoja)"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer">
            <CreditCard className="w-4 h-4 text-indigo-600" /> Imprimir carnets
          </button>
          <button type="button" onClick={() => setIsBatchImportOpen(true)} title="Matricula a varios alumnos a la vez desde una hoja de Excel"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-400 cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-600" /> Importar desde Excel
          </button>
          <button type="button" onClick={openWizard} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-md shadow-indigo-600/25 cursor-pointer">
            <UserPlus className="w-4 h-4" /> Matricular alumno
          </button>
        </div>
      </div>

      {/* ══════════ ¿Qué pasa al matricular? ══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5">
        <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3">¿Qué pasa cuando matriculas a un alumno?</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { n: 1, icon: User, color: 'bg-indigo-600', title: 'Registras sus datos', text: 'Nombre, DNI, el aula donde estudiará y los datos de su apoderado.' },
            { n: 2, icon: FileText, color: 'bg-purple-600', title: 'Se descarga su ficha', text: 'Una ficha de matrícula en PDF lista para imprimir y firmar.' },
            { n: 3, icon: QrCode, color: 'bg-emerald-600', title: 'Recibe carnet y accesos', text: 'Un carnet con QR para marcar asistencia, y usuario y contraseña para el alumno y su apoderado.' },
          ].map(st => (
            <div key={st.n} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <span className={`w-10 h-10 rounded-xl ${st.color} text-white flex items-center justify-center shrink-0`}><st.icon className="w-5 h-5" /></span>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{st.n}. {st.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">{st.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ Vacantes por nivel (también filtran la lista) ══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button type="button" onClick={() => setActiveFilter('todos')} aria-pressed={activeFilter === 'todos'}
          className={`text-left p-4 rounded-3xl border-2 cursor-pointer transition-all ${activeFilter === 'todos' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300'}`}>
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Todo el colegio</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalEnrolled}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{totalEnrolled === 1 ? 'alumno matriculado' : 'alumnos matriculados'}</p>
          <p className="text-xs font-bold text-emerald-600 mt-1">{totalFree} vacantes libres</p>
        </button>
        {levelStats.map(l => {
          const pctUsed = l.capacity > 0 ? Math.round((l.enrolled / l.capacity) * 100) : 0;
          const tone = { inicial: 'bg-amber-500', primaria: 'bg-blue-500', secundaria: 'bg-purple-500' }[l.lvl];
          const active = activeFilter === l.lvl;
          return (
            <button key={l.lvl} type="button" onClick={() => setActiveFilter(active ? 'todos' : l.lvl)} aria-pressed={active}
              className={`text-left p-4 rounded-3xl border-2 cursor-pointer transition-all ${active ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300'}`}>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${tone}`} /> {LEVEL_LABEL[l.lvl]}</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{l.enrolled}<span className="text-base text-slate-400"> / {l.capacity}</span></p>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden my-1.5"><div className={`h-full rounded-full ${tone}`} style={{ width: `${pctUsed}%` }} /></div>
              <p className="text-xs text-slate-500"><strong className={l.free > 0 ? 'text-emerald-600' : 'text-rose-600'}>{l.free > 0 ? `${l.free} vacantes libres` : 'Sin vacantes'}</strong> · {l.classrooms} aulas</p>
            </button>
          );
        })}
      </div>

      {/* WIZARD MODAL */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Pasos del asistente */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-lg font-black text-slate-900 dark:text-white">{currentStep < 6 ? 'Matricular alumno' : '¡Matrícula lista!'}</p>
                {currentStep < 6 && (
                  <button type="button" onClick={resetWizard} aria-label="Cerrar" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">✕</button>
                )}
              </div>
              <ol className="grid grid-cols-6 gap-1">
                {['Alumno', 'Aula', 'Apoderado', 'Documentos', 'Revisar', 'Listo'].map((name, i) => {
                  const n = i + 1;
                  const done = n < currentStep;
                  const current = n === currentStep;
                  return (
                    <li key={name} className="flex flex-col items-center gap-1 text-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${done ? 'bg-emerald-500 text-white' : current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        {done ? <Check className="w-4 h-4" /> : n}
                      </span>
                      <span className={`text-[11px] font-bold leading-tight ${current ? 'text-indigo-700 dark:text-indigo-300' : done ? 'text-emerald-600' : 'text-slate-400'}`}>{name}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Wizard Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* PASO 1: DATOS DEL ESTUDIANTE */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    ¿A quién vas a matricular?
                  </h3>

                  {/* Foto de Perfil del Estudiante */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                    <AvatarUploader
                      currentAvatarUrl={wizardData.avatar_url}
                      userName={`${wizardData.nombres || 'Alumno'} ${wizardData.apellidos || ''}`.trim()}
                      onAvatarUpdated={(url) => setWizardData((prev) => ({ ...prev, avatar_url: url }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Nombres *</label>
                      <input
                        type="text"
                        value={wizardData.nombres}
                        onChange={e => setWizardData({ ...wizardData, nombres: e.target.value })}
                        placeholder="Ej. Lucas Daniel"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Apellidos *</label>
                      <input
                        type="text"
                        value={wizardData.apellidos}
                        onChange={e => setWizardData({ ...wizardData, apellidos: e.target.value })}
                        placeholder="Ej. Castro Morales"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">DNI del Alumno *</label>
                      <input
                        type="text"
                        maxLength={8}
                        value={wizardData.dni}
                        onChange={e => setWizardData({ ...wizardData, dni: e.target.value.replace(/\D/g, '') })}
                        placeholder="Ej. 78945612"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={wizardData.fechaNacimiento}
                        onChange={e => setWizardData({ ...wizardData, fechaNacimiento: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: NIVEL, GRADO Y SECCIÓN */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    ¿En qué aula estudiará?
                  </h3>

                  {/* Nivel */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">Nivel Educativo</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'inicial', label: '🧸 Inicial (3-5 Años)' },
                        { id: 'primaria', label: '📚 Primaria (1°-6°)' },
                        { id: 'secundaria', label: '🎓 Secundaria (1°-5°)' },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => {
                            const newGrades = gradeLevels.filter(g => g.nivel === lvl.id);
                            setWizardData({
                              ...wizardData,
                              nivel: lvl.id as any,
                              gradoId: newGrades[0]?.id || '',
                              seccionId: '',
                            });
                          }}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all text-center sm:text-left ${
                            wizardData.nivel === lvl.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grado */}
                  <div>
                    <SearchableSelect
                      label="Grado / Aula"
                      icon={<GraduationCap className="w-3.5 h-3.5" />}
                      value={wizardData.gradoId}
                      onChange={(gid: string) => {
                        const secs = sections.filter(s => s.grado_id === gid);
                        setWizardData({ ...wizardData, gradoId: gid, seccionId: secs[0]?.id || '' });
                      }}
                      options={availableGrades.map(g => ({
                        value: g.id,
                        label: g.nombre,
                        sublabel: `Nivel ${g.nivel.toUpperCase()}`,
                        icon: <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                      }))}
                      placeholder="Seleccionar grado escolar..."
                      searchPlaceholder="Buscar grado (ej. 3°, 5°)..."
                      maxVisibleResults={2}
                      required
                    />
                  </div>

                  {/* Sección */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sección Asignada</span>
                    </label>
                    <div className="flex gap-2">
                      {availableSections.map(sec => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => setWizardData({ ...wizardData, seccionId: sec.id })}
                          disabled={freeSeats(sec.id) === 0}
                          className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                            wizardData.seccionId === sec.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          Sección &quot;{sec.letra}&quot; · {freeSeats(sec.id) === 0 ? 'llena' : `${freeSeats(sec.id)} vacantes libres`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3: APODERADO */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    ¿Quién es su apoderado?
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Nombre del Apoderado *</span>
                      </label>
                      <input
                        type="text"
                        value={wizardData.nombreApoderado}
                        onChange={e => setWizardData({ ...wizardData, nombreApoderado: e.target.value })}
                        placeholder="Ej. Roberto Carlos Pérez"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Teléfono / WhatsApp *</span>
                      </label>
                      <input
                        type="text"
                        value={wizardData.telefonoApoderado}
                        onChange={e => setWizardData({ ...wizardData, telefonoApoderado: e.target.value })}
                        placeholder="Ej. 988112233"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Correo Electrónico</span>
                      </label>
                      <input
                        type="email"
                        value={wizardData.emailApoderado}
                        onChange={e => setWizardData({ ...wizardData, emailApoderado: e.target.value })}
                        placeholder="Ej. apoderado@gmail.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <SearchableSelect
                        label="Parentesco Legal"
                        icon={<User className="w-3.5 h-3.5" />}
                        value={wizardData.parentesco}
                        onChange={(p: string) => setWizardData({ ...wizardData, parentesco: p })}
                        options={[
                          { value: 'Padre', label: 'Padre', sublabel: 'Progenitor legal' },
                          { value: 'Madre', label: 'Madre', sublabel: 'Progenitora legal' },
                          { value: 'Tutor Legal', label: 'Tutor Legal', sublabel: 'Apoderado judicial' },
                          { value: 'Abuelo/a', label: 'Abuelo / Abuela', sublabel: 'Familiar directo' },
                          { value: 'Tío/a', label: 'Tío / Tía', sublabel: 'Familiar' },
                        ]}
                        placeholder="Seleccionar parentesco..."
                        searchPlaceholder="Buscar parentesco..."
                        maxVisibleResults={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 4: DOCUMENTOS */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    ¿Qué documentos entregó?
                  </h3>

                  <div className="space-y-3">
                    {[
                      { key: 'certificadoEstudios', label: 'Certificado Oficial de Estudios del Grado Anterior' },
                      { key: 'dniEscaneado', label: 'Copia de DNI del Estudiante y del Apoderado' },
                      { key: 'fichaMedica', label: 'Ficha de Salud y Cartilla de Vacunación' },
                    ].map((doc) => (
                      <label
                        key={doc.key}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={(wizardData as any)[doc.key]}
                          onChange={e => setWizardData({ ...wizardData, [doc.key]: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {doc.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* PASO 5: CONFIRMACIÓN Y CREDENCIALES */}
              {currentStep === 5 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Revisa los datos antes de confirmar
                  </h3>

                  {/* Resumen */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estudiante:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{wizardData.nombres} {wizardData.apellidos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">DNI:</span>
                      <span className="font-mono font-bold">{wizardData.dni}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Aula:</span>
                      <span className="font-bold capitalize text-indigo-600">{availableGrades.find(g => g.id === wizardData.gradoId)?.nombre} &quot;{sections.find(x => x.id === wizardData.seccionId)?.letra || '?'}&quot;</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Apoderado:</span>
                      <span className="font-bold">{wizardData.nombreApoderado} ({wizardData.telefonoApoderado})</span>
                    </div>
                  </div>

                  {/* Configuración de Acceso y Contraseñas */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200">
                          Contraseñas para entrar a la plataforma (opcional: si las dejas vacías, se crean solas)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateWizardPasswords}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-2xs cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        Generar Contraseñas
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Contraseña Estudiante */}
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">🔑 Clave Alumno</span>
                          <span className="text-[10px] text-slate-400 font-mono">Rol: Estudiante</span>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassStudent ? 'text' : 'password'}
                            value={wizardData.studentPassword}
                            onChange={(e) => setWizardData(prev => ({ ...prev, studentPassword: e.target.value }))}
                            placeholder="Dejar vacío para autogenerar"
                            className="w-full px-2.5 py-1.5 pr-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassStudent(!showPassStudent)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassStudent ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      {/* Contraseña Apoderado */}
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">🔑 Clave Apoderado</span>
                          <span className="text-[10px] text-slate-400 font-mono">Rol: Apoderado</span>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassParent ? 'text' : 'password'}
                            value={wizardData.parentPassword}
                            onChange={(e) => setWizardData(prev => ({ ...prev, parentPassword: e.target.value }))}
                            placeholder="Dejar vacío para autogenerar"
                            className="w-full px-2.5 py-1.5 pr-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassParent(!showPassParent)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassParent ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Al confirmar, el sistema <strong>descargará automáticamente la Ficha Oficial en PDF</strong> con los accesos y el código QR.</span>
                    </p>
                  </div>
                </div>
              )}

              {/* PASO 6: ÉXITO */}
              {currentStep === 6 && (
                <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl font-black">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      ¡Alumno matriculado!
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Se descargó la Ficha Oficial en PDF y se habilitaron los accesos a la plataforma para el estudiante y el apoderado.
                    </p>
                  </div>

                  {/* Botón destacado de Descarga de Ficha PDF */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleDownloadFicha()}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs shadow-lg shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>📄 Descargar Ficha Oficial de Matrícula (PDF)</span>
                    </button>
                  </div>

                  {/* Credenciales Estudiante y Apoderado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto">
                    {generatedResult.credentials && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2 font-mono">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                          <span className="font-bold text-[11px] font-sans text-indigo-600 dark:text-indigo-400">🎓 Cuenta Alumno</span>
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-sans">Estudiante</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400 font-sans">Usuario:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{generatedResult.credentials.username}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(generatedResult.credentials!.username);
                                showToast('Usuario copiado', 'info');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400 font-sans">Clave:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{generatedResult.credentials.password}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(generatedResult.credentials!.password);
                                showToast('Contraseña copiada', 'info');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {generatedResult.parentCredentials && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2 font-mono">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                          <span className="font-bold text-[11px] font-sans text-amber-600 dark:text-amber-400">👨‍👩‍👧 Cuenta Apoderado</span>
                          <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded font-sans">{generatedResult.parentCredentials.existing ? 'Ya tenía cuenta' : 'Apoderado'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400 font-sans">Usuario:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{generatedResult.parentCredentials.username}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(generatedResult.parentCredentials!.username);
                                showToast('Usuario de apoderado copiado', 'info');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400 font-sans">Clave:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-amber-600 dark:text-amber-400">{generatedResult.parentCredentials.password}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(generatedResult.parentCredentials!.password);
                                showToast('Contraseña de apoderado copiada', 'info');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Carnet QR Card Render */}
                  {generatedResult.student && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                        Carnet Estudiantil Oficial Emitido
                      </p>
                      <QrCard
                        student={generatedResult.student}
                        section={availableSections.find(s => s.id === wizardData.seccionId)}
                        showActions={true}
                      />
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Wizard Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              {currentStep < 6 ? (
                <>
                  <button
                    type="button"
                    onClick={currentStep === 1 ? resetWizard : handlePrevStep}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {currentStep === 1 ? 'Cancelar' : 'Anterior'}
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                  >
                    {currentStep === 5 ? 'Confirmar matrícula' : 'Siguiente'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={resetWizard}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs transition-all"
                >
                  Finalizar y Cerrar
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ══════════ Lista de alumnos matriculados ══════════ */}
      <DataTable
        title={activeFilter === 'todos' || activeFilter === 'activo' ? 'Alumnos matriculados' : `Alumnos matriculados en ${LEVEL_LABEL[activeFilter] || ''}`}
        data={filteredEnrollments}
        columns={columns}
        searchPlaceholder="Buscar por nombre, DNI, aula o apoderado"
        emptyMessage={enrollments.length === 0 ? 'Aún no hay alumnos matriculados. Toca "Matricular alumno" para empezar.' : 'No hay alumnos con esa búsqueda.'}
        itemsPerPage={12}
        gridClassName="grid-cols-1 md:grid-cols-2 2xl:grid-cols-3"
        searchFilter={(enr, q) => {
          const n = studentName(enr);
          const sec = sectionOfEnr(enr);
          return `${n.nombres} ${n.apellidos} ${n.dni} ${n.codigo} ${sec?.grado?.nombre || ''} ${sec?.letra || ''} ${sec?.grado?.nivel || ''} ${n.apoderado} ${n.telefono}`.toLowerCase().includes(q);
        }}
        gridItemRender={(enr) => {
          const n = studentName(enr);
          const sec = sectionOfEnr(enr);
          const nivel = sec?.grado?.nivel || '';
          return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col gap-3 h-full shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <Avatar enr={enr} size="w-12 h-12" />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black text-slate-900 dark:text-white leading-tight truncate">{n.apellidos}, {n.nombres}</p>
                  <p className="text-xs text-slate-500">{n.dni ? `DNI ${n.dni}` : n.codigo}</p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-black ${enr.estado === 'activo' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'}`}>
                  {enr.estado === 'activo' ? 'Estudiando' : enr.estado}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[11px] text-slate-500">Aula</p>
                  <p className="font-black text-slate-800 dark:text-slate-100 truncate">{sec?.grado?.nombre || 'Grado'} &quot;{sec?.letra || '?'}&quot;</p>
                  <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${getLevelBadgeClass(nivel)}`}>{LEVEL_LABEL[nivel] || '—'}</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 min-w-0">
                  <p className="text-[11px] text-slate-500">Apoderado</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{n.apoderado || 'No registrado'}</p>
                  {n.telefono && <a href={`tel:${n.telefono}`} className="text-xs text-indigo-600 hover:underline">{n.telefono}</a>}
                </div>
              </div>
              <p className="text-xs text-slate-500">Matriculado el {niceDate(enr.fecha_matricula)}</p>
              <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">{actionButtons(enr)}</div>
            </div>
          );
        }}
      />

      {/* Batch Import CSV/Excel Modal */}
      {isBatchImportOpen && (
        <Modal
          isOpen={isBatchImportOpen}
          onClose={() => setIsBatchImportOpen(false)}
          title="Importar alumnos desde Excel"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              1) Descarga la plantilla. 2) Llénala en Excel con un alumno por fila. 3) Copia las filas y pégalas abajo. Cada alumno se matricula en el aula indicada (nivel, grado y sección) y recibe su carnet y sus accesos. Los DNI que ya existen se omiten.
            </p>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-bold text-slate-800 dark:text-white">Plantilla Oficial de Matrícula</p>
                <p className="text-[11px] text-slate-400">Columnas: DNI; Nombres; Apellidos; Nivel; Grado; Seccion; NombreApoderado; Telefono</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const sampleCsv = `DNI;Nombres;Apellidos;Nivel;Grado;Seccion;NombreApoderado;Telefono;EmailApoderado\n74839201;Carlos Alberto;Mendoza Quispe;primaria;3ro;A;Alberto Mendoza;987654321;apoderado1@gmail.com\n74839202;Lucia Fernanda;Ramos Vega;primaria;3ro;A;Fernanda Vega;987654322;apoderado2@gmail.com`;
                  const blob = new Blob(['\uFEFF' + sampleCsv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Plantilla_Matricula_Masiva_2026.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold hover:bg-indigo-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Plantilla
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pega el contenido CSV o datos copiados de Excel:
              </label>
              <textarea
                rows={6}
                placeholder="DNI;Nombres;Apellidos;Nivel;Grado;Seccion;NombreApoderado;Telefono;EmailApoderado&#10;74839201;Carlos Alberto;Mendoza Quispe;primaria;3ro;A;Alberto Mendoza;987654321;apoderado1@gmail.com"
                value={batchCsvText}
                onChange={(e) => setBatchCsvText(e.target.value)}
                className="w-full font-mono text-[11px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBatchImportOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!batchCsvText.trim() || isProcessingBatch}
                onClick={async () => {
                  setIsProcessingBatch(true);
                  const lines = batchCsvText.trim().split('\n').filter(l => l.trim().length > 0);
                  const dataLines = lines[0].toLowerCase().includes('dni') ? lines.slice(1) : lines;
                  
                  let successCount = 0;
                  let skipped = 0;
                  const seenDni = new Set(students.map(s => s.dni));
                  const defaultSecId = sections[0]?.id || 'sec-3pri-a';

                  for (const line of dataLines) {
                    const delimiter = line.includes(';') ? ';' : ',';
                    const parts = line.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''));
                    if (parts.length >= 3) {
                      const dni = parts[0] || `7${Math.floor(1000000 + Math.random() * 9000000)}`;
                      const nombres = parts[1] || 'Estudiante';
                      const apellidos = parts[2] || 'Nuevo';
                      if (seenDni.has(dni)) { skipped++; continue; }
                      seenDni.add(dni);
                      const nivelTxt = (parts[3] || '').toLowerCase();
                      const gradoNum = parseInt((parts[4] || '').replace(/\D/g, ''), 10);
                      const letra = (parts[5] || '').toLowerCase();
                      const secId = sections.find(s => s.letra.toLowerCase() === letra && (!nivelTxt || s.grado?.nivel === nivelTxt) && (!gradoNum || s.grado?.numero_grado === gradoNum))?.id
                        || sections.find(s => s.letra.toLowerCase() === letra && (!nivelTxt || s.grado?.nivel === nivelTxt))?.id
                        || defaultSecId;
                      const nombreApod = parts[6] || `Apoderado de ${nombres}`;
                      const telApod = parts[7] || '999888777';
                      const emailApod = parts[8] || 'apoderado@gmail.com';

                      addStudent({
                        nombres,
                        apellidos,
                        dni,
                        fechaNacimiento: '2016-05-15',
                        genero: 'M',
                        seccionId: secId,
                        nombreApoderado: nombreApod,
                        dniApoderado: '44883322',
                        telefonoApoderado: telApod,
                        emailApoderado: emailApod,
                        parentesco: 'Padre',
                      });
                      successCount++;
                    }
                  }

                  setIsProcessingBatch(false);
                  setIsBatchImportOpen(false);
                  setBatchCsvText('');
                  showToast(`Se matricularon ${successCount} estudiantes${skipped ? ` (${skipped} omitidos por DNI repetido)` : ''}`, 'success', '📥 Importación Completada');
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md disabled:opacity-40"
              >
                {isProcessingBatch ? 'Procesando...' : 'Procesar e Importar Lote'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Carnet QR Modal for Enrolled Student */}
      {selectedEnrollmentForQr && selectedEnrollmentForQr.estudiante && (
        <Modal
          isOpen={!!selectedEnrollmentForQr}
          onClose={() => setSelectedEnrollmentForQr(null)}
          title={`Carnet QR — ${selectedEnrollmentForQr.estudiante.profile?.nombres || ''} ${selectedEnrollmentForQr.estudiante.profile?.apellidos || ''}`}
          maxWidth="md"
        >
          <div className="p-2">
            <QrCard
              student={selectedEnrollmentForQr.estudiante}
              section={selectedEnrollmentForQr.seccion}
              showActions={true}
            />
          </div>
        </Modal>
      )}

    </div>
  );
}

export default function AdminMatriculasPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-bold flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Cargando sistema de matrículas...</span>
        </div>
      }
    >
      <MatriculasContent />
    </Suspense>
  );
}
