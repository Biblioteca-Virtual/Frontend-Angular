import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest, messageRequest } from '@core/api/api-operators';
import { ApiCollection, ApiEnvelope, ApiMessage, CollectionNameRequest } from '@core/models';

/**
 * Colecciones del usuario actual.
 *
 * - `list` trae `cantidad_libros` pero no `libros`; `getById` trae los libros.
 * - `create` y `rename` responden 409 si el nombre está repetido.
 * - `delete` borra la colección; los libros siguen en el catálogo.
 * - `addBook` sobre un libro que ya estaba no hace nada y devuelve 200.
 */
@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly http = inject(HttpClient);

  list(): Observable<ApiCollection[]> {
    return dataRequest(this.http.get<ApiEnvelope<ApiCollection[]>>(API_ENDPOINTS.collections));
  }

  getById(id: number): Observable<ApiCollection> {
    return dataRequest(this.http.get<ApiEnvelope<ApiCollection>>(API_ENDPOINTS.collection(id)));
  }

  create(nombre: string): Observable<ApiCollection> {
    const payload: CollectionNameRequest = { nombre };
    return dataRequest(
      this.http.post<ApiEnvelope<ApiCollection>>(API_ENDPOINTS.collections, payload),
    );
  }

  rename(id: number, nombre: string): Observable<ApiCollection> {
    const payload: CollectionNameRequest = { nombre };
    return dataRequest(
      this.http.put<ApiEnvelope<ApiCollection>>(API_ENDPOINTS.collection(id), payload),
    );
  }

  delete(id: number): Observable<string> {
    return messageRequest(this.http.delete<ApiMessage>(API_ENDPOINTS.collection(id)));
  }

  addBook(id: number, libroId: number): Observable<ApiCollection> {
    return dataRequest(
      this.http.post<ApiEnvelope<ApiCollection>>(API_ENDPOINTS.collectionBooks(id), {
        libro_id: libroId,
      }),
    );
  }

  removeBook(id: number, libroId: number): Observable<ApiCollection> {
    return dataRequest(
      this.http.delete<ApiEnvelope<ApiCollection>>(API_ENDPOINTS.collectionBook(id, libroId)),
    );
  }
}
