'use client';

import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Student, Section } from '@/types';
import { Download, Printer, ShieldCheck, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';

interface QrCardProps {
  student: Student;
  section?: Section;
  schoolName?: string;
  showActions?: boolean;
}

export function QrCard({
  student,
  section,
  schoolName = 'Colegio San Martín de Porres',
  showActions = true,
}: QrCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `Carnet_QR_${student.codigo_estudiante}_${student.profile?.apellidos}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error al generar imagen de carnet:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const fullName = `${student.profile?.apellidos}, ${student.profile?.nombres}`;
  const gradoNombre = section?.grado?.nombre || '3° de Primaria';
  const seccionLetra = section?.letra || 'A';

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Carnet Container */}
      <div
        ref={cardRef}
        className="printable-card relative w-full max-w-[360px] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-white border border-slate-700/60 p-4 sm:p-6"
      >
        {/* Decorative Top Banner */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-blue-500 via-emerald-500 to-teal-400" />
        
        {/* Header Institucional */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4 mt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-black text-white shadow-lg text-sm">
              CSM
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">{schoolName}</h3>
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 inline" /> Año Lectivo 2026
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            ESTUDIANTE
          </span>
        </div>

        {/* Profile Info & Avatar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <img
              src={student.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={fullName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-400/80 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Estudiante</p>
            <h4 className="font-extrabold text-sm text-white leading-tight truncate">{fullName}</h4>
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono border border-slate-700">
                DNI: {student.profile?.dni}
              </span>
              <span className="bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded-md font-semibold border border-emerald-800/60">
                {gradoNombre} &quot;{seccionLetra}&quot;
              </span>
            </div>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner border-2 border-slate-200 mb-3">
          <QRCodeCanvas
            value={student.token_qr || student.codigo_estudiante}
            size={170}
            level="M"
            includeMargin={true}
          />
          <p className="text-[11px] font-mono text-slate-700 mt-2 font-black tracking-widest uppercase">
            {student.codigo_estudiante}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 font-medium">
          Muestra este código en la entrada o cámara del docente para registrar tu asistencia diaria.
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center gap-2.5 no-print">
          <button
            onClick={handleDownload}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all active:scale-95 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Descargar PNG
          </button>
          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Carnet
          </button>
        </div>
      )}
    </div>
  );
}
