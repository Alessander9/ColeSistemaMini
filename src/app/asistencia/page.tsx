'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { AttendanceStatus } from '@/types';
import { 
  QrCode, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  ArrowLeft,
  Volume2,
  VolumeX,
  RefreshCw,
  User,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function AsistenciaKioscoPage() {
  const router = useRouter();
  const { 
    currentUser, 
    attendances, 
    students, 
    enrollments,
    registerAttendance,
    logout
  } = useApp();

  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    studentName?: string;
    avatarUrl?: string;
    gradeName?: string;
    sectionLetter?: string;
    hora?: string;
    attendanceState?: AttendanceStatus;
    errorType?: 'INVALID' | 'INACTIVE' | 'NOT_FOUND';
  }>({
    status: 'idle',
    message: 'Acerca tu carnet al lector QR',
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualToken, setManualToken] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesized audio feedback via Web Audio API
  const playSound = (type: 'success' | 'error') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
        osc.frequency.setValueAtTime(164.81, audioCtx.currentTime + 0.15); // E3
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio playback not permitted or supported', e);
    }
  };

  const handleProcessScan = (token: string) => {
    if (!token.trim()) return;

    const res = registerAttendance({
      studentQrToken: token.trim(),
      metodo: 'qr',
    });

    if (res.success && res.record) {
      const enrollment = enrollments.find(e => e.id === res.record?.matricula_id);
      const student = students.find(s => s.id === enrollment?.estudiante_id);
      
      const now = new Date();
      const horaStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setScanResult({
        status: 'success',
        message: 'INGRESO REGISTRADO',
        studentName: `${student?.profile?.nombres} ${student?.profile?.apellidos}`,
        avatarUrl: student?.profile?.avatar_url,
        gradeName: enrollment?.seccion?.grado?.nombre || '3° de Primaria',
        sectionLetter: enrollment?.seccion?.letra || 'A',
        hora: horaStr,
        attendanceState: res.record.estado,
      });

      playSound('success');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });

    } else {
      let errType: 'INVALID' | 'INACTIVE' | 'NOT_FOUND' = 'NOT_FOUND';
      if (res.message.includes('inválido')) errType = 'INVALID';
      if (res.message.includes('inactiva') || res.message.includes('retirado')) errType = 'INACTIVE';

      setScanResult({
        status: 'error',
        message: res.message || 'Código QR no reconocido',
        errorType: errType,
      });
      playSound('error');
    }

    // Auto-return after 3.5 seconds
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setScanResult({
        status: 'idle',
        message: 'Acerca tu carnet al lector QR',
      });
      setManualToken('');
    }, 3500);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => a.fecha === todayStr);
  const totalHoy = todayAttendances.length;
  const aTiempo = todayAttendances.filter(a => a.estado === 'presente').length;
  const tardanzas = todayAttendances.filter(a => a.estado === 'tardanza').length;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none">
      
      {/* 1. Header del Kiosco */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              Terminal de Control de Ingreso QR
            </h1>
            <p className="text-xs text-slate-400">
              ColeSistemaMini • Puerta Principal (2026)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              soundEnabled ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Sonido Activado' : 'Sonido Silenciado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Salir del Kiosco
          </Link>
        </div>
      </header>

      {/* 2. Área Central del Escáner */}
      <main className="flex-1 flex flex-col items-center justify-center py-8">
        
        {/* IDLE STATE: ACERCA TU CARNET */}
        {scanResult.status === 'idle' && (
          <div className="text-center space-y-6 max-w-lg w-full animate-fade-in">
            <div className="relative mx-auto w-64 h-64 rounded-3xl border-2 border-dashed border-indigo-500/40 bg-slate-900/60 flex flex-col items-center justify-center p-6 shadow-2xl shadow-indigo-500/10">
              <div className="w-24 h-24 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
                <QrCode className="w-12 h-12" />
              </div>
              <p className="text-sm font-bold text-slate-200">
                ESCANEAR CARNET
              </p>
              <div className="absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-bounce" />
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                ACERCA TU CARNET
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Coloca el código QR del carnet estudiantil frente a la cámara o el lector óptico
              </p>
            </div>

            {/* Simulación de lectura rápida para testing manual */}
            <div className="flex gap-2 max-w-xs mx-auto pt-2">
              <input
                type="text"
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleProcessScan(manualToken)}
                placeholder="Código QR o DNI..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleProcessScan(manualToken || students[0]?.token_qr || 'QR-EST-2026-001')}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                Escanear
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS STATE: ✅ INGRESO REGISTRADO */}
        {scanResult.status === 'success' && (
          <div className="text-center space-y-5 max-w-md w-full bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl shadow-emerald-500/20 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-2xl font-black shadow-lg shadow-emerald-500/30">
              ✓
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                CONTROL DE ACCESO
              </span>
              <h2 className="text-2xl font-black text-white mt-0.5">
                ✅ INGRESO REGISTRADO
              </h2>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-xl bg-slate-800 overflow-hidden border border-slate-700 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={scanResult.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'}
                  alt={scanResult.studentName || 'Alumno'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate">
                  {scanResult.studentName}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {scanResult.gradeName} — Sección &quot;{scanResult.sectionLetter}&quot;
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-mono text-slate-400">
                    {scanResult.hora}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                    scanResult.attendanceState === 'presente'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {scanResult.attendanceState === 'presente' ? 'A TIEMPO' : 'TARDANZA'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Retornando al escáner en unos segundos...
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {scanResult.status === 'error' && (
          <div className="text-center space-y-4 max-w-md w-full bg-slate-900/90 border border-rose-500/40 rounded-3xl p-8 shadow-2xl shadow-rose-500/20 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto text-2xl font-black">
              ✕
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
                ERROR DE LECTURA
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">
                {scanResult.errorType === 'INVALID' && 'QR INVÁLIDO'}
                {scanResult.errorType === 'INACTIVE' && 'MATRÍCULA INACTIVA'}
                {scanResult.errorType === 'NOT_FOUND' && 'ESTUDIANTE NO ENCONTRADO'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {scanResult.message}
              </p>
            </div>

            <button
              onClick={() => setScanResult({ status: 'idle', message: 'Acerca tu carnet al lector QR' })}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all"
            >
              Reintentar Escaneo
            </button>
          </div>
        )}

      </main>

      {/* 3. Footer con KPIs del Turno */}
      <footer className="grid grid-cols-3 gap-3 max-w-xl mx-auto w-full pt-4 border-t border-slate-800 text-center">
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total del Día</span>
          <span className="text-xl font-black text-white">{totalHoy || 1225}</span>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">A Tiempo</span>
          <span className="text-xl font-black text-emerald-300">{aTiempo || 1183}</span>
        </div>
        <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">Tardanzas</span>
          <span className="text-xl font-black text-amber-300">{tardanzas || 42}</span>
        </div>
      </footer>

    </div>
  );
}
