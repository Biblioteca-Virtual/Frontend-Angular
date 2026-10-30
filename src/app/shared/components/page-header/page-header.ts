import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Cabecera de pagina con titulo, descripcion opcional y espacio para acciones.
 *
 * Los `<ng-content>` con `select` permiten proyectar las acciones a la derecha
 * desde el componente padre sin duplicar el flexbox aqui.
 */
@Component({
  selector: 'bv-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <div class="header__text">
        <h1 class="vl-highlight-title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="header__subtitle vl-glass">{{ subtitle() }}</p>
        }
      </div>

      <div class="header__actions">
        <ng-content select="[bvPageActions]" />
      </div>
    </header>
  `,
  styles: `
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--bv-space-4);
      flex-wrap: wrap;
      margin-bottom: var(--bv-space-5);
    }

    // El título usa la clase global .vl-highlight-title, igual que el resto
    // de pantallas.
    .header__text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .header__subtitle {
      font-size: var(--bv-text-sm);
      color: #2b2b2b;
    }

    .header__actions:empty {
      display: none;
    }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
