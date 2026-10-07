import { ApiDate } from './api.model';

/**
 * Usuario tal y como lo serializa `Usuario.to_dict()`. La contraseña nunca se
 * incluye: se elimina del dict en el backend.
 */
export interface ApiUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  /** RFC 1123, no ISO 8601. Ver `ApiDate`. */
  fecha_registro: ApiDate;
}

/** Respuesta de `POST /api/auth/login`. */
export interface LoginResult {
  /** JWT HS256. Se envia de vuelta como `Authorization: Bearer <token>`. */
  token: string;
  usuario: ApiUser;
}

/** Cuerpo de `POST /api/auth/register`. */
export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  /** Minimo 6 caracteres, imposed por el backend. */
  password: string;
}

/** Cuerpo de `POST /api/auth/login`. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Claims del JWT emitido por el backend. Solo contiene `sub` y `exp`. */
export interface JwtClaims {
  /** Id del usuario, como string. */
  sub: string;
  /** Expiracion en segundos desde epoch (UTC). */
  exp: number;
}
