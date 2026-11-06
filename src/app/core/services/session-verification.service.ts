import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest } from '@core/api/api-operators';
import { ApiEnvelope, LoginResult, ResendResult, SessionStatus } from '@core/models';
import { AuthService } from '@core/services/auth.service';

/**
 * Verificación del inicio de sesión por correo.
 *
 * - `checkSession` pregunta si ya se tocó "Verificar Sesión". Devuelve `null`
 *   mientras siga pendiente; cuando se verificó, guarda la sesión.
 * - `verifySession` es el destino del botón del correo: verifica y deja logueada
 *   esa pestaña.
 * - `resendSessionEmail` manda otro correo con un link nuevo.
 */
@Injectable({ providedIn: 'root' })
export class SessionVerificationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  checkSession(consulta: string): Observable<LoginResult | null> {
    return dataRequest(
      this.http.post<ApiEnvelope<SessionStatus>>(API_ENDPOINTS.auth.sessionStatus, { consulta }),
    ).pipe(
      map((status) => (status.estado === 'verificada' ? status : null)),
      tap((result) => {
        if (result !== null) {
          this.auth.startSession(result);
        }
      }),
    );
  }

  verifySession(token: string): Observable<LoginResult> {
    return dataRequest(
      this.http.post<ApiEnvelope<LoginResult>>(API_ENDPOINTS.auth.verifySession, { token }),
    ).pipe(tap((result) => this.auth.startSession(result)));
  }

  resendSessionEmail(consulta: string): Observable<ResendResult> {
    return dataRequest(
      this.http.post<ApiEnvelope<ResendResult>>(API_ENDPOINTS.auth.resendSessionEmail, {
        consulta,
      }),
    );
  }
}
