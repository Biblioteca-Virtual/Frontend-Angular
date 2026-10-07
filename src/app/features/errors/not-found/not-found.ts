import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'bv-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="bv-card not-found">
      <p class="not-found__code">404</p>
      <h1>Página no encontrada</h1>
      <p class="bv-muted">La ruta que buscas no existe en la aplicación.</p>
      <a class="bv-btn" routerLink="/libros">Ir al catálogo</a>
    </div>
  `,
  styles: `
    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--bv-space-3);
      max-width: 30rem;
      margin-inline: auto;
      text-align: center;
    }

    .not-found__code {
      font-size: var(--bv-text-2xl);
      font-weight: 800;
      color: var(--bv-primary);
    }
  `,
})
export class NotFound {}
