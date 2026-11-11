/** Pantalla de inicio de sesión. */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AccountService } from '@core/services/account.service';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { FolderButton } from '@shared/components/folder-button/folder-button';
import { WindowCard } from '@shared/components/window-card/window-card';
import { PendingLogin } from '../pending-login';
import { SessionPending } from '../session-pending/session-pending';

/**
 * `returnUrl` lo inyecta `authGuard` con la ruta que el usuario intentaba abrir.
 * Solo se acepta una ruta interna que empiece por `/`, para que el login no se
 * convierta en un redirector hacia sitios externos.
 */
function safeReturnUrl(value: string | null): string {
  return value !== null && value.startsWith('/') ? value : '/libros';
}

/**
 * El backend exige ambos campos y su mensaje es "email es requerido" / "password
 * es requerido". Las validaciones del cliente replican las suyas para no gastar
 * un 400 en cada intento, pero la autoridad sigue siendo la respuesta del servidor.
 */
@Component({
  selector: 'bv-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ErrorBanner, FolderButton, WindowCard, SessionPending],
  templateUrl: './login.html',
  styleUrl: '../auth-form.scss',
})
export class Login {
  private readonly account = inject(AccountService);
  private readonly returnUrl = safeReturnUrl(
    inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl'),
  );

  protected readonly flow = new PendingLogin();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  /** envía email y contraseña; si son correctos se pasa a esperar el correo */
  protected submit(): void {
    this.flow.submit(this.form, () => this.account.login(this.form.getRawValue()));
  }

  /** sesión verificada: vuelve a la página que se quería abrir */
  protected onVerified(): void {
    this.flow.goTo(this.returnUrl);
  }

  /** cancela la espera y limpia la contraseña para volver a intentar */
  protected cancelPending(): void {
    this.flow.reset();
    this.form.controls.password.reset();
  }
}
