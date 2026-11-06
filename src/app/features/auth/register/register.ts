import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { switchMap } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountService } from '@core/services/account.service';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { FolderButton } from '@shared/components/folder-button/folder-button';
import { WindowCard } from '@shared/components/window-card/window-card';
import { PendingLogin } from '../pending-login';
import { SessionPending } from '../session-pending/session-pending';

/** Longitud minima de contraseña impuesta por `app/schemas/user_schema.py`. */
const MIN_PASSWORD_LENGTH = 6;

/**
 * Crea la cuenta e inicia sesión enseguida, para no pedir la contraseña dos
 * veces. Como todo inicio de sesión, manda el correo de "Verificar Sesión" y se
 * espera a que lo toque. Si el email ya existe el backend responde 409.
 *
 * Al cancelar, la cuenta ya existe: se vuelve al login para intentarlo de nuevo.
 */
@Component({
  selector: 'bv-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ErrorBanner, FolderButton, WindowCard, SessionPending],
  templateUrl: './register.html',
  styleUrl: '../auth-form.scss',
})
export class Register {
  private readonly account = inject(AccountService);

  protected readonly flow = new PendingLogin();
  protected readonly minPasswordLength = MIN_PASSWORD_LENGTH;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
  });

  protected submit(): void {
    this.flow.submit(this.form, () => {
      const value = this.form.getRawValue();
      return this.account
        .register(value)
        .pipe(
          switchMap(() => this.account.login({ email: value.email, password: value.password })),
        );
    });
  }

  protected onVerified(): void {
    this.flow.goTo('/libros');
  }

  protected cancelPending(): void {
    this.flow.goTo('/login');
  }
}
