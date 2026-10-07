import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/api/api-error';
import { AsyncState } from '@core/api/async-state';
import { ApiReading, ReadingStatus } from '@core/models';
import { ReadingService } from '@core/services/reading.service';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { PageHeader } from '@shared/components/page-header/page-header';
import { Spinner } from '@shared/components/spinner/spinner';
import { BvDatePipe } from '@shared/pipes/bv-date.pipe';

/** Filtros de la pantalla. El backend no pagina, devuelve el listado completo. */
type ReadingFilter = ReadingStatus | 'todos';

@Component({
  selector: 'bv-reading-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, Spinner, EmptyState, ErrorBanner, BvDatePipe],
  templateUrl: './reading-list.html',
  styleUrl: './reading-list.scss',
})
export class ReadingList {
  private readonly readings = inject(ReadingService);

  protected readonly state = new AsyncState<ApiReading[]>();
  protected readonly actionError = signal<ApiError | null>(null);
  protected readonly filter = signal<ReadingFilter>('todos');

  /** Opciones del filtro. `null` en lugar de `'todos'` porque no es un estado. */
  protected readonly filters: readonly { value: ReadingFilter; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'activo', label: 'En préstamo' },
    { value: 'devuelto', label: 'Devueltos' },
  ];

  private readonly pendingId = signal<number | null>(null);

  /** El filtro se aplica en el servidor: `GET /api/readings/?estado=`. */
  protected readonly visible = computed(() => {
    const items = this.state.data() ?? [];
    const current = this.filter();
    return current === 'todos' ? items : items.filter((item) => item.estado === current);
  });

  constructor() {
    effect(() => {
      const current = this.filter();
      void this.state.run(
        current === 'todos' ? this.readings.list() : this.readings.list({ estado: current }),
      );
    });
  }

  protected setFilter(value: ReadingFilter): void {
    this.filter.set(value);
  }

  protected isPending(id: number): boolean {
    return this.pendingId() === id;
  }

  /**
   * Marca el prestamo como devuelto.
   *
   * Importante: llegar a `progreso: 100` NO devuelve el libro por si solo. El
   * backend exige un `estado: "devuelto"` explicito, y solo entonces fija
   * `fecha_devolucion`.
   */
  protected returnBook(reading: ApiReading): void {
    if (this.pendingId() !== null) {
      return;
    }

    this.pendingId.set(reading.id);
    this.actionError.set(null);

    this.readings
      .returnBook(reading.id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (updated) => this.replace(updated),
        error: (error: ApiError) => {
          this.actionError.set(error);
          this.pendingId.set(null);
        },
      });
  }

  protected updateProgress(reading: ApiReading, progreso: number): void {
    if (this.pendingId() !== null) {
      return;
    }

    this.pendingId.set(reading.id);
    this.actionError.set(null);

    this.readings
      .update(reading.id, { progreso })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (updated) => this.replace(updated),
        error: (error: ApiError) => {
          this.actionError.set(error);
          this.pendingId.set(null);
        },
      });
  }

  private replace(updated: ApiReading): void {
    this.pendingId.set(null);
    this.state.setData(
      (this.state.data() ?? []).map((item) => (item.id === updated.id ? updated : item)),
    );
  }
}
