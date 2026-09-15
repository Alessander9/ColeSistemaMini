'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
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
  Lock
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function AdminMatriculasPage() {
  const { enrollments, addStudent, sections, gradeLevels, students, showToast } = useApp();

  // Selected Enrollment for QR Modal
  const [selectedEnrollmentForQr, setSelectedEnrollmentForQr] = useState<Enrollment | null>(null);

  // Active filter tab (todos, inicial, primaria, secundaria, activo)
  const [activeFilter, setActiveFilter] = useState<string>('todos');

  // Wizard State (Steps 1 to 6)
  const [isWizardOpen, setIsWizardOpen] = useState(false);
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
    gradoId: 'grade-pri-3',
    seccionId: 'sec-3pri-a',
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
  });

  const [generatedResult, setGeneratedResult] = useState<{
    student: Student | null;
    credentials: { username: string; password: string; email: string } | null;
  }>({ student: null, credentials: null });

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Available sections for chosen grade in wizard
  const availableSections = useMemo(
    () => sections.filter(s => s.grado_id === wizardData.gradoId),
    [sections, wizardData.gradoId]
  );

  const availableGrades = useMemo(
    () => gradeLevels.filter(g => g.nivel === wizardData.nivel),
    [gradeLevels, wizardData.nivel]
  );

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!wizardData.nombres || !wizardData.apellidos || !wizardData.dni) {
        showToast('Por favor completa los nombres, apellidos y DNI', 'error');
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
        seccionId: wizardData.seccionId || 'sec-3pri-a',
        nombreApoderado: wizardData.nombreApoderado,
        telefonoApoderado: wizardData.telefonoApoderado,
        genero: wizardData.genero,
        avatar_url: wizardData.avatar_url,
      });

      setGeneratedResult({
        student: res.student,
        credentials: res.credentials,
      });
      setCurrentStep(6);
      showToast('¡Matrícula 2026 completada con éxito!', 'success', 'Matrícula Creada');
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
      gradoId: 'grade-pri-3',
      seccionId: 'sec-3pri-a',
      nombreApoderado: '',
      dniApoderado: '',
      telefonoApoderado: '',
      emailApoderado: '',
      parentesco: 'Padre',
      certificadoEstudios: true,
      dniEscaneado: true,
      fichaMedica: true,
    });
    setGeneratedResult({ student: null, credentials: null });
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

  // DataTable Columns Definition
  const columns: Column<Enrollment>[] = [
    {
      header: 'Estudiante',
      cell: (enr) => {
        const student = enr.estudiante;
        const fullName = `${student?.profile?.apellidos || ''}, ${student?.profile?.nombres || ''}`.trim() || 'Estudiante';
        const avatarUrl = student?.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

        return (
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
            <div className="min-w-0">
              <p className="font-extrabold text-slate-800 dark:text-white truncate">
                {fullName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {student?.codigo_estudiante || 'EST-2026'}
                </span>
                {student?.profile?.dni && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    DNI {student.profile.dni}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Nivel / Grado',
      cell: (enr) => {
        const nivel = enr.seccion?.grado?.nivel;
        const gradoNombre = enr.seccion?.grado?.nombre || 'Grado 2026';
        return (
          <div className="flex flex-col gap-1 items-start">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getLevelBadgeClass(nivel)}`}
            >
              {nivel === 'inicial' && '🧸 Inicial'}
              {nivel === 'primaria' && '📚 Primaria'}
              {nivel === 'secundaria' && '🎓 Secundaria'}
              {!['inicial', 'primaria', 'secundaria'].includes(nivel || '') && (nivel || 'Académico')}
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
              {gradoNombre}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Sección',
      cell: (enr) => (
        <div className="flex flex-col items-start gap-0.5">
          <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800 text-xs">
            Aula {enr.seccion?.letra || 'A'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {enr.seccion?.capacidad_maxima || 30} vacantes
          </span>
        </div>
      ),
    },
    {
      header: 'Apoderado / Contacto',
      cell: (enr) => (
        <div className="text-xs">
          <p className="font-bold text-slate-700 dark:text-slate-300">
            {enr.estudiante?.nombre_apoderado || 'No registrado'}
          </p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{enr.estudiante?.telefono_apoderado || '-'}</span>
          </p>
        </div>
      ),
    },
    {
      header: 'Fecha Matrícula',
      cell: (enr) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium">
            {enr.fecha_matricula || '2026-02-15'}
          </span>
        </div>
      ),
    },
    {
      header: 'Estado',
      cell: (enr) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            enr.estado === 'activo'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {enr.estado}
        </span>
      ),
    },
    {
      header: 'Acciones',
      cell: (enr) => (
        <div className="flex items-center gap-2">
          {enr.estudiante && (
            <button
              type="button"
              onClick={() => setSelectedEnrollmentForQr(enr)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-95"
              title="Ver Carnet Escolar QR"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Carnet QR
            </button>
          )}
          {enr.estudiante_id && (
            <Link
              href={`/admin/estudiantes/${enr.estudiante_id}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer active:scale-95"
              title="Ver Perfil Completo del Estudiante"
            >
              Perfil
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in-50">
      
      {/* Page Header */}
      <PageHeader
        title="Gestión de Matrículas 2026"
        description="Proceso de admisión, asignación de vacantes por nivel (Inicial, Primaria, Secundaria) y emisión de credenciales oficiales."
        badge={`${enrollments.length} Matrículas Activas`}
      >
        <button
          onClick={() => {
            setIsWizardOpen(true);
            setCurrentStep(1);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          + Nueva Matrícula (Wizard)
        </button>
      </PageHeader>

      {/* WIZARD MODAL */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Wizard Header & Progress Bar */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span>Paso {currentStep} de 6</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {currentStep === 1 && '1. Datos del Estudiante'}
                  {currentStep === 2 && '2. Grado y Sección'}
                  {currentStep === 3 && '3. Datos del Apoderado'}
                  {currentStep === 4 && '4. Documentación'}
                  {currentStep === 5 && '5. Confirmación'}
                  {currentStep === 6 && '6. Matrícula Exitosa'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${(currentStep / 6) * 100}%` }}
                />
              </div>
            </div>

            {/* Wizard Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* PASO 1: DATOS DEL ESTUDIANTE */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    Paso 1: Identificación y Foto del Estudiante
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
                    Paso 2: Asignación Académica (2026)
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
                          className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                            wizardData.seccionId === sec.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          Sección &quot;{sec.letra}&quot; ({sec.capacidad_maxima} vacantes)
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
                    Paso 3: Datos del Apoderado Legal
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
                    Paso 4: Verificación de Requisitos y Documentos
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

              {/* PASO 5: CONFIRMACIÓN */}
              {currentStep === 5 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Paso 5: Resumen y Confirmación de Matrícula
                  </h3>

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
                      <span className="text-slate-400">Nivel & Grado:</span>
                      <span className="font-bold capitalize text-indigo-600">{wizardData.nivel} — {availableGrades.find(g => g.id === wizardData.gradoId)?.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Apoderado:</span>
                      <span className="font-bold">{wizardData.nombreApoderado} ({wizardData.telefonoApoderado})</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 6: ÉXITO */}
              {currentStep === 6 && (
                <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      ¡Matrícula 2026 Registrada Exitosamente!
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Se generaron las credenciales oficiales y el carnet escolar con código QR para el control de asistencia.
                    </p>
                  </div>

                  {generatedResult.credentials && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-left border border-slate-200 dark:border-slate-700 text-xs space-y-2 max-w-md mx-auto font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Usuario:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-600">{generatedResult.credentials.username}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(generatedResult.credentials!.username, 'user')}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                            title="Copiar usuario"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Contraseña:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-100">{generatedResult.credentials.password}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(generatedResult.credentials!.password, 'pass')}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                            title="Copiar contraseña"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

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
                    {currentStep === 5 ? 'Confirmar Matrícula' : 'Siguiente'}
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

      {/* Enrollments DataTable with Search, Level Filters, Pagination and Grid/List Mode */}
      <DataTable
        title="Padrón de Matrículas Activas (2026)"
        data={filteredEnrollments}
        columns={columns}
        filterChips={filterChips}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchPlaceholder="Buscar por estudiante, DNI, código, nivel, grado, aula o apoderado..."
        itemsPerPage={10}
        searchFilter={(enr, q) => {
          const student = enr.estudiante;
          const profile = student?.profile;
          const fullName = `${profile?.nombres || ''} ${profile?.apellidos || ''}`.toLowerCase();
          const dni = (profile?.dni || '').toLowerCase();
          const code = (student?.codigo_estudiante || '').toLowerCase();
          const level = (enr.seccion?.grado?.nivel || '').toLowerCase();
          const grade = (enr.seccion?.grado?.nombre || '').toLowerCase();
          const section = `aula ${enr.seccion?.letra || ''}`.toLowerCase();
          const guardian = (student?.nombre_apoderado || '').toLowerCase();
          const phone = (student?.telefono_apoderado || '').toLowerCase();
          const status = (enr.estado || '').toLowerCase();

          return (
            fullName.includes(q) ||
            dni.includes(q) ||
            code.includes(q) ||
            level.includes(q) ||
            grade.includes(q) ||
            section.includes(q) ||
            guardian.includes(q) ||
            phone.includes(q) ||
            status.includes(q)
          );
        }}
        gridItemRender={(enr) => {
          const student = enr.estudiante;
          const fullName = `${student?.profile?.apellidos || ''}, ${student?.profile?.nombres || ''}`.trim() || 'Estudiante';
          const avatarUrl = student?.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
          const nivel = enr.seccion?.grado?.nivel;

          return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4.5 flex flex-col justify-between h-full shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group">
              <div>
                {/* Header: Avatar, Name, Code & DNI */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-sm leading-tight truncate">
                        {fullName}
                      </h4>
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        {student?.codigo_estudiante || 'EST-2026'}
                      </span>
                    </div>
                  </div>
                  {student?.profile?.dni && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      DNI {student.profile.dni}
                    </span>
                  )}
                </div>

                {/* Academic Level & Section Details */}
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-4 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">Nivel y Grado:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${getLevelBadgeClass(nivel)}`}>
                        {nivel}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {enr.seccion?.grado?.nombre}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">Sección:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md text-[11px]">
                      Aula &quot;{enr.seccion?.letra || 'A'}&quot;
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">Apoderado:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[140px]">
                      {student?.nombre_apoderado || 'No registrado'}
                    </span>
                  </div>

                  {student?.telefono_apoderado && (
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-400">Contacto:</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {student.telefono_apoderado}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                {enr.estudiante && (
                  <button
                    type="button"
                    onClick={() => setSelectedEnrollmentForQr(enr)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Carnet QR
                  </button>
                )}
                {enr.estudiante_id && (
                  <Link
                    href={`/admin/estudiantes/${enr.estudiante_id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all active:scale-95 cursor-pointer text-center"
                  >
                    Perfil 360°
                  </Link>
                )}
              </div>
            </div>
          );
        }}
      />

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
