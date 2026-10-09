import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest } from '@core/api/api-operators';
import { ApiEnvelope, ApiReading } from '@core/models';

/**
 * "Ruleta": pide un libro al azar y crea el prestamo correspondiente.
 */
@Injectable({ providedIn: 'root' })
export class RouletteService {
  private readonly http = inject(HttpClient);

  /**
   * Gira la ruleta.
   *
   * No admite cuerpo ni parametros. El backend elige un libro con copias
   * libres, le reintenta hasta 3 veces si la copia se acaba en el camino, y
   * devuelve 409 "No hay libros disponibles en este momento" si agota los
   * intentos.
   *
   * Dos detalles poco intuitivos:
   *  - Responde 201, no 200.
   *  - El sobre contiene un `Reading` completo ya creado con
   *    `progreso: 0` y `estado: "activo"`, no un libro suelto.
   */
  spin(): Observable<ApiReading> {
    return dataRequest(this.http.post<ApiEnvelope<ApiReading>>(API_ENDPOINTS.roulette, null));
  }
}
