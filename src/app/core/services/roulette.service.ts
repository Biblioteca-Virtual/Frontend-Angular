import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest } from '@core/api/api-operators';
import { ApiBook, ApiEnvelope } from '@core/models';

/**
 * "Ruleta": sortea un libro al azar del catálogo de la biblioteca.
 */
@Injectable({ providedIn: 'root' })
export class RouletteService {
  private readonly http = inject(HttpClient);

  /**
   * Gira la ruleta y retorna un libro aleatorio.
   */
  spin(): Observable<ApiBook> {
    return dataRequest(this.http.post<ApiEnvelope<ApiBook>>(API_ENDPOINTS.roulette, null));
  }
}
