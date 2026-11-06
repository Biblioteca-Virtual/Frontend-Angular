import { API_URL } from '@core/api/api.config';

const ABSOLUTE_COVER = /^(https?:\/\/|\/assets\/)/;

/** URL absoluta de una portada; las rutas del storage cuelgan del backend. */
export function resolveCoverUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  return ABSOLUTE_COVER.test(path) ? path : `${API_URL}/${path.replace(/^\//, '')}`;
}
