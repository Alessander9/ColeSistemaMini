'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  SwitchCamera,
  Upload,
  Volume2,
  VolumeX,
  ShieldAlert,
  X,
  UserCheck,
  UserX,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '@/context/AppContext';
import { AttendanceStatus } from '@/types';

interface QrScannerProps {
  onScanSuccess?: (result: string) => void;
  statusMode?: AttendanceStatus;
  autoStart?: boolean;
}

export function QrScanner({
  onScanSuccess,
  statusMode = 'presente',
  autoStart = false,
}: QrScannerProps) {
  const { registerAttendance, students, enrollments } = useApp();

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [currentFacing, setCurrentFacing] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Big Visual Alert Banner state
  const [activeAlert, setActiveAlert] = useState<{
    type: 'success' | 'duplicate' | 'error';
    title: string;
    message: string;
    studentName?: string;
    avatarUrl?: string;
    gradeSection?: string;
    time?: string;
    statusBadge?: string;
  } | null>(null);

  const [flashColor, setFlashColor] = useState<'green' | 'amber' | 'red' | null>(null);
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
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    statusModeRef.current = statusMode;
  }, [statusMode]);

  // ── High Volume Audio Synthesizer & Speech Notification ────────────────────
  const playTone = useCallback((type: 'success' | 'error' | 'duplicate') => {
    if (!soundEnabled) return;

    try {
      const AudioCtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      // Master Gain set to maximum safe volume (0.90)
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.9, ctx.currentTime);
      masterGain.connect(ctx.destination);

      if (type === 'success') {
        // Bright 3-note harmonic chime (Do-Mi-Sol in high octave)
        const notes = [659.25, 880.0, 1318.51]; // E5, A5, E6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

          noteGain.gain.setValueAtTime(0.85, ctx.currentTime + idx * 0.08);
          noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

          osc.connect(noteGain);
          noteGain.connect(masterGain);

          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
        });

        // Speech announcement
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance('Asistencia confirmada');
          utterance.lang = 'es-PE';
          utterance.rate = 1.2;
          utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      } else if (type === 'duplicate') {
        // High-pitch 3-pulse ALARM beeps (PI-PI-PI)
        [880, 880, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const pulseGain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);

          pulseGain.gain.setValueAtTime(0.95, ctx.currentTime + idx * 0.14);
          pulseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.14 + 0.09);

          osc.connect(pulseGain);
          pulseGain.connect(masterGain);

          osc.start(ctx.currentTime + idx * 0.14);
          osc.stop(ctx.currentTime + idx * 0.14 + 0.1);
        });

        // Speech warning
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance('Atención: alumno ya registrado');
          utterance.lang = 'es-PE';
          utterance.rate = 1.25;
          utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      } else {
        // Deep Error Buzz
        [220, 160].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const errGain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);

          errGain.gain.setValueAtTime(0.9, ctx.currentTime + idx * 0.15);
          errGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.15 + 0.18);

          osc.connect(errGain);
          errGain.connect(masterGain);

          osc.start(ctx.currentTime + idx * 0.15);
          osc.stop(ctx.currentTime + idx * 0.15 + 0.2);
        });
      }
    } catch {
      /* AudioContext locked */
    }
  }, [soundEnabled]);

  // ── Strong Haptic Vibration ───────────────────────────────────────────────
  const triggerHaptic = (pattern: number[] = [100, 50, 100]) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      /* ignore */
    }
  };

  // ── Process decoded QR text ───────────────────────────────────────────────
  const handleDecoded = useCallback((decodedText: string) => {
    const rawClean = decodedText.trim();
    if (!rawClean) return;

    // Fast-throttle consecutive camera reads of identical QR in 3s
    if (decodeCooldownRef.current && lastDecodeRef.current === rawClean) return;
    lastDecodeRef.current = rawClean;
    decodeCooldownRef.current = true;
    setTimeout(() => {
      decodeCooldownRef.current = false;
    }, 3500);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const cleanLower = rawClean.toLowerCase();
    const foundStudent = students.find(
      (s) =>
        s.token_qr?.trim().toLowerCase() === cleanLower ||
        s.codigo_estudiante?.trim().toLowerCase() === cleanLower ||
        s.profile?.dni?.trim() === rawClean ||
        s.id === rawClean
    );

    const foundEnrollment = foundStudent
      ? enrollments.find((e) => e.estudiante_id === foundStudent.id)
      : undefined;

    const studentFullName = foundStudent?.profile
      ? `${foundStudent.profile.nombres} ${foundStudent.profile.apellidos}`
      : 'Estudiante No Reconocido';

    const gradeSectionStr = foundEnrollment?.seccion
      ? `${foundEnrollment.seccion.grado?.nombre || 'Grado'} "${foundEnrollment.seccion.letra}"`
      : undefined;

    // Call Context's registerAttendance
    const res = registerAttendance({
      studentQrToken: rawClean,
      metodo: 'qr',
      status: statusModeRef.current,
    });

    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);

    // ── CASE 1: DUPLICATE (Already registered today) ─────────────────────────
    if (res.duplicate) {
      playTone('duplicate');
      triggerHaptic([300, 100, 300, 100, 350]); // Strong double alarm vibration
      setFlashColor('amber');
      setTimeout(() => setFlashColor(null), 800);

      setActiveAlert({
        type: 'duplicate',
        title: '⚠️ ALUMNO YA REGISTRADO HOY',
        message: res.message || `${studentFullName} ya tiene registro de asistencia el día de hoy.`,
        studentName: studentFullName,
        avatarUrl: foundStudent?.profile?.avatar_url,
        gradeSection: gradeSectionStr,
        time: res.record?.hora_registro || timeStr,
        statusBadge: res.record?.estado?.toUpperCase() || 'PRESENTE',
      });

      alertTimeoutRef.current = setTimeout(() => {
        setActiveAlert(null);
      }, 7000);
      return;
    }

    // ── CASE 2: SUCCESS ──────────────────────────────────────────────────────
    if (res.success) {
      playTone('success');
      triggerHaptic([100, 50, 100]);
      setFlashColor('green');
      setTimeout(() => setFlashColor(null), 800);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

      setActiveAlert({
        type: 'success',
        title: '✅ ¡ASISTENCIA REGISTRADA!',
        message: `Ingreso marcado a las ${timeStr} (${statusModeRef.current.toUpperCase()}) vía Lector QR.`,
        studentName: studentFullName,
        avatarUrl: foundStudent?.profile?.avatar_url,
        gradeSection: gradeSectionStr,
        time: timeStr,
        statusBadge: statusModeRef.current.toUpperCase(),
      });

      alertTimeoutRef.current = setTimeout(() => {
        setActiveAlert(null);
      }, 6000);

      if (onScanSuccess) onScanSuccess(rawClean);
      return;
    }

    // ── CASE 3: ERROR (Not found or invalid) ─────────────────────────────────
    playTone('error');
    triggerHaptic([400]);
    setFlashColor('red');
    setTimeout(() => setFlashColor(null), 800);

    setActiveAlert({
      type: 'error',
      title: '❌ QR NO RECONOCIDO',
      message: res.message || 'El carnet escaneado no pertenece a ningún alumno matriculado.',
      studentName: 'Código: ' + rawClean,
      time: timeStr,
    });

    alertTimeoutRef.current = setTimeout(() => {
      setActiveAlert(null);
    }, 6000);
  }, [registerAttendance, students, enrollments, playTone, onScanSuccess]);

  // ── Scan loop using BarcodeDetector (native) or Html5Qrcode canvas fallback
  const startScanLoop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const hasBarcodeDetector =
      typeof (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector !== 'undefined';

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
          const results = await detector.detect(canvas);
          if (results.length > 0) {
            handleDecoded(results[0].rawValue);
          }
        } else {
          await new Promise<void>((resolve) => {
            canvas.toBlob(
              async (blob) => {
                if (!blob) {
                  resolve();
                  return;
                }
                try {
                  const { Html5Qrcode } = await import('html5-qrcode');
                  const tempId = 'qr-decode-offscreen';
                  let tempEl = document.getElementById(tempId);
                  if (!tempEl) {
                    tempEl = document.createElement('div');
                    tempEl.id = tempId;
                    tempEl.style.cssText =
                      'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
                    document.body.appendChild(tempEl);
                  }
                  const h = new Html5Qrcode(tempId, { verbose: false });
                  const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
                  const result = await h.scanFile(file, false);
                  handleDecoded(result);
                  await h.clear();
                } catch {
                  /* no QR in frame */
                }
                resolve();
              },
              'image/jpeg',
              0.7
            );
          });
          await new Promise((r) => setTimeout(r, 500));
        }
      } catch {
        /* frame decode error - continue */
      }

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
  const startCamera = useCallback(
    async (facing: 'environment' | 'user' = 'environment') => {
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
            if (!videoRef.current) {
              reject(new Error('no video'));
              return;
            }
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(resolve).catch(reject);
            };
            videoRef.current.onerror = reject;
            setTimeout(resolve, 3000);
          });
        }

        setIsCameraActive(true);
        startScanLoop();
      } catch (err: unknown) {
        const msg = String(err);
        let userMsg = 'No se pudo acceder a la cámara. Usa HTTPS y otorga el permiso de cámara.';
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          userMsg =
            '🔒 Permiso denegado. Toca el ícono de candado en la barra del navegador y activa la cámara.';
        } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFound')) {
          userMsg = '📵 No se encontró ninguna cámara en este dispositivo.';
        } else if (msg.includes('NotReadableError') || msg.includes('TrackStartError')) {
          userMsg = '⚠️ La cámara está en uso por otra app. Ciérrala y vuelve a intentar.';
        } else if (msg.includes('OverconstrainedError')) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
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
          } catch {
            /* fall through */
          }
        }
        setCameraError(userMsg);
        setIsCameraActive(false);
      } finally {
        setIsStarting(false);
      }
    },
    [stopCamera, startScanLoop]
  );

  const toggleCamera = useCallback(() => {
    isCameraActive ? stopCamera() : startCamera(currentFacing);
  }, [isCameraActive, stopCamera, startCamera, currentFacing]);

  const switchFacing = useCallback(() => {
    startCamera(currentFacing === 'environment' ? 'user' : 'environment');
  }, [currentFacing, startCamera]);

  useEffect(() => {
    if (autoStart) {
      const t = setTimeout(() => startCamera('environment'), 300);
      return () => clearTimeout(t);
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    stopCamera();
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
  }, [stopCamera]);

  // ── File scan ─────────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileScanning(true);
    setCameraError(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempId = 'qr-fileinput-scanner';
      let tempEl = document.getElementById(tempId);
      if (!tempEl) {
        tempEl = document.createElement('div');
        tempEl.id = tempId;
        tempEl.style.cssText =
          'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
        document.body.appendChild(tempEl);
      }
      const h = new Html5Qrcode(tempId, { verbose: false });
      const result = await h.scanFile(file, false);
      handleDecoded(result);
      await h.clear();
    } catch {
      setCameraError(
        'No se detectó un QR en la imagen. Prueba con otra foto o escribe el código manualmente.'
      );
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
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 sm:p-6 relative overflow-hidden">

      {/* Screen flash on scan */}
      {flashColor === 'green' && (
        <div className="absolute inset-0 z-50 bg-emerald-500/30 backdrop-blur-[2px] pointer-events-none animate-pulse transition-all" />
      )}
      {flashColor === 'amber' && (
        <div className="absolute inset-0 z-50 bg-amber-500/40 backdrop-blur-[2px] pointer-events-none animate-pulse transition-all" />
      )}
      {flashColor === 'red' && (
        <div className="absolute inset-0 z-50 bg-rose-500/40 backdrop-blur-[2px] pointer-events-none animate-pulse transition-all" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              isCameraActive
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
              Lector QR de Asistencia
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
          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs ${
            soundEnabled
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-300 shadow-sm'
              : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
          }`}
          title={soundEnabled ? 'Sonido y voz activados (Volumen Máx)' : 'Sonido silenciado'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline text-[11px]">{soundEnabled ? 'Audio 100%' : 'Mudo'}</span>
        </button>
      </div>

      {/* Viewport */}
      <div className="relative bg-black rounded-2xl mb-4 overflow-hidden" style={{ minHeight: 290 }}>
        {/* Native <video> element */}
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
            minHeight: 250,
            background: '#000',
          }}
        />

        {/* Hidden canvas for QR decoding */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scan frame overlay */}
        {isCameraActive && (
          <div
            className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center"
            style={{ background: 'transparent' }}
          >
            <div className="relative w-56 h-56 sm:w-64 sm:h-64">
              <div className="absolute inset-0 border-2 border-emerald-400/80 rounded-2xl shadow-lg shadow-emerald-500/20" />
              <div className="absolute -top-0.5 -left-0.5 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute -top-0.5 -right-0.5 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute -bottom-0.5 -left-0.5 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
              <div
                className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse"
                style={{ boxShadow: '0 0 12px #10b981' }}
              />
            </div>
            <p className="mt-3 px-3.5 py-1.5 rounded-full bg-black/75 text-xs font-extrabold text-emerald-300 border border-emerald-500/40 shadow-md">
              Apunta al código QR del carnet escolar
            </p>
          </div>
        )}

        {/* Idle state (camera off) */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
              <Camera className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="font-black text-white text-base mb-1">Cámara del Celular Apagada</p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Pulsa el botón para encender la <strong className="text-emerald-400">cámara trasera</strong> y escanear el carnet de inmediato.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleCamera}
              disabled={isStarting}
              className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-900/50 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Iniciando cámara...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" /> Prender Cámara del Celular
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Camera controls (visible when ON) */}
      {isCameraActive && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={toggleCamera}
            className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <CameraOff className="w-4 h-4" /> Apagar Cámara
          </button>
          <button
            type="button"
            onClick={switchFacing}
            disabled={isStarting}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60"
          >
            <SwitchCamera className="w-4 h-4" />
            {currentFacing === 'environment' ? 'Cambiar a Frontal' : 'Usar Trasera'}
          </button>
        </div>
      )}

      {/* Camera error */}
      {cameraError && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 text-xs flex items-start gap-3 animate-in fade-in">
          <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-extrabold text-sm mb-0.5">Aviso de Cámara</p>
            <p className="leading-relaxed">{cameraError}</p>
            <button
              type="button"
              onClick={() => startCamera('environment')}
              className="mt-2.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs active:scale-95 cursor-pointer shadow"
            >
              Reintentar Conexión
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 🌟 ULTRA VISUAL FEEDBACK ALERT CARD (SUCCESS / DUPLICATE / ERROR) 🌟 */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeAlert && (
        <div
          className={`mb-4 p-4 rounded-3xl border-4 shadow-2xl relative animate-in zoom-in-95 duration-200 ${
            activeAlert.type === 'duplicate'
              ? 'bg-amber-50 dark:bg-amber-950/90 border-amber-500 dark:border-amber-500 text-amber-950 dark:text-amber-100 ring-4 ring-amber-400/30'
              : activeAlert.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-500 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-4 ring-emerald-400/30'
              : 'bg-rose-50 dark:bg-rose-950/90 border-rose-500 dark:border-rose-500 text-rose-950 dark:text-rose-100 ring-4 ring-rose-400/30'
          }`}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setActiveAlert(null)}
            className="absolute top-3 right-3 p-1 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 text-current cursor-pointer"
            aria-label="Cerrar alerta"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3.5">
            {/* Icon / Avatar */}
            {activeAlert.type === 'duplicate' ? (
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/40 animate-bounce">
                <AlertTriangle className="w-7 h-7" />
              </div>
            ) : activeAlert.type === 'success' ? (
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/40">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/40">
                <AlertCircle className="w-7 h-7" />
              </div>
            )}

            <div className="flex-1 min-w-0 pr-5">
              {/* Alert Title */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    activeAlert.type === 'duplicate'
                      ? 'bg-amber-500 text-white'
                      : activeAlert.type === 'success'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {activeAlert.type === 'duplicate'
                    ? 'DUPLICADO RECHAZADO'
                    : activeAlert.type === 'success'
                    ? 'CONFIRMADO'
                    : 'ERROR'}
                </span>
                {activeAlert.time && (
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {activeAlert.time}
                  </span>
                )}
              </div>

              <h4 className="font-black text-base leading-tight tracking-tight mb-1">
                {activeAlert.title}
              </h4>

              {/* Student info */}
              {activeAlert.studentName && (
                <div className="flex items-center gap-2 my-1.5 bg-white/70 dark:bg-black/40 p-2 rounded-xl border border-current/10">
                  {activeAlert.avatarUrl ? (
                    <img
                      src={activeAlert.avatarUrl}
                      alt={activeAlert.studentName}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                      👤
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-xs truncate">{activeAlert.studentName}</p>
                    {activeAlert.gradeSection && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {activeAlert.gradeSection}
                      </p>
                    )}
                  </div>
                  {activeAlert.statusBadge && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                        activeAlert.statusBadge === 'PRESENTE'
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : activeAlert.statusBadge === 'TARDANZA'
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {activeAlert.statusBadge}
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs leading-relaxed font-medium opacity-90 mt-1">
                {activeAlert.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alternative methods */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Registro Alternativo
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
            id="qr-file-upload-native"
          />
          <label
            htmlFor="qr-file-upload-native"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
          >
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
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-all active:scale-95 cursor-pointer"
          >
            Registrar
          </button>
        </form>

        <div className="space-y-1.5">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">
            Simular escaneo de prueba (1-clic):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {students.slice(0, 4).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleDecoded(st.token_qr)}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <span>🎓</span>
                <span>
                  {st.profile?.nombres.split(' ')[0]} {st.profile?.apellidos.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
