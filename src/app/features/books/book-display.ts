import { ApiBook, BOOK_LOCATIONS, BookLocation } from '@core/models';

/** Porcentaje leído, de 0 a 100. Sin páginas totales cargadas vale 0. */
export function readingPercentage(total: unknown, read: unknown): number {
  const totalPages = Number(total) || 0;
  const readPages = Number(read) || 0;
  if (totalPages <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((readPages / totalPages) * 100)));
}

/** Usa el porcentaje que calculó el backend y, si no vino, lo calcula. */
export function bookPercentage(book: ApiBook | null | undefined): number {
  if (!book) {
    return 0;
  }
  return book.porcentaje_lectura ?? readingPercentage(book.paginas_totales, book.paginas_leidas);
}

export function locationLabel(location: BookLocation): string {
  return BOOK_LOCATIONS.find((item) => item.value === location)?.label ?? 'Físico';
}
