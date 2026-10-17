/**
 * Servicio de Optimización y Carga de Imágenes con Cloudinary
 * Proporciona compresión automática en WebP/AVIF, recorte facial inteligente y CDN global gratuito.
 */

import { initialsAvatarUrl } from '@/lib/avatar';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  error?: string;
}

export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return Boolean(cloudName && cloudName.trim() !== '' && cloudName !== 'your-cloud-name');
}

/**
 * Genera una URL de avatar con iniciales de alta definición como fallback
 */
export function getFallbackAvatar(nombres: string, apellidos: string = ''): string {
  return initialsAvatarUrl(`${nombres} ${apellidos}`.trim());
}

/**
 * Aplica transformaciones automáticas de Cloudinary:
 * - f_auto: Formato óptimo automático (AVIF o WebP según el navegador)
 * - q_auto: Compresión inteligente sin pérdida visual perceptible
 * - g_face, c_fill: Centrado automático en el rostro para carnets y fotos de perfil
 */
export function getOptimizedCloudinaryUrl(
  url?: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'thumb' | 'crop' | 'scale';
    gravity?: 'face' | 'center' | 'auto';
  } = {}
): string {
  if (!url) return '';

  // Si no es una URL de Cloudinary, retornar la original tal cual
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }

  const {
    width = 200,
    height = 200,
    crop = 'fill',
    gravity = 'face',
  } = options;

  const transformations = `f_auto,q_auto,w_${width},h_${height},c_${crop},g_${gravity}`;

  // Insertar las transformaciones en la URL de Cloudinary después de /upload/
  return url.replace('/upload/', `/upload/${transformations}/`);
}

/**
 * Sube una imagen directamente a Cloudinary usando Unsigned Preset (Client-Side)
 */
export async function uploadImageToCloudinary(
  file: File | Blob,
  folder: string = 'colegio_avatars'
): Promise<{ url: string | null; error: string | null }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'colegio_preset';

  if (!isCloudinaryConfigured()) {
    // Si no está configurado Cloudinary, usar FileReader para generar data URL local para pruebas instantáneas
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          url: reader.result as string,
          error: null,
        });
      };
      reader.onerror = () => {
        resolve({
          url: null,
          error: 'Fallo al leer la imagen seleccionada.',
        });
      };
      reader.readAsDataURL(file);
    });
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data: CloudinaryUploadResponse = await response.json();

    if (!response.ok || !data.secure_url) {
      return {
        url: null,
        error: data.error || 'Error al subir la imagen al servidor de Cloudinary.',
      };
    }

    const optimizedUrl = getOptimizedCloudinaryUrl(data.secure_url, {
      width: 250,
      height: 250,
      crop: 'fill',
      gravity: 'face',
    });

    return {
      url: optimizedUrl,
      error: null,
    };
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : 'Error de conexión con Cloudinary.',
    };
  }
}
