'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Course, EducationalLevel, Competency } from '@/types';
import { 
  BookOpen, 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  GraduationCap, 
  School, 
  Clock, 
  Palette, 
  Hash, 
  FileText, 
  Award, 
  Layers,
  Check
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseToEdit?: Course | null;
  defaultLevel?: EducationalLevel;
  onSuccess?: (course: Course) => void;
}

const COLOR_PRESETS = [
  { label: 'Índigo', hex: '#4f46e5', bg: 'bg-indigo-500' },
  { label: 'Esmeralda', hex: '#059669', bg: 'bg-emerald-500' },
  { label: 'Azul', hex: '#2563eb', bg: 'bg-blue-500' },
  { label: 'Violeta', hex: '#7c3aed', bg: 'bg-purple-500' },
  { label: 'Rubí', hex: '#dc2626', bg: 'bg-red-500' },
  { label: 'Ámbar', hex: '#d97706', bg: 'bg-amber-500' },
  { label: 'Cyan', hex: '#0891b2', bg: 'bg-cyan-500' },
  { label: 'Rosa', hex: '#db2777', bg: 'bg-pink-500' },
  { label: 'Slate', hex: '#475569', bg: 'bg-slate-600' },
];

const CURRICULAR_AREAS = [
  'Matemática',
  'Comunicación',
  'Ciencia y Tecnología',
  'Personal Social / Ciencias Sociales',
  'Inglés / Idioma Extranjero',
  'Arte y Cultura',
  'Educación Física',
  'Educación Religiosa',
  'Computación, TIC & Robótica',
  'Desarrollo Personal y Cívica (DPCC)',
  'Educación para el Trabajo (EPT)',
  'Tutoría y Orientación Educativa',
  'Taller Especializado / Extracurricular'
];

