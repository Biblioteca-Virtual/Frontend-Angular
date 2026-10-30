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
import { AsyncState } from '@core/api/async-state';
import { ApiBook } from '@core/models';
import { BookService } from '@core/services/book.service';
import { RouletteService } from '@core/services/roulette.service';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { Spinner } from '@shared/components/spinner/spinner';

/** Lugares de la copa donde cuelgan hojas: x, y y una leve inclinación. */
const LEAF_SPOTS: readonly [number, number, number][] = [
  [98, 262, 12],
  [146, 288, 4],
  [196, 296, -3],
  [246, 294, 6],
  [294, 282, -6],
  [338, 258, -12],
  [72, 206, 18],
  [362, 200, -18],
  [222, 304, 0],
];
/** Lo que tarda la hoja en caer; coincide con `leaf-fall` en el SCSS. */
const FALL_MS = 1100;

/** Círculos (cx, cy, r) que forman la copa, al estilo de un árbol de caricatura. */
const CROWN = [
  [110, 190, 55], [150, 130, 60], [210, 100, 62], [275, 128, 60], [322, 185, 55],
  [302, 242, 50], [242, 252, 55], [172, 252, 55], [116, 242, 45], [80, 214, 40],
  [348, 224, 40], [210, 172, 82], [172, 82, 45], [252, 80, 45],
];
const SHADE = [[162, 262, 36], [252, 264, 36], [322, 244, 28], [100, 238, 26], [212, 236, 40]];
const LIGHT = [
  [150, 112, 34], [212, 82, 38], [272, 108, 32], [112, 176, 28], [204, 160, 40], [300, 172, 26],
];

/**
 * Árbol de lectura: el usuario "agarra una hoja" y descubre al azar su próxima
 * lectura. El sorteo lo hace el backend y solo considera los libros que todavía
 * no terminó.
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

  protected readonly crown = CROWN;
  protected readonly shade = SHADE;
  protected readonly light = LIGHT;

  protected readonly catalog = new AsyncState<ApiBook[]>();
  protected readonly picking = signal(false);
  protected readonly pickedLeaf = signal<number | null>(null);
  protected readonly result = signal<ApiBook | null>(null);
  protected readonly error = signal<ApiError | null>(null);

  protected readonly pendingCount = computed(
    () => (this.catalog.data() ?? []).filter((book) => !book.terminado).length,
  );

  /** Una hoja por libro pendiente, hasta llenar los lugares de la copa. */
  protected readonly leaves = computed(() =>
    LEAF_SPOTS.slice(0, Math.min(this.pendingCount(), LEAF_SPOTS.length)).map(
      ([x, y, tilt], index) => ({ index, x, y, tilt }),
    ),
  );

  constructor() {
    void this.catalog.run(this.books.list());
  }

  protected pick(index: number): void {
    if (this.picking()) {
      return;
    }
    this.picking.set(true);
    this.pickedLeaf.set(index);
    this.error.set(null);
    this.result.set(null);

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const fallen = new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : FALL_MS));

    this.roulette
      .spin()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // El resultado aparece cuando la hoja termina de caer.
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

  /** Vuelve a colgar la hoja para poder elegir otra vez. */
  protected reset(): void {
    this.result.set(null);
    this.pickedLeaf.set(null);
  }

  protected getCoverUrl(path: string | null | undefined): string | null {
    return this.books.getCoverUrl(path);
  }
}
