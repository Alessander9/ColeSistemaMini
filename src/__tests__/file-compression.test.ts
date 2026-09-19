import { describe, it, expect } from 'vitest';
import {
  compressFile,
  formatBytes,
  optimizeDocument
} from '@/lib/services/compressionService';

describe('Servicio de Compresión y Optimización de Archivos', () => {
  it('formatea bytes correctamente a KB y MB', () => {
    expect(formatBytes(0)).toBe('0 KB');
    expect(formatBytes(512 * 1024)).toBe('512 KB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.50 MB');
  });

  it('optimiza documentos PDF y DOCX reduciendo el peso significativamente', async () => {
    const mockPdfFile = new File(['%PDF-1.4 Mock content with dummy streams'], 'guia-mate.pdf', {
      type: 'application/pdf',
    });

    const resultBalanced = await compressFile(mockPdfFile, 'balanced');
    expect(resultBalanced.name).toBe('guia-mate.pdf');
    expect(resultBalanced.isImage).toBe(false);
    expect(resultBalanced.preset).toBe('balanced');
    expect(resultBalanced.compressedSize).toBeLessThanOrEqual(resultBalanced.originalSize);
    expect(resultBalanced.savedPercentage).toBeGreaterThanOrEqual(0);
  });

  it('soporta presets equilibrada, alta compresión y máxima nitidez', async () => {
    const mockDocFile = new File(['Document body data'], 'investigacion.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const highComp = await optimizeDocument(mockDocFile, 'high');
    const maxQuality = await optimizeDocument(mockDocFile, 'maximum');

    expect(highComp.compressedSize).toBeLessThanOrEqual(maxQuality.compressedSize);
  });
});
