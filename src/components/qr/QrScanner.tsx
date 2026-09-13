'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Zap, 
  SwitchCamera, 
  Upload, 
  Flashlight,
  Volume2,
  VolumeX,
  Smartphone,
  ShieldAlert,
  Info
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
  autoStart = false 
}: QrScannerProps) {
  const { registerAttendance, students } = useApp();
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const [lastScanned, setLastScanned] = useState<{
    text: string;
    status: 'success' | 'error';
    message: string;
    studentName?: string;
    time?: string;
  } | null>(null);

  const [manualToken, setManualToken] = useState('');
  const [fileScanning, setFileScanning] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerContainerId = 'interactive-qr-scanner-element';

  // Sound beep
  const triggerBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext policy
    }
  }, [soundEnabled]);

  // Haptic feedback
  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([70, 30, 70]);
      }
    } catch {
      // Ignore vibration error
    }
  };

  const handleQrRead = useCallback((decodedText: string) => {
    triggerBeep();
    triggerHaptic();

    const currentTime = new Date().toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    const res = registerAttendance({
      studentQrToken: decodedText,
      metodo: 'qr',
      status: statusMode,
    });

    const foundStudent = students.find(
      s => s.token_qr === decodedText || 
           s.codigo_estudiante.toLowerCase() === decodedText.toLowerCase() ||
           s.profile?.dni === decodedText
    );
    const studentName = foundStudent?.profile 
      ? `${foundStudent.profile.nombres} ${foundStudent.profile.apellidos}`
      : undefined;

    if (res.success) {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6'],
      });
      setLastScanned({
        text: decodedText,
        status: 'success',
        message: res.message,
        studentName,
        time: currentTime,
      });
    } else {
      setLastScanned({
        text: decodedText,
        status: 'error',
        message: res.message,
        studentName: 'Código no reconocido',
        time: currentTime,
      });
    }

    if (onScanSuccess) {
      onScanSuccess(decodedText);
    }
  }, [registerAttendance, students, statusMode, triggerBeep, onScanSuccess]);

  // Stop camera helper
  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn('Error al detener cámara:', err);
      }
    }
    setIsCameraActive(false);
  };

  // Start camera helper
  const startCamera = async (targetFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setIsStarting(true);

    // Stop current instance if running
    await stopCamera();

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const qrCodeInstance = html5QrCodeRef.current;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edgeSize = Math.max(180, Math.floor(minEdge * 0.72));
          return { width: edgeSize, height: edgeSize };
        },
        aspectRatio: 1.0,
      };

      try {
        // Try requested facing mode (e.g. rear camera on mobile)
        await qrCodeInstance.start(
          { facingMode: targetFacing },
          config,
          (decodedText) => {
            handleQrRead(decodedText);
          },
          () => {
            // Frame error ignore
          }
        );
        setIsCameraActive(true);
        setFacingMode(targetFacing);
      } catch (firstErr) {
        console.warn(`No se pudo iniciar cámara con facingMode ${targetFacing}, reintentando con cámara por defecto:`, firstErr);
        // Fallback to default available video device
        await qrCodeInstance.start(
          { facingMode: targetFacing === 'environment' ? 'user' : 'environment' },
          config,
          (decodedText) => {
            handleQrRead(decodedText);
          },
          () => {}
        );
        setIsCameraActive(true);
        setFacingMode(targetFacing === 'environment' ? 'user' : 'environment');
      }
    } catch (err: unknown) {
      console.error('Error definitivo al iniciar cámara:', err);
      const errStr = String(err);
      if (errStr.includes('NotAllowedError') || errStr.includes('Permission')) {
        setCameraError('Permiso de cámara denegado. Por favor habilita el permiso de cámara en los ajustes de tu navegador o en el ícono de candado.');
      } else if (errStr.includes('NotFoundError') || errStr.includes('DevicesNotFoundError')) {
        setCameraError('No se encontró ninguna cámara conectada en este dispositivo.');
      } else if (errStr.includes('NotReadableError') || errStr.includes('TrackStartError')) {
        setCameraError('La cámara está en uso por otra aplicación o pestaña. Por favor ciérrala y vuelve a intentar.');
      } else {
        setCameraError('No se pudo acceder a la cámara. Verifica que tengas conexión HTTPS y permisos habilitados.');
      }
      setIsCameraActive(false);
    } finally {
      setIsStarting(false);
    }
  };

  // Toggle Camera On/Off
  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera(facingMode);
    }
  };

  // Switch facing mode (rear <-> front)
  const switchCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  };

  // File QR scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanning(true);
    setCameraError(null);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }
      
      // If camera was scanning, stop it first
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        setIsCameraActive(false);
      }

      const result = await html5QrCodeRef.current.scanFile(file, true);
      handleQrRead(result);
    } catch (err) {
      setCameraError('No se pudo detectar un código QR nítido en la imagen seleccionada. Prueba con otra foto o escribe el código.');
    } finally {
      setFileScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    if (autoStart) {
      startCamera('environment');
    }

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.warn);
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
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 sm:p-6 transition-all">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all ${
            isCameraActive 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}>
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
              Lector QR de Asistencia
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isCameraActive ? 'Cámara activa — Enfoca el carnet' : 'Presiona el botón para encender la cámara'}
            </p>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
            soundEnabled 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300' 
              : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
          }`}
          title={soundEnabled ? 'Sonido de escaneo activado' : 'Sonido silenciado'}
          aria-label="Alternar sonido"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Viewport Card */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 mb-4 flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px]">
        
        {/* Hidden/Active HTML5 QR Container */}
        <div 
          id={scannerContainerId} 
          className={`w-full h-full ${!isCameraActive ? 'hidden' : 'block'}`} 
        />

        {/* Laser Scanner Effect when active */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              
              {/* Laser beam */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse top-1/2 -translate-y-1/2" />
            </div>
            
            <p className="mt-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
              Alinea el código QR dentro del recuadro
            </p>
          </div>
        )}

        {/* Inactive Camera State with Big Touch Button */}
        {!isCameraActive && (
          <div className="flex flex-col items-center text-center p-6 space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shadow-inner">
              <Camera className="w-8 h-8 text-emerald-500/80" />
            </div>

            <div>
              <p className="font-extrabold text-white text-base mb-1">
                La cámara está apagada
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Toca el botón a continuación para encender la cámara de tu celular y comenzar a registrar asistencias.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleCamera}
              disabled={isStarting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Iniciando cámara...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Prender Cámara del Celular</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Camera Live Controls (when camera is ON) */}
      {isCameraActive && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={toggleCamera}
            className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <CameraOff className="w-4 h-4" />
            Apagar Cámara
          </button>

          <button
            type="button"
            onClick={switchCameraFacing}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <SwitchCamera className="w-4 h-4" />
            {facingMode === 'environment' ? 'Cambiar a Frontal' : 'Cambiar a Trasera'}
          </button>
        </div>
      )}

      {/* Error message / Camera permission alert */}
      {cameraError && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-xs">Atención con la Cámara</p>
            <p className="text-[11px] leading-relaxed">{cameraError}</p>
          </div>
        </div>
      )}

      {/* Real-Time Scan Feedback Alert */}
      {lastScanned && (
        <div
          className={`mb-4 p-4 rounded-2xl border flex items-start gap-3 transition-all animate-in zoom-in-95 ${
            lastScanned.status === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-100'
              : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-100'
          }`}
        >
          {lastScanned.status === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-sm mb-0.5">
                {lastScanned.status === 'success' ? '¡Asistencia Registrada!' : 'Atención'}
              </p>
              {lastScanned.time && (
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {lastScanned.time}
                </span>
              )}
            </div>
            {lastScanned.studentName && (
              <p className="font-bold text-xs text-emerald-700 dark:text-emerald-300">
                👤 {lastScanned.studentName}
              </p>
            )}
            <p className="mt-0.5 text-slate-600 dark:text-slate-300">{lastScanned.message}</p>
          </div>
        </div>
      )}

      {/* Alternative Input / Simulation Tools */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Métodos Alternativos de Registro
          </span>

          {/* Hidden File Input for QR Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="qr-image-upload-input"
          />
          <label
            htmlFor="qr-image-upload-input"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            {fileScanning ? 'Leyendo imagen...' : 'Subir foto QR'}
          </label>
        </div>

        {/* Manual Code / DNI Entry */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Pegar Token QR, DNI o Código..."
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 cursor-pointer"
          >
            Registrar
          </button>
        </form>

        {/* Quick Demo Scan Buttons */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-slate-400 block">Simular escaneo de alumno (1-Click):</span>
          <div className="flex flex-wrap gap-1.5">
            {students.slice(0, 4).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleQrRead(st.token_qr)}
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
