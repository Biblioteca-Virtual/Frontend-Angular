import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '@core/api/api-error';
import { AuthService } from '@core/services/auth.service';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { FolderButton } from '@shared/components/folder-button/folder-button';
import { WindowCard } from '@shared/components/window-card/window-card';
import { PendingSession } from '@core/models';
import { SessionPending } from '../session-pending/session-pending';

/** Longitud minima de contraseña impuesta por `app/schemas/user_schema.py`. */
const MIN_PASSWORD_LENGTH = 6;

@Component({
  selector: 'bv-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ErrorBanner, FolderButton, WindowCard, SessionPending],
  templateUrl: './register.html',
  styleUrl: '../auth-form.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly submitting = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly minPasswordLength = MIN_PASSWORD_LENGTH;
  /** Cuenta creada: se espera que toque "Verificar Sesión" en el correo. */
  protected readonly pending = signal<PendingSession | null>(null);

  protected readonly nombre = computed(() => this.form.controls.nombre);
  protected readonly apellido = computed(() => this.form.controls.apellido);
  protected readonly email = computed(() => this.form.controls.email);
  protected readonly password = computed(() => this.form.controls.password);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
  });

  /**
   * Crea la cuenta e inicia sesión enseguida, para no pedir la contraseña dos
   * veces. Como todo inicio de sesión, manda el correo de "Verificar Sesión" y
   * se espera a que lo toque.
   *
   * Si el email ya existe el backend responde 409 con
   * "Ya existe un usuario con ese email".
   */
  protected submit(): void {
    if (this.pending() !== null) {
      return;
    }
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const { nombre, apellido, email, password } = this.form.getRawValue();

    this.auth
      .register({ nombre, apellido, email, password })
      .pipe(
        switchMap(() => this.auth.login({ email, password })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pending) => {
          this.pending.set(pending);
          this.submitting.set(false);
        },
        error: (error: ApiError) => {
          this.error.set(error);
          this.submitting.set(false);
        },
      });
  }

  protected onVerified(): void {
    void this.router.navigate(['/libros']);
  }

  /** La cuenta ya existe: cancelar lleva al login para volver a intentarlo. */
  protected cancelPending(): void {
    void this.router.navigate(['/login']);
  }
}