export function CourseFormModal({
  isOpen,
  onClose,
  courseToEdit,
  defaultLevel = 'primaria',
  onSuccess,
}: CourseFormModalProps) {
  const { addCourse, updateCourse, teachers, sections } = useApp();

  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nivel, setNivel] = useState<EducationalLevel>(defaultLevel);
  const [areaCurricular, setAreaCurricular] = useState('Matemática');
  const [colorHex, setColorHex] = useState('#4f46e5');
  const [horasSemanales, setHorasSemanales] = useState<number>(4);
  const [descripcion, setDescripcion] = useState('');
  
  // Competencias CNEB
  const [competencias, setCompetencias] = useState<{ id?: string; codigo: string; descripcion: string }[]>([
    { codigo: 'C1', descripcion: 'Comprende y aplica conocimientos fundamentales' },
    { codigo: 'C2', descripcion: 'Resuelve situaciones complejas y propone soluciones' },
  ]);

  // Asignación inmediata opcional
  const [enableImmediateAssign, setEnableImmediateAssign] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [aulaDefecto, setAulaDefecto] = useState('');

  const isEditing = Boolean(courseToEdit);

  // Inicializar formulario al abrir o cambiar de curso a editar
  useEffect(() => {
    if (courseToEdit) {
      setNombre(courseToEdit.nombre || '');
      setCodigo(courseToEdit.codigo || '');
      setNivel(courseToEdit.nivel || defaultLevel);
      setAreaCurricular(courseToEdit.area_curricular || 'Matemática');
      setColorHex(courseToEdit.color_hex || courseToEdit.color || '#4f46e5');
      setHorasSemanales(courseToEdit.horas_semanales_sugeridas || 4);
      setDescripcion(courseToEdit.descripcion || '');
      if (courseToEdit.competencias && courseToEdit.competencias.length > 0) {
        setCompetencias(courseToEdit.competencias.map(c => ({
          id: c.id,
          codigo: c.codigo,
          descripcion: c.descripcion,
        })));
      } else {
        setCompetencias([
          { codigo: 'C1', descripcion: 'Comprende y aplica conocimientos fundamentales' },
          { codigo: 'C2', descripcion: 'Resuelve situaciones complejas y propone soluciones' },
        ]);
      }
      setEnableImmediateAssign(false);
    } else {
      setNombre('');
      setCodigo('');
      setNivel(defaultLevel);
      setAreaCurricular('Matemática');
      setColorHex('#4f46e5');
      setHorasSemanales(4);
      setDescripcion('');
      setCompetencias([
        { codigo: 'C1', descripcion: 'Comprende y aplica conocimientos fundamentales' },
        { codigo: 'C2', descripcion: 'Resuelve situaciones complejas y propone soluciones' },
      ]);
      setEnableImmediateAssign(false);
      if (teachers.length > 0) setSelectedTeacherId(teachers[0].id);
      if (sections.length > 0) {
        const secForLevel = sections.find(s => s.grado?.nivel === defaultLevel) || sections[0];
        setSelectedSectionId(secForLevel?.id || '');
      }
    }
  }, [courseToEdit, defaultLevel, isOpen, teachers, sections]);

  // Autogenerar código de curso si es nuevo
  const handleNombreChange = (val: string) => {
    setNombre(val);
    if (!isEditing) {
      const words = val.trim().split(/\s+/);
      let autoCode = '';
      if (words.length === 1 && words[0].length >= 3) {
        autoCode = words[0].substring(0, 3).toUpperCase();
      } else if (words.length > 1) {
        autoCode = words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
      }
      if (autoCode) {
        const suffix = nivel === 'inicial' ? 'INI' : nivel === 'primaria' ? 'PRI' : 'SEC';
        setCodigo(`${autoCode}-${suffix}`);
      }
    }
  };

  const handleNivelChange = (newNivel: EducationalLevel) => {
    setNivel(newNivel);
    if (!isEditing && codigo.includes('-')) {
      const parts = codigo.split('-');
      const suffix = newNivel === 'inicial' ? 'INI' : newNivel === 'primaria' ? 'PRI' : 'SEC';
      setCodigo(`${parts[0]}-${suffix}`);
    }
    const firstSec = sections.find(s => s.grado?.nivel === newNivel);
    if (firstSec) setSelectedSectionId(firstSec.id);
  };

  const addCompetencyRow = () => {
    const nextNum = competencias.length + 1;
    setCompetencias(prev => [
      ...prev,
      { codigo: `C${nextNum}`, descripcion: '' }
    ]);
  };

  const removeCompetencyRow = (index: number) => {
    if (competencias.length <= 1) return;
    setCompetencias(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((c, i) => ({
        ...c,
        codigo: c.codigo.startsWith('C') ? `C${i + 1}` : c.codigo,
      }));
    });
  };

  const updateCompetency = (index: number, field: 'codigo' | 'descripcion', val: string) => {
    setCompetencias(prev => prev.map((c, i) => i === index ? { ...c, [field]: val } : c));
  };

  const availableSections = useMemo(() => {
    return sections.filter(s => s.grado?.nivel === nivel);
  }, [sections, nivel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !codigo.trim()) return;

    const validCompetencias = competencias
      .filter(c => c.descripcion.trim().length > 0)
      .map((c, idx) => ({
        ...c,
        codigo: c.codigo.trim() || `C${idx + 1}`,
        descripcion: c.descripcion.trim(),
      }));

    if (validCompetencias.length === 0) {
      validCompetencias.push({
        codigo: 'C1',
        descripcion: 'Desarrollo de competencias generales del área curricular',
      });
    }

    if (isEditing && courseToEdit) {
      updateCourse(courseToEdit.id, {
        nombre: nombre.trim(),
        codigo: codigo.trim().toUpperCase(),
        nivel,
        color: colorHex,
        color_hex: colorHex,
        area_curricular: areaCurricular,
        horas_semanales_sugeridas: horasSemanales,
        descripcion: descripcion.trim(),
        competencias: validCompetencias,
      });
      onSuccess?.({
        ...courseToEdit,
        nombre: nombre.trim(),
        codigo: codigo.trim().toUpperCase(),
        nivel,
        color: colorHex,
        color_hex: colorHex,
        area_curricular: areaCurricular,
        horas_semanales_sugeridas: horasSemanales,
        descripcion: descripcion.trim(),
      });
    } else {
      const assignList = (enableImmediateAssign && selectedTeacherId && selectedSectionId) ? [{
        docenteId: selectedTeacherId,
        seccionId: selectedSectionId,
        horasSemanales,
        aulaDefecto: aulaDefecto || 'Aula General',
      }] : undefined;

      const created = addCourse({
        nombre: nombre.trim(),
        codigo: codigo.trim().toUpperCase(),
        nivel,
        color: colorHex,
        color_hex: colorHex,
        area_curricular: areaCurricular,
        horas_semanales_sugeridas: horasSemanales,
        descripcion: descripcion.trim(),
        competencias: validCompetencias,
        assignTo: assignList,
      });

      onSuccess?.(created);
    }

    onClose();
  };

  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: colorHex }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  {isEditing ? 'Editar Asignatura / Curso' : 'Registrar Nuevo Curso'}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                  {nivel}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Configuración curricular, competencias CNEB y asignación docente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SECCIÓN 1: NIVEL EDUCATIVO */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-indigo-500" />
              Nivel Educativo Destino *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['inicial', 'primaria', 'secundaria'] as EducationalLevel[]).map((lvl) => {
                const isSelected = nivel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleNivelChange(lvl)}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs capitalize flex items-center justify-center gap-2 border transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-400'}`} />
                    {lvl === 'inicial' ? '🧸 Inicial' : lvl === 'primaria' ? '📚 Primaria' : '🎓 Secundaria'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 2: DATOS PRINCIPALES */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Nombre */}
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Nombre del Curso / Materia *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej: Matemática, Robótica, Arte y Creatividad..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-bold placeholder:font-normal"
              />
            </div>

            {/* Código */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-500" />
                Código Oficial *
              </label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: MAT-PRI"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono font-bold tracking-wider"
              />
            </div>

            {/* Área Curricular */}
            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Área Curricular / Especialidad *
              </label>
              <select
                value={areaCurricular}
                onChange={(e) => setAreaCurricular(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                {CURRICULAR_AREAS.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Horas Semanales Sugeridas */}
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Horas Semanales
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={horasSemanales}
                  onChange={(e) => setHorasSemanales(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-bold text-center"
                />
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">hrs / sem</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: COLOR INSTITUCIONAL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-500" />
                Color de Identificación del Curso
              </span>
              <span 
                className="px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-xs"
                style={{ backgroundColor: colorHex }}
              >
                {nombre || 'Vista Previa'}
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setColorHex(preset.hex)}
                  title={preset.label}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${preset.bg} ${
                    colorHex === preset.hex ? 'ring-3 ring-offset-2 ring-indigo-500 scale-110 shadow-md' : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {colorHex === preset.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
              <div className="flex items-center gap-1.5 ml-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                  title="Color personalizado"
                />
                <span className="text-[11px] font-mono text-slate-500 uppercase">{colorHex}</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: CONSTRUCTOR DE COMPETENCIAS CNEB */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-500" />
                  Competencias Oficiales del Curso (CNEB)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Estas competencias aparecerán en las libretas de calificaciones y rúbricas docentes.
                </p>
              </div>
              <button
                type="button"
                onClick={addCompetencyRow}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-[11px] flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Competencia
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {competencias.map((comp, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <div className="w-12 shrink-0">
                    <input
                      type="text"
                      value={comp.codigo}
                      onChange={(e) => updateCompetency(idx, 'codigo', e.target.value)}
                      placeholder="C1"
                      className="w-full px-2 py-1.5 text-center text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/50"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={comp.descripcion}
                      onChange={(e) => updateCompetency(idx, 'descripcion', e.target.value)}
                      placeholder="Descripción de la competencia..."
                      className="w-full px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 bg-transparent rounded-lg border border-slate-200/80 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  {competencias.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCompetencyRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Eliminar competencia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 5: ASIGNACIÓN DIRECTA A DOCENTE (Solo en creación) */}
          {!isEditing && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableImmediateAssign}
                  onChange={(e) => setEnableImmediateAssign(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 rounded-md border-slate-300"
                />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Asignar de inmediato a un Docente y Salón
                </span>
              </label>

              {enableImmediateAssign && (
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Profesor / Docente Responsable
                    </label>
                    <SearchableSelect
                      value={selectedTeacherId}
                      onChange={(val) => setSelectedTeacherId(val)}
                      icon={<GraduationCap className="w-3.5 h-3.5" />}
                      options={teachers.map(t => ({
                        value: t.id,
                        label: `${t.apellidos}, ${t.nombres}`,
                        sublabel: `DNI: ${t.dni} • ${t.especialidad || 'Docente'}`,
                      }))}
                      placeholder="Seleccionar docente..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Salón / Sección ({nivel})
                    </label>
                    <SearchableSelect
                      value={selectedSectionId}
                      onChange={(val) => setSelectedSectionId(val)}
                      icon={<School className="w-3.5 h-3.5" />}
                      options={availableSections.map(s => ({
                        value: s.id,
                        label: `${s.grado?.nombre} "${s.letra}"`,
                        sublabel: `Capacidad: ${s.capacidad_maxima} alumnos`,
                      }))}
                      placeholder="Seleccionar aula..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Aula / Laboratorio por Defecto (Opcional)
                    </label>
                    <input
                      type="text"
                      value={aulaDefecto}
                      onChange={(e) => setAulaDefecto(e.target.value)}
                      placeholder="Ej: Laboratorio de Cómputo 1, Aula 204..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DESCRIPCIÓN ADICIONAL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Descripción o Sumilla del Curso (Opcional)
            </label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Objetivos pedagógicos, enfoque metodológico o requisitos del curso..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

        </form>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/25 hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isEditing ? 'Guardar Cambios del Curso' : 'Registrar y Habilitar Curso'}
          </button>
        </div>

      </div>
    </div>
  );
}
