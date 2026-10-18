'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { AttendanceStatus, Student, Enrollment } from '@/types';
import { 
  QrCode, 
  ArrowLeft,
  Volume2,
  VolumeX,
  RefreshCw,
  Camera,
  CameraOff,
  SwitchCamera,
  Zap,
  ZapOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  User,
  Users,
  Sun,
  Crosshair,
  ShieldCheck,
  XCircle,
  Keyboard,
  Upload,
  Sparkles,
  Check,
  X,
  Info,
  ChevronRight,
  Settings,
  ChevronDown,
  Maximize2,
  Minimize2,
  HelpCircle,
  BarChart3,
  CheckCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { findStudentByQr, parseQrPayload, getTodayLocalIso } from '@/lib/attendance/qrMatcher';
import { initialsAvatarUrl } from '@/lib/avatar';

// ── Componente de Reloj Aislado y Memoizado (Evita re-renderizar toda la página del Kiosco cada segundo) ──
const KioscoClock = React.memo(function KioscoClock() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      };
      const formatted = now.toLocaleDateString('es-PE', options);
      setCurrentDateFormatted(formatted.charAt(0).toUpperCase() + formatted.slice(1));
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200">
      <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0 hidden sm:block" />
      <div className="text-right sm:text-left leading-none">
        <span className="text-[9px] text-slate-400 font-medium block truncate">
          {currentDateFormatted || 'Hoy'}
        </span>
        <span className="text-xs sm:text-sm font-black font-mono tracking-wider text-white">
          {currentTime || '08:00:00'}
        </span>
      </div>
    </div>
  );
});

