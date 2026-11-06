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

  readonly submitting = signal(false);
  readonly error = signal<ApiError | null>(null);
  /** Contraseña correcta: se espera la verificación por correo. */
  readonly session = signal<PendingSession | null>(null);

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

  goTo(url: string): void {
    void this.router.navigateByUrl(url);
  }

  reset(): void {
    this.session.set(null);
  }
}
