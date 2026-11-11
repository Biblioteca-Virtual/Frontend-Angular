/** Panel de reseñas de la comunidad dentro del detalle del libro. */
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
import { ApiError } from '@core/api/api-error';
import { ApiReview } from '@core/models';
import { AuthService } from '@core/services/auth.service';
import { ReviewService } from '@core/services/review.service';
import { AsyncState } from '@core/state/async-state';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { Spinner } from '@shared/components/spinner/spinner';
import { StarRating } from '@shared/components/star-rating/star-rating';
import { BvDatePipe } from '@shared/pipes/bv-date.pipe';
import { BookReviewForm } from '../book-review-form/book-review-form';

/**
 * Reseñas de la comunidad sobre un libro.
 *
 * `hasOwnReview` compara también `libro_id` porque el listado incluye reseñas de
 * libros con un título equivalente, y el límite de una reseña es por libro. El
 * listado viene ordenado de la más reciente a la más antigua.
 */
@Component({
  selector: 'bv-book-reviews-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ConfirmDialog,
    EmptyState,
    ErrorBanner,
    Spinner,
    StarRating,
    BvDatePipe,
    BookReviewForm,
  ],
  templateUrl: './book-reviews-panel.html',
  styleUrl: './book-reviews-panel.scss',
})
export class BookReviewsPanel {
  private readonly reviewService = inject(ReviewService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  /** libro del que se muestran las reseñas */
  readonly bookId = input.required<number>();

  /** reseñas cargadas, error de una acción, formulario abierto y borrado pendiente */
  protected readonly state = new AsyncState<ApiReview[]>();
  protected readonly actionError = signal<ApiError | null>(null);
  protected readonly writing = signal(false);
  protected readonly reviewToDelete = signal<ApiReview | null>(null);
  protected readonly deleting = signal(false);

  /** id del usuario logueado y lista de reseñas lista para la plantilla */
  protected readonly userId = computed(() => this.auth.user()?.id);
  protected readonly reviews = computed(() => this.state.data() ?? []);

  /** verdadero cuando el usuario ya reseñó este mismo libro */
  protected readonly hasOwnReview = computed(() =>
    this.reviews().some(
      (review) => review.usuario_id === this.userId() && review.libro_id === this.bookId(),
    ),
  );

  /** promedio de estrellas; null sin reseñas */
  protected readonly averageRating = computed(() => {
    const reviews = this.reviews();
    if (reviews.length === 0) {
      return null;
    }
    return reviews.reduce((sum, review) => sum + review.calificacion, 0) / reviews.length;
  });

  /** carga las reseñas cada vez que cambia el libro */
  constructor() {
    effect(() => {
      void this.state.run(this.reviewService.forBook(this.bookId()));
    });
  }

  /** abre el formulario de reseña */
  protected startWriting(): void {
    this.actionError.set(null);
    this.writing.set(true);
  }

  /** agrega la reseña publicada al principio de la lista */
  protected onPublished(created: ApiReview): void {
    this.state.setData([created, ...this.reviews()]);
    this.writing.set(false);
  }

  /** borra la reseña propia y la saca de la lista */
  protected deleteReview(review: ApiReview): void {
    if (this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.actionError.set(null);

    this.reviewService
      .delete(review.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.state.setData(this.reviews().filter((item) => item.id !== review.id));
          this.reviewToDelete.set(null);
          this.deleting.set(false);
        },
        error: (error: ApiError) => {
          this.actionError.set(error);
          this.reviewToDelete.set(null);
          this.deleting.set(false);
        },
      });
  }
}
