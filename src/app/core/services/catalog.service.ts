import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest } from '@core/api/api-operators';
import { ApiAuthor, ApiCategory, ApiEnvelope } from '@core/models';

/**
 * Categorías y autores, compartidos entre todos los usuarios.
 *
 * Al crear uno que ya existe (sin importar mayúsculas), el backend devuelve el
 * existente en lugar de fallar.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  getCategories(): Observable<ApiCategory[]> {
    return dataRequest(this.http.get<ApiEnvelope<ApiCategory[]>>(API_ENDPOINTS.categories));
  }

  createCategory(nombre: string): Observable<ApiCategory> {
    return dataRequest(
      this.http.post<ApiEnvelope<ApiCategory>>(API_ENDPOINTS.categories, { nombre }),
    );
  }

  getAuthors(): Observable<ApiAuthor[]> {
    return dataRequest(this.http.get<ApiEnvelope<ApiAuthor[]>>(API_ENDPOINTS.authors));
  }

  createAuthor(nombreCompleto: string): Observable<ApiAuthor> {
    return dataRequest(
      this.http.post<ApiEnvelope<ApiAuthor>>(API_ENDPOINTS.authors, {
        nombre_completo: nombreCompleto,
      }),
    );
  }
}
