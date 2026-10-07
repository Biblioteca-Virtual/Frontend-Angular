import { describe, expect, it } from 'vitest';
import { decodeJwtClaims, isTokenExpired } from './token-storage.service';

/** Construye un JWT con la forma que emite el backend (`sub` + `exp`). */
function makeToken(expSeconds: number): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: '42', exp: expSeconds })}.firma`;
}

describe('decodeJwtClaims', () => {
  it('decodifica los claims sub y exp', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;

    expect(decodeJwtClaims(makeToken(exp))).toEqual({ sub: '42', exp });
  });

  it('devuelve null si el token no tiene tres segmentos', () => {
    expect(decodeJwtClaims('no-es-un-jwt')).toBeNull();
  });

  it('devuelve null si el payload carece de sub o exp', () => {
    const encode = (value: object) =>
      btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    expect(decodeJwtClaims(`${encode({})}.${encode({ sub: '1' })}.sig`)).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('detecta un token vigente', () => {
    // El backend emite 24 h por defecto (TOKEN_EXPIRATION_HOURS).
    const token = makeToken(Math.floor(Date.now() / 1000) + 24 * 3600);

    expect(isTokenExpired(token)).toBe(false);
  });

  it('detecta un token caducado', () => {
    const token = makeToken(Math.floor(Date.now() / 1000) - 1);

    expect(isTokenExpired(token)).toBe(true);
  });

  it('trata un token ilegible como caducado, para forzar un login limpio', () => {
    expect(isTokenExpired('basura')).toBe(true);
  });
});
