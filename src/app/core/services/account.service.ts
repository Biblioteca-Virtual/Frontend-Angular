/** Servicio de registro e inicio de sesión con contraseña. */
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest } from '@core/api/api-operators';
import { ApiEnvelope, ApiUser, LoginRequest, PendingSession, RegisterRequest } from '@core/models';

/**
 * Alta de cuentas y validación de contraseña.
 *
 * `register` no inicia sesión: después hay que llamar a `login`. Y `login`
 * todavía no devuelve token: el backend manda el correo de "Verificar Sesión" y
 * la sesión llega con `SessionVerificationService` cuando se toca el botón.
 */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  /** crea la cuenta y devuelve el usuario creado, sin iniciar sesión */
  register(payload: RegisterRequest): Observable<ApiUser> {
    return dataRequest(this.http.post<ApiEnvelope<ApiUser>>(API_ENDPOINTS.auth.register, payload));
  }

  /** valida email y contraseña; el backend responde con la verificación pendiente */
  login(payload: LoginRequest): Observable<PendingSession> {
    return dataRequest(
      this.http.post<ApiEnvelope<PendingSession>>(API_ENDPOINTS.auth.login, payload),
    );
  }
}
