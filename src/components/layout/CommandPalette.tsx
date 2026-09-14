'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Search, 
  User, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Layers, 
  FileText, 
  CheckSquare, 
  Bell, 
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
}

export function CommandPalette() {
  const router = useRouter();
  const { 
    isCommandPaletteOpen, 
    setIsCommandPaletteOpen, 
    students, 
    teachers, 
    courses, 
    sections,
    currentUser 
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atajo global CTRL+K / CMD+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Resultados de búsqueda categorizados
  const results: CommandItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Accesos directos predeterminados según el rol
      const shortcuts: CommandItem[] = [
        { id: 'sc-dash', title: 'Ir al Dashboard Principal', category: 'Navegación', icon: Sparkles, url: `/${currentUser?.rol === 'admin' ? 'admin' : currentUser?.rol === 'docente' ? 'docente' : currentUser?.rol === 'apoderado' ? 'apoderado' : currentUser?.rol === 'asistencia' ? 'asistencia' : 'estudiante'}` },
        { id: 'sc-est', title: 'Directorio de Estudiantes', category: 'Navegación', icon: GraduationCap, url: '/admin/estudiantes' },
        { id: 'sc-mat', title: 'Nueva Matrícula (Wizard)', category: 'Acciones Rápidas', icon: Layers, url: '/admin/matriculas' },
        { id: 'sc-asis', title: 'Terminal de Asistencia QR', category: 'Herramientas', icon: CheckSquare, url: '/asistencia' },
        { id: 'sc-not', title: 'Consolidado de Calificaciones', category: 'Evaluación', icon: FileText, url: '/admin/notas-salon' },
      ];
      return shortcuts;
    }

    const items: CommandItem[] = [];

    // 1. Estudiantes
    students
      .filter(s => {
        const full = `${s.profile?.nombres} ${s.profile?.apellidos} ${s.codigo_estudiante} ${s.profile?.dni}`.toLowerCase();
        return full.includes(q);
      })
      .slice(0, 5)
      .forEach(s => {
        items.push({
          id: `st-${s.id}`,
          title: `${s.profile?.nombres} ${s.profile?.apellidos}`,
          subtitle: `DNI: ${s.profile?.dni} • Código: ${s.codigo_estudiante}`,
          category: 'Estudiantes',
          icon: GraduationCap,
          url: `/admin/estudiantes/${s.id}`
        });
      });

    // 2. Docentes
    teachers
      .filter(t => `${t.nombres} ${t.apellidos} ${t.especialidad} ${t.dni}`.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(t => {
        items.push({
          id: `tc-${t.id}`,
          title: `Prof. ${t.nombres} ${t.apellidos}`,
          subtitle: t.especialidad || 'Docente Titular',
          category: 'Plana Docente',
          icon: User,
          url: '/admin/docentes'
        });
      });

    // 3. Cursos
    courses
      .filter(c => `${c.nombre} ${c.codigo} ${c.nivel}`.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(c => {
        items.push({
          id: `cr-${c.id}`,
          title: c.nombre,
          subtitle: `Nivel: ${c.nivel.toUpperCase()} • Código: ${c.codigo}`,
          category: 'Cursos & Malla Curricular',
          icon: BookOpen,
          url: '/admin/academico'
        });
      });

    // 4. Secciones
    sections
      .filter(sec => `${sec.grado?.nombre} ${sec.letra}`.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(sec => {
        items.push({
          id: `sec-${sec.id}`,
          title: `${sec.grado?.nombre} "${sec.letra}"`,
          subtitle: `Capacidad: ${sec.capacidad_maxima} alumnos`,
          category: 'Secciones & Aulas',
          icon: Layers,
          url: `/admin/secciones/${sec.id}`
        });
      });

    return items;
  }, [query, students, teachers, courses, sections, currentUser]);

  const handleSelect = (url: string) => {
    setIsCommandPaletteOpen(false);
    router.push(url);
  };

  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (results.length || 1)) % (results.length || 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex].url);
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownList}
            placeholder="Buscar estudiantes, docentes, cursos, secciones... (o escribe una acción)"
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No se encontraron resultados para &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">Prueba buscando por nombre, DNI, curso o código.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.url)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        isSelected 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-2">
                          <span>{item.title}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                            {item.category}
                          </span>
                        </div>
                        {item.subtitle && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-indigo-600 dark:text-indigo-400' : 'opacity-0'}`} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Navegar: <kbd className="font-mono bg-slate-200/60 dark:bg-slate-800 px-1 rounded">↑</kbd> <kbd className="font-mono bg-slate-200/60 dark:bg-slate-800 px-1 rounded">↓</kbd></span>
            <span>Seleccionar: <kbd className="font-mono bg-slate-200/60 dark:bg-slate-800 px-1 rounded">Enter</kbd></span>
          </div>
          <div className="font-medium text-slate-500 dark:text-slate-400">
            ColeSistemaMini SaaS
          </div>
        </div>
      </div>
    </div>
  );
}
