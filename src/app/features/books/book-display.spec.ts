/** Tests del cálculo del progreso y de las etiquetas de ubicación. */
import { describe, expect, it } from 'vitest';
import { ApiBook } from '@core/models';
import { bookPercentage, locationLabel, readingPercentage } from './book-display';

describe('readingPercentage', () => {
  it('redondea el porcentaje leído', () => {
    expect(readingPercentage(300, 100)).toBe(33);
  });

  it('vale 0 sin páginas totales o con valores vacíos', () => {
    expect(readingPercentage(0, 50)).toBe(0);
    expect(readingPercentage('', null)).toBe(0);
  });

  it('no se pasa de 100', () => {
    expect(readingPercentage(100, 250)).toBe(100);
  });
});

describe('bookPercentage', () => {
  const book = { paginas_totales: 200, paginas_leidas: 50 } as ApiBook;

  it('prefiere el porcentaje que calculó el backend', () => {
    expect(bookPercentage({ ...book, porcentaje_lectura: 80 })).toBe(80);
  });

  it('lo calcula si no vino y vale 0 sin libro', () => {
    expect(bookPercentage(book)).toBe(25);
    expect(bookPercentage(null)).toBe(0);
  });
});

describe('locationLabel', () => {
  it('muestra el nombre de la ubicación', () => {
    expect(locationLabel('kindle')).toBe('Books/Kindle');
  });
});
