import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest } from '@core/api/api-operators';
import { ApiEnvelope, ApiUser, LoginRequest, LoginResult, RegisterRequest } from '@core/models';
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

  /**
   * Crea una cuenta.
   *
   * OJO: el backend NO devuelve token en el registro, asi que tras un alta
   * correcta hay que hacer login igualmente.
   */
  register(payload: RegisterRequest): Observable<ApiUser> {
    return dataRequest(this.http.post<ApiEnvelope<ApiUser>>(API_ENDPOINTS.auth.register, payload));
  }

  /** Inicia sesion y persiste el token junto al usuario. */
  login(payload: LoginRequest): Observable<LoginResult> {
    return dataRequest(
      this.http.post<ApiEnvelope<LoginResult>>(API_ENDPOINTS.auth.login, payload),
    ).pipe(
      tap((result) => {
        this.storage.setSession(result.token, result.usuario);
        this._currentUser.set(result.usuario);
      }),
    );
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
