import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/api/api-error';
import { AsyncState } from '@core/api/async-state';
import { ApiReview, CreateReviewRequest, ReviewRating } from '@core/models';
import { AuthService } from '@core/services/auth.service';
import { ReviewService } from '@core/services/review.service';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { PageHeader } from '@shared/components/page-header/page-header';
import { Spinner } from '@shared/components/spinner/spinner';
import { BvDatePipe } from '@shared/pipes/bv-date.pipe';

@Component({
  selector: 'bv-review-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, PageHeader, Spinner, EmptyState, ErrorBanner, BvDatePipe],
  templateUrl: './review-list.html',
  styleUrl: './review-list.scss',
})
export class ReviewList {
  private readonly reviews = inject(ReviewService);
  private readonly auth = inject(AuthService);

  protected readonly state = new AsyncState<ApiReview[]>();
  protected readonly actionError = signal<ApiError | null>(null);
  protected readonly submitting = signal(false);

  protected readonly ratings: readonly ReviewRating[] = [1, 2, 3, 4, 5];

  protected readonly draft = {
    libro_id: '',
    calificacion: 3 as ReviewRating,
    comentario: '',
  };

  /** Marca las reseñas del usuario actual, para gestionarlas de forma distinta. */
  protected readonly mine = computed(() => {
    const userId = this.auth.user()?.id;
    return new Set(
      (this.state.data() ?? []).filter((r) => r.usuario_id === userId).map((r) => r.id),
    );
  });

  constructor() {
    void this.state.run(this.reviews.list());
  }

  protected isMine(review: ApiReview): boolean {
    return this.mine().has(review.id);
  }

  protected stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  /**
   * Crea una reseña.
   *
   * El backend impone una reseña por usuario y libro (`UNIQUE (libro_id,
   * usuario_id)`), asi que repetirla devuelve 409. Y solo se puede modificar o
   * borrar la propia: sobre la de otro usuario responde 404.
   */
  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    const libroId = Number(this.draft.libro_id);
    if (!Number.isInteger(libroId) || libroId < 1) {
      return;
    }

    this.submitting.set(true);
    this.actionError.set(null);

    const payload: CreateReviewRequest = {
      libro_id: libroId,
      calificacion: this.draft.calificacion,
      comentario: this.draft.comentario.trim() || null,
    };

    this.reviews
      .create(payload)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (created) => {
          this.state.setData([...(this.state.data() ?? []), created]);
          this.draft.libro_id = '';
          this.draft.calificacion = 3;
          this.draft.comentario = '';
          this.submitting.set(false);
        },
        error: (error: ApiError) => {
          this.actionError.set(error);
          this.submitting.set(false);
        },
      });
  }

  protected remove(review: ApiReview): void {
    this.actionError.set(null);

    this.reviews
      .delete(review.id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () =>
          this.state.setData((this.state.data() ?? []).filter((item) => item.id !== review.id)),
        error: (error: ApiError) => this.actionError.set(error),
      });
  }
}
