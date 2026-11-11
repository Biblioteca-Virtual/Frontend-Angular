/** Tests de la construcción de URLs de portadas. */
import { describe, expect, it } from 'vitest';
import { API_URL } from '@core/api/api.config';
import { resolveCoverUrl } from './cover-url';

describe('resolveCoverUrl', () => {
  it('sin portada devuelve null', () => {
    expect(resolveCoverUrl(null)).toBeNull();
    expect(resolveCoverUrl('')).toBeNull();
  });

  it('respeta las URL absolutas y los assets', () => {
    expect(resolveCoverUrl('https://x.com/a.png')).toBe('https://x.com/a.png');
    expect(resolveCoverUrl('/assets/a.png')).toBe('/assets/a.png');
  });

  it('las rutas del storage cuelgan del backend, con o sin barra', () => {
    expect(resolveCoverUrl('/api/storage/covers/a.png')).toBe(
      `${API_URL}/api/storage/covers/a.png`,
    );
    expect(resolveCoverUrl('api/storage/covers/a.png')).toBe(`${API_URL}/api/storage/covers/a.png`);
  });
});
