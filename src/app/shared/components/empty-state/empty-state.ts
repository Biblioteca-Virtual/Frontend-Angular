import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Mensaje para listas sin resultados.
 *
 * Cubre los tres casos que se dan en esta aplicacion: la consulta no ha
 * devuelto nada, la lista esta realmente vacia, o el filtro activo no
 * coincide con ningun elemento.
 */
@Component({
  selector: 'bv-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <p class="empty__title">{{ title() }}</p>
      @if (description()) {
        <p class="empty__description">{{ description() }}</p>
      }
      <ng-content />
    </div>
  `,
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
}
