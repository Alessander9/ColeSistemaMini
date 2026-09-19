'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  AlertCircle, 
  LayoutList, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Filter
} from 'lucide-react';

import { SkeletonTable } from '@/components/ui/Skeleton';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  emptyMessage?: string;
  itemsPerPage?: number;
  gridItemRender?: (item: T) => React.ReactNode;
  filterChips?: FilterChip[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  title?: string;
  actions?: React.ReactNode;
  isLoading?: boolean;
  gridClassName?: string;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = 'Buscar...',
  searchFilter,
  emptyMessage = 'No se encontraron registros',
  itemsPerPage = 10,
  gridItemRender,
  filterChips,
  activeFilter,
  onFilterChange,
  title,
  actions,
  isLoading = false,
  gridClassName = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered dataset
  const filteredData = useMemo(() => {
    if (!searchFilter || !search.trim()) return data;
    return data.filter((item) => searchFilter(item, search.toLowerCase().trim()));
  }, [data, search, searchFilter]);

  // Reset page when search or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter, data.length]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const pagedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, validCurrentPage, itemsPerPage]);

  const startRecord = filteredData.length === 0 ? 0 : (validCurrentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(validCurrentPage * itemsPerPage, filteredData.length);

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (validCurrentPage > 3) pages.push('...');
      const start = Math.max(2, validCurrentPage - 1);
      const end = Math.min(totalPages - 1, validCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (validCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, validCurrentPage]);

  if (isLoading) {
    return <SkeletonTable rows={itemsPerPage > 6 ? 6 : itemsPerPage} cols={columns.length} />;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col transition-all duration-300">
      
      {/* Top Header & Controls Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col gap-3.5">
        
        {/* Title + Action Buttons Row */}
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            {title && (
              <h3 className="font-bold text-slate-800 dark:text-white text-base sm:text-lg tracking-tight">
                {title}
              </h3>
            )}
            {actions && <div className="flex items-center gap-2 self-start sm:self-auto">{actions}</div>}
          </div>
        )}

        {/* Search Bar + View Toggle Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Toolbar: Records Badge + Grid/List View Mode Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              {filteredData.length} {filteredData.length === 1 ? 'resultado' : 'resultados'}
            </span>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Vista en Lista / Tabla"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Lista</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Vista en Cuadrícula / Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Optional Filter Chips / Tabs */}
        {filterChips && filterChips.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin pt-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3 h-3" /> Filtro:
            </span>
            {filterChips.map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onFilterChange?.(chip.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full shrink-0 border transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {chip.icon && <span className="shrink-0">{chip.icon}</span>}
                  <span>{chip.label}</span>
                  {chip.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {chip.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content: List Mode vs Grid Mode */}
      <div className="flex-1">
        {filteredData.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-slate-400" />
              </div>
              <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">{emptyMessage}</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Intenta ajustar los términos de búsqueda o cambiar los filtros activos.
              </p>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* Table / List View */
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                  {columns.map((col, idx) => (
                    <th key={idx} className="py-3 px-3.5 sm:px-6 whitespace-nowrap">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pagedData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {columns.map((col, idx) => (
                      <td key={idx} className="py-3 px-3.5 sm:px-6 font-medium text-slate-700 dark:text-slate-200">
                        {col.cell ? col.cell(row) : (row[col.accessorKey as keyof T] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Card / Grid View */
          <div className={`p-4 sm:p-6 grid ${gridClassName} gap-4 sm:gap-5`}>
            {pagedData.map((item) => (
              <div 
                key={item.id} 
                className="transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                {gridItemRender ? (
                  gridItemRender(item)
                ) : (
                  /* Default Card Render if no custom grid render provided */
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-2.5">
                    {columns.map((col, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-400 font-medium">{col.header}:</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {col.cell ? col.cell(item) : (item[col.accessorKey as keyof T] as React.ReactNode)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {filteredData.length > 0 && (
        <div className="px-4 py-3.5 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex flex-col xs:flex-row items-center justify-between gap-3 text-xs">
          
          {/* Item count text */}
          <div className="text-slate-500 dark:text-slate-400 font-medium text-center xs:text-left text-[11px] sm:text-xs">
            Mostrando <span className="font-bold text-slate-800 dark:text-slate-200">{startRecord}</span> a{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{endRecord}</span> de{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{filteredData.length}</span> registros
          </div>

          {/* Pagination Buttons (10 items / page) */}
          <div className="flex items-center gap-1">
            {/* Prev Button */}
            <button
              type="button"
              disabled={validCurrentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            {pageNumbers.map((page, idx) => {
              if (page === '...') {
                return (
                  <span key={`dots-${idx}`} className="px-2 text-slate-400">
                    ...
                  </span>
                );
              }
              const isCurrent = page === validCurrentPage;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(Number(page))}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              type="button"
              disabled={validCurrentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
