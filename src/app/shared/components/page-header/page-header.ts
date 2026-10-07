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
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p class="bv-muted">{{ subtitle() }}</p>
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

    .header__text > p {
      margin-top: var(--bv-space-1);
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
