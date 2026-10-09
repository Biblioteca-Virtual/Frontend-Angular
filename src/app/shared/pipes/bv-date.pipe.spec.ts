import { describe, expect, it } from 'vitest';
import { BvDatePipe } from './bv-date.pipe';

describe('BvDatePipe', () => {
  const pipe = new BvDatePipe();

  // Formato real que devuelve el backend Flask: RFC 1123, no ISO 8601.
  const RFC_1123 = 'Fri, 25 Sep 2026 12:00:00 GMT';

  it('parsea el formato RFC 1123 que emite el backend', () => {
    // El fallo que motiva este pipe: el DatePipe de Angular solo entiende ISO.
    expect(new Date(RFC_1123).getTime()).not.toBeNaN();

    const result = pipe.transform(RFC_1123);

    expect(result).not.toBe('—');
    expect(result).toContain('2026');
  });

  it('también acepta ISO 8601 por si el backend lo corrige', () => {
    const result = pipe.transform('2026-09-25T12:00:00Z');

    expect(result).not.toBe('—');
    expect(result).toContain('2026');
  });

  it('devuelve un guion largo ante null, undefined o cadena vacía', () => {
    // `fecha_devolucion` llega como null mientras el préstamo está activo.
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
    expect(pipe.transform('')).toBe('—');
  });

  it('devuelve un guion largo ante una fecha ilegible', () => {
    expect(pipe.transform('no-es-una-fecha')).toBe('—');
  });

  it('admite los tres formatos y produce texto legible', () => {
    for (const format of ['short', 'long', 'datetime'] as const) {
      const result = pipe.transform(RFC_1123, format);
      expect(result).not.toBe('—');
      expect(result).toContain('2026');
    }
  });

  it('acepta un objeto Date', () => {
    const result = pipe.transform(new Date('2026-09-25T12:00:00Z'));

    expect(result).not.toBe('—');
  });
});
