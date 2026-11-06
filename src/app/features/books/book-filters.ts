import { computed, signal } from '@angular/core';
import { ApiBook } from '@core/models';

const normalized = (text: string): string => text.trim().toLowerCase();

function hasAuthor(book: ApiBook, search: string): boolean {
  return (book.autores || []).some((author) =>
    `${author.nombre} ${author.apellido}`.toLowerCase().includes(search),
  );
}

/** Filtros de la biblioteca, compartidos entre el buscador y la grilla. */
export class BookFilters {
  readonly title = signal('');
  readonly author = signal('');
  readonly category = signal('');

  readonly active = computed(
    () => this.title().trim() !== '' || this.author().trim() !== '' || this.category() !== '',
  );

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
