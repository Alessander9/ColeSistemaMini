'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Users, 
  GraduationCap, 
  School, 
  Calendar, 
  Award, 
  QrCode, 
  FileText, 
  Megaphone, 
  Settings, 
  ShieldCheck, 
  ArrowRight,
  Command,
  X
} from 'lucide-react';

export function CommandPalette() {
  const { 
    isCommandPaletteOpen, 
    toggleCommandPalette, 
    students, 
    teachers, 
    sections, 
    currentUser 
  } = useApp();
  
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        toggleCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette, isCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Static Navigation Items
  const navigationItems = useMemo(() => [
    { title: 'Terminal Kiosco QR (Asistencia en Vivo)', href: '/asistencia', category: 'Acceso Rápido', icon: QrCode },
    { title: 'Matrículas & Fichas Oficiales', href: '/admin/matriculas', category: 'Administración', icon: Users },
    { title: 'Consolidado de Calificaciones CNEB', href: '/admin/notas-salon', category: 'Académico', icon: Award },
    { title: 'Reportes & Actas Oficiales', href: '/admin/reportes', category: 'Académico', icon: FileText },
    { title: 'Comunicados & Circulares Institucionales', href: '/admin/comunicados', category: 'Comunicación', icon: Megaphone },
    { title: 'Calendario Escolar MINEDU 2026', href: '/admin/calendario', category: 'Académico', icon: Calendar },
    { title: 'Horarios Escolares por Salón', href: '/admin/horarios', category: 'Académico', icon: Calendar },
    { title: 'Gestión de Cursos & Curriculo CNEB', href: '/admin/academico', category: 'Administración', icon: School },
    { title: 'Plana Docente', href: '/admin/docentes', category: 'Administración', icon: GraduationCap },
    { title: 'Branding & Identidad Institucional', href: '/admin/branding', category: 'Configuración', icon: Settings },
  ], []);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    if (!query.trim()) return [];
    const term = query.toLowerCase();
    return students.filter(s => {
      const name = `${s.profile?.nombres || s.nombres || ''} ${s.profile?.apellidos || s.apellidos || ''}`.toLowerCase();
      const dni = (s.profile?.dni || s.dni || '').toLowerCase();
      const code = (s.codigo_estudiante || '').toLowerCase();
      return name.includes(term) || dni.includes(term) || code.includes(term);
    }).slice(0, 5);
  }, [students, query]);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    if (!query.trim()) return [];
    const term = query.toLowerCase();
    return teachers.filter(t => {
      const name = `${t.nombres} ${t.apellidos}`.toLowerCase();
      const email = (t.email || '').toLowerCase();
      return name.includes(term) || email.includes(term);
    }).slice(0, 4);
  }, [teachers, query]);

  // Filtered Pages
  const filteredNav = useMemo(() => {
    if (!query.trim()) return navigationItems.slice(0, 6);
    const term = query.toLowerCase();
    return navigationItems.filter(item => 
      item.title.toLowerCase().includes(term) || item.category.toLowerCase().includes(term)
    );
  }, [navigationItems, query]);

  if (!isCommandPaletteOpen) return null;

  const handleSelect = (href: string) => {
    toggleCommandPalette();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in-50">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar estudiantes, docentes, páginas o módulos... (Esc para salir)"
            className="w-full bg-transparent text-white text-sm font-medium focus:outline-none placeholder:text-slate-500"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-4 max-h-96 scrollbar-thin">
          {/* Students Group */}
          {filteredStudents.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 px-3 py-1">
                Estudiantes ({filteredStudents.length})
              </p>
              <div className="space-y-1">
                {filteredStudents.map(student => {
                  const fullName = `${student.profile?.apellidos || student.apellidos || ''}, ${student.profile?.nombres || student.nombres || ''}`.trim();
                  return (
                    <button
                      key={student.id}
                      onClick={() => handleSelect(`/admin/estudiantes/${student.id}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">{fullName}</p>
                          <p className="text-[11px] text-slate-400">DNI: {student.profile?.dni || student.dni || '---'} · {student.codigo_estudiante}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 group-hover:text-indigo-400 flex items-center gap-1">
                        Ver Expediente <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Teachers Group */}
          {filteredTeachers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-3 py-1">
                Docentes ({filteredTeachers.length})
              </p>
              <div className="space-y-1">
                {filteredTeachers.map(teacher => (
                  <button
                    key={teacher.id}
                    onClick={() => handleSelect('/admin/docentes')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {teacher.nombres.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">{teacher.nombres} {teacher.apellidos}</p>
                        <p className="text-[11px] text-slate-400">{teacher.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 group-hover:text-emerald-400 flex items-center gap-1">
                      Plana Docente <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Pages */}
          {filteredNav.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Módulos y Herramientas
              </p>
              <div className="space-y-1">
                {filteredNav.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href + item.title}
                      onClick={() => handleSelect(item.href)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-950/40 flex items-center justify-center transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">{item.title}</p>
                          <p className="text-[10px] text-slate-500">{item.category}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredStudents.length === 0 && filteredTeachers.length === 0 && filteredNav.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              No se encontraron resultados para &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Navegación inteligente ColeSistema Mini</span>
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[9px]">↵</kbd> para ir</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[9px]">ESC</kbd> para cerrar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
