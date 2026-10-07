import {
  MonoTypeOperatorFunction,
  Observable,
  OperatorFunction,
  catchError,
  map,
  throwError,
} from 'rxjs';
import { ApiError, toApiError } from '@core/api/api-error';
import { ApiEnvelope, ApiMessage } from '@core/models';

/**
 * Desenvuelve el sobre `{ data }` que usa la API.
 *
 * El backend responde `{ "data": ... }` en todos los endpoints de lectura y
 * escritura, salvo dos excepciones:
 *   - los DELETE, que responden `{ "message": "Libro eliminado" }`
 *   - `GET /health`, que responde el objeto plano
 *
 * Cambia el tipo de salida, asi que devuelve un `OperatorFunction` y no un
 * `MonoTypeOperatorFunction`.
 */
export function unwrap<T>(): OperatorFunction<ApiEnvelope<T>, T> {
  return map((envelope: ApiEnvelope<T>) => envelope.data);
}

/**
 * Normaliza cualquier fallo a `ApiError`.
 *
 * Sin esto, los componentes tendrian que manejar `HttpErrorResponse` y leer
 * `error.error.errors`, que el backend no siempre envia (ver `ApiErrorBody`).
 *
 * El tipo de retorno se anota a mano porque `throwError` no es generico en
 * RxJS 7 y, sin anotarlo, `catchError` lo inferiria como `Observable<unknown>`.
 */
export function catchApiError<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown): Observable<T> =>
    throwError(() => toApiError(error as never)),
  );
}

/**
 * Igual que `unwrap`, pero para los endpoints DELETE, que devuelven un mensaje
 * en lugar de la entidad.
 */
export function unwrapMessage(): OperatorFunction<ApiMessage, string> {
  return map((response: ApiMessage) => response.message);
}

/** Azucar para declarar un metodo de servicio que devuelve datos ya desenvueltos. */
export function dataRequest<T>(request: Observable<ApiEnvelope<T>>): Observable<T> {
  return request.pipe(unwrap<T>(), catchApiError<T>());
}

/** Azucar para declarar un metodo de servicio que devuelve un mensaje de borrado. */
export function messageRequest(request: Observable<ApiMessage>): Observable<string> {
  return request.pipe(unwrapMessage(), catchApiError<string>());
}

export { ApiError };
