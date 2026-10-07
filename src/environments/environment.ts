/**
 * Entorno por defecto (desarrollo).
 *
 * En los builds de produccion este archivo se sustituye por
 * `environment.production.ts` mediante `fileReplacements` en angular.json,
 * por lo que el codigo de la aplicacion nunca debe importar nada distinto
 * de `@env/environment`.
 */
export const environment = {
  production: false,

  /** Origen del backend Flask. Sin barra final. */
  apiUrl: 'http://localhost:5000',

  /** Tiempo maximo de espera por respuesta del backend, en milisegundos. */
  apiTimeoutMs: 15000,
};
