'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, CheckCircle2, AlertCircle, Sparkles, RefreshCw, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '@/context/AppContext';

interface QrScannerProps {
  onScanSuccess?: (result: string) => void;
}

export function QrScanner({ onScanSuccess }: QrScannerProps) {
  const { registerAttendance, students } = useApp();
  const [lastScanned, setLastScanned] = useState<{
    text: string;
    status: 'success' | 'error';
    message: string;
    studentName?: string;
  } | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const triggerBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext not allowed before user gesture
    }
  };

  const handleQrRead = (decodedText: string) => {
    triggerBeep();
    const res = registerAttendance({
      studentQrToken: decodedText,
      metodo: 'qr',
      status: 'presente',
    });

    if (res.success) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
      setLastScanned({
        text: decodedText,
        status: 'success',
        message: res.message,
      });
    } else {
      setLastScanned({
        text: decodedText,
        status: 'error',
        message: res.message,
      });
    }

    if (onScanSuccess) {
      onScanSuccess(decodedText);
    }
  };

  useEffect(() => {
    const scannerId = 'qr-reader-element';
    
    // Check if element exists
    const el = document.getElementById(scannerId);
    if (!el) return;

    try {
      const scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true,
        },
        false
      );

      scanner.render(
        (text) => {
          handleQrRead(text);
        },
        (error) => {
          // Continuous scanning silent error
        }
      );

      scannerRef.current = scanner;
    } catch (err) {
      console.warn('Cámara no iniciada o permisos pendientes:', err);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleQrRead(manualToken.trim());
    setManualToken('');
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Escáner de Asistencia QR</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Apunta la cámara al carnet del estudiante</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          En vivo
        </span>
      </div>

      {/* HTML5 QR Camera Container */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 mb-5">
        <div id="qr-reader-element" className="w-full" />
      </div>

      {/* Real-Time Scan Feedback Alert */}
      {lastScanned && (
        <div
          className={`mb-5 p-4 rounded-2xl border flex items-start gap-3 transition-all animate-in fade-in-50 ${
            lastScanned.status === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
          }`}
        >
          {lastScanned.status === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm mb-0.5">
              {lastScanned.status === 'success' ? '¡Asistencia Registrada!' : 'Atención'}
            </p>
            <p>{lastScanned.message}</p>
          </div>
        </div>
      )}

      {/* Test / Simulation Shortcuts */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Acceso Rápido de Prueba (Sin cámara)
          </span>
        </div>

        <form onSubmit={handleManualSubmit} className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Pegar código o Token QR..."
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95"
          >
            Registrar
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] text-slate-400 self-center mr-1">Escanear rápido:</span>
          {students.slice(0, 3).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => handleQrRead(st.token_qr)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
            >
              👤 {st.profile?.nombres.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
