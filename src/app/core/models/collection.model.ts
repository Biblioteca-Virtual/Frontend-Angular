import { ApiDate } from './api.model';
import { ApiBook } from './book.model';

/**
 * Colección tal y como la serializa `Coleccion.to_dict()`.
 *
 * Las colecciones son privadas: el backend solo devuelve las del usuario del
 * token, y una ajena responde 404.
 */
export interface ApiCollection {
  id: number;
  usuario_id: number;
  nombre: string;
  fecha_creacion: ApiDate;
  cantidad_libros: number;
  /** Viene vacía en `GET /api/collections/`; solo el detalle trae los libros. */
  libros: ApiBook[];
}

/** Cuerpo de `POST /api/collections/` y de `PUT /api/collections/{id}`. */
export interface CollectionNameRequest {
  nombre: string;
}
