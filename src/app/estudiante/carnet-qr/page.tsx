'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { QrCard } from '@/components/qr/QrCard';
import { AlertCircle } from 'lucide-react';

export default function EstudianteCarnetQrPage() {
  const { students, enrollments, currentUser } = useApp();

  const activeStudent = students.find(s => s.profile_id === currentUser.id);
  const activeEnrollment = activeStudent
    ? enrollments.find(e => e.estudiante_id === activeStudent.id)
    : undefined;

  if (!activeStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center p-8">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-amber-500" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Carnet no disponible</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tu perfil de estudiante aún no está vinculado al sistema. Contacta al administrador.
          </p>
        </div>
      </div>
    );
  }

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
