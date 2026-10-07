import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest, messageRequest } from '@core/api/api-operators';
import {
  ApiBook,
  ApiEnvelope,
  ApiMessage,
  CreateBookRequest,
  UpdateBookRequest,
} from '@core/models';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly http = inject(HttpClient);

  /**
   * Lista el catalogo completo.
   *
   * OJO: el backend NO implementa paginacion. No hay `page`, `limit` ni `total`;
   * la respuesta es el array entero, asi que la paginacion (si se quiere) hay que
   * hacerla en el cliente. Tampoco hay ordenacion configurable: el SQL ordena
   * por `libros.id ASC`.
   *
   * @param q Filtra por TITULO, unicamente. El OpenAPI afirma que busca tambien
   *   por ISBN, descripcion y autor, pero `book_service.py` solo aplica
   *   `LOWER(l.titulo) LIKE LOWER(%s)`. No prometas busqueda por autor en la UI.
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

  /** Crea un libro. El backend responde 201 con el libro ya guardado. */
  create(payload: CreateBookRequest): Observable<ApiBook> {
    return dataRequest(this.http.post<ApiEnvelope<ApiBook>>(API_ENDPOINTS.books, payload));
  }

  /**
   * Actualiza un libro de forma parcial. Solo se envian los campos modificados;
   * los omitidos conservan su valor en el backend.
   *
   * OJO: `autores` REEMPLAZA el conjunto completo (hace DELETE + INSERT), asi
   * que enviar `[]` deja el libro sin autores.
   */
  update(id: number, payload: UpdateBookRequest): Observable<ApiBook> {
    return dataRequest(this.http.put<ApiEnvelope<ApiBook>>(API_ENDPOINTS.book(id), payload));
  }

  /**
   * Elimina un libro.
   *
   * Si el libro tiene prestamos asociados devuelve 409, porque
   * `prestamos.libro_id` NO tiene ON DELETE CASCADE (a diferencia de
   * `resenas.libro_id`). El mensaje llega en la forma minima de error, sin
   * lista de `errors`.
   */
  delete(id: number): Observable<string> {
    return messageRequest(this.http.delete<ApiMessage>(API_ENDPOINTS.book(id)));
  }
}
