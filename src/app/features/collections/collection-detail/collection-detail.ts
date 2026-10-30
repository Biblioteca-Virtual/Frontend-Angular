import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiError } from '@core/api/api-error';
import { AsyncState } from '@core/api/async-state';
import { ApiBook, ApiCollection } from '@core/models';
import { BookService } from '@core/services/book.service';
import { CollectionService } from '@core/services/collection.service';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { Spinner } from '@shared/components/spinner/spinner';
import { WindowCard } from '@shared/components/window-card/window-card';

/** Contenido de una colección (Adentro de colecciones.svg). */
@Component({
  selector: 'bv-collection-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, ConfirmDialog, ErrorBanner, Spinner, WindowCard],
  templateUrl: './collection-detail.html',
  styleUrls: ['../collections.scss', './collection-detail.scss'],
})
export class CollectionDetail {
  private readonly collections = inject(CollectionService);
  private readonly books = inject(BookService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Parámetro de ruta `colecciones/:collectionId`. */
  readonly collectionId = input.required<number | string>();

  readonly numericId = computed(() => Number(this.collectionId()));

  protected readonly state = new AsyncState<ApiCollection>();
  protected readonly catalog = new AsyncState<ApiBook[]>();
  protected readonly actionError = signal<ApiError | null>(null);
  protected readonly busy = signal(false);
  protected readonly confirmingDelete = signal(false);

  protected readonly renaming = signal(false);
  protected readonly nombre = signal('');
  protected readonly libroId = signal<number | ''>('');

  /** Libros del catálogo que todavía no están en la colección. */
  protected readonly available = computed(() => {
    const inside = new Set((this.state.data()?.libros ?? []).map((book) => book.id));
    return (this.catalog.data() ?? []).filter((book) => !inside.has(book.id));
  });

  /** La portada de la colección es la del primer libro que tenga una. */
  protected readonly coverUrl = computed(() => {
    const withCover = (this.state.data()?.libros ?? []).find((book) => book.imagen_portada);
    return this.books.getCoverUrl(withCover?.imagen_portada);
  });

  constructor() {
    effect(() => {
      const id = this.numericId();
      if (!isNaN(id)) {
        void this.state.run(this.collections.getById(id));
      }
    });

    void this.catalog.run(this.books.list());
  }

  protected startRenaming(collection: ApiCollection): void {
    this.nombre.set(collection.nombre);
    this.actionError.set(null);
    this.renaming.set(true);
  }

  protected cancelRenaming(): void {
    this.renaming.set(false);
    this.actionError.set(null);
  }

  protected rename(): void {
    const nombre = this.nombre().trim();
    if (!nombre) {
      return;
    }
    this.mutate(this.collections.rename(this.numericId(), nombre), () =>
      this.renaming.set(false),
    );
  }

  protected addBook(): void {
    const libroId = this.libroId();
    if (libroId === '') {
      return;
    }
    this.mutate(this.collections.addBook(this.numericId(), libroId), () => this.libroId.set(''));
  }

  protected removeBook(book: ApiBook): void {
    this.mutate(this.collections.removeBook(this.numericId(), book.id));
  }

  protected remove(): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);

    this.collections
      .delete(this.numericId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/colecciones']),
        error: (error: ApiError) => {
          this.actionError.set(error);
          this.busy.set(false);
          this.confirmingDelete.set(false);
        },
      });
  }

  /** Ejecuta una modificación que devuelve la colección actualizada. */
  private mutate(request: Observable<ApiCollection>, onSuccess?: () => void): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        this.state.setData(updated);
        this.busy.set(false);
        onSuccess?.();
      },
      error: (error: ApiError) => {
        this.actionError.set(error);
        this.busy.set(false);
      },
    });
  }
}
