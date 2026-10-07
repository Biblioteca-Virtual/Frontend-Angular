import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * Estructura comun a todas las pantallas autenticadas: barra de navegacion y
 * outlet.
 *
 * Los enlaces se muestran en funcion de `auth.isLoggedIn()`, porque todo el
 * catalogo lo exige: en el backend los blueprints `books`, `readings`, `reviews`
 * y `roulette` llevan `@login_required`.
 */
@Component({
  selector: 'bv-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly router = inject(Router);

  protected readonly auth = inject(AuthService);

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
