import { Pipe, PipeTransform } from '@angular/core';
import { ApiAuthor, ApiUser } from '@core/models';

/** Cualquier cosa que tenga `nombre` y `apellido`. */
type ConNombre = ApiAuthor | ApiUser;

/**
 * Concatena nombre y apellido de forma segura.
 *
 * El backend representa al usuario de dos maneras distintas y ninguna es un
 * objeto con ambos campos en todos los casos:
 *   - en `Book.autores` viene como array de `{nombre, apellido}`
 *   - en `Reading.usuario` y `Review.usuario` viene ya unido como string plano
 *     ("Ada Lovelace"), asi que ese caso no pasa por aqui
 *
 * Acepta un elemento o un array. Con varios autores los separa con comas, que
 * es lo que espera un lector. Un array vacio (libro sin autores) devuelve "—".
 *
 *     {{ libro.autores | autorNombre }}
 */
@Pipe({ name: 'autorNombre', pure: true })
export class AutorNombrePipe implements PipeTransform {
  transform(value: ConNombre | ConNombre[] | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '—';
      }
      return value.map((item) => this.nombreCompleto(item)).join(', ');
    }

    return this.nombreCompleto(value);
  }

  private nombreCompleto(value: ConNombre): string {
    return `${value.nombre} ${value.apellido}`.trim() || '—';
  }
}
