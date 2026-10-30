import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest, messageRequest } from '@core/api/api-operators';
import { ApiCollection, ApiEnvelope, ApiMessage, CollectionNameRequest } from '@core/models';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly http = inject(HttpClient);

  /** Colecciones del usuario actual, con `cantidad_libros` pero sin `libros`. */
  list(): Observable<ApiCollection[]> {
    return dataRequest(this.http.get<ApiEnvelope<ApiCollection[]>>(API_ENDPOINTS.collections));
  }

  /** Una colección propia con sus libros completos. */
  getById(id: number): Observable<ApiCollection> {
    return dataRequest(this.http.get<ApiEnvelope<ApiCollection>>(API_ENDPOINTS.collection(id)));
  }

  /** Crea una colección vacía. Un nombre repetido responde 409. */
  create(nombre: string): Observable<ApiCollection> {
    const payload: CollectionNameRequest = { nombre };
    return dataRequest(
      this.http.post<ApiEnvelope<ApiCollection>>(API_ENDPOINTS.collections, payload),
    );
  }

  /** Cambia el nombre. Un nombre repetido responde 409. */
  rename(id: number, nombre: string): Observable<ApiCollection> {
    const payload: CollectionNameRequest = { nombre };
    return dataRequest(
      this.http.put<ApiEnvelope<ApiCollection>>(API_ENDPOINTS.collection(id), payload),
    );
  }

  /** Borra la colección; los libros siguen en el catálogo. */
  delete(id: number): Observable<string> {
    return messageRequest(this.http.delete<ApiMessage>(API_ENDPOINTS.collection(id)));
  }

  /** Agrega un libro. Si ya estaba, el backend no hace nada y devuelve 200. */
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
