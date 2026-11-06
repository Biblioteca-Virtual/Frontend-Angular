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
import { SessionVerificationService } from '@core/services/session-verification.service';
import { Brand } from '@shared/components/brand/brand';
import { WindowCard } from '@shared/components/window-card/window-card';

/** Tiempo que se muestra "¡Sesión verificada!" antes de ir a la biblioteca. */
const REDIRECT_DELAY_MS = 2500;

const invalidLinkError = (): ApiError =>
  new ApiError(400, 'Datos inválidos', ['El link de verificación no es válido']);

/**
 * Destino del botón "Verificar Sesión" del correo: `/verificar-sesion?token=...`.
 * El query param `token` llega enlazado por `withComponentInputBinding`.
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
  private readonly verification = inject(SessionVerificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly token = input<string>();

  protected readonly verifying = signal(true);
  protected readonly user = signal<ApiUser | null>(null);
  protected readonly error = signal<ApiError | null>(null);

  ngOnInit(): void {
    const token = this.token();
    if (!token) {
      this.error.set(invalidLinkError());
      this.verifying.set(false);
      return;
    }

    this.verification
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
