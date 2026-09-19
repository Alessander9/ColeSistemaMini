'use client';

import React from 'react';
import { AttendanceRecord, Student, Enrollment } from '@/types';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';
import { 
  X, 
  Calendar, 
  Clock, 
  QrCode, 
  Smartphone, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  User, 
  GraduationCap,
  Sparkles
} from 'lucide-react';

interface AttendanceDetailDrawerProps {
  record: AttendanceRecord | null;
  student?: Student;
  enrollment?: Enrollment;
  onClose: () => void;
}

export function AttendanceDetailDrawer({
  record,
  student,
  enrollment,
  onClose,
}: AttendanceDetailDrawerProps) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-50 duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Detalle de Asistencia
              </h3>
              <p className="text-[11px] text-slate-500">
                Registro institucional verificado
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Context Card */}
        <div className="my-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
              {student ? `${(student.profile?.nombres || student.nombres || 'E')[0]}${(student.profile?.apellidos || student.apellidos || 'S')[0]}` : 'ES'}
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-white block">
                {student ? `${student.profile?.nombres || student.nombres || ''} ${student.profile?.apellidos || student.apellidos || ''}` : 'Estudiante Registrado'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-indigo-500" />
                {enrollment?.seccion ? `${enrollment.seccion.grado?.nombre || 'Primaria'} "${enrollment.seccion.letra}"` : '3° de Primaria "A"'}
              </span>
            </div>
          </div>

          <AttendanceStatusBadge estado={record.estado} />
        </div>

        {/* Details Grid */}
        <div className="space-y-3 my-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Fecha */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-blue-500" /> Fecha
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-white block font-mono">
                {record.fecha}
              </span>
            </div>

            {/* Hora */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-emerald-500" /> Hora de Marcación
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-white block font-mono">
                {record.hora_registro !== '—' ? record.hora_registro : 'Sin registro de hora'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Tipo */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Tipo de Registro
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-white capitalize">
                {record.tipo_registro || (record.estado === 'falta' ? 'Inasistencia' : 'Ingreso')}
              </span>
            </div>

            {/* Dispositivo */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Smartphone className="w-3 h-3 text-purple-500" /> Dispositivo
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-white truncate block">
                {record.dispositivo || 'Kiosko QR - Puerta Principal'}
              </span>
            </div>
          </div>

          {/* Ubicación */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-rose-500" /> Ubicación
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {record.ubicacion || 'Ingreso Principal - Av. Los Álamos'}
            </span>
          </div>

          {/* Observación */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3 text-amber-500" /> Observación
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 italic block">
              {record.observacion || 'Sin observaciones registradas.'}
            </span>
          </div>
        </div>

        {/* Security / Immutability Note */}
        <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-2.5 text-indigo-900 dark:text-indigo-200 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            Este registro es inmutable y forma parte de la bitácora oficial del sistema escolar.
          </span>
        </div>

        {/* Action Button */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
}
