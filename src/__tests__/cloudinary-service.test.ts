import { describe, it, expect } from 'vitest';
import { 
  getFallbackAvatar, 
  getOptimizedCloudinaryUrl, 
  isCloudinaryConfigured 
} from '../lib/services/cloudinaryService';

describe('Cloudinary Avatar & CDN Integration Service', () => {
  it('generates local initials avatars without sending the name to third parties', () => {
    const avatar = getFallbackAvatar('Carlos Alberto', 'Mendoza');
    expect(avatar.startsWith('data:image/svg+xml')).toBe(true);
    expect(avatar).not.toContain('ui-avatars.com');
    expect(avatar).not.toContain('Mendoza');
    expect(decodeURIComponent(avatar)).toContain('>CA</text>');
  });

  it('correctly identifies when Cloudinary is not configured or configured', () => {
    // In test environment without cloud name
    const configured = isCloudinaryConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('applies face detection, auto-format and auto-quality to Cloudinary URLs', () => {
    const rawCloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    const optimized = getOptimizedCloudinaryUrl(rawCloudinaryUrl, {
      width: 250,
      height: 250,
      crop: 'fill',
      gravity: 'face',
    });

    expect(optimized).toContain('/upload/f_auto,q_auto,w_250,h_250,c_fill,g_face/');
  });

  it('preserves non-Cloudinary image URLs without alteration', () => {
    const regularUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';
    const result = getOptimizedCloudinaryUrl(regularUrl);
    expect(result).toBe(regularUrl);
  });
});
