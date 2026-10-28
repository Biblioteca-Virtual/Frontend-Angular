/** Autor anidado dentro de `Libro`. */
export interface ApiAuthor {
  id: number;
  nombre: string;
  apellido: string;
}

/**
 * Categoria anidada dentro de `Libro`.
 */
export interface ApiCategory {
  id: number;
  nombre: string | null;
  descripcion?: string | null;
}

/** Libro tal y como lo serializa `Libro.to_dict()`. */
export interface ApiBook {
  id: number;
  titulo: string;
  isbn: string | null;
  descripcion: string | null;
  anio_publicacion: number | null;
  cantidad: number;
  categoria: ApiCategory;
  autores: ApiAuthor[];
  paginas_totales?: number;
  paginas_leidas?: number;
  porcentaje_lectura?: number;
  imagen_portada?: string | null;
}

/** Cuerpo de `POST /api/books/` (creacion). */
export interface CreateBookRequest {
  titulo: string;
  categoria_id?: number;
  cantidad?: number;
  autores?: number[];
  isbn?: string | null;
  descripcion?: string | null;
  anio_publicacion?: number | null;
  paginas_totales?: number;
  paginas_leidas?: number;
  imagen_portada?: string | null;
}

/**
 * Cuerpo de `PUT /api/books/{id}` (actualizacion parcial).
 */
export interface UpdateBookRequest {
  titulo?: string;
  isbn?: string | null;
  descripcion?: string | null;
  anio_publicacion?: number | null;
  cantidad?: number;
  categoria_id?: number;
  autores?: number[];
  paginas_totales?: number;
  paginas_leidas?: number;
  imagen_portada?: string | null;
}

export interface UpdateBookProgressRequest {
  paginas_totales?: number;
  paginas_leidas?: number;
}
