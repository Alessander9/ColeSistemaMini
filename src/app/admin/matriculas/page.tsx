'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Student } from '@/types';
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
  Copy
} from 'lucide-react';

export default function AdminMatriculasPage() {
  const { enrollments, addStudent, sections, gradeLevels, students, showToast } = useApp();

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

  // Available sections for chosen grade
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
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
                    <div className="grid grid-cols-3 gap-2">
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
                          className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                            wizardData.nivel === lvl.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grado */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Grado / Aula</label>
                    <select
                      value={wizardData.gradoId}
                      onChange={e => {
                        const gid = e.target.value;
                        const secs = sections.filter(s => s.grado_id === gid);
                        setWizardData({ ...wizardData, gradoId: gid, seccionId: secs[0]?.id || '' });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                    >
                      {availableGrades.map(g => (
                        <option key={g.id} value={g.id}>{g.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sección */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Sección Asignada</label>
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
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Nombre del Apoderado *</label>
                      <input
                        type="text"
                        value={wizardData.nombreApoderado}
                        onChange={e => setWizardData({ ...wizardData, nombreApoderado: e.target.value })}
                        placeholder="Ej. Roberto Carlos Pérez"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Teléfono / WhatsApp *</label>
                      <input
                        type="text"
                        value={wizardData.telefonoApoderado}
                        onChange={e => setWizardData({ ...wizardData, telefonoApoderado: e.target.value })}
                        placeholder="Ej. 988112233"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Correo Electrónico</label>
                      <input
                        type="email"
                        value={wizardData.emailApoderado}
                        onChange={e => setWizardData({ ...wizardData, emailApoderado: e.target.value })}
                        placeholder="Ej. apoderado@gmail.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">Parentesco</label>
                      <select
                        value={wizardData.parentesco}
                        onChange={e => setWizardData({ ...wizardData, parentesco: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Padre">Padre</option>
                        <option value="Madre">Madre</option>
                        <option value="Tutor Legal">Tutor Legal</option>
                      </select>
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

      {/* Enrollments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Padrón de Matrículas Activas (2026)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Estudiante</th>
                <th className="py-3 px-3">Código</th>
                <th className="py-3 px-3">Nivel / Grado</th>
                <th className="py-3 px-3">Sección</th>
                <th className="py-3 px-3">Apoderado</th>
                <th className="py-3 px-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {enrollments.map((enr) => (
                <tr key={enr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {enr.estudiante?.profile?.nombres} {enr.estudiante?.profile?.apellidos}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {enr.estudiante?.codigo_estudiante}
                  </td>
                  <td className="py-3 px-3">
                    <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                      {enr.seccion?.grado?.nivel} — {enr.seccion?.grado?.nombre}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-indigo-600">
                    Aula {enr.seccion?.letra}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {enr.estudiante?.nombre_apoderado || 'Roberto Pérez'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-500/20">
                      {enr.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
