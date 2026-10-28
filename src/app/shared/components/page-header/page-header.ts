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

    h1 {
      position: relative;
      display: inline-block;
      font-family: var(--vl-font-serif);
      font-style: italic;
      font-weight: 700;
      font-size: clamp(2.2rem, 4.5vw, 3.5rem);
      line-height: 1.1;
      color: #000;
      margin-bottom: var(--bv-space-2);
      z-index: 1;

      &::before {
        content: '';
        position: absolute;
        left: -6px;
        right: -6px;
        bottom: 4px;
        height: 48%;
        background-color: var(--vl-highlight);
        z-index: -1;
      }
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
