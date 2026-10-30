import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS, API_URL } from '@core/api/api.config';
import { dataRequest, messageRequest } from '@core/api/api-operators';
import {
  ApiAuthor,
  ApiBook,
  ApiCategory,
  ApiEnvelope,
  ApiMessage,
  ApiReview,
  CreateBookRequest,
  UpdateBookProgressRequest,
  UpdateBookRequest,
} from '@core/models';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly http = inject(HttpClient);

  /**
   * Lista la biblioteca del usuario actual.
   */
  list(q?: string): Observable<ApiBook[]> {
    let params = new HttpParams();

    const search = q?.trim();
    if (search) {
      params = params.set('q', search);
    }

    return dataRequest(this.http.get<ApiEnvelope<ApiBook[]>>(API_ENDPOINTS.books, { params }));
  }

  getById(id: number): Observable<ApiBook> {
    return dataRequest(this.http.get<ApiEnvelope<ApiBook>>(API_ENDPOINTS.book(id)));
  }

  /**
   * Obtiene la lista de categorías del catálogo.
   */
  getCategories(): Observable<ApiCategory[]> {
    return dataRequest(this.http.get<ApiEnvelope<ApiCategory[]>>(API_ENDPOINTS.categories));
  }

  /**
   * Agrega una categoría compartida. Si ya existe (sin importar mayúsculas),
   * el backend devuelve la existente.
   */
  createCategory(nombre: string): Observable<ApiCategory> {
    return dataRequest(
      this.http.post<ApiEnvelope<ApiCategory>>(API_ENDPOINTS.categories, { nombre }),
    );
  }

  /** Autores compartidos, para sugerirlos al cargar un libro. */
  getAuthors(): Observable<ApiAuthor[]> {
    return dataRequest(this.http.get<ApiEnvelope<ApiAuthor[]>>(API_ENDPOINTS.authors));
  }

  /**
   * Agrega un autor por su nombre completo. Si ya existe (sin importar
   * mayúsculas), el backend devuelve el existente.
   */
  createAuthor(nombreCompleto: string): Observable<ApiAuthor> {
    return dataRequest(
      this.http.post<ApiEnvelope<ApiAuthor>>(API_ENDPOINTS.authors, {
        nombre_completo: nombreCompleto,
      }),
    );
  }

  /**
   * Reseñas del libro y de los libros de otros usuarios con un título
   * equivalente (sin importar tildes, mayúsculas ni pequeños errores).
   */
  reviews(id: number): Observable<ApiReview[]> {
    return dataRequest(this.http.get<ApiEnvelope<ApiReview[]>>(API_ENDPOINTS.bookReviews(id)));
  }

  /** Crea un libro. El backend responde 201 con el libro ya guardado. */
  create(payload: CreateBookRequest): Observable<ApiBook> {
    return dataRequest(this.http.post<ApiEnvelope<ApiBook>>(API_ENDPOINTS.books, payload));
  }

  /**
   * Actualiza un libro de forma parcial.
   */
  update(id: number, payload: UpdateBookRequest): Observable<ApiBook> {
    return dataRequest(this.http.put<ApiEnvelope<ApiBook>>(API_ENDPOINTS.book(id), payload));
  }

  /**
   * Actualiza el progreso de lectura (páginas totales y/o leídas).
   */
  updateProgress(id: number, payload: UpdateBookProgressRequest): Observable<ApiBook> {
    return dataRequest(this.http.patch<ApiEnvelope<ApiBook>>(API_ENDPOINTS.bookProgress(id), payload));
  }

  /**
   * Sube una imagen de portada al almacenamiento del backend.
   */
  uploadCover(file: File): Observable<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return dataRequest(this.http.post<ApiEnvelope<{ url: string; filename: string }>>(
      API_ENDPOINTS.storage.upload,
      formData
    ));
  }

  /**
   * Resuelve la URL absoluta de una imagen de portada si proviene del storage local.
   */
  getCoverUrl(path: string | null | undefined): string | null {
    if (!path) {
      return null;
    }
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/assets/')) {
      return path;
    }
    if (path.startsWith('/')) {
      return `${API_URL}${path}`;
    }
    return `${API_URL}/${path}`;
  }

  /**
   * Elimina un libro.
   */
  delete(id: number): Observable<string> {
    return messageRequest(this.http.delete<ApiMessage>(API_ENDPOINTS.book(id)));
  }
}
