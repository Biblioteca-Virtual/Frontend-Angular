import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { exhaustMap, filter, take, timer } from 'rxjs';
import { ApiError } from '@core/api/api-error';
import { LoginResult, PendingSession } from '@core/models';
import { AuthService } from '@core/services/auth.service';

/** Cada cuánto se pregunta si ya se tocó "Verificar Sesión". */
const POLL_INTERVAL_MS = 3000;

/**
 * "Revisá tu correo": se muestra después de un login con la contraseña
 * correcta, mientras se espera que el usuario toque "Verificar Sesión" en el
 * correo. Pregunta al backend cada pocos segundos y, cuando se verificó, la
 * sesión ya queda guardada y emite `verified`.
 */
@Component({
  selector: 'bv-session-pending',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pending" role="status" aria-live="polite">
      <svg class="pending__icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
      </svg>
      <div class="pending__body">
        <strong>Revisá tu correo</strong>
        @if (sent()) {
          <p>
            Te mandamos un correo a <b>{{ pending().email }}</b>. Tocá
            <b>"Verificar Sesión"</b> para entrar. Si no lo ves, revisá la carpeta de spam.
          </p>
        } @else {
          <p>
            Para entrar tenés que tocar <b>"Verificar Sesión"</b> en el correo que le mandamos a
            <b>{{ pending().email }}</b>.
          </p>
        }

        @if (error(); as apiError) {
          <p class="pending__error">{{ apiError.details[0] ?? apiError.displayMessage }}</p>
          <button type="button" class="vl-btn vl-btn--sm vl-btn--primary" (click)="cancel.emit()">
            Volver a iniciar sesión
          </button>
        } @else {
          <p class="pending__wait">
            <span class="pending__dot" aria-hidden="true"></span>
            Esperando la verificación… el link vence en {{ minutes() }} minutos.
          </p>

          @if (resent()) {
            <p class="pending__ok">Listo, te mandamos un correo nuevo.</p>
          } @else if (!sent()) {
            <p class="pending__error">No pudimos mandar el correo. Probá reenviarlo.</p>
          }

          <div class="pending__actions">
            <button type="button" class="vl-btn vl-btn--sm" [disabled]="resending()" (click)="resend()">
              {{ resending() ? 'Enviando…' : 'Reenviar correo' }}
            </button>
            <button type="button" class="vl-btn vl-btn--sm vl-btn--ghost" (click)="cancel.emit()">
              Cancelar
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .pending {
      display: flex;
      gap: 0.9rem;
      padding: 1rem 1.1rem;
      margin-bottom: 1rem;
      background: #fff4df;
      border: 1px solid #f3c77a;
      border-radius: 10px;
      color: #3a2a0c;
    }

    .pending__icon {
      flex: none;
      width: 2rem;
      height: 2rem;
      fill: none;
      stroke: var(--vl-amber);
      stroke-width: 1.8;
      stroke-linejoin: round;
    }

    .pending__body {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.95rem;
      line-height: 1.45;

      strong {
        font-size: 1.05rem;
      }

      p {
        margin: 0;
      }
    }

    .pending__wait {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6b5320;
      font-size: 0.9rem;
    }

    .pending__dot {
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 50%;
      background: var(--vl-amber);
      animation: pending-pulse 1.2s ease-in-out infinite;
    }

    .pending__actions {
      display: flex;
      gap: 0.5rem;
    }

    .pending__ok {
      color: #2f6b2f;
      font-weight: 600;
    }

    .pending__error {
      color: var(--bv-danger);
      font-weight: 600;
    }

    @keyframes pending-pulse {
      50% {
        opacity: 0.25;
        transform: scale(0.7);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .pending__dot {
        animation: none;
      }
    }
  `,
})
export class SessionPending implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pending = input.required<PendingSession>();

  /** La sesión ya quedó guardada: el padre decide a dónde navegar. */
  readonly verified = output<LoginResult>();
  /** Volver al formulario (canceló o la verificación venció). */
  readonly cancel = output<void>();

  protected readonly error = signal<ApiError | null>(null);
  protected readonly sent = signal(true);
  protected readonly minutes = signal(0);
  protected readonly resending = signal(false);
  protected readonly resent = signal(false);

  ngOnInit(): void {
    this.sent.set(this.pending().correo_enviado);
    this.minutes.set(this.pending().expira_en_minutos);

    // exhaustMap: si el backend tarda, no se apilan consultas.
    timer(POLL_INTERVAL_MS, POLL_INTERVAL_MS)
      .pipe(
        exhaustMap(() => this.auth.checkSession(this.pending().consulta)),
        filter((result): result is LoginResult => result !== null),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => this.verified.emit(result),
        error: (error: ApiError) => this.error.set(error),
      });
  }

  protected resend(): void {
    if (this.resending()) {
      return;
    }
    this.resending.set(true);
    this.resent.set(false);

    this.auth
      .resendSessionEmail(this.pending().consulta)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.sent.set(result.correo_enviado);
          this.resent.set(result.correo_enviado);
          this.minutes.set(result.expira_en_minutos);
          this.resending.set(false);
        },
        error: (error: ApiError) => {
          this.error.set(error);
          this.resending.set(false);
        },
      });
  }
}
