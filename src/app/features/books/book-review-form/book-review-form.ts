import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ApiError } from '@core/api/api-error';
import { ApiReview, ReviewRating } from '@core/models';
import { ReviewService } from '@core/services/review.service';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { StarRating } from '@shared/components/star-rating/star-rating';

/** Formulario para publicar la reseña propia de un libro. */
@Component({
  selector: 'bv-book-review-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ErrorBanner, StarRating],
  templateUrl: './book-review-form.html',
  styleUrl: './book-review-form.scss',
})
export class BookReviewForm {
  private readonly reviewService = inject(ReviewService);
  private readonly destroyRef = inject(DestroyRef);

  readonly bookId = input.required<number>();

  readonly published = output<ApiReview>();
  readonly cancelled = output<void>();

  protected readonly rating = signal<ReviewRating>(3);
  protected readonly comment = signal('');
  protected readonly publishing = signal(false);
  protected readonly error = signal<ApiError | null>(null);

  protected publish(): void {
    if (this.publishing()) {
      return;
    }
    this.publishing.set(true);
    this.error.set(null);

    this.reviewService
      .create({
        libro_id: this.bookId(),
        calificacion: this.rating(),
        comentario: this.comment().trim() || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => this.published.emit(created),
        error: (error: ApiError) => {
          this.error.set(error);
          this.publishing.set(false);
        },
      });
  }
}
