import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '@core/api/api-error';
import { ApiUser } from '@core/models';
import { AuthService } from '@core/services/auth.service';
import { Brand } from '@shared/components/brand/brand';
import { WindowCard } from '@shared/components/window-card/window-card';

/** Tiempo que se muestra "¡Sesión verificada!" antes de ir a la biblioteca. */
const REDIRECT_DELAY_MS = 2500;

/**
 * Destino del botón "Verificar Sesión" del correo: `/verificar-sesion?token=...`.
 *
 * Verifica el inicio de sesión: la pestaña donde se escribió la contraseña
 * entra sola, y esta también queda logueada.
 */
@Component({
  selector: 'bv-verify-session',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, WindowCard, Brand],
  templateUrl: './verify-session.html',
  styleUrls: ['../auth-form.scss', './verify-session.scss'],
})
export class VerifySession implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Query param `token`, enlazado por `withComponentInputBinding`. */
  readonly token = input<string>();

  protected readonly verifying = signal(true);
  protected readonly user = signal<ApiUser | null>(null);
  protected readonly error = signal<ApiError | null>(null);

  ngOnInit(): void {
    const token = this.token();
    if (!token) {
      this.error.set(new ApiError(400, 'Datos inválidos', ['El link de verificación no es válido']));
      this.verifying.set(false);
      return;
    }

    this.auth
      .verifySession(token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ usuario }) => {
          this.user.set(usuario);
          this.verifying.set(false);
          const timer = setTimeout(() => void this.router.navigate(['/libros']), REDIRECT_DELAY_MS);
          this.destroyRef.onDestroy(() => clearTimeout(timer));
        },
        error: (error: ApiError) => {
          this.error.set(error);
          this.verifying.set(false);
        },
      });
  }
}
