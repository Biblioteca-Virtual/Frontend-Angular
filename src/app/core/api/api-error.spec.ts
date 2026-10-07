import { describe, expect, it } from 'vitest';
import { ApiError, toApiError } from './api-error';
import { HttpErrorResponse } from '@angular/common/http';

describe('toApiError', () => {
  it('normaliza la forma completa de error, con lista de errores', () => {
    // 400 emitido por las subclases de ApiError del backend.
    const response = new HttpErrorResponse({
      status: 400,
      url: 'http://localhost:5000/api/auth/register',
      error: {
        error: 'Datos inválidos',
        errors: ['nombre es requerido', 'password debe tener al menos 6 caracteres'],
      },
    });

    const apiError = toApiError(response);

    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError.status).toBe(400);
    expect(apiError.message).toBe('Datos inválidos');
    expect(apiError.details).toEqual([
      'nombre es requerido',
      'password debe tener al menos 6 caracteres',
    ]);
    expect(apiError.isValidation).toBe(true);
  });

  it('normaliza la forma mínima de error, sin lista de errores', () => {
    // 405 emitido por el handler de HTTPException: aquí `errors` NO existe.
    const response = new HttpErrorResponse({
      status: 405,
      url: 'http://localhost:5000/api/auth/login',
      error: { error: 'Método no permitido' },
    });

    const apiError = toApiError(response);

    expect(apiError.status).toBe(405);
    expect(apiError.message).toBe('Método no permitido');
    expect(apiError.details).toEqual([]);
    expect(apiError.isValidation).toBe(false);
  });

  it('convierte un status 0 en error de red con mensaje explicativo', () => {
    // Es lo que ve el navegador cuando el backend está caído o CORS está mal.
    const response = new HttpErrorResponse({ status: 0, url: 'http://localhost:5000/api/books/' });

    const apiError = toApiError(response);

    expect(apiError.isNetwork).toBe(true);
    expect(apiError.message).toContain('CORS_ORIGINS');
  });

  it('no rompe con un cuerpo HTML inesperado', () => {
    // El 308 de GET /api/books (sin barra final) devuelve HTML, no JSON.
    const response = new HttpErrorResponse({
      status: 308,
      url: 'http://localhost:5000/api/books',
      error: '<html><body>Moved Permanently</body></html>',
    });

    const apiError = toApiError(response);

    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError.status).toBe(308);
    expect(apiError.details).toEqual([]);
  });

  it('clasifica los códigos que la UI trata de forma especial', () => {
    const make = (status: number) => toApiError(new HttpErrorResponse({ status }));

    expect(make(401).isUnauthorized).toBe(true);
    expect(make(404).isNotFound).toBe(true);
    expect(make(409).isConflict).toBe(true);
  });

  it('concatena varios detalles en displayMessage', () => {
    const error = new ApiError(400, 'Datos inválidos', ['a es requerido', 'b es requerido']);

    expect(error.displayMessage).toBe('a es requerido · b es requerido');
  });
});
