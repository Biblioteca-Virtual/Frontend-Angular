/** Autor anidado dentro de `Libro`. */
export interface ApiAuthor {
  id: number;
  nombre: string;
  apellido: string;
}

/**
 * Categoria anidada dentro de `Libro`.
 *
 * OJO: el backend NO expone `categoria_id` en el nivel superior del libro, lo
 * renombra a este objeto. Para crear un libro se envia `categoria_id`.
 */
export interface ApiCategory {
  id: number;
  /** Nullable en la base de datos. */
  nombre: string | null;
}

/** Libro tal y como lo serializa `Libro.to_dict()`. */
export interface ApiBook {
  id: number;
  titulo: string;
  /** Nullable y unico en la base de datos. */
  isbn: string | null;
  descripcion: string | null;
  anio_publicacion: number | null;
  /** Numero de copias disponibles para préstamo. */
  cantidad: number;
  categoria: ApiCategory;
  autores: ApiAuthor[];
}

/** Cuerpo de `POST /api/books/` (creacion). */
export interface CreateBookRequest {
  titulo: string;
  categoria_id: number;
  cantidad?: number;
  autores?: number[];
  isbn?: string | null;
  descripcion?: string | null;
  anio_publicacion?: number | null;
}

/**
 * Cuerpo de `PUT /api/books/{id}` (actualizacion parcial).
 *
 * El backend exige al menos un campo y trata los omitidos como "sin cambio".
 * Enviar `autores` REEMPLAZA el conjunto completo, incluido `[]` para borrarlo.
 */
export interface UpdateBookRequest {
  titulo?: string;
  isbn?: string | null;
  descripcion?: string | null;
  anio_publicacion?: number | null;
  cantidad?: number;
  categoria_id?: number;
  autores?: number[];
}
