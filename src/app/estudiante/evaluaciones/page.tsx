'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Calendar, Clock, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

export default function EstudianteEvaluacionesPage() {
  const { exams } = useApp();

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50">
      <PageHeader
        title="Mis Próximas Evaluaciones"
        description="Consulta las fechas de exámenes bimestrales, prácticas calificadas y competencias a evaluar."
        badge={`${exams.length} Programadas`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                  {exam.curso?.nombre}
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {exam.tipo.toUpperCase()}
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {exam.titulo}
              </h3>
              <p className="text-xs text-slate-400">
                Competencia: {exam.competencia?.descripcion || 'Resolución de problemas'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                {exam.fecha_programada} ({exam.hora_inicio || '08:00 AM'})
              </span>
              <span className="text-slate-400 font-medium">
                ⏱ {exam.duracion_minutos} min
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
