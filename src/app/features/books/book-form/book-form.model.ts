/** Conversión entre los datos del formulario de libros y los de la API. */
import { ApiAuthor, ApiBook, BookLocation, CreateBookRequest } from '@core/models';

/** Campos del formulario de libro que se editan directamente con `ngModel`. */
export interface BookFormValue {
  titulo: string;
  descripcion: string;
  ubicacion: BookLocation;
  url_lectura: string;
  paginas_totales: number;
  paginas_leidas: number;
}

/** Lo que eligen las partes del formulario que tienen su propio estado. */
export interface BookFormSelection {
  categoryId: string;
  authors: ApiAuthor[];
  cover: string;
}

/** Valores iniciales del formulario en modo alta. */
export function emptyBookForm(): BookFormValue {
  return {
    titulo: '',
    descripcion: '',
    ubicacion: 'fisico',
    url_lectura: '',
    paginas_totales: 0,
    paginas_leidas: 0,
  };
}

/** Pasa un libro de la API a los valores del formulario en modo edición. */
export function toBookFormValue(book: ApiBook): BookFormValue {
  return {
    titulo: book.titulo,
    descripcion: book.descripcion ?? '',
    ubicacion: book.ubicacion ?? 'fisico',
    url_lectura: book.url_lectura ?? '',
    paginas_totales: book.paginas_totales ?? 0,
    paginas_leidas: book.paginas_leidas ?? 0,
  };
}

/** Solo una ubicación web guarda URL; las demás la limpian. */
export function toBookPayload(
  form: BookFormValue,
  selection: BookFormSelection,
): CreateBookRequest {
  return {
    titulo: form.titulo.trim(),
    categoria_id: Number(selection.categoryId) || 1,
    autores: selection.authors.map((author) => author.id),
    descripcion: form.descripcion.trim() || null,
    paginas_totales: Number(form.paginas_totales) || 0,
    paginas_leidas: Number(form.paginas_leidas) || 0,
    imagen_portada: selection.cover.trim() || null,
    ubicacion: form.ubicacion,
    url_lectura: form.ubicacion === 'web' ? form.url_lectura.trim() || null : null,
  };
}
