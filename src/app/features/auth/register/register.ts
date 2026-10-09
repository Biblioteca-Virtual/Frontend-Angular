import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '@core/api/api-error';
import { AuthService } from '@core/services/auth.service';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';

/** Longitud minima de contraseña impuesta por `app/schemas/user_schema.py`. */
const MIN_PASSWORD_LENGTH = 6;

@Component({
  selector: 'bv-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ErrorBanner],
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
   * Crea la cuenta y entra directamente.
   *
   * OJO: `POST /api/auth/register` NO devuelve token, solo el usuario creado,
   * asi que despues del alta hay que llamar a `POST /api/auth/login`. Aqui se
   * encadenan las dos peticiones para que el usuario no tenga que reintroducir
   * su contraseña.
   *
   * Si el email ya existe el backend responde 409 con
   * "Ya existe un usuario con ese email".
   */
  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const { nombre, apellido, email, password } = this.form.getRawValue();

    this.auth
      .register({ nombre, apellido, email, password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: ApiError) => {
          this.error.set(error);
          this.submitting.set(false);
        },
        next: () => {
          this.auth
            .login({ email, password })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => void this.router.navigate(['/libros']),
              error: (error: ApiError) => {
                this.error.set(error);
                this.submitting.set(false);
              },
            });
        },
      });
  }
}
