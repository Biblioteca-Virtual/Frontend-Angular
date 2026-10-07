import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * Protege las rutas que exigen sesion.
 *
 * Todo el catalogo lo requiere: en el backend los blueprints `books`,
 * `readings`, `reviews` y `roulette` llevan `@login_required`. Devuelve un
 * `UrlTree` en vez de `false` para que el router no deje la URL en blanco.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  // `returnUrl` permite volver a la pagina pedida tras iniciar sesion.
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/**
 * Inverso de `authGuard`, para las pantallas publicas (login y registro), donde
 * un usuario ya autenticado no tiene nada que hacer.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn() ? router.createUrlTree(['/libros']) : true;
};
