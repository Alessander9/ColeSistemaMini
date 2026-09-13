'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  badgeColor?: 'admin' | 'docente' | 'estudiante' | 'default';
  children?: React.ReactNode;
}

const badgeColorMap = {
  admin: 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-sm shadow-purple-500/20',
  docente: 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-sm shadow-blue-500/20',
  estudiante: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/20',
  default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
};

export function PageHeader({ title, description, badge, badgeColor = 'default', children }: PageHeaderProps) {
  const badgeClass = badgeColorMap[badgeColor] || badgeColorMap.default;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 animate-slide-up">
      <div className="space-y-1 sm:space-y-2">
        {badge && (
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full ${badgeClass}`}>
              {badge}
            </span>
          </div>
        )}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap mt-1">
          {children}
        </div>
      )}
    </div>
  );
}
