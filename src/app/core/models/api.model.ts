/**
 * Formatos de fecha que devuelve el backend Flask.
 *
 * IMPORTANTE: Flask serializa los TIMESTAMP de Postgres con el proveedor JSON
 * por defecto, que usa `werkzeug.http.http_date`. Es decir, las fechas llegan en
 * RFC 1123 / HTTP-date y NO en ISO 8601:
 *
 *     "fecha_registro": "Fri, 25 Sep 2026 12:00:00 GMT"
 *
 * El `DatePipe` de Angular no puede parsear ese formato, por eso existe el pipe
 * `BvDatePipe`. Ademas las columnas son TIMESTAMP WITHOUT TIME ZONE, es decir
 * horas locales naive: no contienen informacion de zona horaria.
 */
export type ApiDate = string;

/** Sobre de exito devuelto por la mayoria de endpoints. */
export interface ApiEnvelope<T> {
  data: T;
}

/**
 * Sobre de exito de los endpoints DELETE, que no devuelven `data`:
 * `{ "message": "Libro eliminado" }`.
 */
export interface ApiMessage {
  message: string;
}

/**
 * Cuerpo de error del backend. OJO: existen DOS formas.
 *
 * Forma completa, emitida por las subclases de `ApiError` (400, 401, 404, 409):
 *   { "error": "Datos invalidos", "errors": ["nombre es requerido"] }
 *
 * Forma minima, emitida por los handlers de IntegrityError / HTTPException /
 * Exception (404 de ruta, 405, 500, 409 de FK):
 *   { "error": "Metodo no permitido" }
 *
 * Por eso `errors` es opcional: leerlo sin comprobar puede dar `undefined`.
 */
export interface ApiErrorBody {
  error: string;
  errors?: string[];
}
