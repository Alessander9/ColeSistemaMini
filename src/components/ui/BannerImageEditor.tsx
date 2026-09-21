'use client';

import React, { useState, useRef } from 'react';
import {
  Link2,
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Image as ImageIcon,
  X,
  Zap,
} from 'lucide-react';
import { compressFile, formatBytes } from '@/lib/services/compressionService';
import { uploadImageToCloudinary } from '@/lib/services/cloudinaryService';

interface BannerImageEditorProps {
  label: string;
  description?: string;
  currentUrl: string;
  defaultUrl?: string;
  fallbackColor?: string;
  onChange: (url: string) => void;
}

/**
 * Editor de imagen de banner reutilizable:
 * - Modo URL: pega un enlace externo (https://...)
 * - Modo Archivo: sube una imagen local con compresión automática en el navegador
 *   y subida a Cloudinary si está configurado (fallback: data URL local).
 * - Incluye vista previa en vivo, medición de compresión y botón de restaurar.
 */
export function BannerImageEditor({
  label,
  description,
  currentUrl,
  defaultUrl = '',
  fallbackColor = '#4f46e5',
  onChange,
}: BannerImageEditorProps) {
  const [mode, setMode] = useState<'url' | 'archivo'>('url');
  const [urlInput, setUrlInput] = useState(currentUrl.startsWith('data:') ? '' : currentUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{ from: string; to: string; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const handleUrlApply = () => {
    const v = urlInput.trim();
    if (!v) {
      setError('Ingresa una URL válida (https://...)');
      return;
    }
    if (!/^https?:\/\//i.test(v)) {
      setError('La URL debe comenzar con http:// o https://');
      return;
    }
    setError(null);
    onChange(v);
    flashSuccess('Imagen por URL aplicada');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|heic|heif|bmp|gif)$/i.test(file.name);
    if (!isImage) {
      setError('Selecciona un archivo de imagen válido (JPG, PNG, WebP, AVIF, HEIC, etc.).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('El archivo supera el límite de 25 MB.');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      // ⚡ Compresión inteligente en el navegador antes de subir
      const compressed = await compressFile(file, 'high');
      setCompressionInfo({
        from: compressed.originalFormatted,
        to: compressed.compressedFormatted,
        pct: compressed.savedPercentage,
      });

      const { url, error: uploadError } = await uploadImageToCloudinary(compressed.file, 'colegio_banners');
      if (uploadError || !url) {
        setError(uploadError || 'Error al procesar la imagen.');
        setIsUploading(false);
        return;
      }

      onChange(url);
      flashSuccess(`Imagen optimizada aplicada (-${compressed.savedPercentage}%)`);
    } catch {
      setError('Fallo al comprimir/procesar la imagen.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setUrlInput(defaultUrl.startsWith('data:') ? '' : defaultUrl);
    setCompressionInfo(null);
    setError(null);
    onChange(defaultUrl);
  };

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: `${fallbackColor}1a`, color: fallbackColor }}
          >
            <ImageIcon className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">{label}</h4>
            {description && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          title="Restaurar imagen por defecto"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preview */}
      <div
        className="relative h-24 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80"
        style={{ backgroundColor: `${fallbackColor}0f` }}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400">
            <ImageIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold">Sin imagen personalizada</span>
          </div>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/60">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`py-1.5 rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5 transition-all ${
            mode === 'url'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode('archivo')}
          className={`py-1.5 rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5 transition-all ${
            mode === 'archivo'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          Archivo
        </button>
      </div>

      {/* URL Mode */}
      {mode === 'url' && (
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlApply())}
              placeholder="https://ejemplo.com/banner.jpg"
              className="w-full pl-9 pr-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleUrlApply}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-black shadow-sm transition-all"
          >
            Aplicar
          </button>
        </div>
      )}

      {/* File Mode */}
      {mode === 'archivo' && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/bmp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-black flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                ⚡ Comprimiendo y subiendo...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Subir imagen desde tu dispositivo
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-400 text-center">
            JPG, PNG, WebP, AVIF, HEIC hasta 25 MB · Se comprime automáticamente para ocupar el menor espacio posible
          </p>
        </div>
      )}

      {/* Compression badge */}
      {compressionInfo && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-900 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {compressionInfo.from} → {compressionInfo.to}
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-black">-{compressionInfo.pct}%</span>
        </div>
      )}

      {/* Success feedback */}
      {success && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {success}
        </div>
      )}

      {/* Error feedback */}
      {error && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {currentUrl.startsWith('data:') && (
        <p className="text-[9px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <X className="w-3 h-3" />
          Imagen guardada localmente (sin Cloudinary configurado). Configura NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME para CDN.
        </p>
      )}
    </div>
  );
}
