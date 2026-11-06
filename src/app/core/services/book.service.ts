import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest, messageRequest } from '@core/api/api-operators';
import {
  ApiBook,
  ApiEnvelope,
  ApiMessage,
  CreateBookRequest,
  UpdateBookProgressRequest,
  UpdateBookRequest,
} from '@core/models';

/**
 * Biblioteca del usuario actual.
 *
 * - `create` responde 201 con el libro ya guardado.
 * - `update` modifica el libro de forma parcial.
 * - `updateProgress` cambia solo las páginas totales y/o leídas.
 */
@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly http = inject(HttpClient);

  list(q?: string): Observable<ApiBook[]> {
    const search = q?.trim();
    const params = search ? { q: search } : undefined;
    return dataRequest(this.http.get<ApiEnvelope<ApiBook[]>>(API_ENDPOINTS.books, { params }));
  }

  getById(id: number): Observable<ApiBook> {
    return dataRequest(this.http.get<ApiEnvelope<ApiBook>>(API_ENDPOINTS.book(id)));
  }

  create(payload: CreateBookRequest): Observable<ApiBook> {
    return dataRequest(this.http.post<ApiEnvelope<ApiBook>>(API_ENDPOINTS.books, payload));
  }

  update(id: number, payload: UpdateBookRequest): Observable<ApiBook> {
    return dataRequest(this.http.put<ApiEnvelope<ApiBook>>(API_ENDPOINTS.book(id), payload));
  }

  updateProgress(id: number, payload: UpdateBookProgressRequest): Observable<ApiBook> {
    return dataRequest(
      this.http.patch<ApiEnvelope<ApiBook>>(API_ENDPOINTS.bookProgress(id), payload),
    );
  }

  delete(id: number): Observable<string> {
    return messageRequest(this.http.delete<ApiMessage>(API_ENDPOINTS.book(id)));
  }
}
