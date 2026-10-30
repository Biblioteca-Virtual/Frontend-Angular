import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

/**
 * Diálogo de confirmación para acciones que no se pueden deshacer.
 *
 * Usa `<dialog>` nativo con `showModal()`, así que el navegador se ocupa del
 * foco, del fondo inerte y de cerrar con Escape (que cuenta como cancelar).
 *
 *     <bv-confirm-dialog
 *       [open]="confirming()"
 *       title="¿Eliminar este libro?"
 *       (confirmed)="remove()"
 *       (cancelled)="confirming.set(false)"
 *     />
 */
@Component({
  selector: 'bv-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="confirm" (cancel)="onCancel($event)" (click)="onBackdrop($event)">
      <h2 class="confirm__title">{{ title() }}</h2>
      @if (message()) {
        <p class="confirm__message">{{ message() }}</p>
      }
      <div class="confirm__actions">
        <button type="button" class="vl-btn vl-btn--ghost" (click)="cancelled.emit()">
          Cancelar
        </button>
        <button
          type="button"
          class="vl-btn vl-btn--danger-solid"
          [disabled]="busy()"
          (click)="confirmed.emit()"
        >
          {{ busy() ? 'Eliminando…' : confirmLabel() }}
        </button>
      </div>
    </dialog>
  `,
  styles: `
    .confirm {
      width: min(420px, calc(100vw - 2rem));
      padding: 1.5rem 1.75rem;
      border: none;
      border-radius: 20px;
      background: var(--vl-panel-bg);
      box-shadow: 0 20px 50px rgb(15 23 42 / 30%);
      color: #1a1a1a;

      &::backdrop {
        background: rgb(18 28 42 / 45%);
        backdrop-filter: blur(3px);
      }
    }

    .confirm__title {
      font-family: var(--vl-font-serif);
      font-size: 1.35rem;
      margin-bottom: 0.5rem;
    }

    .confirm__message {
      color: #4a4031;
      margin-bottom: 1.25rem;
    }

    .confirm__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `,
})
export class ConfirmDialog {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly message = input<string | null>(null);
  readonly confirmLabel = input('Eliminar');
  /** Deshabilita el botón mientras corre la petición. */
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const element = this.dialog().nativeElement;
      if (this.open() && !element.open) {
        element.showModal();
      } else if (!this.open() && element.open) {
        element.close();
      }
    });
  }

  /** Escape: el padre decide cerrar, para que `open` siga siendo la fuente de verdad. */
  protected onCancel(event: Event): void {
    event.preventDefault();
    if (!this.busy()) {
      this.cancelled.emit();
    }
  }

  /** Un clic fuera de la caja (sobre el backdrop) también cancela. */
  protected onBackdrop(event: MouseEvent): void {
    const element = this.dialog().nativeElement;
    if (event.target !== element || this.busy()) {
      return;
    }
    // El padding del <dialog> también es el propio elemento: solo cuenta un
    // clic fuera de su rectángulo.
    const box = element.getBoundingClientRect();
    const outside =
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom;
    if (outside) {
      this.cancelled.emit();
    }
  }
}
