'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2, Sparkles, X, Zap } from 'lucide-react';
import { uploadImageToCloudinary, isCloudinaryConfigured } from '@/lib/services/cloudinaryService';
import { compressFile, formatBytes } from '@/lib/services/compressionService';

interface AvatarUploaderProps {
  currentAvatarUrl?: string;
  userName: string;
  onAvatarUpdated: (newUrl: string) => void;
  className?: string;
  compact?: boolean;
}

export function AvatarUploader({
  currentAvatarUrl,
  userName,
  onAvatarUpdated,
  className = '',
  compact = false,
}: AvatarUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<{
    original: string;
    compressed: string;
    savedPct: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCloudinaryActive = isCloudinaryConfigured();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Acepta múltiples formatos de imagen
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|heic|heif|bmp|gif|svg)$/i.test(file.name);
    if (!isImage) {
      setError('Por favor selecciona una imagen válida (JPG, PNG, WebP, AVIF, HEIC, etc.).');
      return;
    }

    // Límite de seguridad de 25MB (se comprimirá automáticamente en el cliente)
    if (file.size > 25 * 1024 * 1024) {
      setError('El archivo supera el límite de 25 MB.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // ⚡ APLICAR COMPRESIÓN INTELIGENTE EN EL NAVEGADOR
      const compressed = await compressFile(file, 'balanced');
      
      setCompressionInfo({
        original: compressed.originalFormatted,
        compressed: compressed.compressedFormatted,
        savedPct: compressed.savedPercentage,
      });

      const { url, error: uploadError } = await uploadImageToCloudinary(compressed.file, 'colegio_avatars');

      if (uploadError || !url) {
        setError(uploadError || 'Error al subir la imagen.');
        setIsUploading(false);
        return;
      }

      setPreview(url);
      onAvatarUpdated(url);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch {
      setError('Fallo de conexión al procesar y optimizar la fotografía.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTriggerSelect = () => {
    fileInputRef.current?.click();
  };

  if (compact) {
    return (
      <div className={`flex flex-col items-center gap-1.5 ${className}`}>
        <div className="relative group">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-2 ring-purple-200 dark:ring-purple-900/60 shadow-md bg-slate-100 dark:bg-slate-800">
            <img
              src={preview || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=160`}
              alt={userName}
              className={`w-full h-full object-cover transition-all duration-300 ${
                isUploading ? 'scale-105 blur-xs opacity-60' : 'group-hover:scale-105'
              }`}
            />
            
            {/* Overlay Button */}
            <button
              type="button"
              onClick={handleTriggerSelect}
              disabled={isUploading}
              className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              title="Cambiar foto de perfil"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              ) : (
                <>
                  <Camera className="w-5 h-5 mb-0.5 drop-shadow" />
                  <span className="text-[9px] font-bold tracking-tight">Cambiar</span>
                </>
              )}
            </button>
          </div>

          {/* Cloudinary Active Badge */}
          {isCloudinaryActive && (
            <span 
              className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[8px] font-extrabold shadow-md flex items-center gap-0.5 border border-white dark:border-slate-900"
              title="Optimización Cloudinary CDN Activa"
            >
              <Sparkles className="w-2 h-2" />
              CDN
            </span>
          )}
        </div>

        {/* Hidden File Input con multiformato */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/bmp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={handleTriggerSelect}
          disabled={isUploading}
          className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Zap className="w-3 h-3 text-indigo-500" />
          <span>{isUploading ? 'Comprimiendo...' : 'Cambiar foto'}</span>
        </button>

        {uploadSuccess && (
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex flex-col items-center gap-0.5 text-center animate-in fade-in">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Actualizada
            </span>
            {compressionInfo && compressionInfo.savedPct > 0 && (
              <span className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded-full">
                ⚡ -{compressionInfo.savedPct}% ({compressionInfo.compressed})
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 ${className}`}>
      
      {/* Avatar Display with Upload Overlay */}
      <div className="relative group">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-xl bg-slate-100 dark:bg-slate-800">
          <img
            src={preview || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=200`}
            alt={userName}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isUploading ? 'scale-105 blur-xs opacity-60' : 'group-hover:scale-105'
            }`}
          />
          
          {/* Overlay Button */}
          <button
            type="button"
            onClick={handleTriggerSelect}
            disabled={isUploading}
            className="absolute inset-0 bg-black/40 hover:bg-black/55 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
            title="Cambiar foto de perfil"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            ) : (
              <>
                <Camera className="w-6 h-6 mb-1 drop-shadow" />
                <span className="text-[10px] font-bold tracking-tight">Cambiar</span>
              </>
            )}
          </button>
        </div>

        {/* Cloudinary Active Badge */}
        {isCloudinaryActive && (
          <span 
            className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-extrabold shadow-md flex items-center gap-0.5 border border-white dark:border-slate-900"
            title="Optimización Cloudinary CDN Activa"
          >
            <Sparkles className="w-2.5 h-2.5" />
            CDN
          </span>
        )}
      </div>

      {/* Hidden File Input con multiformato */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/bmp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Action Button & Instructions */}
      <div className="text-center space-y-1.5">
        <button
          type="button"
          onClick={handleTriggerSelect}
          disabled={isUploading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>⚡ Comprimiendo foto...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Fotografía</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-400">
          Multiformato (JPG, PNG, WebP, AVIF, HEIC). Compresión automática sin pérdida.
        </p>
      </div>

      {/* Feedback Alerts */}
      {uploadSuccess && (
        <div className="flex flex-col items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-in fade-in text-center">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Fotografía actualizada y optimizada!</span>
          </div>
          {compressionInfo && compressionInfo.savedPct > 0 && (
            <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800">
              ⚡ Comprimido: {compressionInfo.original} ➔ {compressionInfo.compressed} (-{compressionInfo.savedPct}%)
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

    </div>
  );
}
