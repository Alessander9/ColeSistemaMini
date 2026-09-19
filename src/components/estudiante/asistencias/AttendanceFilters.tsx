import React from 'react';
import { Search, X, ListFilter, CheckCircle2, Clock, XCircle, LayoutGrid, List } from 'lucide-react';

export interface FilterCounts {
  todos: number;
  presente: number;
  tardanza: number;
  falta: number;
}

interface AttendanceFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  counts: FilterCounts;
  viewMode?: 'table' | 'cards';
  onViewModeChange?: (mode: 'table' | 'cards') => void;
  totalResults: number;
}

export function AttendanceFilters({
  searchQuery,
  onSearchChange,
  selectedFilter,
  onSelectFilter,
  counts,
  viewMode,
  onViewModeChange,
  totalResults,
}: AttendanceFiltersProps) {
  const chips = [
    {
      id: 'todos',
      label: 'Todos los registros',
      count: counts.todos,
      icon: ListFilter,
      activeClass: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm',
      inactiveClass: 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50',
    },
    {
      id: 'presente',
      label: 'Puntuales',
      count: counts.presente,
      icon: CheckCircle2,
      activeClass: 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20',
      inactiveClass: 'bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100/70',
    },
    {
      id: 'tardanza',
      label: 'Tardanzas',
      count: counts.tardanza,
      icon: Clock,
      activeClass: 'bg-amber-500 text-white shadow-sm shadow-amber-500/20',
      inactiveClass: 'bg-amber-50/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100/70',
    },
    {
      id: 'falta',
      label: 'Faltas',
      count: counts.falta,
      icon: XCircle,
      activeClass: 'bg-rose-600 text-white shadow-sm shadow-rose-500/20',
      inactiveClass: 'bg-rose-50/70 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100/70',
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[280px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por fecha (AAAA-MM-DD), hora..."
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => {
          const isSelected = selectedFilter === chip.id;
          const Icon = chip.icon;
          return (
            <button
              key={chip.id}
              onClick={() => onSelectFilter(chip.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isSelected ? chip.activeClass : chip.inactiveClass
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
              <span>{chip.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  isSelected
                    ? 'bg-black/20 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200'
                }`}
              >
                {chip.count}
              </span>
            </button>
          );
        })}

        {/* View Mode Switcher (Optional) */}
        {onViewModeChange && viewMode && (
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl ml-auto">
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Vista de Tabla"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('cards')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Vista de Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
