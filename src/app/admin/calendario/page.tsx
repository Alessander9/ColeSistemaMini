'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Calendar, 
  Plus, 
  Filter, 
  Sparkles, 
  Trash2, 
  Clock, 
  BookOpen, 
  School, 
  Award, 
  Sun, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  CalendarDays
} from 'lucide-react';
import { SchoolCalendarEvent, CalendarEventType, EducationalLevel } from '@/types';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export default function AdminCalendarioPage() {
  const { 
    calendarEvents, 
    addCalendarEvent, 
    deleteCalendarEvent, 
    updateCalendarEvent,
    academicContext
  } = useApp();

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('todos');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('lista');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo: 'inicio_bimestre' as CalendarEventType,
    nivel: 'todos' as EducationalLevel | 'todos',
    es_laborable: true,
    color: '#3B82F6',
  });

  const filteredEvents = useMemo(() => {
    return calendarEvents
      .filter(ev => {
        const matchType = selectedTypeFilter === 'todos' || ev.tipo === selectedTypeFilter;
        const matchLevel = selectedLevelFilter === 'todos' || ev.nivel === selectedLevelFilter || ev.nivel === 'todos';
        return matchType && matchLevel;
      })
      .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
  }, [calendarEvents, selectedTypeFilter, selectedLevelFilter]);

  const stats = useMemo(() => {
    const total = calendarEvents.length;
    const bimestres = calendarEvents.filter(e => e.tipo === 'inicio_bimestre' || e.tipo === 'fin_bimestre').length;
    const feriados = calendarEvents.filter(e => e.tipo === 'feriado' || e.tipo === 'vacaciones').length;
    const evaluaciones = calendarEvents.filter(e => e.tipo === 'evaluaciones').length;
    return { total, bimestres, feriados, evaluaciones };
  }, [calendarEvents]);

  const getTypeLabel = (type: CalendarEventType) => {
    switch (type) {
      case 'inicio_bimestre': return { label: 'Inicio de Bimestre', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
      case 'fin_bimestre': return { label: 'Cierre de Bimestre', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
      case 'evaluaciones': return { label: 'Periodo de Evaluación', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
      case 'vacaciones': return { label: 'Vacaciones Estudiantiles', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
      case 'feriado': return { label: 'Feriado Oficial', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
      case 'capacitacion': return { label: 'Jornada Pedagógica', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
      case 'actividad_cultural': return { label: 'Actividad Institucional', color: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800' };
      case 'reunion_apoderados': return { label: 'Reunión de Apoderados', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' };
      default: return { label: 'Evento', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.fecha_inicio) return;

    addCalendarEvent({
      titulo: formData.titulo.trim(),
      descripcion: formData.descripcion.trim() || undefined,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin || formData.fecha_inicio,
      tipo: formData.tipo,
      nivel: formData.nivel,
      es_laborable: formData.es_laborable,
      color: formData.color,
    });

    setFormData({
      titulo: '',
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      tipo: 'inicio_bimestre',
      nivel: 'todos',
      es_laborable: true,
      color: '#3B82F6',
    });
    setIsModalOpen(false);
  };


  useEscapeKey(isModalOpen, () => setIsModalOpen(false));
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Calendario Escolar {academicContext.anio}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Hitos pedagógicos MINEDU, semanas de gestión, bimestres, evaluaciones y recesos
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Evento / Hito</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hitos Registrados</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{stats.total}</p>
          <span className="text-xs text-slate-400 font-medium">Cronograma 2026</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Bimestres & Cierres</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{stats.bimestres}</p>
          <span className="text-xs text-indigo-400/80 font-medium">Periodos oficiales</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Semanas Exámenes</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">{stats.evaluaciones}</p>
          <span className="text-xs text-purple-400/80 font-medium">Evaluación CNEB</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Feriados & Vacaciones</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{stats.feriados}</p>
          <span className="text-xs text-emerald-400/80 font-medium">Recesos no laborables</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Tipo: Todos los Hitos</option>
            <option value="inicio_bimestre">Inicio de Bimestre</option>
            <option value="fin_bimestre">Fin de Bimestre</option>
            <option value="evaluaciones">Evaluaciones</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="feriado">Feriados</option>
            <option value="capacitacion">Jornada Pedagógica</option>
            <option value="actividad_cultural">Actividad Cultural</option>
            <option value="reunion_apoderados">Reunión de Apoderados</option>
          </select>

          <select
            value={selectedLevelFilter}
            onChange={(e) => setSelectedLevelFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Nivel: Todos</option>
            <option value="inicial">Inicial</option>
            <option value="primaria">Primaria</option>
            <option value="secundaria">Secundaria</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Mostrando <strong>{filteredEvents.length}</strong> eventos programados
        </div>
      </div>

      {/* Events Timeline / List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No hay eventos en este criterio</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Utiliza el botón superior para agregar hitos del cronograma escolar oficial.
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const badge = getTypeLabel(event.tipo);
            return (
              <div
                key={event.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: event.color || '#3B82F6' }}
                  >
                    <span className="text-[10px] uppercase font-bold leading-tight opacity-90">
                      {new Date(event.fecha_inicio + 'T00:00:00').toLocaleString('es-PE', { month: 'short' })}
                    </span>
                    <span className="text-base font-black leading-tight">
                      {new Date(event.fecha_inicio + 'T00:00:00').getDate()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {event.fecha_fin && event.fecha_fin !== event.fecha_inicio
                          ? `Del ${event.fecha_inicio} al ${event.fecha_fin}`
                          : event.fecha_inicio}
                      </span>
                      {!event.es_laborable && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 uppercase">
                          No Laborable
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                      {event.titulo}
                    </h3>

                    {event.descripcion && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {event.descripcion}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    Nivel: {event.nivel.toUpperCase()}
                  </span>
                  <button
                    onClick={() => deleteCalendarEvent(event.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                    title="Eliminar evento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Agregar Evento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Nuevo Evento / Hito Escolar</h2>
                  <p className="text-xs text-slate-500">Agrega fechas clave del cronograma anual del colegio</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre del Hito o Actividad *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej. Clausura II Bimestre / Simulacro Nacional"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha Fin (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Tipo de Evento
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="inicio_bimestre">Inicio de Bimestre</option>
                    <option value="fin_bimestre">Fin de Bimestre</option>
                    <option value="evaluaciones">Periodo de Evaluaciones</option>
                    <option value="vacaciones">Vacaciones Estudiantiles</option>
                    <option value="feriado">Feriado Oficial</option>
                    <option value="capacitacion">Jornada Pedagógica</option>
                    <option value="actividad_cultural">Actividad Institucional</option>
                    <option value="reunion_apoderados">Reunión de Apoderados</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nivel Educativo
                  </label>
                  <select
                    value={formData.nivel}
                    onChange={(e) => setFormData({ ...formData, nivel: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todos">Todos los Niveles</option>
                    <option value="inicial">Inicial</option>
                    <option value="primaria">Primaria</option>
                    <option value="secundaria">Secundaria</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Detalles sobre directivas, participación o suspensión de clases..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <input
                  type="checkbox"
                  id="es_laborable"
                  checked={!formData.es_laborable}
                  onChange={(e) => setFormData({ ...formData, es_laborable: !e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="es_laborable" className="cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Día NO laborable / Suspensión de clases</span>
                  <span className="text-[11px] text-slate-500">Marcar si no se pasará asistencia escolar en esta fecha</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar Evento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