export default function AsistenciaKioscoPage() {
  const router = useRouter();
  const { 
    currentUser, 
    users,
    attendances, 
    students, 
    enrollments,
    registerAttendance,
    recordStaffAttendance,
    refreshData,
    brandingConfig,
  } = useApp();

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Fullscreen listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // ── Scanner & Camera State ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'scan' | 'manual' | 'stats' | 'config'>('scan');
  const [scanMode, setScanMode] = useState<'entrada' | 'salida'>('entrada');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [currentFacing, setCurrentFacing] = useState<'environment' | 'user'>('environment');
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isProcessingScan, setIsProcessingScan] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showHelpDrawer, setShowHelpDrawer] = useState<boolean>(false);

  // ── Manual Input & Upload State ─────────────────────────────────────────────
  const [manualInput, setManualInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Active Alert Banner / Modal State ───────────────────────────────────────
  const [activeAlert, setActiveAlert] = useState<{
    type: 'success' | 'duplicate' | 'error';
    title: string;
    message: string;
    studentName?: string;
    studentCode?: string;
    avatarUrl?: string;
    gradeSection?: string;
    time?: string;
    parentEmail?: string;
    statusBadge?: 'A TIEMPO' | 'TARDANZA' | 'FALTÓ' | 'DUPLICADO';
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fallbackScannerRef = useRef<any>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDecodeRef = useRef<string>('');
  const decodeCooldownRef = useRef(false);

  // ── Today's Attendance Calculations ────────────────────────────────────────
  const todayStr = getTodayLocalIso();
  const todayAttendances = attendances.filter(a => a.fecha === todayStr);

  const aTiempoCount = todayAttendances.filter(a => a.estado === 'presente').length;
  const tardanzaCount = todayAttendances.filter(a => a.estado === 'tardanza').length;
  
  // Total active enrolled students
  const activeEnrollments = enrollments.filter(e => e.estado === 'activo');
  const totalEnrolled = activeEnrollments.length > 0 ? activeEnrollments.length : (students.length > 0 ? students.length : 120);
  const registeredCount = todayAttendances.length;
  const faltoCount = Math.max(0, totalEnrolled - registeredCount);
  const attendanceRate = totalEnrolled > 0 ? Math.round((registeredCount / totalEnrolled) * 100) : 0;

  // Latest registrations for today
  const recentAttendances = [...todayAttendances].sort((a, b) => {
    return (b.hora_registro || '').localeCompare(a.hora_registro || '');
  }).slice(0, 6);

  // ── Audio Feedback Synthesizer & Speech con Presets Institucionales ─────────
  const playTone = useCallback((type: 'success' | 'error' | 'duplicate') => {
    if (!soundEnabled) return;

    try {
      const AudioCtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.9, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const soundPreset = brandingConfig?.kioskSoundPreset || 'chime';
      const schoolName = brandingConfig?.nombreInstitucion || 'Colegio';

      if (type === 'success') {
        if (soundPreset === 'bell') {
          // Campana Escolar Clásica (Bitonal resonante 523Hz y 659Hz)
          [523.25, 659.25, 523.25].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);

            noteGain.gain.setValueAtTime(0.9, ctx.currentTime + idx * 0.16);
            noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.6);

            osc.connect(noteGain);
            noteGain.connect(masterGain);

            osc.start(ctx.currentTime + idx * 0.16);
            osc.stop(ctx.currentTime + idx * 0.16 + 0.6);
          });
        } else if (soundPreset === 'arpeggio') {
          // Arpegio Suave Pentatónico (Do, Mi, Sol, Si, Do)
          [523.25, 659.25, 783.99, 987.77, 1046.50].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

            noteGain.gain.setValueAtTime(0.7, ctx.currentTime + idx * 0.06);
            noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.4);

            osc.connect(noteGain);
            noteGain.connect(masterGain);

            osc.start(ctx.currentTime + idx * 0.06);
            osc.stop(ctx.currentTime + idx * 0.06 + 0.4);
          });
        } else {
          // Chime Digital Predeterminado (3-note chime)
          const notes = [659.25, 880.0, 1318.51];
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
        }

        // Voz Sintetizada si el preset es 'voice' o notificación hablada
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const voiceText = soundPreset === 'voice' 
            ? `Bienvenido a ${schoolName}. Asistencia confirmada.` 
            : 'Asistencia registrada';
          const utterance = new SpeechSynthesisUtterance(voiceText);
          utterance.lang = 'es-PE';
          utterance.rate = 1.15;
          window.speechSynthesis.speak(utterance);
        }
      } else if (type === 'duplicate') {
        // Warning beeps
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

        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance('Atención: alumno ya registrado hoy');
          utterance.lang = 'es-PE';
          utterance.rate = 1.2;
          window.speechSynthesis.speak(utterance);
        }
      } else {
        // Error Buzz
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
  }, [soundEnabled, brandingConfig?.kioskSoundPreset, brandingConfig?.nombreInstitucion]);

  // ── Core Attendance Processor & Multi-Format QR Parser ────────────────────
  const handleProcessCode = useCallback((rawInput: string) => {
    const rawClean = parseQrPayload(rawInput);
    if (!rawClean) return;

    if (decodeCooldownRef.current && lastDecodeRef.current === rawClean) return;
    lastDecodeRef.current = rawClean;
    decodeCooldownRef.current = true;
    setTimeout(() => {
      decodeCooldownRef.current = false;
    }, 3200);

    setIsProcessingScan(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isLate = currentHour > 8 || (currentHour === 8 && currentMinute > 0);
    const calculatedStatus: AttendanceStatus = isLate ? 'tardanza' : 'presente';

    const normalize = (str?: string) =>
      str ? str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    const normClean = normalize(rawClean);
    const dniMatch = rawClean.match(/(?<!\d)\d{8}(?!\d)/);
    const extractedDni = dniMatch ? dniMatch[0] : '';

    const foundStudent = findStudentByQr(students, rawClean);

    // ── Staff / Teacher Attendance Check ──
    if (!foundStudent) {
      const foundStaff = users.find((u) => {
        const uDni = normalize(u.dni);
        return (uDni === normClean || (extractedDni && uDni === extractedDni)) && (u.rol === 'docente' || u.rol === 'admin');
      });

      if (foundStaff) {
        const staffRes = recordStaffAttendance({
          userId: foundStaff.id,
          tipo: scanMode,
          metodo: 'qr',
        });
        playTone('success');
        try {
          confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
        } catch { /* ignore */ }
        setActiveAlert({
          type: 'success',
          title: scanMode === 'entrada' ? '¡Ingreso Docente Registrado!' : '¡Salida Docente Registrada!',
          message: `Prof. ${foundStaff.nombres} ${foundStaff.apellidos} — Marcación ${scanMode} exitosa.`,
          studentName: `Prof. ${foundStaff.nombres} ${foundStaff.apellidos}`,
          studentCode: `DOC-${foundStaff.dni}`,
          avatarUrl: foundStaff.avatar_url,
          gradeSection: foundStaff.especialidad || 'Personal Docente',
          time: timeStr,
          statusBadge: staffRes.record?.estado === 'tardanza' ? 'TARDANZA' : 'A TIEMPO',
        });
        alertTimeoutRef.current = setTimeout(() => {
          setActiveAlert(null);
        }, 4000);
        setIsProcessingScan(false);
        return;
      }
    }

    const foundEnrollment = foundStudent
      ? enrollments.find((e) => 
          e.estudiante_id === foundStudent.id ||
          e.estudiante?.id === foundStudent.id ||
          (foundStudent.profile_id && (e.estudiante_id === foundStudent.profile_id || e.estudiante?.profile_id === foundStudent.profile_id)) ||
          (foundStudent.codigo_estudiante && e.estudiante?.codigo_estudiante === foundStudent.codigo_estudiante) ||
          (foundStudent.dni && (e.estudiante?.dni === foundStudent.dni || e.estudiante?.profile?.dni === foundStudent.dni)) ||
          (foundStudent.profile?.dni && (e.estudiante?.dni === foundStudent.profile.dni || e.estudiante?.profile?.dni === foundStudent.profile.dni))
        )
      : undefined;

    const studentFullName = foundStudent?.profile
      ? `${foundStudent.profile.nombres} ${foundStudent.profile.apellidos}`
      : `${foundStudent?.nombres || ''} ${foundStudent?.apellidos || ''}`.trim() || 'Estudiante no registrado';

    const gradeSectionStr = foundEnrollment?.seccion
      ? `${foundEnrollment.seccion.grado?.nombre || 'Grado'} "${foundEnrollment.seccion.letra}"`
      : undefined;

    // Register into AppContext
    const res = registerAttendance({
      studentQrToken: rawClean,
      metodo: 'qr',
      status: calculatedStatus,
    });

    setIsProcessingScan(false);
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);

    // ── Case 1: DUPLICATE (Already registered) ──
    if (res.duplicate) {
      playTone('duplicate');
      setActiveAlert({
        type: 'duplicate',
        title: 'Asistencia ya registrada',
        message: `${studentFullName} ya registró su asistencia el día de hoy.`,
        studentName: studentFullName,
        studentCode: foundStudent?.codigo_estudiante || rawClean,
        avatarUrl: foundStudent?.profile?.avatar_url,
        gradeSection: gradeSectionStr,
        time: res.record?.hora_registro || timeStr,
        statusBadge: 'DUPLICADO',
      });

      alertTimeoutRef.current = setTimeout(() => {
        setActiveAlert(null);
      }, 4000);
      return;
    }

    // ── Case 2: SUCCESS ──
    if (res.success) {
      playTone('success');
      try {
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
      } catch { /* ignore */ }

      const parentEmail = foundStudent?.email_apoderado || 'apoderado@gmail.com';

      setActiveAlert({
        type: 'success',
        title: '¡Asistencia registrada!',
        message: `Ingreso marcado a las ${timeStr} correctamente.`,
        studentName: studentFullName,
        studentCode: foundStudent?.codigo_estudiante || rawClean,
        avatarUrl: foundStudent?.profile?.avatar_url,
        gradeSection: gradeSectionStr,
        time: timeStr,
        parentEmail,
        statusBadge: calculatedStatus === 'tardanza' ? 'TARDANZA' : 'A TIEMPO',
      });

      alertTimeoutRef.current = setTimeout(() => {
        setActiveAlert(null);
      }, 4000);
      return;
    }

    // ── Case 3: FALLBACK AL SERVIDOR / NOT FOUND ──
    fetch('/api/asistencia/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenQr: rawClean, metodo: 'qr', status: calculatedStatus }),
    })
      .then(async (apiRes) => {
        const data = await apiRes.json();
        if (data.success) {
          playTone('success');
          try {
            confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
          } catch { /* ignore */ }
          setActiveAlert({
            type: 'success',
            title: '¡Asistencia registrada!',
            message: data.message || `Ingreso marcado a las ${timeStr} correctamente.`,
            studentName: data.data?.estudiante || studentFullName,
            studentCode: data.data?.codigo || rawClean,
            time: timeStr,
            statusBadge: calculatedStatus === 'tardanza' ? 'TARDANZA' : 'A TIEMPO',
          });
          refreshData();
          alertTimeoutRef.current = setTimeout(() => {
            setActiveAlert(null);
          }, 4000);
        } else if (data.duplicate) {
          playTone('duplicate');
          setActiveAlert({
            type: 'duplicate',
            title: 'Asistencia ya registrada',
            message: data.message || 'El alumno ya cuenta con asistencia registrada hoy.',
            studentName: data.data?.estudiante || studentFullName,
            studentCode: data.data?.codigo || rawClean,
            time: timeStr,
            statusBadge: 'DUPLICADO',
          });
          alertTimeoutRef.current = setTimeout(() => {
            setActiveAlert(null);
          }, 4000);
        } else {
          playTone('error');
          setActiveAlert({
            type: 'error',
            title: 'No pudimos leer el código QR',
            message: data.message || 'El código no pertenece a ningún estudiante matriculado. Intenta nuevamente o utiliza el registro manual.',
            studentName: 'Código: ' + rawClean,
            time: timeStr,
          });
          alertTimeoutRef.current = setTimeout(() => {
            setActiveAlert(null);
          }, 4000);
        }
      })
      .catch(() => {
        playTone('error');
        setActiveAlert({
          type: 'error',
          title: 'No pudimos leer el código QR',
          message: 'El código no pertenece a ningún estudiante matriculado. Intenta nuevamente o utiliza el registro manual.',
          studentName: 'Código: ' + rawClean,
          time: timeStr,
        });
        alertTimeoutRef.current = setTimeout(() => {
          setActiveAlert(null);
        }, 4000);
      });
  }, [students, enrollments, users, scanMode, registerAttendance, recordStaffAttendance, playTone, refreshData]);

  // ── Native / Video Camera Scanning Loop ─────────────────────────────────────
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
            handleProcessCode(results[0].rawValue);
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
                  if (!fallbackScannerRef.current) {
                    const { Html5Qrcode } = await import('html5-qrcode');
                    const tempId = 'kiosk-qr-temp-decode';
                    let tempEl = document.getElementById(tempId);
                    if (!tempEl) {
                      tempEl = document.createElement('div');
                      tempEl.id = tempId;
                      tempEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
                      document.body.appendChild(tempEl);
                    }
                    fallbackScannerRef.current = new Html5Qrcode(tempId, { verbose: false });
                  }
                  const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
                  const result = await fallbackScannerRef.current.scanFile(file, false);
                  handleProcessCode(result);
                } catch {
                  /* Frame scan continue */
                }
                resolve();
              },
              'image/jpeg',
              0.7
            );
          });
          await new Promise((r) => setTimeout(r, 380));
        }
      } catch {
        /* decode tick err */
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [handleProcessCode]);

  // ── Camera Lifecycle Controls with Multi-Level Fallbacks ────────────────────
  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* track stop */
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (fallbackScannerRef.current) {
      try {
        fallbackScannerRef.current.clear();
      } catch {
        /* ignore */
      }
      fallbackScannerRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(
    async (facingOrDeviceId?: 'environment' | 'user' | string) => {
      setCameraError(null);
      stopCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('El navegador no soporta acceso a la cámara o no está en un entorno seguro (HTTPS/localhost).');
        setIsCameraActive(false);
        return;
      }

      const isDeviceId = facingOrDeviceId && facingOrDeviceId !== 'environment' && facingOrDeviceId !== 'user';
      const facing = !isDeviceId && facingOrDeviceId ? (facingOrDeviceId as 'environment' | 'user') : currentFacing;

      let stream: MediaStream | null = null;

      try {
        if (isDeviceId) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: facingOrDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        }
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false,
          });
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          } catch (err: unknown) {
            const msg = String(err);
            let userMsg = 'No se pudo acceder a la cámara.';
            if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
              userMsg = '🔒 Permiso de cámara denegado. Permite el acceso a la cámara en tu navegador.';
            } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFound')) {
              userMsg = '📵 No se encontró ninguna cámara conectada en este equipo.';
            } else if (msg.includes('NotReadableError') || msg.includes('TrackStartError')) {
              userMsg = '⚠️ La cámara está en uso por otra aplicación o pestaña.';
            }
            setCameraError(userMsg);
            setIsCameraActive(false);
            return;
          }
        }
      }

      if (stream) {
        streamRef.current = stream;
        if (!isDeviceId) {
          setCurrentFacing(facing);
        }

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = devices.filter(d => d.kind === 'videoinput');
          setAvailableDevices(videoDevs);
        } catch {
          /* ignore enum error */
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('autoplay', 'true');
          videoRef.current.muted = true;

          try {
            await videoRef.current.play();
          } catch (e) {
            console.warn('Video play promise error:', e);
          }
        }

        setIsCameraActive(true);
        startScanLoop();
      }
    },
    [stopCamera, currentFacing, startScanLoop]
  );

  // ── Hardware USB QR Scanner Gun Listener ────────────────────────────────────
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 300) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.trim().length >= 3) {
          handleProcessCode(buffer.trim());
          buffer = '';
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleProcessCode]);

  useEffect(() => {
    startCamera('environment');
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── QR File Upload Handler ──────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempId = 'kiosk-file-upload-temp';
      let tempEl = document.getElementById(tempId);
      if (!tempEl) {
        tempEl = document.createElement('div');
        tempEl.id = tempId;
        tempEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
        document.body.appendChild(tempEl);
      }
      const h = new Html5Qrcode(tempId, { verbose: false });
      const decoded = await h.scanFile(file, false);
      await h.clear();
      handleProcessCode(decoded);
    } catch {
      setActiveAlert({
        type: 'error',
        title: 'Imagen sin QR válido',
        message: 'No se detectó ningún código QR en la imagen seleccionada.',
      });
    }
  };

  const getReturnUrl = () => {
    if (currentUser?.rol === 'admin') return '/admin';
    if (currentUser?.rol === 'docente') return '/docente/asistencia';
    return '/admin';
  };

  const schoolTitle = brandingConfig?.nombreInstitucion || 'Colegio San Martín de Porres';

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── 1. ENCABEZADO RESPONSIVE Y MODERNO ── */}
      <header className="sticky top-0 z-40 bg-[#070b14]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-5 lg:px-8 py-2.5 sm:py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Logo & School Branding */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-950 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[#091120] rounded-[10px] sm:rounded-[14px] flex items-center justify-center text-emerald-400">
                <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base lg:text-lg font-black text-white leading-tight truncate">
                  Kiosco Asistencia <span className="text-emerald-400 font-extrabold">QR</span>
                </h1>
                <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">En Línea</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate mt-0.5">
                {schoolTitle} • Portería General 2026
              </p>
            </div>
          </div>

          {/* Right Controls: Clock + Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Clock Widget Aislado (0 re-renders en el árbol principal) */}
            <KioscoClock />

            {/* Pantalla Completa (Totem Mode) */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-800 shrink-0 cursor-pointer"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa (Totem)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Volver al Panel Button */}
            <button
              type="button"
              onClick={() => router.push(getReturnUrl())}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#131d33] hover:bg-[#1c2a47] text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700/80 active:scale-95 cursor-pointer shrink-0"
              title="Volver al panel"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
              <span className="hidden md:inline">Volver al Panel</span>
            </button>

          </div>

        </div>
      </header>

      {/* ── CONTENIDO PRINCIPAL FLUIDO ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-5 lg:px-8 py-3 sm:py-5 flex flex-col gap-3.5 sm:gap-5">
        
        {/* ── BARRA DE MODOS Y PESTAÑAS RESPONSIVE ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-1">
          
          {/* Segmented Mode Selector: Entrada / Salida */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            <div className="inline-flex p-1 rounded-xl bg-slate-900/90 border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setScanMode('entrada')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  scanMode === 'entrada'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📥</span>
                <span>Entrada</span>
              </button>
              <button
                type="button"
                onClick={() => setScanMode('salida')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  scanMode === 'salida'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📤</span>
                <span>Salida</span>
              </button>
            </div>

            {/* Navigation Tabs Pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('scan');
                  if (!isCameraActive) startCamera(currentFacing);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'scan'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Escáner</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'manual'
                    ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/50 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Manual</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'stats'
                    ? 'bg-blue-950/60 text-blue-300 border border-blue-500/50 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                <span>Registros ({registeredCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'config' ? 'scan' : 'config')}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'config'
                    ? 'bg-purple-950/60 text-purple-300 border-purple-500/50'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800/80'
                }`}
                title="Ajustes de audio y cámara"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Sound Toggle Button */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-rose-950/40 border-rose-900 text-rose-400'
              }`}
              title={soundEnabled ? 'Sonido activado (clic para silenciar)' : 'Silenciado (clic para activar sonido)'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] hidden xs:inline">Audio On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[11px] hidden xs:inline">Mudo</span>
                </>
              )}
            </button>

            {/* Ayuda Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowHelpDrawer(!showHelpDrawer)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Guía</span>
            </button>

            {/* Imprimir Resumen */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold cursor-pointer"
              title="Imprimir resumen de puerta"
            >
              <span>📋</span>
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>

        </div>

        {/* ── 3 RESUMEN ULTRA RESPONSIVE DE MÉTRICAS (SIEMPRE VISIBLE) ── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          
          {/* Card A TIEMPO */}
          <div className="bg-gradient-to-br from-[#0c241c] to-[#081712] border border-emerald-500/40 hover:border-emerald-500/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 transition-all shadow-lg">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-400 block truncate">
                A TIEMPO
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white">{aTiempoCount}</span>
                <span className="text-[9px] sm:text-xs text-emerald-300/80 font-medium hidden xs:inline">est.</span>
              </div>
            </div>
          </div>

          {/* Card TARDANZA */}
          <div className="bg-gradient-to-br from-[#2b1f0c] to-[#1a1205] border border-amber-500/40 hover:border-amber-500/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 transition-all shadow-lg">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-amber-400 block truncate">
                TARDANZA
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white">{tardanzaCount}</span>
                <span className="text-[9px] sm:text-xs text-amber-300/80 font-medium hidden xs:inline">est.</span>
              </div>
            </div>
          </div>

          {/* Card PENDIENTE / FALTÓ */}
          <div className="bg-gradient-to-br from-[#240e15] to-[#16060a] border border-rose-500/40 hover:border-rose-500/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 transition-all shadow-lg">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-rose-400 block truncate">
                PENDIENTE
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white">{faltoCount}</span>
                <span className="text-[9px] sm:text-xs text-rose-300/80 font-medium hidden xs:inline">por llegar</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── CUERPO PRINCIPAL DINÁMICO (2 COLUMNAS EN DESKTOP) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 flex-1">
          
          {/* ── COLUMNA PRINCIPAL (ESCÁNER O VISTA ACTIVA) ── */}
          <div className={`${activeTab === 'scan' ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col gap-3.5`}>
            
            {/* VISTA 1: ESCÁNER QR */}
            {activeTab === 'scan' && (
              <div className="flex flex-col bg-[#0b1324] rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-slate-800/80 shadow-2xl relative overflow-hidden">
                
                {/* Viewport de Cámara Ultra Responsive */}
                <div className="relative w-full aspect-square xs:aspect-[4/3] sm:aspect-[16/10] max-h-[58vh] sm:max-h-[500px] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800/90 shadow-inner">
                  
                  {/* Video Live Feed */}
                  <video
                    ref={videoRef}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                      isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  />

                  {/* Pantalla cuando la cámara está apagada o con error */}
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#091120] to-[#040810] p-6 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                        <CameraOff className="w-8 h-8" />
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-200">Cámara Inactiva</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        {cameraError || 'Enciende la cámara para escanear los carnets escolares automáticamente.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => startCamera(currentFacing)}
                        className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                      >
                        Encender Cámara
                      </button>
                    </div>
                  )}

                  {/* Dark tint overlay */}
                  <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />

                  {/* Laser & Reticle Guide */}
                  {isCameraActive && (
                    <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
                      
                      {/* Floating Top Banner (No bloquea el centro del QR) */}
                      <div className="absolute -top-12 xs:-top-16 sm:-top-20 z-20">
                        <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 shadow-lg">
                          <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span>Centra el código QR del carnet</span>
                        </div>
                      </div>

                      {/* Glowing Corner Frame */}
                      <div className="relative w-44 h-44 xs:w-56 xs:h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-7 h-7 sm:w-9 sm:h-9 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl sm:rounded-tl-2xl shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                        <div className="absolute top-0 right-0 w-7 h-7 sm:w-9 sm:h-9 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl sm:rounded-tr-2xl shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                        <div className="absolute bottom-0 left-0 w-7 h-7 sm:w-9 sm:h-9 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl sm:rounded-bl-2xl shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                        <div className="absolute bottom-0 right-0 w-7 h-7 sm:w-9 sm:h-9 border-b-4 border-r-4 border-emerald-400 rounded-br-xl sm:rounded-br-2xl shadow-[0_0_12px_rgba(52,211,153,0.8)]" />

                        {/* Animated Laser Scanning Line */}
                        <div className="absolute inset-x-3 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] animate-pulse" />
                      </div>

                    </div>
                  )}

                  {/* Viewport Bottom Overlay Controls */}
                  {isCameraActive && (
                    <div className="absolute bottom-3 inset-x-2 z-20 flex items-center justify-center gap-4 sm:gap-6 bg-slate-950/75 backdrop-blur-md rounded-xl sm:rounded-2xl py-1.5 px-3 border border-white/10 w-fit mx-auto shadow-lg">
                      {/* Torch */}
                      <button
                        type="button"
                        onClick={() => setTorchEnabled(!torchEnabled)}
                        className="flex flex-col items-center gap-0.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Linterna / Flash"
                      >
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                          {torchEnabled ? <Zap className="w-3.5 h-3.5 text-amber-400" /> : <ZapOff className="w-3.5 h-3.5 text-slate-400" />}
                        </div>
                        <span className="text-[8px] font-bold text-slate-400">{torchEnabled ? 'Luz On' : 'Luz'}</span>
                      </button>

                      {/* Switch Camera */}
                      <button
                        type="button"
                        onClick={() => startCamera(currentFacing === 'environment' ? 'user' : 'environment')}
                        className="flex flex-col items-center gap-0.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Girar cámara"
                      >
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                          <SwitchCamera className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-[8px] font-bold text-slate-400">
                          {currentFacing === 'environment' ? 'Trasera' : 'Frontal'}
                        </span>
                      </button>

                      {/* Sound Toggle In-Viewport */}
                      <button
                        type="button"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="flex flex-col items-center gap-0.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Sonido"
                      >
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
                        </div>
                        <span className="text-[8px] font-bold text-slate-400">{soundEnabled ? 'Audio' : 'Mudo'}</span>
                      </button>
                    </div>
                  )}

                  {/* ── POP-UP MODAL DE ALERTA AL ESCANEAR ── */}
                  {activeAlert && (
                    <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                      <div className={`w-full max-w-sm rounded-2xl sm:rounded-3xl p-4 sm:p-5 border text-center shadow-2xl flex flex-col items-center my-auto ${
                        activeAlert.type === 'success'
                          ? 'bg-[#0d2820] border-emerald-500/60 text-emerald-100'
                          : activeAlert.type === 'duplicate'
                          ? 'bg-[#291e0a] border-amber-500/60 text-amber-100'
                          : 'bg-[#290e12] border-rose-500/60 text-rose-100'
                      }`}>
                        
                        {/* Status Icon */}
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-2.5 shadow-lg ${
                          activeAlert.type === 'success'
                            ? 'bg-emerald-500 text-slate-950'
                            : activeAlert.type === 'duplicate'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-rose-500 text-white'
                        }`}>
                          {activeAlert.type === 'success' ? (
                            <Check className="w-7 h-7 stroke-[3]" />
                          ) : activeAlert.type === 'duplicate' ? (
                            <AlertTriangle className="w-7 h-7" />
                          ) : (
                            <X className="w-7 h-7 stroke-[3]" />
                          )}
                        </div>

                        {/* Title & Message */}
                        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                          {activeAlert.title}
                        </h2>
                        <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                          {activeAlert.message}
                        </p>

                        {/* Student Details Card */}
                        {activeAlert.studentName && (
                          <div className="w-full mt-3 p-3 rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 space-y-1.5 text-left">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={activeAlert.avatarUrl || initialsAvatarUrl(activeAlert.studentName)}
                                alt=""
                                className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-400 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-extrabold text-white text-xs sm:text-sm truncate">
                                  {activeAlert.studentName}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono truncate">
                                  {activeAlert.studentCode} {activeAlert.gradeSection ? `• ${activeAlert.gradeSection}` : ''}
                                </p>
                                <p className="text-[10px] text-emerald-400 font-semibold">
                                  Hora: {activeAlert.time}
                                </p>
                              </div>

                              {activeAlert.statusBadge && (
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase shrink-0 ${
                                  activeAlert.statusBadge === 'A TIEMPO'
                                    ? 'bg-emerald-500 text-slate-950'
                                    : activeAlert.statusBadge === 'TARDANZA'
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-rose-500 text-white'
                                }`}>
                                  {activeAlert.statusBadge}
                                </span>
                              )}
                            </div>

                            {activeAlert.type === 'success' && activeAlert.parentEmail && (
                              <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-emerald-300">
                                <span className="truncate">📧 Notificado: {activeAlert.parentEmail}</span>
                                <span className="font-bold text-white shrink-0 ml-1">Brevo Live</span>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveAlert(null)}
                          className="mt-3 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          Cerrar y continuar escaneando
                        </button>

                      </div>
                    </div>
                  )}

                </div>

                {/* Botones de Control de Cámara */}
                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isCameraActive) {
                        stopCamera();
                      } else {
                        startCamera(currentFacing);
                      }
                    }}
                    className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl sm:rounded-2xl font-bold text-xs border transition-all cursor-pointer ${
                      isCameraActive
                        ? 'bg-rose-950/30 hover:bg-rose-950/50 border-rose-700/60 text-rose-300'
                        : 'bg-emerald-950/30 hover:bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                    }`}
                  >
                    {isCameraActive ? (
                      <>
                        <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                        <span>Apagar Cámara</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Encender Cámara</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => startCamera(currentFacing === 'environment' ? 'user' : 'environment')}
                    className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl sm:rounded-2xl bg-[#13203c] hover:bg-[#1a2c52] border border-blue-600/50 text-blue-200 font-bold text-xs transition-all cursor-pointer"
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-blue-400" />
                    <span>{currentFacing === 'environment' ? 'Cámara Frontal' : 'Cámara Trasera'}</span>
                  </button>
                </div>

              </div>
            )}

            {/* VISTA 2: REGISTRO MANUAL */}
            {activeTab === 'manual' && (
              <div className="bg-[#0b1324] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800/80 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    <Keyboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-white">Registro Manual y Código QR</h3>
                    <p className="text-xs text-slate-400">Ingresa DNI de 8 dígitos, código escolar (EST-...) o sube una imagen de carnet</p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manualInput.trim()) {
                      handleProcessCode(manualInput.trim());
                      setManualInput('');
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-2.5"
                >
                  <div className="relative flex-1">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="DNI, código EST-... o token QR"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl bg-[#070d1a] border border-slate-800 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!manualInput.trim()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-950 transition-all cursor-pointer shrink-0"
                  >
                    <span>Registrar Asistencia</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl sm:rounded-2xl bg-[#131d33] hover:bg-[#1a2947] text-slate-300 font-bold text-xs sm:text-sm border border-slate-700/80 transition-colors cursor-pointer shrink-0"
                  >
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>Subir Foto QR</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </form>

                {/* Quick Chips para probar de inmediato en demostraciones */}
                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Probar con un clic (Alumnos Registrados):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {students.slice(0, 4).map((s) => {
                      const name = s.profile ? `${s.profile.nombres} ${s.profile.apellidos}` : `${s.nombres} ${s.apellidos}`;
                      const code = s.dni || s.codigo_estudiante || s.token_qr;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleProcessCode(code)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-all active:scale-95"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{name.split(' ')[0]} ({code})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* VISTA 3: ESTADÍSTICAS Y REGISTROS */}
            {activeTab === 'stats' && (
              <div className="bg-[#0b1324] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800/80 shadow-2xl">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm sm:text-base text-white">Todos los Registros del Día</h3>
                      <p className="text-xs text-slate-400">{todayAttendances.length} asistencias marcadas hoy ({attendanceRate}% del total)</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => refreshData()}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    title="Actualizar datos"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {todayAttendances.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No se han registrado asistencias el día de hoy todavía.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {todayAttendances.map(a => {
                      const enr = enrollments.find(e => e.id === a.matricula_id);
                      const student = enr?.estudiante || students.find(s => s.id === enr?.estudiante_id) || a.matricula?.estudiante;
                      const isLate = a.estado === 'tardanza';

                      return (
                        <div
                          key={a.id}
                          className="p-3 rounded-xl bg-[#070e1c] border border-slate-800/90 flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={student?.profile?.avatar_url || initialsAvatarUrl(student?.profile?.nombres || 'Alumno')}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-slate-200 truncate">
                                {student?.profile ? `${student.profile.apellidos}, ${student.profile.nombres}` : student?.codigo_estudiante || 'Alumno'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {a.hora_registro || '08:00'} • {a.metodo === 'qr' ? 'Escáner QR' : 'Manual'}
                              </p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 ${
                            isLate
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {isLate ? 'Tardanza' : 'A tiempo'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VISTA 4: CONFIGURACIÓN DE DISPOSITIVOS Y AUDIO */}
            {activeTab === 'config' && (
              <div className="bg-[#0b1324] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800/80 shadow-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-white">Configuración del Terminal Kiosco</h3>
                    <p className="text-xs text-slate-400">Selecciona periféricos de video, sonido de feedback y tolerancia</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Selector de cámara conectada */}
                  <div className="p-4 rounded-2xl bg-[#070e1c] border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Dispositivo de Cámara Web:
                    </label>
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                        startCamera(e.target.value);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                    >
                      <option value="">Predeterminada (Automática)</option>
                      {availableDevices.map((d, idx) => (
                        <option key={d.deviceId || idx} value={d.deviceId}>
                          {d.label || `Cámara ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">
                      Detectadas {availableDevices.length} cámaras. Cambia de dispositivo si cuentas con lector externo USB.
                    </p>
                  </div>

                  {/* Sonido institucional */}
                  <div className="p-4 rounded-2xl bg-[#070e1c] border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Prueba de Sonido de Confirmación:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => playTone('success')}
                        className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-bold cursor-pointer"
                      >
                        🔔 Probar Éxito
                      </button>
                      <button
                        type="button"
                        onClick={() => playTone('duplicate')}
                        className="px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer"
                      >
                        ⚠️ Probar Duplicado
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Preset actual: <strong className="text-white">{brandingConfig?.kioskSoundPreset || 'chime'}</strong>. Personalizable en Admin &gt; Branding.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('scan')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                  >
                    Guardar y Volver al Escáner
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ── COLUMNA DERECHA: GUÍA VISUAL Y FEED DE ÚLTIMOS INGRESOS (4 Cols en Desktop) ── */}
          {activeTab === 'scan' && (
            <div className="lg:col-span-4 flex flex-col gap-3.5">
              
              {/* Graphic Student Card Preview */}
              <div className="bg-[#0b1324] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-800/80 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#122040] to-[#0c162e] border border-blue-500/30 text-center shadow-inner relative overflow-hidden">
                    <div className="w-28 h-16 sm:w-32 sm:h-20 mx-auto rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-2 text-white shadow-lg flex flex-col justify-between border border-blue-400/40">
                      <div className="flex items-center justify-between">
                        <div className="w-6 h-1 bg-white/60 rounded-full" />
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="space-y-1 text-left">
                          <div className="w-10 h-1 bg-white/40 rounded-full" />
                          <div className="w-7 h-1 bg-white/40 rounded-full" />
                        </div>
                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white p-0.5 rounded flex items-center justify-center text-slate-900 shadow">
                          <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                      </div>
                    </div>

                    <h3 className="font-black text-xs sm:text-sm text-white mt-2.5 leading-tight">
                      Carnet Escolar con QR
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Acerca el carnet a 15-20 cm frente a la cámara.
                    </p>
                  </div>

                  {/* 3 Quick Visual Tips */}
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0e172a] border border-slate-800/70">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-200">
                        Código centrado y estable
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0e172a] border border-slate-800/70">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Sun className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-200">
                        Evitar reflejos de luz directa
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0e172a] border border-slate-800/70">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        <Volume2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-200">
                        Aviso sonoro automático
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trouble Notice Button */}
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className="mt-3.5 p-2.5 rounded-xl bg-blue-950/30 hover:bg-blue-950/50 border border-blue-800/40 flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-[11px] font-bold text-blue-200">¿Problemas al escanear?</span>
                  </div>
                  <span className="text-[10px] text-blue-400 font-semibold underline">Usar DNI</span>
                </button>
              </div>

              {/* Feed de Últimos Registros */}
              <div className="bg-[#0b1324] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-800/80 shadow-2xl flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Últimos en ingresar
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('stats')}
                      className="text-[10px] text-emerald-400 hover:underline font-bold"
                    >
                      Ver todos ({todayAttendances.length})
                    </button>
                  </div>

                  {recentAttendances.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#070e1c] border border-slate-800 text-center text-[11px] text-slate-500">
                      Esperando primeros registros...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentAttendances.slice(0, 4).map((a) => {
                        const enr = enrollments.find(e => e.id === a.matricula_id);
                        const student = enr?.estudiante || students.find(s => s.id === enr?.estudiante_id) || a.matricula?.estudiante;
                        const isLate = a.estado === 'tardanza';

                        return (
                          <div
                            key={a.id}
                            className="p-2 rounded-xl bg-[#070e1c] border border-slate-800/80 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={student?.profile?.avatar_url || initialsAvatarUrl(student?.profile?.nombres || 'Alumno')}
                                alt=""
                                className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-slate-200 truncate">
                                  {student?.profile ? `${student.profile.nombres?.split(' ')[0]} ${student.profile.apellidos?.split(' ')[0]}` : student?.codigo_estudiante || 'Alumno'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {a.hora_registro || '08:00'}
                                </p>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                              isLate
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {isLate ? 'Tardanza' : 'A tiempo'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Total alumnos: <strong className="text-white">{totalEnrolled}</strong></span>
                  <span>Marcados hoy: <strong className="text-emerald-400">{registeredCount}</strong></span>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* ── FOOTER DISCRETO ── */}
      <footer className="px-3 sm:px-6 py-2.5 text-center text-[10px] text-slate-500 border-t border-slate-800/40 bg-[#070b14]">
        <span>ColeSistema Mini • Terminal Kiosco Seguro & Anti-Duplicados • Soporta Pistola USB & Escáner de Cámara</span>
      </footer>

    </div>
  );
}
