import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest, messageRequest } from '@core/api/api-operators';
import {
  ApiEnvelope,
  ApiMessage,
  ApiReading,
  CreateReadingRequest,
  ReadingFilters,
  UpdateReadingRequest,
} from '@core/models';

@Injectable({ providedIn: 'root' })
export class ReadingService {
  private readonly http = inject(HttpClient);

  /**
   * Lista los prestamos del usuario autenticado.
   *
   * El backend filtra por `usuario_id` en el SQL, asi que el resultado nunca
   * incluye prestamos de otros usuarios. Ordena por
   * `fecha_actualizacion DESC, id DESC`, y no admite paginacion.
   *
   * Un `estado` o `libro_id` invalido produce 400 con el detalle
   * "estado debe ser uno de los siguientes valores: activo, devuelto".
   */
  list(filters: ReadingFilters = {}): Observable<ApiReading[]> {
    let params = new HttpParams();

    if (filters.estado !== undefined) {
      params = params.set('estado', filters.estado);
    }
    if (filters.libro_id !== undefined) {
      params = params.set('libro_id', filters.libro_id);
    }

    return dataRequest(
      this.http.get<ApiEnvelope<ApiReading[]>>(API_ENDPOINTS.readings, { params }),
    );
  }

  /**
   * Detalle de un prestamo.
   *
   * OJO: si el prestamo es de otro usuario responde 404, no 403. El backend no
   * distingue "no existe" de "no es tuyo".
   */
  getById(id: number): Observable<ApiReading> {
    return dataRequest(this.http.get<ApiEnvelope<ApiReading>>(API_ENDPOINTS.reading(id)));
  }

  /**
   * Pide un prestamo. Devuelve 409 "No hay copias disponibles de este libro" si
   * los prestamos activos igualan `libros.cantidad`.
   */
  create(payload: CreateReadingRequest): Observable<ApiReading> {
    return dataRequest(this.http.post<ApiEnvelope<ApiReading>>(API_ENDPOINTS.readings, payload));
  }

  /**
   * Actualiza progreso o estado.
   *
   * Reglas de negocio que conviene conocer antes de usar esta pantalla:
   *  - `progreso: 100` NO devuelve el libro. Hay que mandar `estado: "devuelto"`.
   *  - Reactivar un prestamo devuelto vuelve a comprobar la disponibilidad y
   *    puede devolver 409.
   *  - Nunca enviar `usuario_id`: el backend lo rechaza con 400.
   */
  update(id: number, payload: UpdateReadingRequest): Observable<ApiReading> {
    return dataRequest(this.http.put<ApiEnvelope<ApiReading>>(API_ENDPOINTS.reading(id), payload));
  }

  /** Marca el prestamo como devuelto (`estado: "devuelto"`). Atajo de `update`. */
  returnBook(id: number): Observable<ApiReading> {
    return this.update(id, { estado: 'devuelto' });
  }

  delete(id: number): Observable<string> {
    return messageRequest(this.http.delete<ApiMessage>(API_ENDPOINTS.reading(id)));
  }
}
