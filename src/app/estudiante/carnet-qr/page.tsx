'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';
import { useApp } from '@/context/AppContext';
import { QrCard } from '@/components/qr/QrCard';
import { AttendanceRecord, AttendanceStatus } from '@/types';
import { AlertCircle, ChevronRight, Flame, Maximize2, ShieldCheck, X } from 'lucide-react';

const STATUS_META: Record<AttendanceStatus, { label: string; emoji: string; chip: string }> = {
  presente: { label: 'A tiempo', emoji: '✅', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  tardanza: { label: 'Tardanza', emoji: '⏰', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  falta: { label: 'Falta', emoji: '❌', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
  justificado: { label: 'Justificada', emoji: '📝', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300' },
};

function isoOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function timeText(hora?: string) {
  if (!hora || hora === '—') return '';
  const [h, m] = hora.split(':').map(Number);
  if (Number.isNaN(h)) return hora;
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
}
function dayText(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const text = new Date(y, m - 1, d).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Dibujo amigable: celular mostrando un QR con un check
function CardIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <circle cx="80" cy="62" r="50" className="fill-white/60 dark:fill-white/5" />
      <rect x="52" y="14" width="56" height="96" rx="12" fill="#1e293b" />
      <rect x="57" y="22" width="46" height="78" rx="6" fill="#fff" />
      <rect x="64" y="34" width="12" height="12" rx="2" fill="#0f172a" />
      <rect x="84" y="34" width="12" height="12" rx="2" fill="#0f172a" />
      <rect x="64" y="54" width="12" height="12" rx="2" fill="#0f172a" />
      <rect x="86" y="56" width="4" height="4" fill="#0f172a" />
      <rect x="92" y="62" width="4" height="4" fill="#0f172a" />
      <rect x="84" y="62" width="4" height="4" fill="#0f172a" />
      <rect x="66" y="76" width="28" height="4" rx="2" fill="#a5b4fc" />
      <rect x="70" y="84" width="20" height="4" rx="2" fill="#c7d2fe" />
      <circle cx="116" cy="84" r="14" fill="#10b981" />
      <path d="M110 84 l4 4 l8 -9" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 34 l3 6 l6 1 l-4.5 4.5 l1 6.5 l-5.5 -3 l-5.5 3 l1 -6.5 l-4.5 -4.5 l6 -1 Z" fill="#fbbf24" />
      <path d="M136 26 l2 4 l4 0.7 l-3 3 l0.7 4.3 l-3.7 -2 l-3.7 2 l0.7 -4.3 l-3 -3 l4 -0.7 Z" fill="#f472b6" />
    </svg>
  );
}

export default function EstudianteCarnetQrPage() {
  const { students, enrollments, attendances, currentUser } = useApp();
  const [scanMode, setScanMode] = useState(false);

  const activeStudent = students.find(s => s.profile_id === currentUser.id || s.id === currentUser.id);
  const activeEnrollment = activeStudent ? enrollments.find(e => e.estudiante_id === activeStudent.id) : undefined;

  // Un registro de entrada por día, del más reciente al más antiguo
  const entries = useMemo(() => {
    if (!activeEnrollment?.id) return [] as AttendanceRecord[];
    const byDay = new Map<string, AttendanceRecord>();
    attendances
      .filter(a => a.matricula_id === activeEnrollment.id && a.tipo_registro !== 'salida')
      .forEach(a => {
        const prev = byDay.get(a.fecha);
        if (!prev || (a.hora_registro || '') < (prev.hora_registro || '')) byDay.set(a.fecha, a);
      });
    return Array.from(byDay.values()).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [attendances, activeEnrollment?.id]);

  const today = new Date();
  const todayEntry = entries.find(e => e.fecha === isoOf(today)) || null;
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const streak = (() => {
    let n = 0;
    for (const e of entries) {
      if (e.estado !== 'presente') break;
      n++;
    }
    return n;
  })();

  useEffect(() => {
    if (!scanMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setScanMode(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [scanMode]);

  if (!activeStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center p-8">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-amber-500" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Tu carnet aún no está listo</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pídele a tu tutor(a) o a la secretaría del colegio que activen tu carnet.
          </p>
        </div>
      </div>
    );
  }

  const firstName = (activeStudent.profile?.nombres || activeStudent.nombres || '').split(' ')[0];
  const fullName = `${activeStudent.profile?.nombres || activeStudent.nombres || ''} ${activeStudent.profile?.apellidos || activeStudent.apellidos || ''}`.trim();
  const qrValue = activeStudent.token_qr || activeStudent.codigo_estudiante;

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in-50 pb-8">

      {/* ── CABECERA AMIGABLE ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-100 via-sky-50 to-emerald-100 dark:from-indigo-950/50 dark:via-slate-900 dark:to-emerald-950/40 border border-indigo-200/70 dark:border-indigo-900/60 px-5 py-4 sm:px-6 print:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Mi carnet QR {firstName && <span className="text-indigo-600 dark:text-indigo-300">· {firstName}</span>}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Es tu pase para entrar al colegio. Muéstralo en la puerta cada mañana y tu asistencia se registra sola. 🪪
            </p>
            <div className="flex flex-wrap gap-2 pt-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200">
                🔢 Código <span className="font-mono">{activeStudent.codigo_estudiante}</span>
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                todayEntry ? STATUS_META[todayEntry.estado].chip : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200'
              }`}>
                {todayEntry
                  ? <>{STATUS_META[todayEntry.estado].emoji} Hoy: {todayEntry.estado === 'falta' || todayEntry.estado === 'justificado' ? STATUS_META[todayEntry.estado].label : `entraste a las ${timeText(todayEntry.hora_registro)}`}</>
                  : isWeekend ? <>🛋️ Hoy no hay clases</> : <>⏳ Hoy aún no registras tu entrada</>}
              </span>
              {streak > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/50 text-xs font-bold text-orange-700 dark:text-orange-300">
                  <Flame className="w-3.5 h-3.5" /> {streak} {streak === 1 ? 'día' : 'días'} seguidos a tiempo
                </span>
              )}
            </div>
          </div>
          <CardIllustration className="hidden sm:block w-32 h-24 shrink-0 animate-float" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* ── CARNET ── */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => setScanMode(true)}
            className="w-full max-w-md inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-black shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all cursor-pointer print:hidden"
          >
            <Maximize2 className="w-5 h-5" /> Mostrar para escanear
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2 print:hidden">Muestra tu código en grande para que el lector de la puerta lo lea fácil.</p>

          <QrCard student={activeStudent} section={activeEnrollment?.seccion} showActions={true} />
        </div>

        {/* ── AYUDA ── */}
        <div className="lg:col-span-5 space-y-3 print:hidden">

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">¿Cómo uso mi carnet?</h2>
            <ol className="mt-3 space-y-2.5">
              {[
                { emoji: '📱', title: 'Abre tu carnet', text: 'En el celular, en la tablet o impreso en papel.' },
                { emoji: '📷', title: 'Acércalo al lector', text: 'En la puerta del colegio, muestra el código al lector o a tu profesor.' },
                { emoji: '✅', title: 'Espera el check', text: 'Cuando suene o salga el check verde, ¡tu entrada quedó registrada!' },
              ].map((step, i) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="relative w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-xl shrink-0" aria-hidden="true">
                    {step.emoji}
                    <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                  </span>
                  <span className="pt-0.5">
                    <span className="block text-sm font-black text-slate-900 dark:text-white">{step.title}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Mis últimas entradas</h2>
              <Link href="/estudiante/asistencias" className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline inline-flex items-center gap-0.5">
                Ver toda mi asistencia <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {entries.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Cuando uses tu carnet por primera vez, aquí verás tus entradas.</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                {entries.slice(0, 5).map(e => (
                  <li key={e.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-700 dark:text-slate-200 font-semibold truncate">{dayText(e.fecha)}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      {timeText(e.hora_registro) && <span className="text-slate-500 dark:text-slate-400">{timeText(e.hora_registro)}</span>}
                      <span className={`px-2 py-0.5 rounded-full font-bold ${STATUS_META[e.estado].chip}`}>{STATUS_META[e.estado].emoji} {STATUS_META[e.estado].label}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 p-4">
            <h2 className="text-sm font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Cuida tu carnet
            </h2>
            <ul className="mt-2 space-y-1.5 text-xs text-amber-900/90 dark:text-amber-100/90">
              <li>🔒 Es solo tuyo: no lo prestes ni le mandes foto a nadie.</li>
              <li>🔆 Si el lector no lo lee, sube el brillo de tu celular.</li>
              <li>🆘 Si lo pierdes o se rompe, avisa a tu tutor(a) para pedir uno nuevo.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── MODO ESCANEO: QR GRANDE EN PANTALLA COMPLETA ── */}
      {scanMode && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Carnet QR en pantalla completa"
          className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center gap-4 p-6 animate-in fade-in-50"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setScanMode(false); }}
        >
          <button
            type="button"
            onClick={() => setScanMode(false)}
            aria-label="Cerrar"
            className="absolute top-4 right-4 p-2.5 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <p className="text-sm font-black uppercase tracking-wider text-emerald-600">Acerca tu pantalla al lector 📷</p>
          <div className="p-4 rounded-3xl border-4 border-slate-900 bg-white">
            <QRCodeCanvas
              value={qrValue}
              size={Math.min(360, Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.6))}
              level="M"
              includeMargin
            />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900">{fullName}</p>
            <p className="text-lg font-mono font-black tracking-widest text-slate-600">{activeStudent.codigo_estudiante}</p>
            {activeEnrollment?.seccion?.grado?.nombre && (
              <p className="text-sm text-slate-500">{activeEnrollment.seccion.grado.nombre} &quot;{activeEnrollment.seccion.letra}&quot;</p>
            )}
          </div>
          <p className="text-xs text-slate-400">Sube el brillo si no lo lee · Toca la X o presiona Esc para cerrar</p>
        </div>,
        document.body
      )}
    </div>
  );
}
