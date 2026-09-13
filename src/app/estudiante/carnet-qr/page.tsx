'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { QrCard } from '@/components/qr/QrCard';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function EstudianteCarnetQrPage() {
  const { students, enrollments, currentUser } = useApp();

  const activeStudent = students.find(s => s.profile_id === currentUser.id) || students[0];
  const activeEnrollment = enrollments.find(e => e.estudiante_id === activeStudent.id) || enrollments[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50">
      <PageHeader
        title="Mi Carnet Escolar Digital QR"
        description="Tu credencial de identificación para el registro diario de asistencia escolar."
        badge={activeStudent.codigo_estudiante}
      />

      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <QrCard
          student={activeStudent}
          section={activeEnrollment?.seccion}
          showActions={true}
        />
      </div>
    </div>
  );
}
