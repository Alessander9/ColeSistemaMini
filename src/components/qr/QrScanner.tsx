'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  SwitchCamera,
  Upload,
  Volume2,
  VolumeX,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '@/context/AppContext';
import { AttendanceStatus } from '@/types';

interface QrScannerProps {
  onScanSuccess?: (result: string) => void;
  statusMode?: AttendanceStatus;
  autoStart?: boolean;
}

// Unique ID per mount to avoid DOM collision on hot reload
let instanceCounter = 0;

export function QrScanner({
  onScanSuccess,
  statusMode = 'presente',
  autoStart = false,
}: QrScannerProps) {
  const { registerAttendance, students } = useApp();

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [currentFacing, setCurrentFacing] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<{
    status: 'success' | 'error';
    message: string;
    studentName?: string;
    time?: string;
  } | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [fileScanning, setFileScanning] = useState(false);

  const qrInstanceRef = useRef<Html5Qrcode | null>(null);
  const containerIdRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const statusModeRef = useRef(statusMode);

  // Keep statusModeRef fresh so scanner callback always uses current mode
  useEffect(() => {
    statusModeRef.current = statusMode;
  }, [statusMode]);

  // Create a unique container ID on first render
  if (!containerIdRef.current) {
    instanceCounter += 1;
    containerIdRef.current = `qr-scanner-container-${instanceCounter}`;
  }

  // ─── Beep ────────────────────────────────────────────────────────────────
  const triggerBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch { /* AudioContext locked */ }
  }, [soundEnabled]);

  // ─── Haptic ──────────────────────────────────────────────────────────────
  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([60, 30, 60]);
      }
    } catch { /* ignore */ }
  };

  // ─── QR Decode handler ───────────────────────────────────────────────────
  const handleDecoded = useCallback(
    (decodedText: string) => {
      triggerBeep();
      triggerHaptic();

      const currentTime = new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const res = registerAttendance({
        studentQrToken: decodedText,
        metodo: 'qr',
        status: statusModeRef.current,
      });

      const foundStudent = students.find(
        (s) =>
          s.token_qr === decodedText ||
          s.codigo_estudiante.toLowerCase() === decodedText.toLowerCase() ||
          s.profile?.dni === decodedText,
      );
      const studentName = foundStudent?.profile
        ? `${foundStudent.profile.nombres} ${foundStudent.profile.apellidos}`
        : undefined;

      if (res.success) {
        confetti({ particleCount: 30, spread: 55, origin: { y: 0.6 } });
        setLastScanned({ status: 'success', message: res.message, studentName, time: currentTime });
      } else {
        setLastScanned({ status: 'error', message: res.message, studentName: 'No reconocido', time: currentTime });
      }

      if (onScanSuccess) onScanSuccess(decodedText);
    },
    [registerAttendance, students, triggerBeep, onScanSuccess],
  );

  // ─── Stop camera ─────────────────────────────────────────────────────────
  const stopCamera = useCallback(async () => {
    if (qrInstanceRef.current) {
      try {
        if (qrInstanceRef.current.isScanning) {
          await qrInstanceRef.current.stop();
        }
        // Clear the inner canvas/video nodes but keep the wrapper div
        qrInstanceRef.current.clear();
      } catch (e) {
        console.warn('stopCamera:', e);
      }
    }
    setIsCameraActive(false);
  }, []);

  // ─── Start camera ────────────────────────────────────────────────────────
  const startCamera = useCallback(
    async (facing: 'environment' | 'user' = 'environment') => {
      setCameraError(null);
      setIsStarting(true);

      // Stop any running instance first
      await stopCamera();

      try {
        // Re-create instance each time to avoid stale internal state
        qrInstanceRef.current = new Html5Qrcode(containerIdRef.current, {
          verbose: false,
        });

        const config: Html5QrcodeCameraScanConfig = {
          fps: 15,
          // Responsive qrbox: fills ~72% of the viewport smallest edge
          qrbox: (w: number, h: number) => {
            const edge = Math.floor(Math.min(w, h) * 0.72);
            return { width: Math.max(edge, 180), height: Math.max(edge, 180) };
          },
          aspectRatio: 1.0,
          disableFlip: false,
        };

        // Try requested facing, fall back to exact cameraId if facingMode fails
        try {
          await qrInstanceRef.current.start(
            { facingMode: facing },
            config,
            handleDecoded,
            () => { /* frame error – ignored */ },
          );
          setCurrentFacing(facing);
          setIsCameraActive(true);
        } catch (firstErr) {
          console.warn(`facingMode=${facing} failed, trying alternate:`, firstErr);
          const alternate = facing === 'environment' ? 'user' : 'environment';
          await qrInstanceRef.current.start(
            { facingMode: alternate },
            config,
            handleDecoded,
            () => {},
          );
          setCurrentFacing(alternate);
          setIsCameraActive(true);
        }
      } catch (err: unknown) {
        const msg = String(err);
        let userMsg = 'No se pudo acceder a la cámara. Asegúrate de usar HTTPS y de haber otorgado el permiso de cámara en el navegador.';
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          userMsg = '🔒 Permiso de cámara denegado. Toca el ícono de candado en la barra del navegador y activa el permiso de cámara.';
        } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFound')) {
          userMsg = '📵 No se encontró ninguna cámara en este dispositivo.';
        } else if (msg.includes('NotReadableError') || msg.includes('TrackStartError')) {
          userMsg = '⚠️ La cámara está ocupada (otra app o pestaña la está usando). Ciérrala y vuelve a intentar.';
        }
        setCameraError(userMsg);
        setIsCameraActive(false);
      } finally {
        setIsStarting(false);
      }
    },
    [stopCamera, handleDecoded],
  );

  // ─── Toggle ───────────────────────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera(currentFacing);
    }
  }, [isCameraActive, stopCamera, startCamera, currentFacing]);

  const switchFacing = useCallback(() => {
    const next = currentFacing === 'environment' ? 'user' : 'environment';
    startCamera(next);
  }, [currentFacing, startCamera]);

  // ─── Auto-start on mount (optional) ──────────────────────────────────────
  useEffect(() => {
    if (autoStart) {
      // Small delay so the DOM element is painted before Html5Qrcode tries to find it
      const t = setTimeout(() => startCamera('environment'), 400);
      return () => clearTimeout(t);
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── File/image scan ─────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileScanning(true);
    setCameraError(null);

    try {
      // Stop live camera first
      await stopCamera();
      // Need a fresh instance pointing to a valid DOM node
      const scanner = new Html5Qrcode(containerIdRef.current, { verbose: false });
      const result = await scanner.scanFile(file, /* showImage= */ false);
      handleDecoded(result);
      scanner.clear();
    } catch {
      setCameraError('No se pudo detectar un código QR en la imagen. Prueba con otra foto o escribe el código manualmente.');
    } finally {
      setFileScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Manual entry ────────────────────────────────────────────────────────
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleDecoded(manualToken.trim());
    setManualToken('');
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 sm:p-6 transition-all">

      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              isCameraActive
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
              Lector QR — Asistencia
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isCameraActive
                ? `📸 Cámara ${currentFacing === 'environment' ? 'trasera' : 'frontal'} activa`
                : 'Toca el botón para encender la cámara'}
            </p>
          </div>
        </div>

        {/* Sound toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
            soundEnabled
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
          }`}
          aria-label="Alternar sonido"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Viewport ── */}
      {/*
        IMPORTANT: The div#containerId must ALWAYS be in the DOM so Html5Qrcode
        can find it. We hide it visually when inactive and overlay our own UI.
      */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 mb-4"
           style={{ minHeight: 260 }}>

        {/* Html5Qrcode injects the <video> element here – always rendered */}
        <div
          id={containerIdRef.current}
          className="w-full"
          style={{ display: isCameraActive ? 'block' : 'none' }}
        />

        {/* Overlay scan frame (shown on top of live video) */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Scan frame with corner brackets */}
            <div className="relative w-52 h-52 sm:w-60 sm:h-60">
              <div className="absolute inset-0 border-2 border-emerald-400/60 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.25)]" />
              {/* TL */}
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              {/* TR */}
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              {/* BL */}
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              {/* BR */}
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
              {/* Laser sweep */}
              <div className="absolute left-4 right-4 h-0.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] animate-pulse" />
            </div>
            <p className="mt-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
              Enfoca el código QR del carnet
            </p>
          </div>
        )}

        {/* Idle placeholder (camera off) */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
              <Camera className="w-8 h-8 text-emerald-500/80" />
            </div>
            <div>
              <p className="font-extrabold text-white text-base mb-1">Cámara apagada</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pulsa el botón para encender la <strong className="text-white">cámara trasera</strong> del celular y escanear los carnets QR.
              </p>
            </div>

            {/* Primary CTA */}
            <button
              type="button"
              onClick={toggleCamera}
              disabled={isStarting}
              className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isStarting ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Iniciando cámara...</>
              ) : (
                <><Camera className="w-4 h-4" /> Prender Cámara del Celular</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Controls when camera is ON ── */}
      {isCameraActive && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={toggleCamera}
            className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <CameraOff className="w-4 h-4" /> Apagar
          </button>
          <button
            type="button"
            onClick={switchFacing}
            disabled={isStarting}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60"
          >
            <SwitchCamera className="w-4 h-4" />
            {currentFacing === 'environment' ? 'Cambiar a Frontal' : 'Usar Trasera'}
          </button>
        </div>
      )}

      {/* ── Error alert ── */}
      {cameraError && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-xs flex items-start gap-2.5 animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold mb-0.5">Error de Cámara</p>
            <p className="leading-relaxed">{cameraError}</p>
            <button
              type="button"
              onClick={() => startCamera('environment')}
              className="mt-2 px-3 py-1 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold text-xs active:scale-95 cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* ── Last scan result ── */}
      {lastScanned && (
        <div
          className={`mb-4 p-4 rounded-2xl border flex items-start gap-3 animate-in zoom-in-95 ${
            lastScanned.status === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-100'
              : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-100'
          }`}
        >
          {lastScanned.status === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-extrabold text-sm">
                {lastScanned.status === 'success' ? '✅ ¡Registrado!' : '❌ Error'}
              </p>
              {lastScanned.time && (
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {lastScanned.time}
                </span>
              )}
            </div>
            {lastScanned.studentName && (
              <p className="font-bold text-[13px]">👤 {lastScanned.studentName}</p>
            )}
            <p className="mt-0.5 text-slate-600 dark:text-slate-300">{lastScanned.message}</p>
          </div>
        </div>
      )}

      {/* ── Alternative methods ── */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Registro Sin Cámara
          </span>
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
            id="qr-file-upload-input"
          />
          <label
            htmlFor="qr-file-upload-input"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            {fileScanning ? 'Leyendo...' : 'Foto QR / Galería'}
          </label>
        </div>

        {/* Manual token entry */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="DNI, código o token QR..."
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 cursor-pointer"
          >
            Registrar
          </button>
        </form>

        {/* Quick demo shortcut buttons */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
            Simular escaneo de alumno (demo):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {students.slice(0, 4).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleDecoded(st.token_qr)}
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95"
              >
                🎓 {st.profile?.nombres.split(' ')[0]} {st.profile?.apellidos.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
