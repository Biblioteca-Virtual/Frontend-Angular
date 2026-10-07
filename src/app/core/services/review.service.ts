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

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);

  /**
   * Lista TODAS las reseñas del catalogo, no solo las del usuario actual: el
   * backend no filtra las lecturas. Ordena por `resenas.id ASC` y no admite
   * filtros ni paginacion.
   */
  list(): Observable<ApiReview[]> {
    return dataRequest(this.http.get<ApiEnvelope<ApiReview[]>>(API_ENDPOINTS.reviews));
  }

  getById(id: number): Observable<ApiReview> {
    return dataRequest(this.http.get<ApiEnvelope<ApiReview>>(API_ENDPOINTS.review(id)));
  }

  /**
   * Crea una reseña.
   *
   * Solo puede haber una reseña por usuario y libro (indice UNIQUE en
   * `resenas`). Repetirla devuelve 409, y un `libro_id` inexistente, 404.
   */
  create(payload: CreateReviewRequest): Observable<ApiReview> {
    return dataRequest(this.http.post<ApiEnvelope<ApiReview>>(API_ENDPOINTS.reviews, payload));
  }

  /**
   * Actualiza una reseña propia. Otra reseña responde 404, no 403.
   * Enviar `comentario: null` de forma explicita BORRA el comentario.
   */
  update(id: number, payload: UpdateReviewRequest): Observable<ApiReview> {
    return dataRequest(this.http.put<ApiEnvelope<ApiReview>>(API_ENDPOINTS.review(id), payload));
  }

  delete(id: number): Observable<string> {
    return messageRequest(this.http.delete<ApiMessage>(API_ENDPOINTS.review(id)));
  }
}
