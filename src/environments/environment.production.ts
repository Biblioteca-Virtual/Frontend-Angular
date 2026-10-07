/**
 * Entorno de produccion. Sustituye a `environment.ts` en los builds de
 * produccion (`ng build`) mediante `fileReplacements` en angular.json.
 *
 * `apiUrl` debe coincidir con uno de los origenes declarados en la variable
 * `CORS_ORIGINS` del backend Flask, o el navegador bloqueara las peticiones.
 */
export const environment = {
  production: true,

  /**
   * Origen real del backend. Ajustar al dominio de despliegue.
   * Si el frontend se sirve desde el mismo dominio que la API, usar ''.
   */
  apiUrl: 'http://localhost:5000',

  apiTimeoutMs: 20000,
};
