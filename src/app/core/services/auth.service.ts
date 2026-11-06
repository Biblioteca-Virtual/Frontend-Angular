import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest } from '@core/api/api-operators';
import { ApiEnvelope, ApiUser, LoginResult } from '@core/models';
import { TokenStorageService } from '@core/services/token-storage.service';

/**
 * Estado de la sesión actual.
 *
 * El backend no tiene roles ni permisos: cualquier usuario autenticado tiene
 * acceso completo al catálogo, así que solo importa si hay sesión o no.
 *
 * - `user` es el usuario en caché; puede estar desactualizado, `me` lo refresca.
 * - `isLoggedIn` es `true` si hay token y su claim `exp` sigue en el futuro.
 * - `logout` es puramente local: el backend no expone revocación.
 * - `invalidate` descarta la sesión tras un 401. Lo invoca el interceptor de
 *   errores y no navega: el componente que pidió los datos puede querer mostrar
 *   su propio mensaje en lugar de expulsar al usuario a la fuerza.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);

  private readonly currentUser = signal<ApiUser | null>(this.storage.user());

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = this.storage.isAuthenticated;

  readonly displayName = computed(() => {
    const user = this.currentUser();
    return user === null ? '' : `${user.nombre} ${user.apellido}`.trim();
  });

  startSession(result: LoginResult): void {
    this.storage.setSession(result.token, result.usuario);
    this.currentUser.set(result.usuario);
  }

  me(): Observable<ApiUser> {
    return dataRequest(this.http.get<ApiEnvelope<ApiUser>>(API_ENDPOINTS.auth.me)).pipe(
      tap((user) => {
        this.storage.setUser(user);
        this.currentUser.set(user);
      }),
    );
  }

  logout(): void {
    this.storage.clear();
    this.currentUser.set(null);
  }

  invalidate(): void {
    this.storage.clear();
    this.currentUser.set(null);
  }
}
