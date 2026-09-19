'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { SystemBrandingConfig, SitemapUrlEntry } from '@/types';
import { 
  THEME_PRESETS, 
  FONT_OPTIONS,
  DEFAULT_BRANDING_CONFIG, 
  generateRobotsTxt, 
  generateSitemapXml 
} from '@/lib/services/brandingService';
import { 
  Palette, 
  Sparkles, 
  Globe, 
  Search, 
  Bot, 
  Image as ImageIcon, 
  Upload, 
  Check, 
  Copy, 
  RotateCcw, 
  Save, 
  ExternalLink, 
  Eye, 
  EyeOff,
  Mail,
  Send,
  CheckCircle2, 
  AlertTriangle,
  School,
  FileText,
  Lock,
  MessageCircle,
  BarChart3,
  Type,
  Stamp,
  CreditCard,
  Layers,
  Smartphone,
  Award,
  Volume2,
  Play,
  ShieldCheck,
  Zap,
  Download,
  Printer,
  FileCheck,
  Sliders,
  DollarSign,
  Users
} from 'lucide-react';
import { compressFile, formatFileSize } from '@/lib/services/compressionService';
import { Modal } from '@/components/ui/Modal';
import { sendBrevoAttendanceEmail } from '@/lib/services/brevoService';
import { 
  sendResendEmail, 
  ResendEmailType, 
  buildReportCardEmailHtml, 
  buildWelcomeEnrollmentEmailHtml, 
  buildTuitionReminderEmailHtml 
} from '@/lib/services/resendService';

// Logos predefinidos en SVG de alta calidad para pruebas rápidas
const LOGO_PRESETS = [
  {
    name: 'Insignia Imperial',
    siglas: 'IE',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234f46e5"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(%23g)"/><path d="M50 20 L75 35 L75 65 L50 80 L25 65 L25 35 Z" fill="none" stroke="white" stroke-width="4"/><path d="M50 32 L65 42 L65 58 L50 68 L35 58 L35 42 Z" fill="white" opacity="0.9"/><circle cx="50" cy="50" r="6" fill="%234f46e5"/></svg>`,
  },
  {
    name: 'Átomo Científico',
    siglas: 'AC',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23059669"/><stop offset="100%" stop-color="%2310b981"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(%23g2)"/><ellipse cx="50" cy="50" rx="32" ry="12" fill="none" stroke="white" stroke-width="3.5" transform="rotate(30 50 50)"/><ellipse cx="50" cy="50" rx="32" ry="12" fill="none" stroke="white" stroke-width="3.5" transform="rotate(-30 50 50)"/><circle cx="50" cy="50" r="9" fill="white"/></svg>`,
  },
  {
    name: 'Birrete de Oro',
    siglas: 'BO',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23d97706"/><stop offset="100%" stop-color="%23fbbf24"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(%23g3)"/><path d="M50 25 L80 40 L50 55 L20 40 Z" fill="white"/><path d="M35 50 L35 68 C35 74 65 74 65 68 L65 50" fill="none" stroke="white" stroke-width="4"/><path d="M80 40 L80 62" stroke="white" stroke-width="3.5"/></svg>`,
  },
  {
    name: 'Libro del Saber',
    siglas: 'LS',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%232563eb"/><stop offset="100%" stop-color="%234f46e5"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(%23g4)"/><path d="M50 35 C42 30 30 30 22 34 L22 70 C30 66 42 66 50 70 C58 66 70 66 78 70 L78 34 C70 30 58 30 50 35 Z" fill="white"/><line x1="50" y1="35" x2="50" y2="70" stroke="%232563eb" stroke-width="3"/></svg>`,
  },
];

type ActiveTab = 
  | 'identidad' 
  | 'colores' 
  | 'documentos' 
  | 'carnets' 
  | 'diplomas' 
  | 'sonidos' 
  | 'correos' 
  | 'login' 
  | 'seo' 
  | 'robots' 
  | 'canales';

