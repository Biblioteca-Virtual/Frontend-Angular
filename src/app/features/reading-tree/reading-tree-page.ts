/** Pantalla del árbol de lectura, que elige al azar el próximo libro a leer. */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/api/api-error';
import { resolveCoverUrl } from '@core/api/cover-url';
import { ApiBook } from '@core/models';
import { BookService } from '@core/services/book.service';
import { RouletteService } from '@core/services/roulette.service';
import { AsyncState } from '@core/state/async-state';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { Spinner } from '@shared/components/spinner/spinner';
import { TREE, leavesFor, whenLeafFalls } from './reading-tree-scene';

/**
 * Árbol de lectura: el usuario "agarra una hoja" y descubre al azar su próxima
 * lectura. El sorteo lo hace el backend y solo considera los libros que todavía
 * no terminó. El resultado aparece cuando la hoja termina de caer, y `reset` la
 * vuelve a colgar para poder elegir otra vez.
 */
@Component({
  selector: 'bv-reading-tree-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Spinner, ErrorBanner],
  templateUrl: './reading-tree-page.html',
  styleUrl: './reading-tree-page.scss',
})
export class ReadingTreePage {
  private readonly roulette = inject(RouletteService);
  private readonly books = inject(BookService);
  private readonly destroyRef = inject(DestroyRef);

  /** dibujo del árbol y función para armar la url de las portadas */
  protected readonly tree = TREE;
  protected readonly coverUrl = resolveCoverUrl;

  /** libros del usuario, sorteo en curso, hoja elegida, libro sorteado y error */
  protected readonly catalog = new AsyncState<ApiBook[]>();
  protected readonly picking = signal(false);
  protected readonly pickedLeaf = signal<number | null>(null);
  protected readonly result = signal<ApiBook | null>(null);
  protected readonly error = signal<ApiError | null>(null);

  /** cantidad de libros sin terminar: una hoja por cada uno */
  protected readonly pendingCount = computed(
    () => (this.catalog.data() ?? []).filter((book) => !book.terminado).length,
  );

  /** hojas que se dibujan en la copa */
  protected readonly leaves = computed(() => leavesFor(this.pendingCount()));

  /** al abrir la pantalla carga los libros para contar los pendientes */
  constructor() {
    void this.catalog.run(this.books.list());
  }

  /** agarra una hoja: pide el sorteo y muestra el libro cuando la hoja termina de caer */
  protected pick(index: number): void {
    if (this.picking()) {
      return;
    }
    this.picking.set(true);
    this.pickedLeaf.set(index);
    this.error.set(null);
    this.result.set(null);

    const fallen = whenLeafFalls();

    this.roulette
      .spin()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (book) =>
          void fallen.then(() => {
            this.result.set(book);
            this.picking.set(false);
          }),
        error: (error: ApiError) => {
          this.error.set(error);
          this.picking.set(false);
          this.pickedLeaf.set(null);
        },
      });
  }

  /** vuelve a colgar la hoja para sortear de nuevo */
  protected reset(): void {
    this.result.set(null);
    this.pickedLeaf.set(null);
  }
}
