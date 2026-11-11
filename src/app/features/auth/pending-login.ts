/** Flujo compartido por login y registro hasta que se verifica la sesión por correo. */
import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiError } from '@core/api/api-error';
import { PendingSession } from '@core/models';

/**
 * Lo que comparten el login y el registro: mandar el formulario y esperar a que
 * el usuario toque "Verificar Sesión" en el correo.
 *
 * Usa `inject`, así que hay que crearla mientras se construye el componente.
 */
export class PendingLogin {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** envío en curso y último error, para el botón y el mensaje del formulario */
  readonly submitting = signal(false);
  readonly error = signal<ApiError | null>(null);
  /** Contraseña correcta: se espera la verificación por correo. */
  readonly session = signal<PendingSession | null>(null);

  /** valida el formulario y hace la petición; marca los campos inválidos y evita envíos dobles */
  submit(form: FormGroup, request: () => Observable<PendingSession>): void {
    if (this.session() !== null) {
      return;
    }
    if (form.invalid || this.submitting()) {
      form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    request()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.session.set(session);
          this.submitting.set(false);
        },
        error: (error: ApiError) => {
          this.error.set(error);
          this.submitting.set(false);
        },
      });
  }

  /** navega a la url indicada */
  goTo(url: string): void {
    void this.router.navigateByUrl(url);
  }

  /** olvida la sesión pendiente para mostrar de nuevo el formulario */
  reset(): void {
    this.session.set(null);
  }
}
