import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(
      routes,
      // Rellena los `input()` de los componentes con los parametros de ruta, los
      // query params y los datos estáticos de la ruta, y los convierte al tipo
      // declarado en el input.
      withComponentInputBinding(),
      // Al navegar, vuelve al inicio de la pagina en vez de dejar la posición
      // del scroll anterior.
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),

    /**
     * El orden de los interceptores importa: `authInterceptor` va primero para
     * que la peticon salga ya con `Authorization`, y `errorInterceptor` segundo
     * para que lo vea en su camino de vuelta y pueda normalizar los errores a
     * `ApiError`.
     */
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
