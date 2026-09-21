'use client';

import React, { useState, useEffect } from 'react';
import { Section, GradeLevel, UserProfile } from '@/types';
import { useApp } from '@/context/AppContext';
import { X, School, Users, DoorClosed, Award, Check } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface SectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionToEdit?: Section | null;
}

export const SectionFormModal: React.FC<SectionFormModalProps> = ({
  isOpen,
  onClose,
  sectionToEdit,
}) => {
  const { gradeLevels, teachers, addSection, updateSection } = useApp();

  const [gradoId, setGradoId] = useState('');
  const [letra, setLetra] = useState('A');
  const [capacidadMaxima, setCapacidadMaxima] = useState(30);
  const [aula, setAula] = useState('Pabellón A - Aula 101');
  const [tutorId, setTutorId] = useState('');

  useEffect(() => {
    if (sectionToEdit) {
      setGradoId(sectionToEdit.grado_id || (gradeLevels[0]?.id || ''));
      setLetra(sectionToEdit.letra || 'A');
      setCapacidadMaxima(sectionToEdit.capacidad_maxima || 30);
      setAula(sectionToEdit.aula || 'Aula Principal');
      setTutorId(sectionToEdit.tutor_id || '');
    } else {
      setGradoId(gradeLevels[0]?.id || '');
      setLetra('A');
      setCapacidadMaxima(30);
      setAula('Pabellón A - Aula 101');
      setTutorId('');
    }
  }, [sectionToEdit, gradeLevels, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradoId || !letra.trim()) return;

    if (sectionToEdit) {
      updateSection(sectionToEdit.id, {
        grado_id: gradoId,
        letra: letra.trim().toUpperCase(),
        capacidad_maxima: Number(capacidadMaxima),
        aula: aula.trim(),
        tutor_id: tutorId || undefined,
      });
    } else {
      addSection({
        gradoId,
        letra: letra.trim().toUpperCase(),
        capacidadMaxima: Number(capacidadMaxima),
        aula: aula.trim(),
        tutorId: tutorId || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <School className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {sectionToEdit ? 'Editar Salón / Sección' : 'Crear Nuevo Salón / Sección'}
              </h3>
              <p className="text-xs text-indigo-200">Configuración física, aforo y designación de tutor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Grado y Nivel Educativo *
            </label>
            <SearchableSelect
              value={gradoId}
              onChange={setGradoId}
              required
              icon={<School className="w-4 h-4" />}
              options={gradeLevels.map((g) => ({
                value: g.id,
                label: g.nombre,
                sublabel: `Nivel ${g.nivel.toUpperCase()} · Grado ${g.numero_grado}`,
              }))}
              placeholder="Buscar grado o nivel..."
              searchPlaceholder="Escribe inicial, primaria, secundaria..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Letra / Identificador *
              </label>
              <input
                type="text"
                value={letra}
                onChange={(e) => setLetra(e.target.value)}
                maxLength={2}
                placeholder="Ej. A, B, C"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Aforo Máximo (Vacantes) *
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={capacidadMaxima}
                  onChange={(e) => setCapacidadMaxima(Number(e.target.value))}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ubicación / Aula Física
            </label>
            <div className="relative">
              <DoorClosed className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={aula}
                onChange={(e) => setAula(e.target.value)}
                placeholder="Ej. Pabellón Primaria - Aula 101"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Docente Tutor Designado
            </label>
            <div className="relative">
              <Award className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <SearchableSelect
                value={tutorId}
                onChange={setTutorId}
                icon={<Award className="w-4 h-4" />}
                options={[
                  { value: '', label: 'Sin tutor asignado', sublabel: 'Por designar' },
                  ...teachers.map((t) => ({
                    value: t.id,
                    label: `Prof. ${t.nombres} ${t.apellidos}`,
                    sublabel: t.especialidad || 'Docente',
                  })),
                ]}
                placeholder="Buscar docente tutor..."
                searchPlaceholder="Escribe nombre, apellido o especialidad..."
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 flex items-center gap-2 transition-all hover:shadow-lg"
            >
              <Check className="w-4 h-4" />
              {sectionToEdit ? 'Guardar Cambios' : 'Crear Salón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
