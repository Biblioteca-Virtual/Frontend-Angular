import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { toApiError } from '@core/api/api-error';
import { AuthService } from '@core/services/auth.service';

/**
 * Normaliza los errores de la API a `ApiError` y gestiona la sesion caducada.
 *
 * Se registra DESPUES de `authInterceptor` para que este vea primero la peticon
 * ya autentificada.
 *
 * Sobre el 401: el backend responde 401 cuando falta el token, cuando es
 * invalido y cuando expiro (mensajes distintos, mismo status). Aqui se descarta
 * la sesion y se redirige a `/login`, salvo que ya estemos en una ruta publica,
 * para no provocar un bucle de navegacion al fallar el propio login.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      const apiError = toApiError(error as HttpErrorResponse);

      if (apiError.isUnauthorized && !isAuthEndpoint(req.url)) {
        auth.invalidate();
        void router.navigate(['/login'], {
          queryParams: { returnUrl: router.url },
        });
      }

      return throwError(() => apiError);
    }),
  );
};

function isAuthEndpoint(url: string): boolean {
  return url.endsWith('/api/auth/login') || url.endsWith('/api/auth/register');
}
