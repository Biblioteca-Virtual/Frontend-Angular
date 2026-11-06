import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from '@core/models/api.model';

/**
 * Error normalizado de la API.
 *
 * El backend devuelve DOS formas distintas de error (ver `ApiErrorBody`), asi
 * que este error aplana ambas a un unico modelo con `message` y `details`.
 * Ademas cubre los fallos que nunca pasan por el backend: timeout, error de
 * red, o una respuesta HTML inesperada (por ejemplo el cuerpo del 308 de
 * `/api/books` sin barra final).
 *
 * - `status`: codigo HTTP, o 0 si la peticion nunca llego al servidor (DNS, CORS,
 *   backend caido, timeout).
 * - `details`: errores de validacion; vacia si el backend no los envio.
 * - `url`: lo que se estaba pidiendo, util para depurar.
 * - `isConflict` (409) cubre conflictos con datos existentes.
 * - `isNotFound` (404): ojo, tambien se usa para "no es tuyo".
 * - `isValidation` (400) exige que el backend haya enviado detalles.
 * - `displayMessage` es el mensaje listo para mostrar.
 *
 * `setPrototypeOf` hace falta para que `instanceof` funcione al compilar a ES2022
 * con cadenas de prototipos separadas.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly details: string[];
  readonly url: string | null;

  constructor(status: number, message: string, details: string[] = [], url: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.url = url;

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidation(): boolean {
    return this.status === 400 && this.details.length > 0;
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }

  get displayMessage(): string {
    if (this.isValidation && this.details.length > 1) {
      return this.details.join(' · ');
    }
    return this.message;
  }
}

/** Error de red / CORS genérico para usar cuando no hay respuesta del servidor. */
export const NETWORK_ERROR_MESSAGE =
  'No se pudo conectar con el servidor. Verifica que el backend Flask esté ' +
  'corriendo y que su CORS_ORIGINS incluya el origen de esta aplicación.';

/**
 * Traduce un `HttpErrorResponse` a `ApiError`.
 *
 * Hay que ser defensivo con el cuerpo de la respuesta: si arrives un HTML (por
 * ejemplo el cuerpo del 308 de `/api/books` sin barra final) o un JSON con otra
 * forma, `body` no sera un `ApiErrorBody` y no se debe propagar como tal.
 */
export function toApiError(response: HttpErrorResponse): ApiError {
  // El interceptor ya lo normalizo: volver a traducirlo perderia `details`.
  if (response instanceof ApiError) {
    return response;
  }

  const url = response.url || null;

  if (response.status === 0) {
    return new ApiError(0, NETWORK_ERROR_MESSAGE, [], url);
  }

  const body = response.error as Partial<ApiErrorBody> | string | null;

  if (typeof body === 'object' && body !== null && typeof body.error === 'string') {
    return new ApiError(response.status, body.error, body.errors ?? [], url);
  }

  // Respuesta con una forma inesperada: nos quedamos con el mensaje del status.
  return new ApiError(response.status, response.message || `Error ${response.status}`, [], url);
}
