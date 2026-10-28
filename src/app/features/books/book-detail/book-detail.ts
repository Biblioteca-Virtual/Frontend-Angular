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
import { ApiBook, ApiReview } from '@core/models';
import { BookService } from '@core/services/book.service';
import { ReviewService } from '@core/services/review.service';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { Spinner } from '@shared/components/spinner/spinner';
import { BvDatePipe } from '@shared/pipes/bv-date.pipe';

@Component({
  selector: 'bv-book-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, Spinner, EmptyState, ErrorBanner, BvDatePipe],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.scss',
})
export class BookDetail {
  private readonly books = inject(BookService);
  private readonly reviewService = inject(ReviewService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Parámetro de ruta `libros/:bookId`. */
  readonly bookId = input.required<number | string>();

  readonly numericId = computed(() => Number(this.bookId()));

  protected readonly state = new AsyncState<ApiBook>();
  protected readonly allReviews = new AsyncState<ApiReview[]>();
  protected readonly actionError = signal<ApiError | null>(null);
  protected readonly deleting = signal(false);

  // Edición interactiva de páginas
  protected readonly isEditingProgress = signal(false);
  protected readonly editPaginasTotales = signal(0);
  protected readonly editPaginasLeidas = signal(0);
  protected readonly savingProgress = signal(false);

  protected readonly reviews = computed(() =>
    (this.allReviews.data() ?? []).filter((review) => review.libro_id === this.numericId()),
  );

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
      void this.allReviews.run(this.reviewService.list());
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
        },
      });
  }

  protected stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
