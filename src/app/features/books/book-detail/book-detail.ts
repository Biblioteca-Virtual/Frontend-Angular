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
import { ApiError } from '@core/api/api-error';
import { AsyncState } from '@core/api/async-state';
import { ApiBook, ApiCollection, ApiReview, BOOK_LOCATIONS, BookLocation } from '@core/models';
import { BookService } from '@core/services/book.service';
import { CollectionService } from '@core/services/collection.service';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { ProgressBar } from '@shared/components/progress-bar/progress-bar';
import { Spinner } from '@shared/components/spinner/spinner';
import { AutorNombrePipe } from '@shared/pipes/autor-nombre.pipe';
import { BvDatePipe } from '@shared/pipes/bv-date.pipe';

@Component({
  selector: 'bv-book-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    Spinner,
    EmptyState,
    ErrorBanner,
    ConfirmDialog,
    ProgressBar,
    BvDatePipe,
    AutorNombrePipe,
  ],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.scss',
})
export class BookDetail {
  private readonly books = inject(BookService);
  private readonly collectionService = inject(CollectionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Parámetro de ruta `libros/:bookId`. */
  readonly bookId = input.required<number | string>();

  readonly numericId = computed(() => Number(this.bookId()));

  protected readonly state = new AsyncState<ApiBook>();
  protected readonly bookReviews = new AsyncState<ApiReview[]>();
  protected readonly actionError = signal<ApiError | null>(null);
  protected readonly deleting = signal(false);
  protected readonly confirmingDelete = signal(false);

  // Edición interactiva de páginas
  protected readonly isEditingProgress = signal(false);
  protected readonly editPaginasTotales = signal(0);
  protected readonly editPaginasLeidas = signal(0);
  protected readonly savingProgress = signal(false);

  // Agregar a colección
  protected readonly collections = new AsyncState<ApiCollection[]>();
  protected readonly collectionId = signal<number | ''>('');
  protected readonly addingToCollection = signal(false);
  protected readonly addedTo = signal<ApiCollection | null>(null);

  protected readonly reviews = computed(() => this.bookReviews.data() ?? []);

  protected readonly averageRating = computed(() => {
    const reviews = this.reviews();
    if (reviews.length === 0) {
      return null;
    }
    const total = reviews.reduce((sum, review) => sum + review.calificacion, 0);
    return total / reviews.length;
  });

  constructor() {
    effect(() => {
      const id = this.numericId();
      if (!isNaN(id)) {
        void this.state.run(this.books.getById(id));
      }
    });

    effect(() => {
      const id = this.numericId();
      if (!isNaN(id)) {
        void this.bookReviews.run(this.books.reviews(id));
      }
    });

    void this.collections.run(this.collectionService.list());
  }

  protected addToCollection(book: ApiBook): void {
    const collectionId = this.collectionId();
    if (collectionId === '' || this.addingToCollection()) {
      return;
    }
    this.addingToCollection.set(true);
    this.addedTo.set(null);
    this.actionError.set(null);

    this.collectionService
      .addBook(collectionId, book.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (collection) => {
          this.addedTo.set(collection);
          this.collectionId.set('');
          this.addingToCollection.set(false);
        },
        error: (err: ApiError) => {
          this.actionError.set(err);
          this.addingToCollection.set(false);
        },
      });
  }

  protected getPercentage(book: ApiBook | null): number {
    if (!book) {
      return 0;
    }
    if (book.porcentaje_lectura !== undefined && book.porcentaje_lectura !== null) {
      return book.porcentaje_lectura;
    }
    const totales = book.paginas_totales || 0;
    const leidas = book.paginas_leidas || 0;
    if (totales <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, Math.round((leidas / totales) * 100)));
  }

  protected previewPercentage(): number {
    const totales = Number(this.editPaginasTotales()) || 0;
    const leidas = Number(this.editPaginasLeidas()) || 0;
    if (totales <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, Math.round((leidas / totales) * 100)));
  }

  protected startEditingProgress(book: ApiBook): void {
    this.editPaginasTotales.set(book.paginas_totales || 0);
    this.editPaginasLeidas.set(book.paginas_leidas || 0);
    this.isEditingProgress.set(true);
  }

  protected cancelEditingProgress(): void {
    this.isEditingProgress.set(false);
  }

  protected saveProgress(bookId: number): void {
    if (this.savingProgress()) {
      return;
    }
    this.savingProgress.set(true);
    this.actionError.set(null);

    const payload = {
      paginas_totales: Number(this.editPaginasTotales()) || 0,
      paginas_leidas: Number(this.editPaginasLeidas()) || 0,
    };

    this.books
      .updateProgress(bookId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedBook) => {
          this.state.setData(updatedBook);
          this.isEditingProgress.set(false);
          this.savingProgress.set(false);
        },
        error: (err: ApiError) => {
          this.actionError.set(err);
          this.savingProgress.set(false);
        },
      });
  }

  protected locationLabel(location: BookLocation): string {
    return BOOK_LOCATIONS.find((item) => item.value === location)?.label ?? 'Físico';
  }

  protected getCoverUrl(path: string | null | undefined): string | null {
    return this.books.getCoverUrl(path);
  }

  protected remove(): void {
    if (this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.actionError.set(null);

    this.books
      .delete(this.numericId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/libros']),
        error: (error: ApiError) => {
          this.actionError.set(error);
          this.deleting.set(false);
          this.confirmingDelete.set(false);
        },
      });
  }

  protected stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
