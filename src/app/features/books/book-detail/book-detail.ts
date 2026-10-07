import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '@core/api/api-error';
import { AsyncState } from '@core/api/async-state';
import { ApiBook, ApiReview } from '@core/models';
import { BookService } from '@core/services/book.service';
import { ReviewService } from '@core/services/review.service';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { Spinner } from '@shared/components/spinner/spinner';
import { AutorNombrePipe } from '@shared/pipes/autor-nombre.pipe';
import { BvDatePipe } from '@shared/pipes/bv-date.pipe';

@Component({
  selector: 'bv-book-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Spinner, EmptyState, ErrorBanner, AutorNombrePipe, BvDatePipe],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.scss',
})
export class BookDetail {
  private readonly books = inject(BookService);
  private readonly reviewService = inject(ReviewService);
  private readonly router = inject(Router);

  /** Parametro de ruta `libros/:id`. */
  readonly bookId = input.required<number>();

  protected readonly state = new AsyncState<ApiBook>();
  protected readonly allReviews = new AsyncState<ApiReview[]>();
  protected readonly actionError = signal<ApiError | null>(null);
  protected readonly deleting = signal(false);

  /**
   * El backend no admite filtrar resenas por libro (`GET /api/reviews/` no
   * tiene parametros), asi que se piden todas y se filtran aqui. Solo tiene
   * sentido mientras el catalogo de resenas siga siendo pequeño.
   */
  protected readonly reviews = computed(() =>
    (this.allReviews.data() ?? []).filter((review) => review.libro_id === this.bookId()),
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
    // `bookId` es un input de ruta, asi que ambos efectos se reactivan al
    // navegar entre dos libros.
    effect(() => {
      void this.state.run(this.books.getById(this.bookId()));
    });

    effect(() => {
      void this.allReviews.run(this.reviewService.list());
    });
  }

  protected remove(): void {
    if (this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.actionError.set(null);

    this.books
      .delete(this.bookId())
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => void this.router.navigate(['/libros']),
        error: (error: ApiError) => {
          // El 409 es el caso habitual: si el libro tiene prestamos devuelve
          // "Referencia invalida..." porque `prestamos.libro_id` no tiene
          // ON DELETE CASCADE.
          this.actionError.set(error);
          this.deleting.set(false);
        },
      });
  }

  protected stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
