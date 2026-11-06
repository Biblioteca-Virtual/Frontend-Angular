import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * Marca de ÁmbarLy: logo y nombre uno al lado del otro (el logo es opcional).
 *
 * "Ámbar" va en blanco y "Ly" en color ámbar, con la serif de los titulares.
 * Sobre fondos claros usar `chip`, que le pone un fondo oscuro para que el
 * blanco se lea.
 */
@Component({
  selector: 'bv-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "'brand brand--' + size()",
    '[class.brand--chip]': 'chip()',
    role: 'img',
    'aria-label': 'ÁmbarLy',
  },
  template: `
    @if (logo()) {
      <img class="brand__logo" src="/assets/images/logo-ambarly.svg" alt="" />
    }
    <span class="brand__name" aria-hidden="true">Ámbar<span class="brand__accent">Ly</span></span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      font-family: var(--bv-font-sans);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1;
      white-space: nowrap;
    }

    .brand__logo {
      width: 1.15em;
      height: 1.15em;
      flex: none;
    }

    .brand__name {
      color: #ffffff;
      text-shadow: 0 2px 10px rgb(0 0 0 / 35%);
    }

    // "Ly" con la tipografía de los titulares (serif, negrita e itálica).
    .brand__accent {
      padding-right: 0.06em;
      font-family: var(--vl-font-serif);
      font-style: italic;
      font-weight: 700;
      letter-spacing: 0;
      color: var(--vl-amber);
    }

    :host(.brand--sm) {
      font-size: 1.2rem;
    }

    :host(.brand--md) {
      font-size: 1.8rem;
    }

    :host(.brand--lg) {
      font-size: clamp(3.2rem, 6.5vw, 6.4rem);
      gap: 0.25em;

      .brand__name {
        text-shadow: 0 4px 22px rgb(0 0 0 / 40%);
      }
    }

    :host(.brand--chip) {
      padding: 0.3em 0.75em 0.3em 0.4em;
      background: rgb(14 27 16 / 72%);
      border-radius: 9999px;

      .brand__name {
        text-shadow: none;
      }
    }
  `,
})
export class Brand {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly chip = input(false, { transform: booleanAttribute });
  /** En el inicio va solo el nombre, para que quede centrado. */
  readonly logo = input(true, { transform: booleanAttribute });
}
