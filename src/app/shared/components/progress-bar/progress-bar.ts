import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Barra de progreso de lectura.
 *
 * `size="sm"` es la versión fina que va bajo las portadas de la biblioteca; la
 * normal acompaña al porcentaje en el detalle del libro.
 */
@Component({
  selector: 'bv-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-valuenow]': 'clamped()',
    '[attr.aria-label]': 'label()',
    '[class.progress--sm]': "size() === 'sm'",
    '[class.progress--done]': 'clamped() === 100',
  },
  template: `<span class="progress__fill" [style.width.%]="clamped()"></span>`,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 10px;
      background: #ead9b4;
      border-radius: 999px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgb(0 0 0 / 12%);
    }

    :host(.progress--sm) {
      height: 5px;
    }

    .progress__fill {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #e5ac31, #d08a1d);
      border-radius: inherit;
      transition: width 0.4s ease;
    }

    :host(.progress--done) .progress__fill {
      background: linear-gradient(90deg, #5a9a2a, #3f7d1c);
    }
  `,
})
export class ProgressBar {
  /** Porcentaje 0-100; los valores fuera de rango se recortan. */
  readonly value = input(0);
  readonly size = input<'md' | 'sm'>('md');
  readonly label = input('Progreso de lectura');

  protected readonly clamped = computed(() =>
    Math.min(100, Math.max(0, Math.round(this.value() || 0))),
  );
}
