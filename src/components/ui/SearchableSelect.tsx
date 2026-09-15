'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  maxVisibleResults?: number;
  error?: string;
  className?: string;
  id?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  label,
  placeholder = 'Seleccionar opción...',
  searchPlaceholder = 'Buscar...',
  icon,
  disabled = false,
  required = false,
  maxVisibleResults = 2,
  error,
  className = '',
  id,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected Option
  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );

  // Filtered options matching search query (instant search)
  const matchingOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        String(opt.value).toLowerCase().includes(q)
    );
  }, [options, searchQuery]);

  // Cap visible results to max 2 items at the same time as requested
  const visibleOptions = useMemo(
    () => matchingOptions.slice(0, maxVisibleResults),
    [matchingOptions, maxVisibleResults]
  );

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative flex flex-col gap-1 text-left ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all outline-none text-left ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400'
            : isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-750'
        } ${error ? 'border-rose-500 ring-1 ring-rose-500/30' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.icon ? (
            <span className="shrink-0 text-slate-500 dark:text-slate-400">{selectedOption.icon}</span>
          ) : icon ? (
            <span className="shrink-0 text-slate-400">{icon}</span>
          ) : null}

          <span className={`truncate ${selectedOption ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-400 font-normal'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-500' : ''
          }`}
        />
      </button>

      {/* Dropdown Popup Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-2 space-y-1.5 animate-in fade-in-50 zoom-in-95 duration-150">
          
          {/* Integrated Instant Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filtered Options List (Max 2 shown simultaneously) */}
          <div className="space-y-1 max-h-[140px] overflow-y-auto scrollbar-thin">
            {visibleOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 font-medium">
                No se encontraron coincidencias
              </div>
            ) : (
              visibleOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="min-w-0">
                        <p className="truncate leading-snug">{opt.label}</p>
                        {opt.sublabel && (
                          <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {opt.sublabel}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Badge if more results exist */}
          {matchingOptions.length > maxVisibleResults && (
            <div className="pt-1 px-1 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span>Mostrando 2 de {matchingOptions.length}</span>
              <span className="text-indigo-500 font-medium">Escribe para filtrar</span>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-rose-500 font-bold mt-0.5">{error}</p>}
    </div>
  );
}
