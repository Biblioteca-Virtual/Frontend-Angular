import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Indicador de carga con texto opcional.
 *
 * Usa `role="status"` y `aria-live` para que un lector de pantalla anuncie el
 * cambio de estado sin que haya que mover el foco.
 */
@Component({
  selector: 'bv-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="spinner" role="status" aria-live="polite">
      <span class="spinner__circle" aria-hidden="true"></span>
      @if (label()) {
        <span class="spinner__label">{{ label() }}</span>
      }
    </div>
  `,
  styleUrl: './spinner.scss',
})
export class Spinner {
  /** Texto a mostrar junto al spinner. Por defecto, accesible pero invisible. */
  readonly label = input('Cargando…');
}
