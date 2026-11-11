/** Pipe para mostrar las fechas que envía el backend. */
import { Pipe, PipeTransform } from '@angular/core';
import { ApiDate } from '@core/models';

/** Idioma y región usados para formatear. */
const LOCALE = 'es-ES';

/** Formatos disponibles. Se declara la union antes del Record para no circular. */
export type BvDateFormat = 'short' | 'long' | 'datetime';

/** Opciones de formato de cada variante del pipe. */
const FORMATTERS: Record<BvDateFormat, Intl.DateTimeFormatOptions> = {
  /** "25 sept 2026" */
  short: { day: 'numeric', month: 'short', year: 'numeric' },
  /** "25 de sept. de 2026" */
  long: { day: 'numeric', month: 'long', year: 'numeric' },
  /** "25 sept 2026, 12:00" */
  datetime: {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
};

/**
 * Formatea las fechas del backend.
 *
 * Existe por una razon concreta: Flask serializa los TIMESTAMP con
 * `werkzeug.http.http_date`, asi que las fechas llegan en RFC 1123
 * ("Fri, 25 Sep 2026 12:00:00 GMT") y NO en ISO 8601. El `DatePipe` de Angular
 * solo entiende ISO 8601, de modo que `{{ fecha | date }}` se renderiza vacio.
 *
 * Este pipe parsea RFC 1123 (y tambien ISO, por si el backend lo corrige) con
 * `Date.parse`, que lo entiende de forma nativa en los navegadores actuales, y
 * formatea con `Intl.DateTimeFormat` en espanol.
 *
 * OJO: las columnas son TIMESTAMP WITHOUT TIME ZONE, es decir horas locales sin
 * zona. No se les puede aplicar ninguna conversion de zona horaria.
 *
 *     {{ lectura.fecha_prestamo | bvDate:'datetime' }}
 */
@Pipe({ name: 'bvDate', pure: true })
export class BvDatePipe implements PipeTransform {
  /** devuelve la fecha formateada, o un guion si no se puede leer */
  transform(value: ApiDate | Date | null | undefined, format: BvDateFormat = 'long'): string {
    const date = this.parse(value);
    if (date === null) {
      return '—';
    }
    return new Intl.DateTimeFormat(LOCALE, FORMATTERS[format]).format(date);
  }

  /** convierte el valor en fecha; devuelve null si está vacío o es inválido */
  private parse(value: ApiDate | Date | null | undefined): Date | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : new Date(timestamp);
  }
}
