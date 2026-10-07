import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { catchApiError } from '@core/api/api-operators';
import { HealthStatus } from '@core/models';

/**
 * Sonda de salud del backend.
 *
 * Sirve para mostrar un aviso cuando la API o la base de datos estan caidas sin
 * tener que esperar a que falle una pantalla concreta. Por eso se expone en la
 * barra de navegacion.
 */
@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);

  /**
   * `GET /health` no requiere token, no usa el sobre `{ data }` y responde
   * SIEMPRE 200, incluso con la base de datos caida (en ese caso
   * `database: "indisponible"`). Hay que mirar el cuerpo, no el status.
   *
   * Tampoco lleva cabeceras CORS: el blueprint no esta bajo `/api`. Para leerlo
   * desde el navegador hay que declararlo en `CORS_ORIGINS` o proxyarlo.
   */
  check(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(API_ENDPOINTS.health).pipe(catchApiError<HealthStatus>());
  }
}
