/** Servicio HTTP de reseñas. */
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest, messageRequest } from '@core/api/api-operators';
import {
  ApiEnvelope,
  ApiMessage,
  ApiReview,
  CreateReviewRequest,
  UpdateReviewRequest,
} from '@core/models';

/**
 * Reseñas del catálogo.
 *
 * - `list` trae TODAS las reseñas, no solo las del usuario actual: el backend no
 *   filtra las lecturas. Ordena por `resenas.id ASC`, sin filtros ni paginación.
 * - `forBook` trae las reseñas del libro y de los libros de otros usuarios con un
 *   título equivalente (sin importar tildes, mayúsculas ni pequeños errores).
 * - `create`: solo puede haber una reseña por usuario y libro (índice UNIQUE en
 *   `resenas`). Repetirla devuelve 409, y un `libro_id` inexistente, 404.
 * - `update` sobre una reseña ajena responde 404, no 403. Enviar
 *   `comentario: null` de forma explícita BORRA el comentario.
 */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);

  /** todas las reseñas de todos los usuarios */
  list(): Observable<ApiReview[]> {
    return dataRequest(this.http.get<ApiEnvelope<ApiReview[]>>(API_ENDPOINTS.reviews));
  }

  /** reseñas de un libro, incluidas las de títulos equivalentes */
  forBook(bookId: number): Observable<ApiReview[]> {
    return dataRequest(this.http.get<ApiEnvelope<ApiReview[]>>(API_ENDPOINTS.bookReviews(bookId)));
  }

  /** una reseña por su id */
  getById(id: number): Observable<ApiReview> {
    return dataRequest(this.http.get<ApiEnvelope<ApiReview>>(API_ENDPOINTS.review(id)));
  }

  /** publica una reseña */
  create(payload: CreateReviewRequest): Observable<ApiReview> {
    return dataRequest(this.http.post<ApiEnvelope<ApiReview>>(API_ENDPOINTS.reviews, payload));
  }

  /** edita la calificación o el comentario de la reseña propia */
  update(id: number, payload: UpdateReviewRequest): Observable<ApiReview> {
    return dataRequest(this.http.put<ApiEnvelope<ApiReview>>(API_ENDPOINTS.review(id), payload));
  }

  /** borra la reseña propia */
  delete(id: number): Observable<string> {
    return messageRequest(this.http.delete<ApiMessage>(API_ENDPOINTS.review(id)));
  }
}
