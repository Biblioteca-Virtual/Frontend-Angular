/** Tipos de usuarios, inicio de sesión y verificación por correo. */
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
  /** `false` hasta que toca "Verificar Sesión" en el correo. */
  email_verificado: boolean;
}

/**
 * Respuesta de `POST /api/auth/login` (202): la contraseña es correcta y se
 * mandó el correo de "Verificar Sesión". El token llega al tocar ese botón.
 */
export interface PendingSession {
  verificacion_pendiente: true;
  /** Secreto para preguntar en `/api/auth/session-status` si ya se verificó. */
  consulta: string;
  email: string;
  /** `false` si el backend no tiene el correo configurado o falló el envío. */
  correo_enviado: boolean;
  expira_en_minutos: number;
}

/** Respuesta de `POST /api/auth/session-status`. */
export type SessionStatus = { estado: 'pendiente' } | ({ estado: 'verificada' } & LoginResult);

/** Respuesta de `POST /api/auth/resend-session-email`. */
export interface ResendResult {
  correo_enviado: boolean;
  expira_en_minutos: number;
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
