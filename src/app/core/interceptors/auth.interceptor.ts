import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { PROTECTED_PATHS } from '@core/api/api.config';
import { TokenStorageService } from '@core/services/token-storage.service';

/**
 * Adjunta `Authorization: Bearer <token>` a las peticiones de la API.
 *
 * El backend exige el prefijo `Bearer ` con mayuscula y exactamente un espacio
 * (`security._extract_token` hace `auth.startswith("Bearer ")` y despues corta
 * 7 caracteres). Cualquier variante rompe el parseo.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // El propio backend devuelve 401 si se manda un Authorization invalido, asi
  // que comprobarlo aqui evita un 401 espurio en cada recarga de la pagina.
  if (!req.url.startsWith('/api/') || !isProtected(req.url)) {
    return next(req);
  }

  const storage = inject(TokenStorageService);
  const token = storage.token();

  if (token === null) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};

function isProtected(url: string): boolean {
  return PROTECTED_PATHS.some((path) => url.includes(path));
}
