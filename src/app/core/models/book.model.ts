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

/** Dónde se está leyendo el libro. `kindle` se muestra como "Books/Kindle". */
export type BookLocation = 'fisico' | 'kindle' | 'web';

export const BOOK_LOCATIONS: readonly { value: BookLocation; label: string }[] = [
  { value: 'fisico', label: 'Físico' },
  { value: 'kindle', label: 'Books/Kindle' },
  { value: 'web', label: 'Web' },
];

/** Libro tal y como lo serializa `Libro.to_dict()`. Solo lo ve su dueño. */
export interface ApiBook {
  id: number;
  usuario_id: number;
  titulo: string;
  descripcion: string | null;
  categoria: ApiCategory;
  autores: ApiAuthor[];
  paginas_totales: number;
  paginas_leidas: number;
  porcentaje_lectura: number;
  /** Tiene páginas cargadas y ya se leyeron todas. */
  terminado: boolean;
  imagen_portada: string | null;
  ubicacion: BookLocation;
  /** Solo cuando `ubicacion` es `web`. */
  url_lectura: string | null;
}

/** Cuerpo de `POST /api/books/` (creacion). */
export interface CreateBookRequest {
  titulo: string;
  categoria_id?: number;
  autores?: number[];
  descripcion?: string | null;
  paginas_totales?: number;
  paginas_leidas?: number;
  imagen_portada?: string | null;
  ubicacion?: BookLocation;
  /** Obligatoria si `ubicacion` es `web`; se ignora en las demás. */
  url_lectura?: string | null;
}

/** Cuerpo de `PUT /api/books/{id}` (actualizacion parcial). */
export type UpdateBookRequest = Partial<CreateBookRequest>;

export interface UpdateBookProgressRequest {
  paginas_totales?: number;
  paginas_leidas?: number;
}
