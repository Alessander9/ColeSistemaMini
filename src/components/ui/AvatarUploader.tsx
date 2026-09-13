'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2, Sparkles, X } from 'lucide-react';
import { uploadImageToCloudinary, isCloudinaryConfigured } from '@/lib/services/cloudinaryService';

interface AvatarUploaderProps {
  currentAvatarUrl?: string;
  userName: string;
  onAvatarUpdated: (newUrl: string) => void;
  className?: string;
}

export function AvatarUploader({
  currentAvatarUrl,
  userName,
  onAvatarUpdated,
  className = '',
}: AvatarUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCloudinaryActive = isCloudinaryConfigured();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    // Validación de tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es muy pesada. El tamaño máximo permitido es 5 MB.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const { url, error: uploadError } = await uploadImageToCloudinary(file, 'colegio_avatars');

      if (uploadError || !url) {
        setError(uploadError || 'Error al subir la imagen.');
        setIsUploading(false);
        return;
      }

      setPreview(url);
      onAvatarUpdated(url);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch {
      setError('Fallo de conexión al cargar la fotografía.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTriggerSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center gap-3 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 ${className}`}>
      
      {/* Avatar Display with Upload Overlay */}
      <div className="relative group">
        <div className="relative w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-xl bg-slate-100 dark:bg-slate-800">
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

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
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
              <span>Optimizando foto...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Fotografía</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-400">
          Formato JPG, PNG o WebP. Auto-recorte de rostro.
        </p>
      </div>

      {/* Feedback Alerts */}
      {uploadSuccess && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>¡Fotografía actualizada y optimizada!</span>
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
