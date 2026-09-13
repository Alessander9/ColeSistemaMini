'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { AttendanceStatus } from '@/types';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Volume2, 
  VolumeX, 
  Zap, 
  LogOut, 
  Sparkles, 
  ShieldCheck,
  Search,
  Check,
  Users,
  Sun,
  Moon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

export default function AsistenciaMobilePage() {
  const { 
    currentUser, 
    registerAttendance, 
    attendances, 
    students, 
    enrollments,
    showToast 
  } = useApp();

  const [scanStatusMode, setScanStatusMode] = useState<AttendanceStatus>('presente');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [lastScannedResult, setLastScannedResult] = useState<{
    status: 'success' | 'warning' | 'error';
    studentName: string;
    code: string;
    section: string;
    time: string;
    message: string;
  } | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => a.fecha === todayStr);
  const totalHoy = todayAttendances.length;
  const aTiempo = todayAttendances.filter(a => a.estado === 'presente').length;
  const tardanzas = todayAttendances.filter(a => a.estado === 'tardanza').length;

  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext policy
    }
  };

  const handleProcessScan = (tokenOrCode: string) => {
    playBeep();

    const student = students.find(
      s => s.token_qr === tokenOrCode || s.codigo_estudiante.toLowerCase() === tokenOrCode.toLowerCase() || s.profile?.dni === tokenOrCode
    );

    const enr = student ? enrollments.find(e => e.estudiante_id === student.id) : undefined;
    const studentName = student?.profile ? `${student.profile.nombres} ${student.profile.apellidos}` : 'Estudiante';
    const sectionName = enr?.seccion ? `${enr.seccion.grado?.nombre} "${enr.seccion.letra}"` : 'Salón General';
    const currentTimeStr = new Date().toLocaleTimeString('es-PE', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const res = registerAttendance({
      studentQrToken: tokenOrCode,
      metodo: 'qr',
      status: scanStatusMode,
    });

    if (res.success) {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.65 },
      });

      setLastScannedResult({
        status: scanStatusMode === 'tardanza' ? 'warning' : 'success',
        studentName,
        code: student?.codigo_estudiante || tokenOrCode,
        section: sectionName,
        time: currentTimeStr,
        message: res.message,
      });
    } else {
      setLastScannedResult({
        status: 'error',
        studentName: 'Código no reconocido',
        code: tokenOrCode,
        section: '-',
        time: currentTimeStr,
        message: res.message,
      });
    }
  };

  useEffect(() => {
    const scannerId = 'mobile-qr-reader-viewport';
    const el = document.getElementById(scannerId);
    if (!el) return;

    try {
      const scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true,
        },
        false
      );

      scanner.render(
        (text) => {
          handleProcessScan(text);
        },
        (error) => {
          // continuous silent scan
        }
      );

      scannerRef.current = scanner;
    } catch (err) {
      console.warn('Camera initialization:', err);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [scanStatusMode, soundEnabled]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessScan(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x border-slate-900 overflow-x-hidden">
      
      {/* Mobile Terminal Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
              Control Asistencia
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                MÓVIL
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
              {currentUser.nombres} ({currentUser.cargo || 'Portería'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Sound toggle button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={soundEnabled ? 'Sonido Activado' : 'Sonido Silenciado'}
            aria-label="Alternar sonido"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Logout button */}
          <Link
            href="/despedida"
            className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-400 hover:bg-rose-900/40 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* KPI Counters Banner */}
      <div className="grid grid-cols-3 gap-2 px-3.5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 text-center">
        <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/50">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Hoy</span>
          <p className="text-base font-black text-white">{totalHoy}</p>
        </div>
        <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/50">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">A Tiempo</span>
          <p className="text-base font-black text-emerald-300">{aTiempo}</p>
        </div>
        <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/50">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">Tardanzas</span>
          <p className="text-base font-black text-amber-300">{tardanzas}</p>
        </div>
      </div>

      {/* Attendance Mode Selector (Presente / Tardanza / Justificado) */}
      <div className="px-3.5 pt-3 pb-1">
        <div className="flex items-center justify-between gap-1 p-1 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            onClick={() => setScanStatusMode('presente')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-xl transition-all ${
              scanStatusMode === 'presente'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✓ Presente
          </button>
          <button
            onClick={() => setScanStatusMode('tardanza')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-xl transition-all ${
              scanStatusMode === 'tardanza'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⏰ Tardanza
          </button>
          <button
            onClick={() => setScanStatusMode('justificado')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-xl transition-all ${
              scanStatusMode === 'justificado'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📝 Justificado
          </button>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="px-3.5 py-2 flex-1 flex flex-col">
        
        {/* Camera Feed Viewport */}
        <div className="relative rounded-3xl bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-2xl mb-3 flex flex-col justify-center">
          <div id="mobile-qr-reader-viewport" className="w-full aspect-square" />
          
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-950/80 text-emerald-400 border border-emerald-500/40 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Cámara Activa
            </span>
            <span className="text-[10px] font-semibold text-slate-300 bg-slate-950/80 px-2 py-1 rounded-full backdrop-blur-md border border-slate-800">
              Modo: {scanStatusMode.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Live Scan Feedback Alert Card */}
        {lastScannedResult && (
          <div
            className={`p-3.5 rounded-2xl border mb-3 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-3 ${
              lastScannedResult.status === 'success'
                ? 'bg-emerald-950/90 border-emerald-700/80 text-emerald-50'
                : lastScannedResult.status === 'warning'
                ? 'bg-amber-950/90 border-amber-700/80 text-amber-50'
                : 'bg-rose-950/90 border-rose-700/80 text-rose-50'
            }`}
          >
            {lastScannedResult.status === 'success' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : lastScannedResult.status === 'warning' ? (
              <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <h3 className="font-black text-sm truncate">{lastScannedResult.studentName}</h3>
                <span className="text-[10px] font-mono opacity-80 shrink-0">{lastScannedResult.time}</span>
              </div>
              <p className="text-[11px] opacity-90 font-medium">
                {lastScannedResult.section} • {lastScannedResult.code}
              </p>
              <p className="text-[11px] font-bold mt-1 opacity-95">{lastScannedResult.message}</p>
            </div>
          </div>
        )}

        {/* Manual Input Fallback */}
        <form onSubmit={handleManualSubmit} className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="DNI, código o token QR..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow transition-all active:scale-95"
          >
            Registrar
          </button>
        </form>

        {/* Quick Simulation Buttons */}
        <div className="space-y-1.5 mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Prueba Rápida sin Carnet:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {students.slice(0, 3).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleProcessScan(st.token_qr)}
                className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 truncate text-center active:scale-95 transition-all"
              >
                👤 {st.profile?.nombres.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Scans Feed */}
        <div className="flex-1 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Últimos Ingresos ({todayAttendances.length})
            </span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin flex-1">
            {todayAttendances.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6 italic">
                Aún no hay asistencias registradas hoy.
              </p>
            ) : (
              todayAttendances.slice(0, 8).map((att) => {
                const enr = enrollments.find(e => e.id === att.matricula_id);
                return (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800/60 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0 text-[11px]">
                        {enr?.estudiante?.profile?.nombres[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-200 truncate text-[11px] leading-tight">
                          {enr?.estudiante?.profile?.apellidos}, {enr?.estudiante?.profile?.nombres}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {enr?.seccion?.grado?.nombre} &quot;{enr?.seccion?.letra}&quot;
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        att.estado === 'presente'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : att.estado === 'tardanza'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {att.estado.toUpperCase()}
                      </span>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">{att.hora_registro}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