export default function AdminBrandingPage() {
  const { brandingConfig, updateBrandingConfig, resetBrandingConfig, showToast } = useApp();

  // Estado local del formulario para edición fluida
  const [formData, setFormData] = useState<SystemBrandingConfig>(brandingConfig);
  const [activeTab, setActiveTab] = useState<ActiveTab>('identidad');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newDisallowPath, setNewDisallowPath] = useState('');
  const [newSitemapUrl, setNewSitemapUrl] = useState('');
  const [newSitemapFreq, setNewSitemapFreq] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [newSitemapPriority, setNewSitemapPriority] = useState<number>(0.8);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Estados de Brevo & Resend
  const [showBrevoApiKey, setShowBrevoApiKey] = useState(false);
  const [showResendApiKey, setShowResendApiKey] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('padre.familia@ejemplo.com');
  const [isSendingBrevoTest, setIsSendingBrevoTest] = useState(false);
  
  // Resend Test State
  const [selectedResendTemplate, setSelectedResendTemplate] = useState<ResendEmailType>('libreta_notas');
  const [isSendingResendTest, setIsSendingResendTest] = useState(false);

  // Carnet View Mode (Front / Back)
  const [carnetViewSide, setCarnetViewSide] = useState<'front' | 'back'>('front');

  // Sincronizar formData cuando brandingConfig cambie desde el exterior
  useEffect(() => {
    if (brandingConfig) {
      setFormData(brandingConfig);
    }
  }, [brandingConfig]);

  const handleChange = <K extends keyof SystemBrandingConfig>(key: K, value: SystemBrandingConfig[K]) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSelectSidebarStyle = (style: 'dark' | 'gradient' | 'glass') => {
    handleChange('sidebarStyle', style);
    updateBrandingConfig({ ...brandingConfig, sidebarStyle: style });
    const labels: Record<string, string> = {
      dark: 'Oscuro Corporativo',
      gradient: 'Degradado Institucional',
      glass: 'Minimal Glass',
    };
    showToast(`Estilo de barra lateral "${labels[style]}" aplicado en vivo`, 'info', 'Barra Lateral');
  };

  const handleSelectFont = (fontId: string) => {
    handleChange('fontFamily', fontId);
    
    // Inyección dinámica de Google Font en el DOM en tiempo real
    const fontOption = FONT_OPTIONS.find(f => f.id === fontId);
    const category = fontOption?.category || 'sans-serif';
    const fontUrlParam = fontId.replace(/ /g, '+');
    const fontLinkId = `google-font-${fontId.toLowerCase().replace(/\s+/g, '-')}`;
    
    if (typeof document !== 'undefined') {
      if (!document.getElementById(fontLinkId)) {
        const link = document.createElement('link');
        link.id = fontLinkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontUrlParam}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
      document.body.style.fontFamily = `'${fontId}', ${category}, system-ui, -apple-system, sans-serif`;
    }
    showToast(`Tipografía "${fontOption?.name || fontId}" activada`, 'info', 'Google Fonts');
  };

  const handleSelectCarnetOrientation = (orientation: 'vertical' | 'horizontal') => {
    handleChange('carnetOrientacion', orientation);
    showToast(
      `Formato "${orientation === 'horizontal' ? 'Horizontal (Tarjeta Billetera)' : 'Vertical (Credencial)'}" seleccionado`,
      'info',
      'Diseñador de Carnet'
    );
  };

  const handleSelectDiplomaFrameStyle = (style: 'oro_clasico' | 'azul_imperial' | 'moderno_geometrico') => {
    handleChange('diplomaBordeEstilo', style);
    const labels: Record<string, string> = {
      oro_clasico: 'Oro Clásico',
      azul_imperial: 'Azul Imperial',
      moderno_geometrico: 'Moderno Geométrico',
    };
    showToast(`Estilo de marco "${labels[style]}" seleccionado`, 'info', 'Diploma de Honor');
  };

  const handleApplyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      themePreset: preset.id,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
    showToast(`Tema "${preset.name}" seleccionado`, 'info', 'Paleta Aplicada');
  };

  const handleApplyLogoPreset = (preset: typeof LOGO_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      logoUrl: preset.dataUrl,
      siglas: preset.siglas,
    }));
    showToast(`Logo preset "${preset.name}" aplicado`, 'success', 'Logo Actualizado');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof SystemBrandingConfig) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Optimizando y comprimiendo archivo...', 'info', 'Compresor Inteligente');
      const compressed = await compressFile(file, 'high');

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleChange(field, reader.result as any);
          showToast(
            `Archivo optimizado: ${formatFileSize(compressed.originalSize)} ➔ ${formatFileSize(compressed.compressedSize)} (-${compressed.savedPercentage}%)`,
            'success',
            'Recurso Optimizado'
          );
        }
      };
      reader.readAsDataURL(compressed.file);
    } catch {
      // Fallback si falla compresión
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleChange(field, reader.result as any);
          showToast('Imagen cargada correctamente', 'success', 'Archivo Cargado');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reproducción de sonido de prueba para Kiosco
  const handlePlaySoundTest = (preset: 'bell' | 'chime' | 'arpeggio' | 'voice') => {
    try {
      const AudioCtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.8, ctx.currentTime);
      masterGain.connect(ctx.destination);

      if (preset === 'bell') {
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
      } else if (preset === 'arpeggio') {
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
      } else if (preset === 'voice') {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(`Bienvenido al ${formData.nombreInstitucion || 'Colegio'}. Asistencia confirmada.`);
          utterance.lang = 'es-PE';
          utterance.rate = 1.15;
          window.speechSynthesis.speak(utterance);
        }
      } else {
        // chime
        [659.25, 880.0, 1318.51].forEach((freq, idx) => {
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
      showToast(`Reproduciendo tono "${preset}"`, 'info', 'Sonido');
    } catch {
      showToast('AudioContext no disponible', 'warning', 'Audio');
    }
  };

  // Enviar prueba con Brevo
  const handleSendTestBrevoEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      showToast('Por favor ingresa un correo electrónico válido para la prueba', 'warning', 'Correo Inválido');
      return;
    }

    setIsSendingBrevoTest(true);
    try {
      const now = new Date();
      const horaStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      const fechaStr = now.toISOString().split('T')[0];

      const res = await sendBrevoAttendanceEmail({
        parentEmail: testEmailRecipient,
        parentName: 'Padre de Familia (Prueba)',
        studentName: 'Mateo Alejandro Torres (Demo)',
        studentCode: 'EST-2026-0042',
        gradeSection: '5to Secundaria - "A"',
        fecha: fechaStr,
        horaRegistro: horaStr,
        estado: 'presente',
        metodo: 'qr',
        observacion: 'Prueba de integración en tiempo real desde el Panel de Configuración.',
        branding: formData,
      });

      if (res.success) {
        if (res.simulated) {
          showToast(`Prueba simulada exitosa para ${testEmailRecipient} (Modo Demo Brevo).`, 'info', '✓ Envío Simulado', 5000);
        } else {
          showToast(`¡Correo de asistencia enviado con éxito a ${testEmailRecipient} vía Brevo!`, 'success', '✓ Brevo OK', 5000);
        }
      } else {
        showToast(`Error Brevo: ${res.error || 'Verifica tu API Key'}`, 'error', 'Fallo de Envío');
      }
    } catch (err: any) {
      showToast(`Excepción Brevo: ${err?.message || 'Error'}`, 'error', 'Error');
    } finally {
      setIsSendingBrevoTest(false);
    }
  };

  // Enviar prueba con Resend
  const handleSendTestResendEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      showToast('Por favor ingresa un correo electrónico válido para la prueba', 'warning', 'Correo Inválido');
      return;
    }

    setIsSendingResendTest(true);
    try {
      let res;
      if (selectedResendTemplate === 'libreta_notas') {
        res = await sendResendEmail({
          type: 'libreta_notas',
          recipientEmail: testEmailRecipient,
          recipientName: 'Familia Torres Mendoza',
          studentName: 'Mateo Alejandro Torres (Demo)',
          studentCode: 'EST-2026-0042',
          gradeSection: '5to Secundaria "A"',
          bimestre: 'I Bimestre 2026',
          promedioLetra: 'AD',
          puestoMerito: '1er Puesto del Aula',
          pdfDownloadUrl: '#',
          branding: formData,
        });
      } else if (selectedResendTemplate === 'bienvenida_matricula') {
        res = await sendResendEmail({
          type: 'bienvenida_matricula',
          recipientEmail: testEmailRecipient,
          recipientName: 'Familia Torres Mendoza',
          studentName: 'Mateo Alejandro Torres (Demo)',
          studentCode: 'EST-2026-0042',
          gradeSection: '5to Secundaria "A"',
          anioLectivo: '2026',
          loginUsername: '74829104',
          loginUrl: '#',
          branding: formData,
        });
      } else {
        res = await sendResendEmail({
          type: 'recordatorio_pension',
          recipientEmail: testEmailRecipient,
          recipientName: 'Familia Torres Mendoza',
          studentName: 'Mateo Alejandro Torres (Demo)',
          studentCode: 'EST-2026-0042',
          gradeSection: '5to Secundaria "A"',
          mes: 'Septiembre 2026',
          montoSoles: 450.00,
          fechaVencimiento: '30 de Septiembre de 2026',
          paymentUrl: '#',
          branding: formData,
        });
      }

      if (res.success) {
        if (res.simulated) {
          showToast(`Prueba simulada exitosa para ${testEmailRecipient} (Modo Demo Resend).`, 'info', '✓ Envío Simulado', 5000);
        } else {
          showToast(`¡Correo institucional enviado a ${testEmailRecipient} vía Resend!`, 'success', '✓ Resend OK', 5000);
        }
      } else {
        showToast(`Error Resend: ${res.error || 'Verifica tu API Key'}`, 'error', 'Fallo de Envío');
      }
    } catch (err: any) {
      showToast(`Excepción Resend: ${err?.message || 'Error'}`, 'error', 'Error');
    } finally {
      setIsSendingResendTest(false);
    }
  };

  const handleAddDisallowedPath = () => {
    if (!newDisallowPath.trim()) return;
    let path = newDisallowPath.trim();
    if (!path.startsWith('/')) path = '/' + path;

    if (formData.disallowedPaths.includes(path)) {
      showToast('Esa ruta ya está en la lista de exclusión', 'warning', 'Ruta duplicada');
      return;
    }

    setFormData(prev => ({
      ...prev,
      disallowedPaths: [...prev.disallowedPaths, path],
    }));
    setNewDisallowPath('');
  };

  const handleRemoveDisallowedPath = (pathToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      disallowedPaths: prev.disallowedPaths.filter(p => p !== pathToRemove),
    }));
  };

  const handleAddSitemapUrl = () => {
    if (!newSitemapUrl.trim()) return;
    let url = newSitemapUrl.trim();
    if (!url.startsWith('/')) url = '/' + url;

    const entry: SitemapUrlEntry = {
      url,
      changefreq: newSitemapFreq,
      priority: Number(newSitemapPriority),
      lastmod: new Date().toISOString().split('T')[0],
    };

    setFormData(prev => ({
      ...prev,
      sitemapIncludedPaths: [...prev.sitemapIncludedPaths, entry],
    }));
    setNewSitemapUrl('');
    showToast(`Ruta "${url}" añadida al Sitemap`, 'success', 'Ruta Agregada');
  };

  const handleRemoveSitemapUrl = (urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      sitemapIncludedPaths: prev.sitemapIncludedPaths.filter(item => item.url !== urlToRemove),
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      updateBrandingConfig(formData);
      try {
        await fetch('/api/branding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } catch (e) {
        console.warn('API sync fallback', e);
      }

      showToast('Configuración institucional, temas, documentos, carnets, diplomas y canales guardados con éxito', 'success', '✓ Cambios Guardados', 4000);
    } catch (err) {
      showToast('Error al guardar la configuración', 'error', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    resetBrandingConfig();
    setFormData(DEFAULT_BRANDING_CONFIG);
    setIsResetConfirmOpen(false);
    showToast('Valores restablecidos a la configuración inicial de fábrica', 'info', 'Reiniciado');
  };

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast('Copiado al portapapeles', 'success', 'Copiado');
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Contenidos generados en tiempo real
  const generatedRobots = generateRobotsTxt(formData);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* ── HEADER PRINCIPAL ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 top-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Suite White-Label 360° & Correo Dual (Brevo + Resend)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Personalización de Branding Institucional
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Configura la marca oficial, paletas de colores, marca de agua en PDFs, diseñador de carnets QR, diplomas de honor, sonidos de asistencia y canales de correo transaccional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-restablecer-configuracion"
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Restablecer
            </button>

            <button
              id="btn-guardar-configuracion"
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Aplicando cambios...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>

        {/* Mini Preview Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Colegio:</span>
            <span className="font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-md">{formData.nombreInstitucion || 'No definido'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Fuente:</span>
            <span className="font-semibold text-indigo-300 bg-white/10 px-2 py-0.5 rounded-md">{formData.fontFamily || 'Plus Jakarta Sans'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Color Primario:</span>
            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-md">
              <span className="w-3 h-3 rounded-full border border-white/40 shadow-xs" style={{ backgroundColor: formData.primaryColor }} />
              <span className="font-mono text-slate-200">{formData.primaryColor}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Correos:</span>
            <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-500/20 text-emerald-300">
              Brevo (Asistencias) + Resend (Libretas/Tesorería)
            </span>
          </div>
        </div>
      </div>

      {/* ── NAVEGACIÓN POR PESTAÑAS ── */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 scrollbar-none">
        
        <button
          id="tab-identidad"
          type="button"
          onClick={() => setActiveTab('identidad')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'identidad'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <School className="w-4 h-4" />
          1. Identidad & Logo
        </button>

        <button
          id="tab-colores"
          type="button"
          onClick={() => setActiveTab('colores')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'colores'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Palette className="w-4 h-4" />
          2. Colores & UI Global
        </button>

        <button
          id="tab-documentos"
          type="button"
          onClick={() => setActiveTab('documentos')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'documentos'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Stamp className="w-4 h-4" />
          3. Documentos & Marca de Agua
        </button>

        <button
          id="tab-carnets"
          type="button"
          onClick={() => setActiveTab('carnets')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'carnets'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          4. Carnets QR & Reverso
        </button>

        <button
          id="tab-diplomas"
          type="button"
          onClick={() => setActiveTab('diplomas')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'diplomas'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          5. Diplomas de Honor
        </button>

        <button
          id="tab-sonidos"
          type="button"
          onClick={() => setActiveTab('sonidos')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'sonidos'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          6. Sonidos Kiosco QR
        </button>

        <button
          id="tab-correos"
          type="button"
          onClick={() => setActiveTab('correos')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'correos'
              ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500/30'
              : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          7. Correos (Brevo + Resend)
        </button>

        <button
          id="tab-login"
          type="button"
          onClick={() => setActiveTab('login')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'login'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          8. Login & White-Label
        </button>

        <button
          id="tab-seo"
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'seo'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          9. SEO & Robots
        </button>

        <button
          id="tab-canales"
          type="button"
          onClick={() => setActiveTab('canales')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'canales'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          10. WhatsApp & PWA
        </button>
      </div>

      {/* ── TAB 1: IDENTIDAD & LOGO ── */}
      {activeTab === 'identidad' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <School className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Datos Institucionales Oficiales
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nombre Oficial del Colegio / Institución *
                  </label>
                  <input
                    type="text"
                    value={formData.nombreInstitucion}
                    onChange={(e) => handleChange('nombreInstitucion', e.target.value)}
                    placeholder="Ej. Colegio San Martín de Porres"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Siglas / Acrónimo (1-5 letras) *
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={formData.siglas}
                    onChange={(e) => handleChange('siglas', e.target.value.toUpperCase())}
                    placeholder="Ej. CSM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Slogan / Subtítulo Institucional
                  </label>
                  <input
                    type="text"
                    value={formData.slogan}
                    onChange={(e) => handleChange('slogan', e.target.value)}
                    placeholder="Ej. Formando líderes del mañana"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Logo Presets y Upload */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Logo Oficial & Favicon
              </h2>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Presets Rápidos de Logos</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {LOGO_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyLogoPreset(p)}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center gap-2 group transition-all cursor-pointer hover:shadow-md"
                    >
                      <img src={p.dataUrl} alt={p.name} className="w-10 h-10 object-contain rounded-lg group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subir Logo Institucional (PNG, SVG, WebP)</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden p-1 shadow-sm shrink-0">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Arrastra una imagen o selecciónala de tu equipo</p>
                    <p className="text-[11px] text-slate-400">Recomendado: 512x512 px transparente (máx. 2MB)</p>
                  </div>
                  <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0">
                    <Upload className="w-3.5 h-3.5" /> Subir Logo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-20">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" />
                Vista Previa de Marca
              </h3>
              <div className="p-5 rounded-2xl text-white space-y-3 shadow-lg" style={{
                background: `linear-gradient(135deg, ${formData.primaryColor} 0%, ${formData.accentColor} 50%, ${formData.secondaryColor} 100%)`
              }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">Portal Institucional</span>
                  <span className="font-mono text-[10px] opacity-80">{formData.siglas}</span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold">{formData.nombreInstitucion || 'Colegio'}</h4>
                  <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{formData.slogan}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: COLORES & UI GLOBAL ── */}
      {activeTab === 'colores' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            
            {/* Curvatura de Bordes & Estilo de Sidebar */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Estilo Visual de Interfaz & Radios Globales
              </h2>

              {/* Selector de Curvatura de Bordes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Curvatura de Bordes Global (Border Radius)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'sharp', label: 'Formal / Recto', px: '4px', desc: 'Academias & Institutos' },
                    { id: 'modern', label: 'Equilibrado', px: '10px', desc: 'Estándar Moderno' },
                    { id: 'rounded', label: 'Amigable', px: '18px', desc: 'Inicial & Primaria' },
                  ].map((r) => {
                    const isSelected = (formData.borderRadiusMode || 'modern') === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleChange('borderRadiusMode', r.id as any)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{r.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">{r.px} • {r.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector de Estilo de Barra Lateral */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Estilo de Barra Lateral (Sidebar)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Oscuro Corporativo', desc: 'Slate / Navy Premium' },
                    { id: 'gradient', label: 'Degradado Institucional', desc: 'Color primario de la marca' },
                    { id: 'glass', label: 'Minimal Glass', desc: 'Vidrio translúcido' },
                  ].map((s) => {
                    const isSelected = (formData.sidebarStyle || 'dark') === s.id;
                    return (
                      <button
                        key={s.id}
                        id={`btn-sidebar-${s.id}`}
                        type="button"
                        onClick={() => handleSelectSidebarStyle(s.id as any)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{s.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                        <p className="text-[10px] text-slate-400">{s.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Splash Screen / Preloader Switch */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Pantalla de Carga Oficial (Preloader / Splash Screen)</p>
                    <p className="text-[11px] text-slate-500">Muestra el escudo con animación de pulso y barra de carga al iniciar.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.splashScreenActivo !== false}
                    onChange={(e) => handleChange('splashScreenActivo', e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mensaje del Preloader</label>
                  <input
                    type="text"
                    value={formData.splashScreenTexto || ''}
                    onChange={(e) => handleChange('splashScreenTexto', e.target.value)}
                    placeholder="Iniciando Plataforma de Gestión Escolar..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Selector de Fuentes Google Fonts */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Type className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Tipografía Institucional (Google Fonts)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    id={`btn-font-${f.id.toLowerCase().replace(/\s+/g, '-')}`}
                    type="button"
                    onClick={() => handleSelectFont(f.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      formData.fontFamily === f.id
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white" style={{ fontFamily: f.id }}>{f.name}</span>
                      {formData.fontFamily === f.id && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Presets de Temas y Ajuste HEX */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Paletas Cromáticas & Ajuste HEX
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-left cursor-pointer"
                  >
                    <span className="text-xs font-bold block mb-1">{preset.name}</span>
                    <div className="flex gap-1.5">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.primary }} />
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.secondary }} />
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.accent }} />
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Primario</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={formData.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} className="w-7 h-7 rounded cursor-pointer" />
                    <input type="text" value={formData.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} className="w-full text-xs font-mono px-1 py-0.5 border rounded" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Secundario</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={formData.secondaryColor} onChange={(e) => handleChange('secondaryColor', e.target.value)} className="w-7 h-7 rounded cursor-pointer" />
                    <input type="text" value={formData.secondaryColor} onChange={(e) => handleChange('secondaryColor', e.target.value)} className="w-full text-xs font-mono px-1 py-0.5 border rounded" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Acento</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={formData.accentColor} onChange={(e) => handleChange('accentColor', e.target.value)} className="w-7 h-7 rounded cursor-pointer" />
                    <input type="text" value={formData.accentColor} onChange={(e) => handleChange('accentColor', e.target.value)} className="w-full text-xs font-mono px-1 py-0.5 border rounded" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 sticky top-20">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Muestrario Dinámico & Vista Previa
              </h3>

              {/* Muestra de Barra Lateral Activa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Previsualización de Barra Lateral:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 capitalize">{formData.sidebarStyle || 'Oscuro'}</span>
                </div>
                <div 
                  className={`p-4 rounded-2xl border transition-all duration-300 shadow-sm ${
                    formData.sidebarStyle === 'gradient'
                      ? 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white border-indigo-500/30'
                      : formData.sidebarStyle === 'glass'
                      ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 shadow-lg'
                      : 'bg-slate-900 text-slate-100 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      {formData.siglas || 'CS'}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight truncate">{formData.nombreInstitucion || 'Colegio'}</p>
                      <p className="text-[10px] opacity-70">Panel de Control</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-2 text-white" style={{ backgroundColor: formData.primaryColor }}>
                      <School className="w-3.5 h-3.5" /> Dashboard Activo
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-2 opacity-75">
                      <Users className="w-3.5 h-3.5" /> Directorio Estudiantil
                    </div>
                  </div>
                </div>
              </div>

              {/* Muestra de Tipografía Seleccionada */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Muestrario de Tipografía:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">{formData.fontFamily || 'Plus Jakarta Sans'}</span>
                </div>
                <div 
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                  style={{ fontFamily: formData.fontFamily || 'Plus Jakarta Sans' }}
                >
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    ColeSistema 2026: Educación de Excelencia
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Plataforma moderna adaptada con tipografía oficial para reportes, actas y libretas de calificaciones CNEB.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="font-mono text-xs font-bold text-indigo-600">0123456789</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold">
                      Aa Bb Gg Qq Zz
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón con Radio Dinámico */}
              <div 
                className="p-4 border space-y-3"
                style={{
                  borderRadius: formData.borderRadiusMode === 'sharp' ? '4px' : formData.borderRadiusMode === 'rounded' ? '20px' : '12px',
                  backgroundColor: '#f8fafc'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Borde Dinámico ({formData.borderRadiusMode || 'modern'})</span>
                  <button
                    type="button"
                    style={{
                      backgroundColor: formData.primaryColor,
                      borderRadius: formData.borderRadiusMode === 'sharp' ? '4px' : formData.borderRadiusMode === 'rounded' ? '18px' : '10px'
                    }}
                    className="px-4 py-2 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Guardar Registro
                  </button>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 text-[11px] font-bold text-white rounded" style={{ backgroundColor: formData.secondaryColor }}>AD Destacado</span>
                  <span className="px-2.5 py-1 text-[11px] font-bold text-white rounded bg-blue-500">A Esperado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: DOCUMENTOS, SELLO & MARCA DE AGUA ── */}
      {activeTab === 'documentos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            
            {/* Membrete SIAGIE */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Membrete Oficial para Libretas de Notas & Actas SIAGIE
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Código Modular SIAGIE</label>
                  <input type="text" value={formData.codigoModular} onChange={(e) => handleChange('codigoModular', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs font-mono font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">RUC Institucional</label>
                  <input type="text" value={formData.ruc} onChange={(e) => handleChange('ruc', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">UGEL</label>
                  <input type="text" value={formData.ugel} onChange={(e) => handleChange('ugel', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">DRE / Región</label>
                  <input type="text" value={formData.dre} onChange={(e) => handleChange('dre', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nombre del Director(a)</label>
                  <input type="text" value={formData.directorNombre} onChange={(e) => handleChange('directorNombre', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs font-semibold" />
                </div>
              </div>
            </div>

            {/* Marca de Agua en Documentos */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Marca de Agua de Seguridad Oficial (Watermark en PDFs)
              </h2>
              <p className="text-xs text-slate-500">
                Sube el escudo semitransparente que se estampará en el fondo de las libretas, constancias de matrícula y actas para evitar falsificaciones.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border-2 border-dashed bg-slate-50">
                <div className="w-20 h-20 bg-white rounded-xl border flex items-center justify-center p-2 shrink-0">
                  {formData.watermarkUrl || formData.logoUrl ? (
                    <img src={formData.watermarkUrl || formData.logoUrl} alt="Marca de agua" className="max-h-full object-contain opacity-40" />
                  ) : (
                    <ShieldCheck className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <p className="text-xs font-bold">Escudo Oficial de Fondo</p>
                  <label className="text-[11px] text-slate-500 block">Opacidad de Impresión: {Math.round((formData.watermarkOpacity || 0.12) * 100)}%</label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.40"
                    step="0.01"
                    value={formData.watermarkOpacity || 0.12}
                    onChange={(e) => handleChange('watermarkOpacity', parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
                <label className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer">
                  Subir Escudo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'watermarkUrl')} />
                </label>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700">Texto de Seguridad & Folio Institucional (Pie de Página Legal)</label>
                <input
                  type="text"
                  value={formData.documentSecurityFooterText || ''}
                  onChange={(e) => handleChange('documentSecurityFooterText', e.target.value)}
                  placeholder="Documento Oficial emitido electrónicamente con valor legal."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border text-xs"
                />
              </div>
            </div>

            {/* Sello y Firma Digital */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Stamp className="w-5 h-5 text-indigo-600" />
                Sello y Firma Digital de Dirección (PNG Transparente)
              </h2>
              <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed bg-slate-50">
                <div className="w-24 h-16 bg-white rounded-xl border flex items-center justify-center p-2 shrink-0">
                  {formData.directorFirmaUrl ? (
                    <img src={formData.directorFirmaUrl} alt="Firma" className="max-h-full object-contain" />
                  ) : (
                    <Stamp className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold">Firma con Sello de Dirección</p>
                  <p className="text-[11px] text-slate-400">PNG transparente para estampado digital automático</p>
                </div>
                <label className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer">
                  Subir Firma
                  <input type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => handleFileUpload(e, 'directorFirmaUrl')} />
                </label>
              </div>
            </div>

          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-20">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Vista Previa de Libreta Oficial (PDF con Marca de Agua)
              </h3>

              <div className="p-5 rounded-2xl bg-white border-2 border-slate-300 text-slate-900 shadow-md relative overflow-hidden text-xs">
                {/* Marca de agua de fondo */}
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: formData.watermarkOpacity || 0.12 }}
                >
                  <img src={formData.watermarkUrl || formData.logoUrl || '/icon-512.png'} alt="Watermark" className="w-48 h-48 object-contain" />
                </div>

                {/* Encabezado */}
                <div className="relative z-10 flex items-center justify-between border-b pb-2">
                  <div>
                    <h4 className="font-black text-xs">{formData.nombreInstitucion || 'COLEGIO'}</h4>
                    <p className="text-[9px] text-slate-500">Cód: {formData.codigoModular} • {formData.ugel}</p>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">SIAGIE 2026</span>
                </div>

                <div className="relative z-10 py-4 text-center">
                  <p className="font-extrabold text-xs">INFORME DE PROGRESO DEL ESTUDIANTE</p>
                  <p className="text-[10px] text-slate-500 mt-1">Estudiante: Mateo Alejandro Torres (5to Sec - "A")</p>
                </div>

                {/* Sello y pie de página de seguridad */}
                <div className="relative z-10 pt-4 flex justify-between items-end border-t border-slate-200">
                  <div className="text-[8px] text-slate-400 max-w-[180px]">
                    🛡️ {formData.documentSecurityFooterText || 'Documento Oficial de Valor Legal.'}
                  </div>
                  <div className="text-center w-32">
                    {formData.directorFirmaUrl ? (
                      <img src={formData.directorFirmaUrl} alt="Firma" className="h-10 mx-auto object-contain" />
                    ) : (
                      <div className="h-8 border border-dashed rounded flex items-center justify-center text-[9px] text-slate-400">[Sello Digital]</div>
                    )}
                    <p className="text-[9px] font-bold border-t pt-0.5">{formData.directorNombre || 'Dirección'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: CARNETS ESCOLARES QR & REVERSO ── */}
      {activeTab === 'carnets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Diseñador de Carnet Escolar QR (Frente & Reverso)
              </h2>

              {/* Orientación */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Formato / Orientación del Carnet</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="btn-carnet-vertical"
                    type="button"
                    onClick={() => handleSelectCarnetOrientation('vertical')}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      (formData.carnetOrientacion || 'vertical') === 'vertical'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold block">📱 Vertical (Credencial con Cinta)</span>
                    <span className="text-[10px] text-slate-400">Estilo moderno porta-fotocheck</span>
                  </button>
                  <button
                    id="btn-carnet-horizontal"
                    type="button"
                    onClick={() => handleSelectCarnetOrientation('horizontal')}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      formData.carnetOrientacion === 'horizontal'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold block">💳 Horizontal (Tarjeta Billetera)</span>
                    <span className="text-[10px] text-slate-400">Estilo tarjeta plástica PVC</span>
                  </button>
                </div>
              </div>

              {/* Color de Franja por Nivel & Holograma */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Color de Franja Institucional</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={formData.carnetFranjaNivelColor || formData.primaryColor} onChange={(e) => handleChange('carnetFranjaNivelColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                    <input type="text" value={formData.carnetFranjaNivelColor || formData.primaryColor} onChange={(e) => handleChange('carnetFranjaNivelColor', e.target.value)} className="w-full text-xs font-mono px-2 py-1 border rounded" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sello Holográfico Digital Animado</label>
                  <div className="flex items-center justify-between p-2 rounded-xl border bg-slate-50 dark:bg-slate-800">
                    <span className="text-xs text-slate-700 dark:text-slate-300">Distintivo "Matriculado 2026"</span>
                    <input
                      type="checkbox"
                      checked={formData.carnetSelloHolografico !== false}
                      onChange={(e) => handleChange('carnetSelloHolografico', e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Reverso del Carnet */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-extrabold uppercase text-slate-500">Datos del Reverso del Carnet</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Normas de Convivencia Institucional</label>
                  <textarea
                    rows={2}
                    value={formData.carnetReversoNormas || ''}
                    onChange={(e) => handleChange('carnetReversoNormas', e.target.value)}
                    placeholder="1. Portar el carnet obligatoriamente..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contacto de Emergencia / Tópico</label>
                    <input
                      type="text"
                      value={formData.carnetReversoEmergencia || ''}
                      onChange={(e) => handleChange('carnetReversoEmergencia', e.target.value)}
                      placeholder="Tópico Médico: Pabellón B"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Teléfono de Portería</label>
                    <input
                      type="text"
                      value={formData.carnetReversoTelefono || ''}
                      onChange={(e) => handleChange('carnetReversoTelefono', e.target.value)}
                      placeholder="+51 987 654 321"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-20">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-500" />
                  Previsualización del Carnet Escolar
                </h3>
                <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setCarnetViewSide('front')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${carnetViewSide === 'front' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
                  >
                    Frente
                  </button>
                  <button
                    type="button"
                    onClick={() => setCarnetViewSide('back')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${carnetViewSide === 'back' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
                  >
                    Reverso
                  </button>
                </div>
              </div>

              {/* Carnet Render */}
              <div className="flex justify-center p-4 bg-slate-100 dark:bg-slate-800/40 rounded-2xl min-h-[260px] items-center">
                {formData.carnetOrientacion === 'horizontal' ? (
                  /* Formato Horizontal (Tarjeta Billetera) */
                  carnetViewSide === 'front' ? (
                    <div className="w-full max-w-[360px] h-[210px] rounded-2xl overflow-hidden bg-white shadow-xl border border-slate-200 text-slate-900 flex flex-col justify-between font-sans animate-in zoom-in-95 duration-200">
                      <div 
                        className="px-3.5 py-2 text-white flex items-center justify-between shadow-sm"
                        style={{ backgroundColor: formData.carnetFranjaNivelColor || formData.primaryColor }}
                      >
                        <div className="flex items-center gap-2">
                          {formData.logoUrl && (
                            <img src={formData.logoUrl} alt="Logo" className="w-5 h-5 object-contain bg-white rounded-full p-0.5" />
                          )}
                          <h5 className="font-black text-[11px] leading-tight uppercase tracking-tight truncate max-w-[200px]">
                            {formData.nombreInstitucion || 'COLEGIO'}
                          </h5>
                        </div>
                        <span className="text-[8px] font-bold opacity-90 px-1.5 py-0.5 rounded bg-white/20 whitespace-nowrap">
                          CARNET 2026
                        </span>
                      </div>

                      <div className="px-3.5 py-2 flex items-center gap-3">
                        <div className="w-18 h-20 rounded-xl bg-slate-200 border-2 border-indigo-500 overflow-hidden shadow-xs shrink-0">
                          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" alt="Alumno" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h4 className="font-black text-[11px] text-slate-900 leading-tight truncate">MATEO ALEJANDRO TORRES</h4>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">5TO SECUNDARIA - "A"</p>
                          <p className="text-[8px] text-indigo-600 font-mono font-bold">CÓD: EST-2026-0042</p>
                          <p className="text-[8px] text-slate-400">DNI: 74829104</p>
                        </div>
                        <div className="p-1.5 bg-white rounded-lg border shadow-xs shrink-0">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=EST-2026-0042`} alt="QR" className="w-13 h-13" />
                        </div>
                      </div>

                      <div className="px-3.5 py-1 bg-slate-50 border-t flex items-center justify-between text-[8px]">
                        <span className="font-mono text-slate-400">||||| ||| ||||||| ||||</span>
                        {formData.carnetSelloHolografico !== false && (
                          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-500 text-white font-black text-[7px] shadow-xs">
                            ✨ MATRICULADO 2026
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-[360px] h-[210px] rounded-2xl overflow-hidden bg-white shadow-xl border border-slate-200 text-slate-900 p-3.5 flex flex-col justify-between font-sans animate-in zoom-in-95 duration-200">
                      <div className="border-b pb-1.5 flex items-center justify-between">
                        <h5 className="font-extrabold text-[10px] text-slate-800">REGLAMENTO Y CONDICIONES</h5>
                        <span className="text-[8px] font-bold text-slate-400">USO OBLIGATORIO</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 text-[8px] py-1">
                        <div className="text-slate-600 whitespace-pre-line leading-relaxed">
                          {formData.carnetReversoNormas || '1. Portar el carnet obligatoriamente.\n2. Personal e intransferible.\n3. Presentar en el Kiosco QR.'}
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg border space-y-1">
                          <p><strong>🚨 Emergencia:</strong> {formData.carnetReversoEmergencia || 'Tópico General'}</p>
                          <p><strong>📞 Teléfono:</strong> {formData.carnetReversoTelefono || '+51 987 654 321'}</p>
                          <p><strong>🩸 Grupo:</strong> O+ (Positivo)</p>
                        </div>
                      </div>
                      <div className="pt-1.5 border-t text-center text-[7px] text-slate-400">
                        En caso de extravío comunicar inmediatamente a la Dirección del Colegio.
                      </div>
                    </div>
                  )
                ) : (
                  /* Formato Vertical (Credencial) */
                  carnetViewSide === 'front' ? (
                    <div className="w-64 rounded-2xl overflow-hidden bg-white shadow-xl border border-slate-200 text-slate-900 text-center font-sans animate-in zoom-in-95 duration-200">
                      <div 
                        className="p-3 text-white text-center shadow-sm"
                        style={{ backgroundColor: formData.carnetFranjaNivelColor || formData.primaryColor }}
                      >
                        <h5 className="font-extrabold text-xs leading-tight">{formData.nombreInstitucion || 'COLEGIO'}</h5>
                        <span className="text-[9px] opacity-90">CARNET ESTUDIANTIL 2026</span>
                      </div>

                      <div className="p-4 space-y-2 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-xl bg-slate-200 border-2 border-indigo-500 overflow-hidden shadow-sm">
                          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" alt="Alumno" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs">MATEO ALEJANDRO TORRES</h4>
                          <p className="text-[10px] text-slate-500 font-bold">5TO SECUNDARIA - "A"</p>
                          <p className="text-[9px] text-indigo-600 font-mono font-bold">CÓD: EST-2026-0042</p>
                        </div>

                        <div className="p-2 bg-white rounded-lg border shadow-xs">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=EST-2026-0042`} alt="QR" className="w-16 h-16" />
                        </div>

                        {formData.carnetSelloHolografico !== false && (
                          <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-500 text-white text-[8px] font-black shadow-xs">
                            ✨ MATRICULADO OFICIAL 2026
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-64 rounded-2xl overflow-hidden bg-white shadow-xl border border-slate-200 text-slate-900 p-4 text-xs font-sans space-y-3 animate-in zoom-in-95 duration-200">
                      <div className="border-b pb-2 text-center">
                        <h5 className="font-extrabold text-[11px]">REGLAMENTO DEL CARNET</h5>
                      </div>
                      <div className="text-[9px] text-slate-600 whitespace-pre-line leading-relaxed">
                        {formData.carnetReversoNormas || '1. Portar el carnet obligatoriamente.\n2. Personal e intransferible.'}
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border text-[9px] space-y-1">
                        <p><strong>🚨 Emergencia:</strong> {formData.carnetReversoEmergencia || 'Tópico General'}</p>
                        <p><strong>📞 Teléfono:</strong> {formData.carnetReversoTelefono || '+51 987 654 321'}</p>
                        <p><strong>🩸 Grupo Sanguíneo:</strong> O+ (Positivo)</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: DIPLOMAS DE HONOR ── */}
      {activeTab === 'diplomas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Generador y Diseñador de Diplomas de Honor
              </h2>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Estilo del Marco Ornamental</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'oro_clasico', label: 'Oro Clásico', desc: 'Dorado tradicional' },
                    { id: 'azul_imperial', label: 'Azul Imperial', desc: 'Elegante y solemne' },
                    { id: 'moderno_geometrico', label: 'Moderno Geométrico', desc: 'Líneas limpias' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      id={`btn-diploma-${d.id.replace(/_/g, '-')}`}
                      type="button"
                      onClick={() => handleSelectDiplomaFrameStyle(d.id as any)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        (formData.diplomaBordeEstilo || 'oro_clasico') === d.id
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 ring-2 ring-amber-500/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{d.label}</span>
                        {(formData.diplomaBordeEstilo || 'oro_clasico') === d.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                      </div>
                      <span className="text-[10px] text-slate-400">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Texto Predeterminado de Mérito</label>
                <textarea
                  rows={3}
                  value={formData.diplomaTextoPredeterminado || ''}
                  onChange={(e) => handleChange('diplomaTextoPredeterminado', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 dark:bg-slate-800">
                  <span className="text-xs font-semibold">Firma del Director(a)</span>
                  <input
                    type="checkbox"
                    checked={formData.diplomaFirmaDirector !== false}
                    onChange={(e) => handleChange('diplomaFirmaDirector', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 dark:bg-slate-800">
                  <span className="text-xs font-semibold">Firma del Tutor(a)</span>
                  <input
                    type="checkbox"
                    checked={formData.diplomaFirmaTutor !== false}
                    onChange={(e) => handleChange('diplomaFirmaTutor', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-20">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Vista Previa de Diploma de Excelencia
              </h3>

              {/* Marco Dinámico Ornamental */}
              {formData.diplomaBordeEstilo === 'azul_imperial' ? (
                /* Azul Imperial */
                <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-50 via-indigo-50/30 to-blue-50/20 border-[6px] border-double border-indigo-900 text-slate-900 text-center font-serif shadow-2xl relative overflow-hidden text-xs ring-4 ring-indigo-400/30 animate-in zoom-in-95 duration-200">
                  <div className="absolute top-2 left-2 text-indigo-900 text-xs">👑</div>
                  <div className="absolute top-2 right-2 text-indigo-900 text-xs">👑</div>
                  <div className="absolute bottom-2 left-2 text-indigo-900 text-xs">👑</div>
                  <div className="absolute bottom-2 right-2 text-indigo-900 text-xs">👑</div>

                  <div className="w-10 h-10 mx-auto mb-2">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Award className="w-10 h-10 text-indigo-900 mx-auto" />
                    )}
                  </div>
                  <h4 className="font-bold uppercase tracking-widest text-[11px] text-indigo-900">{formData.nombreInstitucion || 'COLEGIO'}</h4>
                  <h3 className="text-base font-black text-indigo-950 my-2 tracking-wide">DIPLOMA DE EXCELENCIA</h3>
                  <p className="text-[10px] text-slate-600 italic">Otorgado con honor y mérito a:</p>
                  <p className="text-sm font-black text-indigo-950 font-sans my-1.5 underline decoration-indigo-500">MATEO ALEJANDRO TORRES</p>
                  <p className="text-[9px] text-slate-600 px-2 leading-relaxed">
                    {formData.diplomaTextoPredeterminado || 'Por su destacado rendimiento académico durante el Año 2026.'}
                  </p>

                  <div className="pt-6 flex justify-around items-end text-[9px] font-sans">
                    {formData.diplomaFirmaDirector !== false && (
                      <div className="text-center w-28 border-t border-indigo-300 pt-1 font-bold text-indigo-950">
                        {formData.directorNombre || 'Director(a) General'}
                      </div>
                    )}
                    {formData.diplomaFirmaTutor !== false && (
                      <div className="text-center w-28 border-t border-indigo-300 pt-1 font-bold text-indigo-950">
                        Docente Tutor(a)
                      </div>
                    )}
                  </div>
                </div>
              ) : formData.diplomaBordeEstilo === 'moderno_geometrico' ? (
                /* Moderno Geométrico */
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border-2 border-slate-900 dark:border-slate-300 text-slate-900 dark:text-white text-center font-sans shadow-2xl relative overflow-hidden text-xs ring-2 ring-slate-900/10 animate-in zoom-in-95 duration-200">
                  <div className="absolute top-2 left-2 text-slate-700 dark:text-slate-300 text-[10px]">💠</div>
                  <div className="absolute top-2 right-2 text-slate-700 dark:text-slate-300 text-[10px]">💠</div>
                  <div className="absolute bottom-2 left-2 text-slate-700 dark:text-slate-300 text-[10px]">💠</div>
                  <div className="absolute bottom-2 right-2 text-slate-700 dark:text-slate-300 text-[10px]">💠</div>

                  <div className="w-10 h-10 mx-auto mb-2">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Award className="w-10 h-10 text-slate-900 dark:text-slate-200 mx-auto" />
                    )}
                  </div>
                  <h4 className="font-extrabold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-400">{formData.nombreInstitucion || 'COLEGIO'}</h4>
                  <h3 className="text-base font-black text-slate-900 dark:text-white my-2 tracking-wide uppercase">CERTIFICADO DE MÉRITO ACADÉMICO</h3>
                  <p className="text-[10px] text-slate-500 italic">Reconocimiento oficial concedido a:</p>
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 my-1.5 underline decoration-indigo-500">MATEO ALEJANDRO TORRES</p>
                  <p className="text-[9px] text-slate-600 dark:text-slate-300 px-2 leading-relaxed">
                    {formData.diplomaTextoPredeterminado || 'Por su destacado rendimiento académico durante el Año 2026.'}
                  </p>

                  <div className="pt-6 flex justify-around items-end text-[9px]">
                    {formData.diplomaFirmaDirector !== false && (
                      <div className="text-center w-28 border-t border-slate-400 pt-1 font-bold">
                        {formData.directorNombre || 'Director(a) General'}
                      </div>
                    )}
                    {formData.diplomaFirmaTutor !== false && (
                      <div className="text-center w-28 border-t border-slate-400 pt-1 font-bold">
                        Docente Tutor(a)
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Oro Clásico (Default) */
                <div className="p-6 rounded-2xl bg-gradient-to-b from-[#fdfbf7] via-amber-50/20 to-[#fdfbf7] border-[6px] border-double border-amber-600 text-slate-900 text-center font-serif shadow-2xl relative overflow-hidden text-xs ring-4 ring-amber-400/30 animate-in zoom-in-95 duration-200">
                  <div className="absolute top-2 left-2 text-amber-600 text-xs">⚜️</div>
                  <div className="absolute top-2 right-2 text-amber-600 text-xs">⚜️</div>
                  <div className="absolute bottom-2 left-2 text-amber-600 text-xs">⚜️</div>
                  <div className="absolute bottom-2 right-2 text-amber-600 text-xs">⚜️</div>

                  <div className="w-10 h-10 mx-auto mb-2">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Award className="w-10 h-10 text-amber-600 mx-auto" />
                    )}
                  </div>
                  <h4 className="font-bold uppercase tracking-widest text-[11px] text-amber-800">{formData.nombreInstitucion || 'COLEGIO'}</h4>
                  <h3 className="text-base font-black text-slate-900 my-2 tracking-wide">DIPLOMA DE EXCELENCIA</h3>
                  <p className="text-[10px] text-slate-600 italic">Otorgado con honor y mérito a:</p>
                  <p className="text-sm font-black text-amber-950 font-sans my-1.5 underline decoration-amber-500">MATEO ALEJANDRO TORRES</p>
                  <p className="text-[9px] text-slate-600 px-2 leading-relaxed">
                    {formData.diplomaTextoPredeterminado || 'Por su destacado rendimiento académico durante el Año 2026.'}
                  </p>

                  <div className="pt-6 flex justify-around items-end text-[9px] font-sans">
                    {formData.diplomaFirmaDirector !== false && (
                      <div className="text-center w-28 border-t border-slate-400 pt-1 font-bold">
                        {formData.directorNombre || 'Director(a) General'}
                      </div>
                    )}
                    {formData.diplomaFirmaTutor !== false && (
                      <div className="text-center w-28 border-t border-slate-400 pt-1 font-bold">
                        Docente Tutor(a)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: SONIDOS INSTITUCIONALES DEL KIOSCO QR ── */}
      {activeTab === 'sonidos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-indigo-600" />
                Selector de Sonido Institucional para Marcación QR
              </h2>
              <p className="text-xs text-slate-500">
                Selecciona el tono acústico que se reproducirá en el Kiosco de asistencia cuando un alumno escanea su carnet escolar con éxito.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { id: 'chime', label: 'Chime Digital ✨', desc: 'Arpegio brillante de 3 notas con feedback nítido y moderno.' },
                  { id: 'bell', label: 'Campana Escolar Clásica 🔔', desc: 'Timbre escolar tradicional bitonal (523Hz / 659Hz).' },
                  { id: 'arpeggio', label: 'Arpegio Armónico Suave 🎶', desc: 'Escala pentatónica melódica y relajante.' },
                  { id: 'voice', label: 'Voz Sintetizada Institucional 🗣️', desc: 'Saludo hablado personalizado: "Bienvenido al [Colegio]".' },
                ].map((s) => {
                  const isSelected = (formData.kioskSoundPreset || 'chime') === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{s.label}</span>
                          {isSelected && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Activo</span>}
                        </div>
                        <p className="text-[11px] text-slate-500">{s.desc}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePlaySoundTest(s.id as any)}
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Escuchar audio"
                        >
                          <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                          <span>Probar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleChange('kioskSoundPreset', s.id as any)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? 'Seleccionado' : 'Elegir'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-20">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Control de Feedback Kiosco
              </h3>
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configuración en Tiempo Real</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Cualquier ajuste de tono seleccionado se aplicará de inmediato al terminal de lectura de carnet QR en portería.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: CORREOS TRANSACCIONALES (BREVO + RESEND) ── */}
      {activeTab === 'correos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            
            {/* SECCIÓN 1: BREVO PARA ASISTENCIAS DIARIAS */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-emerald-500/40 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-black">
                    B
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-tight">
                      Brevo (Sendinblue API v3)
                    </h2>
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                      Exclusivo: Asistencias Diarias QR en Tiempo Real
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                  Alta Frecuencia
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-emerald-950">Despacho Automático al Escanear QR</p>
                  <p className="text-[11px] text-emerald-800">Envía correo instantáneo al padre con hora exacta y estado.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.brevoActivarEnvioAsistencia !== false}
                  onChange={(e) => handleChange('brevoActivarEnvioAsistencia', e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600"
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Brevo API Key (v3)</label>
                    <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                      Obtener Key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showBrevoApiKey ? 'text' : 'password'}
                      value={formData.brevoApiKey || ''}
                      onChange={(e) => handleChange('brevoApiKey', e.target.value)}
                      placeholder="xkeysib-..."
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-50 border text-xs font-mono"
                    />
                    <button type="button" onClick={() => setShowBrevoApiKey(!showBrevoApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showBrevoApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Email Remitente Brevo</label>
                    <input type="email" value={formData.brevoSenderEmail || ''} onChange={(e) => handleChange('brevoSenderEmail', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Nombre Visible Remitente</label>
                    <input type="text" value={formData.brevoSenderName || ''} onChange={(e) => handleChange('brevoSenderName', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs" />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSendTestBrevoEmail}
                    disabled={isSendingBrevoTest}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSendingBrevoTest ? 'Enviando...' : 'Probar Envío con Brevo'}
                  </button>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: RESEND PARA LIBRETAS, MATRÍCULAS & TESORERÍA */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-indigo-500/40 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">
                    R
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-tight">
                      Resend (Mailer API v1)
                    </h2>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      Exclusivo: Libretas Bimestrales, Matrícula & Tesorería
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-700 border border-indigo-500/30">
                  Institucional
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Resend API Key</label>
                    <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                      Obtener Key en Resend <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showResendApiKey ? 'text' : 'password'}
                      value={formData.resendApiKey || ''}
                      onChange={(e) => handleChange('resendApiKey', e.target.value)}
                      placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-50 border text-xs font-mono"
                    />
                    <button type="button" onClick={() => setShowResendApiKey(!showResendApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showResendApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Email Remitente Resend</label>
                    <input type="email" value={formData.resendSenderEmail || ''} onChange={(e) => handleChange('resendSenderEmail', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Nombre Visible Remitente</label>
                    <input type="text" value={formData.resendSenderName || ''} onChange={(e) => handleChange('resendSenderName', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs" />
                  </div>
                </div>

                {/* Selector de Plantillas de Resend */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-700">Seleccionar Plantilla Resend a Probar</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'libreta_notas', label: '📊 Libreta Oficial' },
                      { id: 'bienvenida_matricula', label: '🎉 Bienvenida Matrícula' },
                      { id: 'recordatorio_pension', label: '💳 Pensión / Tesorería' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedResendTemplate(t.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                          selectedResendTemplate === t.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSendTestResendEmail}
                    disabled={isSendingResendTest}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSendingResendTest ? 'Enviando...' : `Probar Envío con Resend (${selectedResendTemplate})`}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Vista Previa de Correos */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-20">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  Vista Previa de Correo Resend
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                  {selectedResendTemplate}
                </span>
              </div>

              {/* Render simulado de la plantilla seleccionada */}
              <div className="rounded-2xl border bg-slate-50 p-4 text-xs font-sans space-y-3">
                <div 
                  className="p-4 rounded-xl text-white text-center"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  <h4 className="font-bold text-sm">{formData.nombreInstitucion || 'COLEGIO'}</h4>
                  <p className="text-[10px] opacity-90">
                    {selectedResendTemplate === 'libreta_notas' && 'Informe Oficial de Progreso de Competencias'}
                    {selectedResendTemplate === 'bienvenida_matricula' && 'Apertura de Matrícula – Año Académico 2026'}
                    {selectedResendTemplate === 'recordatorio_pension' && 'Departamento de Administración y Tesorería'}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border space-y-2">
                  <p className="font-bold text-slate-800">Estimado(a) Padre de Familia,</p>
                  
                  {selectedResendTemplate === 'libreta_notas' && (
                    <div className="space-y-2">
                      <p className="text-slate-600">Compartimos el informe de calificaciones de <strong>Mateo Alejandro Torres</strong>:</p>
                      <div className="p-2 bg-emerald-50 text-emerald-800 rounded font-bold text-center">
                        🏆 Logro Alcanzado: AD - Destacado
                      </div>
                      <div className="p-2.5 bg-indigo-600 text-white rounded-xl text-center font-bold">
                        📄 Descargar Libreta en PDF
                      </div>
                    </div>
                  )}

                  {selectedResendTemplate === 'bienvenida_matricula' && (
                    <div className="space-y-2">
                      <p className="text-slate-600">Matrícula confirmada para <strong>Mateo Alejandro Torres</strong> en 5to Sec "A".</p>
                      <div className="p-2 bg-slate-50 border rounded text-[11px] font-mono">
                        👤 Usuario: 74829104<br />
                        🏷️ Código: EST-2026-0042
                      </div>
                    </div>
                  )}

                  {selectedResendTemplate === 'recordatorio_pension' && (
                    <div className="space-y-2">
                      <p className="text-slate-600">Pensión escolar del mes de Septiembre 2026:</p>
                      <div className="p-2.5 bg-emerald-50 text-emerald-800 text-center font-black text-base rounded-xl">
                        S/ 450.00
                      </div>
                      <div className="p-2.5 bg-emerald-600 text-white rounded-xl text-center font-bold">
                        💳 Realizar Pago Online
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: LOGIN & WHITE-LABEL ── */}
      {activeTab === 'login' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                Personalización de la Pantalla de Login
              </h2>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Título de Bienvenida</label>
                  <input type="text" value={formData.loginBienvenidaTitulo} onChange={(e) => handleChange('loginBienvenidaTitulo', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mensaje Motivacional</label>
                  <textarea rows={2} value={formData.loginBienvenidaMensaje} onChange={(e) => handleChange('loginBienvenidaMensaje', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs" />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-xs font-bold text-purple-900">Mostrar "Powered by ColeSistema"</span>
                  <input type="checkbox" checked={formData.mostrarPoweredBy} onChange={(e) => handleChange('mostrarPoweredBy', e.target.checked)} className="w-4 h-4 rounded text-purple-600" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Copyright Personalizado</label>
                  <input type="text" value={formData.whiteLabelFooterTexto} onChange={(e) => handleChange('whiteLabelFooterTexto', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-20">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                Vista Previa del Login
              </h3>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-800 to-indigo-950 text-white space-y-3 text-xs">
                <h4 className="font-bold text-emerald-300">{formData.loginBienvenidaTitulo}</h4>
                <p className="text-violet-200 text-[11px]">{formData.loginBienvenidaMensaje}</p>
                <p className="text-[10px] text-violet-300 border-t border-white/20 pt-2">{formData.whiteLabelFooterTexto}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 9: SEO & ROBOTS ── */}
      {activeTab === 'seo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                Meta Tags & Optimización SEO
              </h2>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Título SEO (&lt;title&gt;)</label>
                  <input type="text" value={formData.metaTitle} onChange={(e) => handleChange('metaTitle', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Meta Descripción</label>
                  <textarea rows={2} value={formData.metaDescription} onChange={(e) => handleChange('metaDescription', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-20">
              <h3 className="text-xs font-bold text-slate-500 uppercase">Google SERP Preview</h3>
              <div className="p-4 rounded-xl bg-slate-50 border text-xs space-y-1">
                <h4 className="text-blue-700 font-medium line-clamp-1">{formData.metaTitle}</h4>
                <p className="text-slate-500 text-[11px] line-clamp-2">{formData.metaDescription}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 10: WHATSAPP & PWA ── */}
      {activeTab === 'canales' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                Botón Flotante de Atención por WhatsApp
              </h2>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-950">Habilitar Botón de WhatsApp</span>
                <input type="checkbox" checked={formData.mostrarWhatsappFlotante} onChange={(e) => handleChange('mostrarWhatsappFlotante', e.target.checked)} className="w-4 h-4 rounded text-emerald-600" />
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Número de WhatsApp (ej: 51987654321)</label>
                  <input type="text" value={formData.whatsappSoporteNumero} onChange={(e) => handleChange('whatsappSoporteNumero', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mensaje Predeterminado</label>
                  <textarea rows={2} value={formData.whatsappSoporteMensaje} onChange={(e) => handleChange('whatsappSoporteMensaje', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-20">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" />
                Vista Previa del Botón de WhatsApp
              </h3>
              <div className="p-4 bg-slate-100 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Chat con Secretaría</span>
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN PARA RESTABLECER ── */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="¿Restablecer Configuración de Fábrica?"
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <p>Esta acción revertirá los colores, logo, fuentes, carnets, diplomas, marca de agua y configuraciones a los valores iniciales.</p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3">
            <button type="button" onClick={() => setIsResetConfirmOpen(false)} className="px-4 py-2 rounded-xl border text-xs font-bold">Cancelar</button>
            <button type="button" onClick={handleResetToDefaults} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md">Restablecer Todo</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
