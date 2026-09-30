'use client';

import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Student, Section } from '@/types';
import {
  Download,
  Printer,
  ShieldCheck,
  Sparkles,
  IdCard,
  GraduationCap,
  UserRound,
  Phone,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

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
  const { brandingConfig } = useApp();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
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

  const fullName =
    `${student.profile?.apellidos || student.apellidos || ''}, ${student.profile?.nombres || student.nombres || ''}`.trim() ||
    'Estudiante';
  const gradoNombre = section?.grado?.nombre || 'Grado sin asignar';
  const seccionLetra = section?.letra || '-';
  const dni = student.profile?.dni || student.dni || '—';
  const primaryColor = brandingConfig.carnetColorBorde || brandingConfig.primaryColor || '#4f46e5';
  const accentColor = brandingConfig.carnetFranjaNivelColor || brandingConfig.accentColor || '#10b981';
  const isHorizontal = brandingConfig.carnetOrientacion === 'horizontal';
  const logoText = (brandingConfig.siglas || schoolName.substring(0, 3) || 'CS').substring(0, 3).toUpperCase();
  const cardBackground = brandingConfig.carnetFondoUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(15,23,42,.93), rgba(15,23,42,.78)), url(${brandingConfig.carnetFondoUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: `linear-gradient(135deg, ${primaryColor} 0%, #0f172a 48%, ${accentColor} 135%)`,
      };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div
        ref={cardRef}
        className={`printable-card relative overflow-hidden shadow-2xl text-white border bg-slate-950 ${
          isHorizontal ? 'w-full max-w-[520px] rounded-[28px] p-5' : 'w-full max-w-[340px] rounded-[30px] p-5'
        }`}
        style={{
          ...cardBackground,
          borderColor: primaryColor,
          boxShadow: `0 24px 70px ${primaryColor}33`,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,.24),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(255,255,255,.14),transparent_28%)]" />
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
        />

        <div className="relative flex items-center justify-between border-b border-white/15 pb-3 mb-4 mt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            {brandingConfig.logoUrl ? (
              <img
                src={brandingConfig.logoUrl}
                alt={brandingConfig.nombreInstitucion || schoolName}
                className="w-10 h-10 rounded-2xl object-cover bg-white/95 p-1 shadow-lg shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white shadow-lg text-sm shrink-0"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
              >
                {logoText}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-black text-xs uppercase tracking-wide text-white leading-tight truncate">
                {brandingConfig.nombreInstitucion || schoolName}
              </h3>
              <p className="text-[10px] text-white/75 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 inline" />
                {brandingConfig.carnetSubtitulo || 'Año Lectivo 2026'}
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/20">
            ESTUDIANTE
          </span>
        </div>

        <div className={`relative ${isHorizontal ? 'grid grid-cols-[1fr_178px] gap-4 items-stretch' : 'space-y-4'}`}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {student.profile?.avatar_url ? (
                  <img
                    src={student.profile.avatar_url}
                    alt={fullName}
                    className="w-[88px] h-[88px] rounded-3xl object-cover border-2 shadow-xl"
                    style={{ borderColor: accentColor }}
                  />
                ) : (
                  // Sin foto: iniciales (antes se usaba una foto externa que no carga sin internet)
                  <div
                    className="w-[88px] h-[88px] rounded-3xl border-2 shadow-xl flex items-center justify-center text-3xl font-black text-white bg-white/10"
                    style={{ borderColor: accentColor }}
                    aria-label={fullName}
                  >
                    {`${(student.profile?.nombres || student.nombres || 'E')[0]}${(student.profile?.apellidos || student.apellidos || '')[0] || ''}`.toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 text-white p-1.5 rounded-full shadow" style={{ backgroundColor: accentColor }}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/60 font-black">
                  {brandingConfig.carnetTitulo || 'Carnet estudiantil'}
                </p>
                <h4 className="font-black text-base text-white leading-tight">{fullName}</h4>
                <div className="mt-2 grid gap-1.5 text-[11px]">
                  {brandingConfig.carnetMostrarDni !== false && (
                    <span className="bg-white/10 text-white/90 px-2.5 py-1 rounded-xl font-mono border border-white/15 inline-flex items-center gap-1.5 w-fit">
                      <IdCard className="w-3 h-3" />
                      DNI: {dni}
                    </span>
                  )}
                  {brandingConfig.carnetMostrarGrado !== false && (
                    <span className="bg-white/10 text-white/90 px-2.5 py-1 rounded-xl font-semibold border border-white/15 inline-flex items-center gap-1.5 w-fit">
                      <GraduationCap className="w-3 h-3" />
                      {gradoNombre} &quot;{seccionLetra}&quot;
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-white/80">
              <div className="rounded-2xl bg-white/10 border border-white/15 p-2.5">
                <UserRound className="w-3.5 h-3.5 mb-1 text-white/70" />
                <p className="font-bold leading-tight">Acceso personal e intransferible</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/15 p-2.5">
                <Phone className="w-3.5 h-3.5 mb-1 text-white/70" />
                <p className="font-bold leading-tight">{brandingConfig.carnetReversoTelefono || brandingConfig.telefono}</p>
              </div>
            </div>
          </div>

          <div className={`${isHorizontal ? '' : 'mt-4'} bg-white rounded-[24px] p-4 flex flex-col items-center justify-center shadow-2xl border-2 border-white`}>
            <QRCodeCanvas
              value={student.token_qr || student.codigo_estudiante}
              size={isHorizontal ? 142 : 170}
              level="M"
              includeMargin={true}
            />
            {brandingConfig.carnetMostrarCodigo !== false && (
              <p className="text-[11px] font-mono text-slate-700 mt-2 font-black tracking-widest uppercase">
                {student.codigo_estudiante}
              </p>
            )}
          </div>
        </div>

        <div className="relative mt-4 flex items-center justify-between gap-3 text-[10px] text-white/65 font-semibold">
          <span className="leading-snug">
            {brandingConfig.carnetTextoInstruccion ||
              'Muestra este código en portería o al docente para registrar tu asistencia diaria.'}
          </span>
          {brandingConfig.carnetSelloHolografico !== false && (
            <span className="shrink-0 px-2 py-1 rounded-full bg-gradient-to-r from-amber-300 via-rose-300 to-sky-300 text-slate-950 font-black shadow-lg">
              2026
            </span>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-2.5 no-print">
          <button
            onClick={handleDownload}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all active:scale-95 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Guardar imagen
          </button>
          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir carnet
          </button>
        </div>
      )}
    </div>
  );
}
