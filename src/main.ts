/**
 * Punto de entrada: arranca la aplicación Angular con el componente raíz `App`
 * y la configuración global. Si el arranque falla, el error queda en la consola.
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
