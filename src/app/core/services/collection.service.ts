/** Servicio HTTP de las colecciones del usuario. */
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

  /** colecciones del usuario, sin la lista de libros */
  list(): Observable<ApiCollection[]> {
    return dataRequest(this.http.get<ApiEnvelope<ApiCollection[]>>(API_ENDPOINTS.collections));
  }

  /** una colección con todos sus libros */
  getById(id: number): Observable<ApiCollection> {
    return dataRequest(this.http.get<ApiEnvelope<ApiCollection>>(API_ENDPOINTS.collection(id)));
  }

  /** crea una colección vacía con ese nombre */
  create(nombre: string): Observable<ApiCollection> {
    const payload: CollectionNameRequest = { nombre };
    return dataRequest(
      this.http.post<ApiEnvelope<ApiCollection>>(API_ENDPOINTS.collections, payload),
    );
  }

  /** cambia el nombre de una colección */
  rename(id: number, nombre: string): Observable<ApiCollection> {
    const payload: CollectionNameRequest = { nombre };
    return dataRequest(
      this.http.put<ApiEnvelope<ApiCollection>>(API_ENDPOINTS.collection(id), payload),
    );
  }

  /** borra la colección */
  delete(id: number): Observable<string> {
    return messageRequest(this.http.delete<ApiMessage>(API_ENDPOINTS.collection(id)));
  }

  /** agrega un libro a la colección y devuelve la colección actualizada */
  addBook(id: number, libroId: number): Observable<ApiCollection> {
    return dataRequest(
      this.http.post<ApiEnvelope<ApiCollection>>(API_ENDPOINTS.collectionBooks(id), {
        libro_id: libroId,
      }),
    );
  }

  /** saca un libro de la colección y devuelve la colección actualizada */
  removeBook(id: number, libroId: number): Observable<ApiCollection> {
    return dataRequest(
      this.http.delete<ApiEnvelope<ApiCollection>>(API_ENDPOINTS.collectionBook(id, libroId)),
    );
  }
}
