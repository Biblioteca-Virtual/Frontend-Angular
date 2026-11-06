import { describe, expect, it } from 'vitest';
import { ApiBook } from '@core/models';
import { emptyBookForm, toBookFormValue, toBookPayload } from './book-form.model';

const selection = {
  categoryId: '4',
  authors: [{ id: 9, nombre: 'Ana', apellido: 'Pérez' }],
  cover: '',
};

describe('toBookPayload', () => {
  it('limpia el texto y manda los ids elegidos', () => {
    const form = {
      ...emptyBookForm(),
      titulo: ' Rayuela ',
      descripcion: '  ',
      paginas_totales: 10,
    };

    expect(toBookPayload(form, selection)).toEqual({
      titulo: 'Rayuela',
      categoria_id: 4,
      autores: [9],
      descripcion: null,
      paginas_totales: 10,
      paginas_leidas: 0,
      imagen_portada: null,
      ubicacion: 'fisico',
      url_lectura: null,
    });
  });

  it('solo una ubicación web guarda la URL', () => {
    const form = { ...emptyBookForm(), url_lectura: ' https://x.com ' };

    expect(toBookPayload(form, selection).url_lectura).toBeNull();
    expect(toBookPayload({ ...form, ubicacion: 'web' }, selection).url_lectura).toBe(
      'https://x.com',
    );
  });

  it('la opción de nueva categoría sin confirmar cae en la categoría 1', () => {
    expect(toBookPayload(emptyBookForm(), { ...selection, categoryId: 'nueva' }).categoria_id).toBe(
      1,
    );
  });
});

describe('toBookFormValue', () => {
  it('reemplaza los valores nulos del backend', () => {
    const book = { titulo: 'Rayuela', descripcion: null, url_lectura: null } as ApiBook;

    expect(toBookFormValue(book)).toEqual({
      ...emptyBookForm(),
      titulo: 'Rayuela',
    });
  });
});
