import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest } from '@core/api/api-operators';
import {
  ApiEnvelope,
  ApiUser,
  LoginRequest,
  LoginResult,
  PendingSession,
  RegisterRequest,
  ResendResult,
  SessionStatus,
} from '@core/models';
import { TokenStorageService } from '@core/services/token-storage.service';

/**
 * Estado de autenticacion.
 *
 * El backend no tiene roles ni permisos: cualquier usuario autenticado tiene
 * acceso completo al catalogo. No hay rutas de administrador que proteger mas
 * alla de "hay sesion o no".
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);

  private readonly _currentUser = signal<ApiUser | null>(this.storage.user());

  /** Usuario en cache. Puede estar desactualizado; refrescar con `me()`. */
  readonly user = this._currentUser.asReadonly();

  /** `true` si hay token y su claim `exp` sigue en el futuro. */
  readonly isLoggedIn = this.storage.isAuthenticated;

  readonly displayName = computed(() => {
    const user = this._currentUser();
    return user === null ? '' : `${user.nombre} ${user.apellido}`.trim();
  });

  /** Crea una cuenta. No inicia sesion: despues hay que llamar a `login`. */
  register(payload: RegisterRequest): Observable<ApiUser> {
    return dataRequest(this.http.post<ApiEnvelope<ApiUser>>(API_ENDPOINTS.auth.register, payload));
  }

  /**
   * Valida la contraseña. El backend manda el correo de "Verificar Sesión" y
   * todavia no devuelve token: la sesion llega con `checkSession` cuando se
   * toca el boton del correo.
   */
  login(payload: LoginRequest): Observable<PendingSession> {
    return dataRequest(
      this.http.post<ApiEnvelope<PendingSession>>(API_ENDPOINTS.auth.login, payload),
    );
  }

  /**
   * Pregunta si ya se toco "Verificar Sesión". Devuelve `null` mientras siga
   * pendiente; cuando se verifico, guarda la sesion y devuelve el resultado.
   */
  checkSession(consulta: string): Observable<LoginResult | null> {
    return dataRequest(
      this.http.post<ApiEnvelope<SessionStatus>>(API_ENDPOINTS.auth.sessionStatus, { consulta }),
    ).pipe(
      map((status) => (status.estado === 'verificada' ? status : null)),
      tap((result) => {
        if (result !== null) {
          this.storeSession(result);
        }
      }),
    );
  }

  /** Destino del boton del correo: verifica y deja logueada esta pestaña. */
  verifySession(token: string): Observable<LoginResult> {
    return dataRequest(
      this.http.post<ApiEnvelope<LoginResult>>(API_ENDPOINTS.auth.verifySession, { token }),
    ).pipe(tap((result) => this.storeSession(result)));
  }

  /** Manda otro correo de "Verificar Sesión" con un link nuevo. */
  resendSessionEmail(consulta: string): Observable<ResendResult> {
    return dataRequest(
      this.http.post<ApiEnvelope<ResendResult>>(API_ENDPOINTS.auth.resendSessionEmail, {
        consulta,
      }),
    );
  }

  private storeSession(result: LoginResult): void {
    this.storage.setSession(result.token, result.usuario);
    this._currentUser.set(result.usuario);
  }

  /** Refresca el usuario cacheado con `GET /api/auth/me`. */
  me(): Observable<ApiUser> {
    return dataRequest(this.http.get<ApiEnvelope<ApiUser>>(API_ENDPOINTS.auth.me)).pipe(
      tap((user) => {
        this.storage.setUser(user);
        this._currentUser.set(user);
      }),
    );
  }

  /** Cierra la sesion. Es puramente local: el backend no expone revocacion. */
  logout(): void {
    this.storage.clear();
    this._currentUser.set(null);
  }

  /**
   * Descarta la sesion tras un 401. Lo invoca el interceptor de errores, asi
   * que no navega: el componente que pidio los datos puede querer mostrar su
   * propio mensaje en lugar de ser expulsado a la fuerza.
   */
  invalidate(): void {
    this.storage.clear();
    this._currentUser.set(null);
  }
}
