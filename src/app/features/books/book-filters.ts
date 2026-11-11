/** Filtros de la biblioteca: por título, autor y categoría. */
import { computed, signal } from '@angular/core';
import { ApiBook } from '@core/models';

/** Texto sin espacios en los extremos y en minúsculas, para comparar. */
const normalized = (text: string): string => text.trim().toLowerCase();

/** Verdadero si alguno de los autores del libro contiene el texto buscado. */
function hasAuthor(book: ApiBook, search: string): boolean {
  return (book.autores || []).some((author) =>
    `${author.nombre} ${author.apellido}`.toLowerCase().includes(search),
  );
}

/** Filtros de la biblioteca, compartidos entre el buscador y la grilla. */
export class BookFilters {
  /** texto de cada filtro, enlazado con los campos del buscador */
  readonly title = signal('');
  readonly author = signal('');
  readonly category = signal('');

  /** verdadero cuando hay al menos un filtro cargado */
  readonly active = computed(
    () => this.title().trim() !== '' || this.author().trim() !== '' || this.category() !== '',
  );

  /** devuelve los libros que cumplen todos los filtros cargados */
  apply(books: ApiBook[]): ApiBook[] {
    const title = normalized(this.title());
    const author = normalized(this.author());
    const category = normalized(this.category());

    return books.filter(
      (book) =>
        (!title || book.titulo.toLowerCase().includes(title)) &&
        (!author || hasAuthor(book, author)) &&
        (!category || book.categoria?.nombre?.toLowerCase() === category),
    );
  }

  /** vacía los tres filtros */
  clear(): void {
    this.title.set('');
    this.author.set('');
    this.category.set('');
  }
}

/** Categorías únicas de los libros cargados. */
export function categoryNames(books: ApiBook[]): string[] {
  const names = books.map((book) => book.categoria?.nombre).filter((name) => !!name);
  return Array.from(new Set(names as string[]));
}
