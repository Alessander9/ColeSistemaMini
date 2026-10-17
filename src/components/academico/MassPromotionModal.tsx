'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  X, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  School, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface MassPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MassPromotionModal: React.FC<MassPromotionModalProps> = ({ isOpen, onClose }) => {
  const { sections, enrollments, students, evaluationPeriods, promoteStudentsMassive } = useApp();

  const [originSectionId, setOriginSectionId] = useState('');
  const [targetSectionId, setTargetSectionId] = useState('');
  const [targetPeriodId, setTargetPeriodId] = useState('period-2027');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionResult, setPromotionResult] = useState<number | null>(null);

  // Active students in origin section
  const originEnrollments = useMemo(() => {
    if (!originSectionId) return [];
    return enrollments.filter(e => e.seccion_id === originSectionId && e.estado === 'activo');
  }, [enrollments, originSectionId]);

  // Origin Section Object
  const originSection = useMemo(() => {
    return sections.find(s => s.id === originSectionId);
  }, [sections, originSectionId]);

  // Target Section Object
  const targetSection = useMemo(() => {
    return sections.find(s => s.id === targetSectionId);
  }, [sections, targetSectionId]);

  const handleSelectAll = () => {
    if (selectedStudentIds.length === originEnrollments.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(originEnrollments.map(e => e.estudiante_id));
    }
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleExecutePromotion = () => {
    if (!originSectionId || !targetSectionId || selectedStudentIds.length === 0) return;
    setIsPromoting(true);

    setTimeout(() => {
      const res = promoteStudentsMassive({
        originSectionId,
        targetSectionId,
        targetPeriodId: targetPeriodId || 'period-2027',
        studentIds: selectedStudentIds,
      });
      setIsPromoting(false);
      setPromotionResult(res.promotedCount);
      setStep(3);
    }, 600);
  };

  const resetModal = () => {
    setOriginSectionId('');
    setTargetSectionId('');
    setSelectedStudentIds([]);
    setStep(1);
    setPromotionResult(null);
    onClose();
  };

  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <GraduationCap className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Asistente de Promoción Escolar Masiva</h3>
              <p className="text-xs text-emerald-100">Pase de año lectivo y traslado de salón en bloque</p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-semibold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>1</span>
            Salón de Origen
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>2</span>
            Alumnos y Destino
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <div className={`flex items-center gap-2 ${step === 3 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>3</span>
            Confirmación
          </div>
        </div>

        {/* Body Steps */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Promoción Inteligente de Alumnos</p>
                  <p className="mt-0.5 text-emerald-700">
                    Selecciona el aula actual para listar todos los estudiantes matriculados y promoverlos al siguiente grado.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Seleccionar Salón / Sección de Origen *
                </label>
                <select
                  value={originSectionId}
                  onChange={(e) => {
                    setOriginSectionId(e.target.value);
                    setSelectedStudentIds([]);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Elige la sección de origen --</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.grado?.nombre} &quot;{sec.letra}&quot; ({sec.grado?.nivel.toUpperCase()}) — {sec.aula || 'Aula General'}
                    </option>
                  ))}
                </select>
              </div>

              {originSection && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="font-bold text-slate-800">
                        {originSection.grado?.nombre} &quot;{originSection.letra}&quot;
                      </p>
                      <p className="text-xs text-slate-500">{originEnrollments.length} alumnos matriculados actualmente</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                    {originEnrollments.length} Alumnos
                  </span>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!originSectionId || originEnrollments.length === 0}
                  onClick={() => {
                    setSelectedStudentIds(originEnrollments.map(e => e.estudiante_id));
                    setStep(2);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-200 flex items-center gap-2"
                >
                  Siguiente Paso
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Salón de Destino *
                  </label>
                  <select
                    value={targetSectionId}
                    onChange={(e) => setTargetSectionId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Elige sección destino --</option>
                    {sections.filter(s => s.id !== originSectionId).map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.grado?.nombre} &quot;{sec.letra}&quot; ({sec.grado?.nivel.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Año / Periodo Lectivo Destino *
                  </label>
                  <select
                    value={targetPeriodId}
                    onChange={(e) => setTargetPeriodId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="period-2027">Año Lectivo 2027 (Próximo Año)</option>
                    <option value="period-2026">Año Lectivo 2026 (Año Actual)</option>
                  </select>
                </div>
              </div>

              {/* Student Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Alumnos a Promover ({selectedStudentIds.length} de {originEnrollments.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
                  >
                    {selectedStudentIds.length === originEnrollments.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50">
                  {originEnrollments.map((enr) => {
                    const isChecked = selectedStudentIds.includes(enr.estudiante_id);
                    const name = `${enr.estudiante?.profile?.apellidos || enr.estudiante?.apellidos || ''}, ${enr.estudiante?.profile?.nombres || enr.estudiante?.nombres || ''}`;
                    const code = enr.estudiante?.codigo_estudiante || 'EST';
                    return (
                      <label
                        key={enr.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-emerald-50/50 transition-colors ${isChecked ? 'bg-white' : 'opacity-60'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStudent(enr.estudiante_id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-slate-800">{name}</p>
                          <p className="text-slate-400">Código: {code} | DNI: {enr.estudiante?.profile?.dni || '—'}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ← Volver
                </button>
                <button
                  type="button"
                  disabled={!targetSectionId || selectedStudentIds.length === 0 || isPromoting}
                  onClick={handleExecutePromotion}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-200 flex items-center gap-2"
                >
                  {isPromoting ? 'Promoviendo...' : `Confirmar y Promover (${selectedStudentIds.length})`}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-bold text-xl text-slate-800">¡Promoción Masiva Exitosa!</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Se matricularon <strong className="text-emerald-700">{promotionResult} alumnos</strong> en la sección destino{' '}
                  <strong>{targetSection?.grado?.nombre} &quot;{targetSection?.letra}&quot;</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={resetModal}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md"
              >
                Cerrar Asistente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
