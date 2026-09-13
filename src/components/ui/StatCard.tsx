'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'indigo';
  trend?: {
    value: string;
    positive?: boolean;
  };
  delay?: number;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  delay = 0,
}: StatCardProps) {
  const colorMap = {
    blue: {
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconText: 'text-white',
      glow: 'hover:shadow-blue-500/15',
      accent: 'from-blue-500/10 to-blue-600/5',
      border: 'hover:border-blue-200 dark:hover:border-blue-800',
      valuColor: 'text-blue-600 dark:text-blue-400',
    },
    emerald: {
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      iconText: 'text-white',
      glow: 'hover:shadow-emerald-500/15',
      accent: 'from-emerald-500/10 to-emerald-600/5',
      border: 'hover:border-emerald-200 dark:hover:border-emerald-800',
      valuColor: 'text-emerald-600 dark:text-emerald-400',
    },
    purple: {
      iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      iconText: 'text-white',
      glow: 'hover:shadow-purple-500/15',
      accent: 'from-purple-500/10 to-purple-600/5',
      border: 'hover:border-purple-200 dark:hover:border-purple-800',
      valuColor: 'text-purple-600 dark:text-purple-400',
    },
    amber: {
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
      iconText: 'text-white',
      glow: 'hover:shadow-amber-500/15',
      accent: 'from-amber-500/10 to-amber-600/5',
      border: 'hover:border-amber-200 dark:hover:border-amber-800',
      valuColor: 'text-amber-600 dark:text-amber-400',
    },
    rose: {
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
      iconText: 'text-white',
      glow: 'hover:shadow-rose-500/15',
      accent: 'from-rose-500/10 to-rose-600/5',
      border: 'hover:border-rose-200 dark:hover:border-rose-800',
      valuColor: 'text-rose-600 dark:text-rose-400',
    },
    indigo: {
      iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      iconText: 'text-white',
      glow: 'hover:shadow-indigo-500/15',
      accent: 'from-indigo-500/10 to-indigo-600/5',
      border: 'hover:border-indigo-200 dark:hover:border-indigo-800',
      valuColor: 'text-indigo-600 dark:text-indigo-400',
    },
  };

  const style = colorMap[color];
  const delayClass = delay > 0 ? `delay-${delay}` : '';

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl ${style.glow} ${style.border} transition-all duration-300 card-lift animate-slide-up ${delayClass} group`}
    >
      {/* Subtle gradient accent background */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${style.accent} rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl ${style.iconBg} ${style.iconText} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
              trend.positive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
            }`}>
              {trend.positive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              {trend.value}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
            {value}
          </h3>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium pt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
