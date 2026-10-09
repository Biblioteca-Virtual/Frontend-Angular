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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError } from '@core/api/api-error';
import { AuthService } from '@core/services/auth.service';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';

@Component({
  selector: 'bv-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ErrorBanner],
  templateUrl: './login.html',
  styleUrl: '../auth-form.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly submitting = signal(false);
  protected readonly error = signal<ApiError | null>(null);

  /**
   * `returnUrl` lo inyecta `authGuard` con la ruta que el usuario intentaba
   * abrir. Solo se acepta una ruta interna que empiece por `/`, para que el
   * login no se convierta en un redirector hacia sitios externos.
   */
  private readonly returnUrl = this.safeReturnUrl(
    this.route.snapshot.queryParamMap.get('returnUrl'),
  );

  protected readonly email = computed(() => this.form.controls.email);
  protected readonly password = computed(() => this.form.controls.password);

  /**
   * El backend exige ambos campos y su mensaje es "email es requerido" /
   * "password es requerido". Las validaciones del cliente replican las suyas
   * para no gastar un 400 en cada intento, pero la autoridad sigue siendo la
   * respuesta del servidor.
   */
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    this.auth
      .login(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.returnUrl),
        error: (error: ApiError) => {
          this.error.set(error);
          this.submitting.set(false);
        },
      });
  }

  private safeReturnUrl(value: string | null): string {
    return value !== null && value.startsWith('/') ? value : '/libros';
  }
}
