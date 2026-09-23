'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { EducationalLevel } from '@/types';
import { 
  School, 
  ChevronDown, 
  Check, 
  Layers, 
  Calendar, 
  GraduationCap, 
  Sparkles, 
  X,
  Filter
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export function AcademicContextSelector() {
  const { 
    academicContext, 
    setAcademicLevel, 
    setAcademicGrade, 
    setAcademicSection,
    gradeLevels,
    sections 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const levels: { id: EducationalLevel | 'todos'; label: string; tag: string; color: string }[] = [
    { id: 'todos', label: 'Toda la Institución', tag: 'Global', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { id: 'inicial', label: '🧸 Nivel Inicial', tag: '3–5 Años', color: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20' },
    { id: 'primaria', label: '📚 Nivel Primaria', tag: '1°–6° Grado', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' },
    { id: 'secundaria', label: '🎓 Nivel Secundaria', tag: '1°–5° Año', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20' },
  ];

  const safeGradeLevels = gradeLevels || [];
  const safeSections = sections || [];

  const currentLevelConfig = levels.find(l => l.id === academicContext?.nivel) || levels[0];

  const filteredGrades = (academicContext?.nivel === 'todos' || !academicContext?.nivel)
    ? safeGradeLevels 
    : safeGradeLevels.filter(g => g.nivel === academicContext.nivel);

  const selectedGrade = safeGradeLevels.find(g => g.id === academicContext?.gradoId);
  const selectedSection = safeSections.find(s => s.id === academicContext?.seccionId);

  const availableSections = selectedGrade
    ? safeSections.filter(s => s.grado_id === selectedGrade.id)
    : [];

  const hasCustomFilter = academicContext?.nivel !== 'todos' || !!academicContext?.gradoId || !!academicContext?.seccionId;

  return (
    <div className="relative" ref={containerRef}>
      {/* Context Trigger Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 transition-all text-xs select-none shadow-sm max-w-[190px] xs:max-w-[260px] sm:max-w-none truncate"
      >
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 truncate" suppressHydrationWarning>
          <School className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="hidden sm:inline truncate max-w-[120px] font-medium text-slate-500 dark:text-slate-400">
            {academicContext.institucion.split(' ')[0]}
          </span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
          <span className="font-mono text-slate-500 dark:text-slate-400 hidden xs:inline">2026</span>
          <span className="text-slate-300 dark:text-slate-600 hidden xs:inline">•</span>
          <span className="font-bold text-slate-900 dark:text-white capitalize truncate">
            {academicContext.nivel === 'todos' ? 'Todos' : academicContext.nivel}
          </span>
          {selectedGrade && (
            <>
              <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[110px] hidden sm:inline">
                {selectedGrade.nombre}
              </span>
            </>
          )}
          {selectedSection && (
            <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] shrink-0">
              {selectedSection.letra}
            </span>
          )}
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full left-3 right-3 sm:left-auto sm:right-0 mt-1 sm:mt-2 sm:w-[420px] max-w-[calc(100vw-1.5rem)] sm:max-w-[420px] mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-4 z-50 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
          
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Filtro de Contexto Académico
              </p>
              <h4 className="text-sm font-black text-slate-800 dark:text-white">
                {academicContext.institucion} — 2026
              </h4>
            </div>
            {hasCustomFilter && (
              <button
                onClick={() => {
                  setAcademicLevel('todos');
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                <X className="w-3 h-3" />
                Limpiar filtro
              </button>
            )}
          </div>

          {/* 1. Selector de Nivel Educativo (Inicial, Primaria, Secundaria) */}
          <div className="mb-4">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
              1. Seleccionar Nivel Educativo
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {levels.map((lvl) => {
                const isSelected = academicContext.nivel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => setAcademicLevel(lvl.id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left border text-xs transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md shadow-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="leading-tight">{lvl.label}</p>
                      <p className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {lvl.tag}
                      </p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Selector de Grado o Ciclo */}
          {academicContext.nivel !== 'todos' && (
            <div className="mb-4 animate-in fade-in duration-150">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                2. Grado o Ciclo ({filteredGrades.length})
              </label>
              <SearchableSelect
                value={academicContext.gradoId || ''}
                onChange={(val) => setAcademicGrade(val || undefined)}
                icon={<GraduationCap className="w-3.5 h-3.5" />}
                options={[
                  { value: '', label: 'Todos los grados / ciclos del nivel', sublabel: 'Nivel completo' },
                  ...filteredGrades.map(g => ({
                    value: g.id,
                    label: g.nombre,
                    sublabel: `Nivel ${g.nivel}`,
                  })),
                ]}
                placeholder="Buscar grado..."
              />
            </div>
          )}

          {/* 3. Selector de Sección / Aula */}
          {selectedGrade && availableSections.length > 0 && (
            <div className="mb-2 animate-in fade-in duration-150">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                3. Sección o Aula
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAcademicSection(undefined)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    !academicContext.seccionId
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Todas las Aulas
                </button>
                {availableSections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setAcademicSection(sec.id)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      academicContext.seccionId === sec.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    Sección {sec.letra}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>El contexto persiste durante tu sesión</span>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
