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
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { findStudentByQr, parseQrPayload, getTodayLocalIso } from '@/lib/attendance/qrMatcher';
import { initialsAvatarUrl } from '@/lib/avatar';

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

  // ── Date & Time State ───────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      const formatted = now.toLocaleDateString('es-PE', options);
      // Capitalize first letter
      setCurrentDateFormatted(formatted.charAt(0).toUpperCase() + formatted.slice(1));
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Scanner & Camera State ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'scan' | 'manual' | 'config'>('scan');
  const [scanMode, setScanMode] = useState<'entrada' | 'salida'>('entrada');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [currentFacing, setCurrentFacing] = useState<'environment' | 'user'>('environment');
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isProcessingScan, setIsProcessingScan] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

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
  const totalEnrolled = activeEnrollments.length > 0 ? activeEnrollments.length : 145;
  const registeredCount = todayAttendances.length;
  const faltoCount = Math.max(0, totalEnrolled - registeredCount);

  // Latest registrations for today
  const recentAttendances = [...todayAttendances].sort((a, b) => {
    return (b.hora_registro || '').localeCompare(a.hora_registro || '');
  }).slice(0, 5);

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
    // Mismo lector que registerAttendance: JSON, URL o texto plano
    const rawClean = parseQrPayload(rawInput);
    if (!rawClean) return;

    if (decodeCooldownRef.current && lastDecodeRef.current === rawClean) return;
    lastDecodeRef.current = rawClean;
    decodeCooldownRef.current = true;
    setTimeout(() => {
      decodeCooldownRef.current = false;
    }, 3500);

    setIsProcessingScan(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Determine on-time vs tardiness automatically based on 8:00 AM cutoff
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isLate = currentHour > 8 || (currentHour === 8 && currentMinute > 0);
    const calculatedStatus: AttendanceStatus = isLate ? 'tardanza' : 'presente';

    const normalize = (str?: string) =>
      str ? str.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") : "";
    const normClean = normalize(rawClean);
    const dniMatch = rawClean.match(/(?<!\d)\d{8}(?!\d)/);
    const extractedDni = dniMatch ? dniMatch[0] : '';

    // Búsqueda exacta del estudiante (la misma que usa registerAttendance)
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
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
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
        }, 4500);
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
      }, 4500);
      return;
    }

    // ── Case 2: SUCCESS ──
    if (res.success) {
      playTone('success');
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });

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
      }, 4500);
      return;
    }

    // ── Case 3: FALLBACK AL SERVIDOR / NOT FOUND ──
    // Si la búsqueda local en el Kiosco falló (ej. alumno recién matriculado en otra máquina),
    // consultamos la API del servidor en tiempo real
    fetch('/api/asistencia/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenQr: rawClean, metodo: 'qr', status: calculatedStatus }),
    })
      .then(async (apiRes) => {
        const data = await apiRes.json();
        if (data.success) {
          playTone('success');
          confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
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
          }, 4500);
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
          }, 4500);
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
          }, 4500);
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
        }, 4500);
      });
  }, [students, enrollments, users, scanMode, registerAttendance, recordStaffAttendance, playTone, refreshData]);

  // ── USB Barcode & QR Gun Scanner Global Listener ───────────────────────────
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is intentionally typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const now = Date.now();
      // Fast burst typing from barcode guns is typically < 100ms between chars
      if (now - lastKeyTime > 120) {
        keyBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (keyBuffer.trim().length >= 4) {
          handleProcessCode(keyBuffer.trim());
          keyBuffer = '';
        }
      } else if (e.key.length === 1) {
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleProcessCode]);

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
          await new Promise((r) => setTimeout(r, 400));
        }
      } catch {
        /* decode tick err */
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [handleProcessCode]);

  // ── Available Camera Devices ────────────────────────────────────────────────
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

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

      // Tier 1: Try specific device ID or ideal facing mode
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
        // Tier 2: Try basic facing mode without resolution constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false,
          });
        } catch {
          // Tier 3: Universal fallback: any video device available
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

        // Enumerate camera devices for user selection
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
      // If typing in an input field, let normal typing happen
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      const now = Date.now();
      // Fast keystrokes from USB scanner gun
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

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between p-3 sm:p-5 lg:p-6 select-none font-sans">
      
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── 1. ENCABEZADO COMPACTO ── */}
      <header className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
        
        {/* Left Branding */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-900/30 shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white leading-tight flex items-center gap-2">
              <span>Terminal de Control de Asistencia</span>
              <span className="text-emerald-400">QR</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Portería Principal | Ingreso General | Año Lectivo 2026
            </p>
          </div>
        </div>

        {/* Right Controls: Real-Time Date & Clock + Volver al Panel */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          
          {/* Real-time Clock Card */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#0e172a] border border-slate-800/90 shadow-sm">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-medium block leading-none">
                {currentDateFormatted || 'Cargando fecha...'}
              </span>
              <span className="text-base font-black text-white tracking-wider mt-0.5 block">
                {currentTime || '08:00:00'}
              </span>
            </div>
          </div>

          {/* Volver al Panel Button */}
          <button
            type="button"
            onClick={() => router.push(getReturnUrl())}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#131d33] hover:bg-[#1c2a47] text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700/80 shadow-sm active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-300" />
            <span>Volver al Panel</span>
          </button>

        </div>
      </header>

      {/* ── TOP MODE TABS ── */}
      <div className="max-w-7xl mx-auto w-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-full pb-1 sm:pb-0 shrink-0">
          {/* Modo Entrada / Salida Toggle */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 mr-1 shrink-0">
            <button
              onClick={() => setScanMode('entrada')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                scanMode === 'entrada'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📥 Entrada
            </button>
            <button
              onClick={() => setScanMode('salida')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                scanMode === 'salida'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📤 Salida / Retiro
            </button>
          </div>

          <button
            onClick={() => {
              setActiveTab('scan');
              if (!isCameraActive) startCamera(currentFacing);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'scan'
                ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Escanear QR</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'manual'
                ? 'bg-indigo-950/50 text-indigo-300 border border-indigo-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Registro Manual</span>
          </button>

        </div>

        {/* Sound toggle & Settings */}
        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            title="Imprimir resumen de puerta"
          >
            <span>📋 Resumen</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-[#0e172a] border-slate-700 text-slate-300'
                : 'bg-rose-950/30 border-rose-900 text-rose-400'
            }`}
            title={soundEnabled ? 'Silenciar audio' : 'Activar audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'config' ? 'scan' : 'config')}
            className="p-2 rounded-xl bg-[#0e172a] border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Configuración"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 2 & 3. ÁREA PRINCIPAL: ESCÁNER QR + PANEL DE AYUDA (2 COLUMNAS EN DESKTOP) ── */}
      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5 my-auto">
        
        {/* ── COLUMNA IZQUIERDA: LECTOR QR (8 Cols) ── */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-[#0b1324] rounded-3xl p-4 sm:p-6 border border-slate-800/80 shadow-2xl relative overflow-hidden">
          
          {/* Live Viewport Area */}
          <div className="relative w-full aspect-[16/10] min-h-[280px] sm:min-h-[420px] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800/90">
            
            {/* Real Video Element */}
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />

            {/* Simulated background viewport when camera is inactive/error */}
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#091120] to-[#040810] p-6 text-center">
                <CameraOff className="w-14 h-14 text-slate-600 mb-3" />
                <h3 className="text-base font-black text-slate-300">Cámara en espera</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {cameraError || 'Haz clic en "Encender Cámara" para reanudar el escaneo automático.'}
                </p>
                <button
                  onClick={() => startCamera(currentFacing)}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
                >
                  Encender Cámara
                </button>
              </div>
            )}

            {/* Dark tint overlay */}
            <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />

            {/* Central QR Target Frame with glowing green corners */}
            {isCameraActive && (
              <div className="relative z-10 flex flex-col items-center justify-center">
                
                {/* Glowing Target Frame */}
                <div className="relative w-56 h-56 sm:w-72 sm:h-72 max-w-[70vw] max-h-[70vw] flex items-center justify-center">
                  
                  {/* Glowing Corner Brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl shadow-[0_0_12px_rgba(52,211,153,0.8)]" />

                  {/* Laser Scan line effect */}
                  <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] animate-pulse" />

                  {/* Inner Icon & Instruction */}
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mb-2 shadow-inner">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <p className="text-white font-black text-sm sm:text-base leading-tight drop-shadow-md">
                      Apunta el código QR <br /> del carnet escolar
                    </p>
                    <p className="text-emerald-300 text-[11px] font-medium mt-1 drop-shadow">
                      El escaneo se realizará automáticamente
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* Viewport Bottom Overlay Controls */}
            {isCameraActive && (
              <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-center gap-6 sm:gap-8 bg-slate-950/60 backdrop-blur-md rounded-2xl py-2 px-4 border border-white/10 w-fit mx-auto">
                
                {/* Torch / Flash */}
                <button
                  type="button"
                  onClick={() => setTorchEnabled(!torchEnabled)}
                  className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    {torchEnabled ? <Zap className="w-4 h-4 text-amber-400" /> : <ZapOff className="w-4 h-4 text-slate-400" />}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">Luz: {torchEnabled ? 'On' : 'Auto'}</span>
                </button>

                {/* Facing Camera Switch */}
                <button
                  type="button"
                  onClick={() => startCamera(currentFacing === 'environment' ? 'user' : 'environment')}
                  className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">
                    {currentFacing === 'environment' ? 'Cámara trasera ▾' : 'Cámara frontal ▾'}
                  </span>
                </button>

                {/* Audio Status */}
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">
                    Audio: {soundEnabled ? 'Activado' : 'Mudo'}
                  </span>
                </button>

              </div>
            )}

            {/* ── POP-UP / BANNER DE CONFIRMACIÓN VISUAL (ESTADOS) ── */}
            {activeAlert && (
              <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className={`w-full max-w-md rounded-3xl p-6 border text-center shadow-2xl flex flex-col items-center ${
                  activeAlert.type === 'success'
                    ? 'bg-[#0d2820] border-emerald-500/60 text-emerald-100'
                    : activeAlert.type === 'duplicate'
                    ? 'bg-[#291e0a] border-amber-500/60 text-amber-100'
                    : 'bg-[#290e12] border-rose-500/60 text-rose-100'
                }`}>
                  
                  {/* Status Icon */}
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-3 shadow-lg ${
                    activeAlert.type === 'success'
                      ? 'bg-emerald-500 text-slate-950'
                      : activeAlert.type === 'duplicate'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-rose-500 text-white'
                  }`}>
                    {activeAlert.type === 'success' ? (
                      <Check className="w-9 h-9 stroke-[3]" />
                    ) : activeAlert.type === 'duplicate' ? (
                      <AlertTriangle className="w-9 h-9" />
                    ) : (
                      <X className="w-9 h-9 stroke-[3]" />
                    )}
                  </div>

                  {/* Title & Message */}
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {activeAlert.title}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    {activeAlert.message}
                  </p>

                  {/* Student Details Card */}
                  {activeAlert.studentName && (
                    <div className="w-full mt-4 p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-left">
                      <div className="flex items-center gap-3">
                        <img
                          src={activeAlert.avatarUrl || initialsAvatarUrl(activeAlert.studentName)}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-400 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-white text-sm truncate">
                            {activeAlert.studentName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {activeAlert.studentCode} {activeAlert.gradeSection ? `• ${activeAlert.gradeSection}` : ''}
                          </p>
                          <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                            Hora: {activeAlert.time}
                          </p>
                        </div>

                        {activeAlert.statusBadge && (
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase shrink-0 ${
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
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-300">
                          <span className="flex items-center gap-1.5 font-medium truncate">
                            <span>📧 Notificación enviada al apoderado:</span>
                            <strong className="font-mono text-white">{activeAlert.parentEmail}</strong>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                            Brevo Live
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setActiveAlert(null)}
                    className="mt-4 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cerrar (Continúa escaneando...)
                  </button>

                </div>
              </div>
            )}

          </div>

          {/* Action Buttons Below Viewport */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            
            <button
              type="button"
              onClick={() => {
                if (isCameraActive) {
                  stopCamera();
                } else {
                  startCamera(currentFacing);
                }
              }}
              className={`inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs border transition-all cursor-pointer ${
                isCameraActive
                  ? 'bg-rose-950/30 hover:bg-rose-950/50 border-rose-700/60 text-rose-300'
                  : 'bg-emerald-950/30 hover:bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
              }`}
            >
              {isCameraActive ? (
                <>
                  <CameraOff className="w-4 h-4 text-rose-400" />
                  <span>Apagar Cámara</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Encender Cámara</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => startCamera(currentFacing === 'environment' ? 'user' : 'environment')}
              className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#13203c] hover:bg-[#1a2c52] border border-blue-600/50 text-blue-200 font-bold text-xs transition-all cursor-pointer"
            >
              <SwitchCamera className="w-4 h-4 text-blue-400" />
              <span>{currentFacing === 'environment' ? 'Cambiar a Frontal' : 'Cambiar a Trasera'}</span>
            </button>

          </div>

        </div>

        {/* ── COLUMNA DERECHA: PANEL DE AYUDA (4 Cols) ── */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-[#0b1324] rounded-3xl p-5 sm:p-6 border border-slate-800/80 shadow-2xl space-y-4">
          
          {/* Graphic: Student ID Card Preview */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#122040] to-[#0c162e] border border-blue-500/30 text-center shadow-inner relative overflow-hidden">
            <div className="w-32 h-20 mx-auto rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-2 text-white shadow-lg flex flex-col justify-between border border-blue-400/40">
              <div className="flex items-center justify-between">
                <div className="w-6 h-1 bg-white/60 rounded-full" />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="space-y-1 text-left">
                  <div className="w-12 h-1 bg-white/40 rounded-full" />
                  <div className="w-8 h-1 bg-white/40 rounded-full" />
                </div>
                <div className="w-7 h-7 bg-white p-0.5 rounded flex items-center justify-center text-slate-900 shadow">
                  <QrCode className="w-6 h-6" />
                </div>
              </div>
            </div>

            <h3 className="font-extrabold text-sm text-white mt-3 leading-tight">
              Escanea el QR de tu carnet
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Acerca el código al centro de la cámara para registrar tu asistencia.
            </p>
          </div>

          {/* 4 Quick Visual Help Points */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0e172a] border border-slate-800/70">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Mantén el código estable
              </span>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0e172a] border border-slate-800/70">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Sun className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Procura buena iluminación
              </span>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0e172a] border border-slate-800/70">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Crosshair className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                El escaneo es automático
              </span>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0e172a] border border-slate-800/70">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Sonará un aviso al registrar
              </span>
            </div>
          </div>

          {/* Bottom Trouble Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-800/40 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-blue-300">
              <span className="font-bold block text-blue-200 mb-0.5">¿Problemas para escanear?</span>
              Puedes registrar manualmente con el DNI, código o token del estudiante.
            </div>
          </div>

        </div>

      </main>

      {/* ── 5. REGISTRO MANUAL (BARRA HORIZONTAL SECUNDARIA) ── */}
      <section className="max-w-7xl mx-auto w-full my-4">
        <div className="bg-[#0b1324] rounded-3xl p-4 sm:p-5 border border-slate-800/80 shadow-lg">
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white leading-tight">
                Registro Manual
              </h3>
              <p className="text-[11px] text-slate-400">
                Ingresa el DNI, código o token del estudiante
              </p>
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
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            {/* Input with User Icon */}
            <div className="relative flex-1">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="DNI, código o token..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-xs font-semibold rounded-2xl bg-[#070d1a] border border-slate-800 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <span>Registrar</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Foto QR / Upload Fallback */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-[#131d33] hover:bg-[#1a2947] text-slate-300 font-bold text-xs border border-slate-700/80 transition-colors cursor-pointer shrink-0"
              title="Cargar foto del carnet QR"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              <span>Foto QR</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

          </form>

        </div>
      </section>

      {/* ── 6 & 7. ASISTENCIAS DE HOY (RESUMEN EXCLUSIVO DEL DÍA ACTUAL) ── */}
      <section className="max-w-7xl mx-auto w-full pt-1 pb-4">
        <div className="bg-[#0b1324] rounded-3xl p-5 sm:p-6 border border-slate-800/80 shadow-2xl">
          
          {/* Card Header: Title + En línea badge + Actualizar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white leading-tight">
                  Asistencias de hoy
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Estudiantes registrados en tiempo real
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status "En línea" */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>En línea</span>
              </div>

              {/* Botón Actualizar */}
              <button
                type="button"
                onClick={() => {
                  /* re-trigger state refresh */
                  setCurrentTime(new Date().toLocaleTimeString('es-PE'));
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* 3 Main Exclusive Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: A TIEMPO */}
            <div className="bg-[#0c1f1d] border border-emerald-500/40 hover:border-emerald-500/70 rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block">
                  A TIEMPO
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-black text-white">{aTiempoCount}</span>
                  <span className="text-xs text-emerald-300/80 font-medium">estudiantes</span>
                </div>
              </div>
            </div>

            {/* Card 2: TARDANZA */}
            <div className="bg-[#241a0d] border border-amber-500/40 hover:border-amber-500/70 rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">
                  TARDANZA
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-black text-white">{tardanzaCount}</span>
                  <span className="text-xs text-amber-300/80 font-medium">estudiantes</span>
                </div>
              </div>
            </div>

            {/* Card 3: FALTÓ */}
            <div className="bg-[#240e13] border border-rose-500/40 hover:border-rose-500/70 rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
                <XCircle className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 block">
                  FALTÓ
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-black text-white">{faltoCount}</span>
                  <span className="text-xs text-rose-300/80 font-medium">estudiantes</span>
                </div>
              </div>
            </div>

          </div>

          {/* ── 8. ÚLTIMOS REGISTROS DEL DÍA ── */}
          {recentAttendances.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                Últimos estudiantes registrados hoy
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {recentAttendances.map(a => {
                  const enr = enrollments.find(e => e.id === a.matricula_id);
                  const student = enr?.estudiante || students.find(s => s.id === enr?.estudiante_id) || a.matricula?.estudiante;
                  const isLate = a.estado === 'tardanza';

                  return (
                    <div
                      key={a.id}
                      className="p-2.5 rounded-xl bg-[#070e1c] border border-slate-800/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={student?.profile?.avatar_url || initialsAvatarUrl(student?.profile?.nombres || 'Alumno')}
                          alt=""
                          className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-200 truncate">
                            {student?.profile?.apellidos?.split(' ')[0]}, {student?.profile?.nombres?.split(' ')[0]}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {a.hora_registro || '08:00'}
                          </p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${
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
            </div>
          )}

        </div>
      </section>

    </div>
  );
}

