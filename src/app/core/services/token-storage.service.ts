/** Guardado del token y del usuario en el navegador, y lectura del vencimiento del JWT. */
import { Injectable, computed, signal } from '@angular/core';
import { ApiUser, JwtClaims } from '@core/models';

/** Claves de localStorage donde se guardan el token y el usuario. */
const TOKEN_KEY = 'bv.token';
const USER_KEY = 'bv.usuario';

/**
 * Persistencia de la sesion en `localStorage`.
 *
 * El backend emite un JWT HS256 con 24h de vida por defecto y NO tiene endpoint
 * de refresh ni revocacion: la unica forma de "cerrar sesion" es borrar el token
 * aqui. Por eso `isExpired` lee el claim `exp` para no depender de un 401.
 *
 * Se decodifica el payload SIN verificar la firma, lo cual es correcto aqui:
 * no se toma ninguna decision de seguridad a partir de ese dato, solo se evita
 * mostrar la interfaz de sesion con un token que el backend va a rechazar. La
 * unica validacion que importa la hace el servidor en cada peticion.
 *
 * Si `localStorage` esta bloqueado (modo privado), la sesion no persiste y dura
 * lo que dure la pestaña. El usuario cacheado puede estar desactualizado; se
 * refresca con `AuthService.me()`. `clear` es local: el backend no tiene logout.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  /** valores actuales, leídos del navegador al iniciar la aplicación */
  private readonly _token = signal<string | null>(this.read(TOKEN_KEY));
  private readonly _user = signal<ApiUser | null>(this.readJson<ApiUser>(USER_KEY));

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();

  /** hay sesión válida: existe un token y todavía no venció */
  readonly isAuthenticated = computed(() => {
    const token = this._token();
    return token !== null && !isTokenExpired(token);
  });

  /** guarda el token y el usuario en memoria y en el navegador */
  setSession(token: string, user: ApiUser): void {
    this._token.set(token);
    this._user.set(user);
    write(TOKEN_KEY, token);
    writeJson(USER_KEY, user);
  }

  /** actualiza solo el usuario guardado */
  setUser(user: ApiUser): void {
    this._user.set(user);
    writeJson(USER_KEY, user);
  }

  /** borra la sesión de memoria y del navegador */
  clear(): void {
    this._token.set(null);
    this._user.set(null);
    remove(TOKEN_KEY);
    remove(USER_KEY);
  }

  /** lee una clave; devuelve null si el navegador bloquea el almacenamiento */
  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  /** lee y convierte un valor guardado; si está corrupto lo borra y devuelve null */
  private readJson<T>(key: string): T | null {
    const raw = this.read(key);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      remove(key);
      return null;
    }
  }
}

/** Decodifica los claims del JWT y devuelve si ya expiro. */
export function isTokenExpired(token: string): boolean {
  const claims = decodeJwtClaims(token);
  if (claims === null) {
    // Token ilegible: se considera expirado para forzar un re-login limpio.
    return true;
  }
  // `exp` esta en segundos desde epoch; Date.now() en milisegundos.
  return claims.exp * 1000 <= Date.now();
}

/** Decodifica el payload de un JWT. Devuelve `null` si no es un JWT valido. */
export function decodeJwtClaims(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = base64UrlDecode(parts[1]);
    const claims = JSON.parse(payload) as Partial<JwtClaims>;
    if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number') {
      return null;
    }
    return { sub: claims.sub, exp: claims.exp };
  } catch {
    return null;
  }
}

/** Decodifica base64url (el formato de las partes de un JWT) a texto UTF-8. */
function base64UrlDecode(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);

  // `atob` devuelve bytes; hay que reconstruir el texto UTF-8.
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Guarda un valor; si el navegador no deja, la sesión solo vive en memoria. */
function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sin persistencia: la sesion durara lo que dure la pestana.
  }
}

/** Guarda un objeto convertido a texto JSON. */
function writeJson(key: string, value: unknown): void {
  write(key, JSON.stringify(value));
}

/** Borra una clave, ignorando errores del navegador. */
function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignorado a proposito.
  }
}
