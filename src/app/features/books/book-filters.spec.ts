import { beforeEach, describe, expect, it } from 'vitest';
import { ApiBook } from '@core/models';
import { BookFilters, categoryNames } from './book-filters';

const book = (id: number, titulo: string, autor: string, categoria: string | null): ApiBook =>
  ({
    id,
    titulo,
    autores: [{ id, nombre: autor, apellido: 'Pérez' }],
    categoria: { id, nombre: categoria },
  }) as ApiBook;

const books = [
  book(1, 'Ficciones', 'Jorge', 'Cuentos'),
  book(2, 'Rayuela', 'Julio', 'Novela'),
  book(3, 'Sin categoría', 'Ana', null),
];

describe('BookFilters', () => {
  let filters: BookFilters;

  const ids = (): number[] => filters.apply(books).map((item) => item.id);

  beforeEach(() => {
    filters = new BookFilters();
  });

  it('sin filtros devuelve todos y no está activo', () => {
    expect(ids()).toEqual([1, 2, 3]);
    expect(filters.active()).toBe(false);
  });

  it('filtra por título, autor y categoría sin importar mayúsculas', () => {
    filters.title.set(' FICC ');
    expect(ids()).toEqual([1]);

    filters.clear();
    filters.author.set('julio pér');
    expect(ids()).toEqual([2]);

    filters.clear();
    filters.category.set('novela');
    expect(ids()).toEqual([2]);
  });

  it('combina los filtros', () => {
    filters.title.set('ficciones');
    filters.category.set('Novela');

    expect(ids()).toEqual([]);
    expect(filters.active()).toBe(true);
  });

  it('un título con solo espacios no cuenta como filtro', () => {
    filters.title.set('   ');

    expect(filters.active()).toBe(false);
  });
});

describe('categoryNames', () => {
  it('devuelve las categorías sin repetir ni vacías', () => {
    expect(categoryNames([...books, book(4, 'Bestiario', 'Julio', 'Cuentos')])).toEqual([
      'Cuentos',
      'Novela',
    ]);
  });
});
