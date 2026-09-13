'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
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

// ─────────────────────────────────────────────────────────────────────────────
// We use NATIVE getUserMedia + BarcodeDetector (Chrome 83+) with a canvas
// fallback using Html5Qrcode's scanFile on periodic frames.
// This avoids all Html5QrcodeScanner UI injection issues.
// ─────────────────────────────────────────────────────────────────────────────

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
    status: 'success' | 'error' | 'duplicate';
    message: string;
    studentName?: string;
    time?: string;
  } | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [fileScanning, setFileScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const statusModeRef = useRef(statusMode);
  const lastDecodeRef = useRef<string>('');
  const decodeCooldownRef = useRef(false);

  useEffect(() => { statusModeRef.current = statusMode; }, [statusMode]);

  // ── Tones ─────────────────────────────────────────────────────────────────
  const playTone = useCallback((type: 'success' | 'error' | 'duplicate') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      if (type === 'success') {
        // Two ascending beeps
        [880, 1100].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
          g.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.1);
          o.connect(g); g.connect(ctx.destination);
          o.start(ctx.currentTime + i * 0.12);
          o.stop(ctx.currentTime + i * 0.12 + 0.1);
        });
      } else if (type === 'duplicate') {
        // Single mid tone — "already done"
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(520, ctx.currentTime);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.25);
      } else {
        // Low double buzz — error
        [220, 200].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'square';
          o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
          g.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.08);
          o.connect(g); g.connect(ctx.destination);
          o.start(ctx.currentTime + i * 0.1);
          o.stop(ctx.currentTime + i * 0.1 + 0.08);
        });
      }
    } catch { /* AudioContext locked */ }
  }, [soundEnabled]);

  const triggerHaptic = (pattern: number[] = [60, 30, 60]) => {
    try { navigator.vibrate?.(pattern); } catch { /* ignore */ }
  };

  // ── Process decoded QR text ───────────────────────────────────────────────
  const handleDecoded = useCallback((decodedText: string) => {
    // Cooldown: ignore same QR within 5 seconds to prevent double scans
    if (decodeCooldownRef.current && lastDecodeRef.current === decodedText) return;
    lastDecodeRef.current = decodedText;
    decodeCooldownRef.current = true;
    setTimeout(() => { decodeCooldownRef.current = false; }, 5000);

    const time = new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

    const res = registerAttendance({
      studentQrToken: decodedText,
      metodo: 'qr',
      status: statusModeRef.current,
    });

    const found = students.find(
      (s) => s.token_qr === decodedText ||
             s.codigo_estudiante.toLowerCase() === decodedText.toLowerCase() ||
             s.profile?.dni === decodedText,
    );
    const studentName = found?.profile
      ? `${found.profile.nombres} ${found.profile.apellidos}` : undefined;

    // Duplicate: already registered today via QR
    if ((res as { duplicate?: boolean }).duplicate) {
      playTone('duplicate');
      triggerHaptic([100, 50, 100]);
      setLastScanned({ status: 'duplicate', message: res.message, studentName, time });
      return;
    }

    if (res.success) {
      playTone('success');
      triggerHaptic([60, 30, 60]);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      setLastScanned({ status: 'success', message: res.message, studentName, time });
    } else {
      playTone('error');
      triggerHaptic([200]);
      setLastScanned({ status: 'error', message: res.message, studentName: studentName ?? 'No reconocido', time });
    }
    if (onScanSuccess) onScanSuccess(decodedText);
  }, [registerAttendance, students, playTone, onScanSuccess]);

  // ── Scan loop using BarcodeDetector (native) or ZXing canvas fallback ────
  const startScanLoop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // BarcodeDetector is available in Chrome 83+ on Android
    const hasBarcodeDetector = typeof (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector !== 'undefined';

    type DetectorType = { detect: (source: HTMLCanvasElement) => Promise<Array<{ rawValue: string }>> };
    let detector: DetectorType | null = null;

    if (hasBarcodeDetector) {
      const BD = (window as unknown as Record<string, new (opts: object) => DetectorType>).BarcodeDetector;
      detector = new BD({ formats: ['qr_code'] });
    }

    const tick = async () => {
      if (!video || video.readyState < video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        if (detector) {
          // Native BarcodeDetector path (Chrome Android)
          const results = await detector.detect(canvas);
          if (results.length > 0) {
            handleDecoded(results[0].rawValue);
          }
        } else {
          // Fallback: use Html5Qrcode scanFile on a canvas blob every 500ms
          // We throttle this branch to avoid excessive processing
          await new Promise<void>((resolve) => {
            canvas.toBlob(async (blob) => {
              if (!blob) { resolve(); return; }
              try {
                const { Html5Qrcode } = await import('html5-qrcode');
                const tempId = 'qr-decode-offscreen';
                let tempEl = document.getElementById(tempId);
                if (!tempEl) {
                  tempEl = document.createElement('div');
                  tempEl.id = tempId;
                  tempEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
                  document.body.appendChild(tempEl);
                }
                const h = new Html5Qrcode(tempId, { verbose: false });
                const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
                const result = await h.scanFile(file, false);
                handleDecoded(result);
                await h.clear();
              } catch { /* no QR in frame */ }
              resolve();
            }, 'image/jpeg', 0.7);
          });
          // Throttle: wait 600ms between fallback decodes
          await new Promise((r) => setTimeout(r, 600));
        }
      } catch { /* frame decode error – continue */ }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [handleDecoded]);

  // ── Stop camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // ── Start camera ─────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: 'environment' | 'user' = 'environment') => {
    setCameraError(null);
    setIsStarting(true);
    stopCamera();

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCurrentFacing(facing);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;

        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) { reject(new Error('no video')); return; }
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(resolve).catch(reject);
          };
          videoRef.current.onerror = reject;
          // Timeout in case metadata never fires
          setTimeout(resolve, 3000);
        });
      }

      setIsCameraActive(true);
      startScanLoop();
    } catch (err: unknown) {
      const msg = String(err);
      let userMsg = 'No se pudo acceder a la cámara. Usa HTTPS y otorga el permiso de cámara.';
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        userMsg = '🔒 Permiso denegado. Toca el ícono de candado en la barra del navegador y activa la cámara.';
      } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFound')) {
        userMsg = '📵 No se encontró ninguna cámara en este dispositivo.';
      } else if (msg.includes('NotReadableError') || msg.includes('TrackStartError')) {
        userMsg = '⚠️ La cámara está en uso por otra app. Ciérrala y vuelve a intentar.';
      } else if (msg.includes('OverconstrainedError')) {
        // Retry without ideal constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.muted = true;
            await videoRef.current.play();
          }
          setIsCameraActive(true);
          setCurrentFacing(facing);
          startScanLoop();
          setIsStarting(false);
          return;
        } catch { /* fall through */ }
      }
      setCameraError(userMsg);
      setIsCameraActive(false);
    } finally {
      setIsStarting(false);
    }
  }, [stopCamera, startScanLoop]);

  const toggleCamera = useCallback(() => {
    isCameraActive ? stopCamera() : startCamera(currentFacing);
  }, [isCameraActive, stopCamera, startCamera, currentFacing]);

  const switchFacing = useCallback(() => {
    startCamera(currentFacing === 'environment' ? 'user' : 'environment');
  }, [currentFacing, startCamera]);

  // ── Auto-start ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoStart) {
      const t = setTimeout(() => startCamera('environment'), 300);
      return () => clearTimeout(t);
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // ── File scan ─────────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileScanning(true); setCameraError(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempId = 'qr-fileinput-scanner';
      let tempEl = document.getElementById(tempId);
      if (!tempEl) {
        tempEl = document.createElement('div');
        tempEl.id = tempId;
        tempEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
        document.body.appendChild(tempEl);
      }
      const h = new Html5Qrcode(tempId, { verbose: false });
      const result = await h.scanFile(file, false);
      handleDecoded(result);
      await h.clear();
    } catch {
      setCameraError('No se detectó un QR en la imagen. Prueba con otra foto o escribe el código manualmente.');
    } finally {
      setFileScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleDecoded(manualToken.trim());
    setManualToken('');
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 sm:p-6">

      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
            isCameraActive
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
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
        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            soundEnabled
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
          }`}
          aria-label="Alternar sonido"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Viewport */}
      <div className="relative bg-black rounded-2xl mb-4" style={{ minHeight: 280 }}>

        {/* Native <video> element - always in DOM, always visible when camera on */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full rounded-2xl block"
          style={{
            display: isCameraActive ? 'block' : 'none',
            objectFit: 'cover',
            maxHeight: '70vw',
            minHeight: 240,
            background: '#000',
          }}
        />

        {/* Hidden canvas for QR decoding (off-screen) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scan frame overlay (shows on top of video) */}
        {isCameraActive && (
          <div
            className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center"
            style={{ background: 'transparent' }}
          >
            <div className="relative w-52 h-52 sm:w-60 sm:h-60">
              {/* Frame */}
              <div className="absolute inset-0 border-2 border-emerald-400/70 rounded-2xl" />
              {/* Corners */}
              <div className="absolute -top-0.5 -left-0.5  w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute -bottom-0.5 -left-0.5  w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
              {/* Laser */}
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" style={{ boxShadow: '0 0 8px #34d399' }} />
            </div>
            <p className="mt-3 px-3 py-1.5 rounded-full bg-black/60 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
              Enfoca el código QR del carnet
            </p>
          </div>
        )}

        {/* Idle state (camera off) */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-2xl">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
              <Camera className="w-8 h-8 text-emerald-500/80" />
            </div>
            <div>
              <p className="font-extrabold text-white text-base mb-1">Cámara apagada</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pulsa el botón para encender la <strong className="text-white">cámara trasera</strong> y escanear el carnet QR.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleCamera}
              disabled={isStarting}
              className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isStarting
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Iniciando cámara...</>
                : <><Camera className="w-4 h-4" /> Prender Cámara del Celular</>}
            </button>
          </div>
        )}
      </div>

      {/* Camera controls (visible when ON) */}
      {isCameraActive && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button" onClick={toggleCamera}
            className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <CameraOff className="w-4 h-4" /> Apagar
          </button>
          <button
            type="button" onClick={switchFacing} disabled={isStarting}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60"
          >
            <SwitchCamera className="w-4 h-4" />
            {currentFacing === 'environment' ? 'Cambiar a Frontal' : 'Usar Trasera'}
          </button>
        </div>
      )}

      {/* Error */}
      {cameraError && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-xs flex items-start gap-2.5 animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold mb-0.5">Error de Cámara</p>
            <p className="leading-relaxed">{cameraError}</p>
            <button
              type="button" onClick={() => startCamera('environment')}
              className="mt-2 px-3 py-1 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold text-xs active:scale-95 cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Last scan result */}
      {lastScanned && (
        <div className={`mb-4 p-4 rounded-2xl border-2 flex items-start gap-3 animate-in zoom-in-95 duration-200 ${
          lastScanned.status === 'success'
            ? 'bg-emerald-50 border-emerald-400 dark:bg-emerald-950/60 dark:border-emerald-600'
            : lastScanned.status === 'duplicate'
            ? 'bg-amber-50 border-amber-400 dark:bg-amber-950/60 dark:border-amber-600'
            : 'bg-rose-50 border-rose-400 dark:bg-rose-950/60 dark:border-rose-600'
        }`}>
          {lastScanned.status === 'success' && (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          )}
          {lastScanned.status === 'duplicate' && (
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          )}
          {lastScanned.status === 'error' && (
            <AlertCircle className="w-6 h-6 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between mb-1">
              <p className={`font-extrabold text-sm ${
                lastScanned.status === 'success' ? 'text-emerald-800 dark:text-emerald-200'
                : lastScanned.status === 'duplicate' ? 'text-amber-800 dark:text-amber-200'
                : 'text-rose-800 dark:text-rose-200'
              }`}>
                {lastScanned.status === 'success' && '✅ ¡Asistencia Registrada!'}
                {lastScanned.status === 'duplicate' && '⚠️ Ya estaba registrado hoy'}
                {lastScanned.status === 'error' && '❌ No reconocido'}
              </p>
              {lastScanned.time && (
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-black/30 px-1.5 py-0.5 rounded-md">
                  {lastScanned.time}
                </span>
              )}
            </div>
            {lastScanned.studentName && (
              <p className="font-bold text-[13px] text-slate-800 dark:text-slate-100 mb-0.5">
                👤 {lastScanned.studentName}
              </p>
            )}
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{lastScanned.message}</p>
          </div>
        </div>
      )}


      {/* Alternative methods */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Registro Sin Cámara
          </span>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
            onChange={handleFileUpload} className="hidden" id="qr-file-upload-native" />
          <label htmlFor="qr-file-upload-native"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer">
            <Upload className="w-3 h-3" />
            {fileScanning ? 'Leyendo...' : 'Foto QR / Galería'}
          </label>
        </div>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="DNI, código o token QR..."
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />
          <button type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 cursor-pointer">
            Registrar
          </button>
        </form>

        <div className="space-y-1.5">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
            Simular escaneo (demo 1-click):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {students.slice(0, 4).map((st) => (
              <button key={st.id} type="button" onClick={() => handleDecoded(st.token_qr)}
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95">
                🎓 {st.profile?.nombres.split(' ')[0]} {st.profile?.apellidos.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
