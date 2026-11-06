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
import { Router, RouterLink } from '@angular/router';
import { resolveCoverUrl } from '@core/api/cover-url';
import { ApiError } from '@core/api/api-error';
import { ApiBook } from '@core/models';
import { BookService } from '@core/services/book.service';
import { AsyncState } from '@core/state/async-state';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { Spinner } from '@shared/components/spinner/spinner';
import { AutorNombrePipe } from '@shared/pipes/autor-nombre.pipe';
import { AddToCollection } from '../add-to-collection/add-to-collection';
import { bookPercentage, locationLabel } from '../book-display';
import { BookProgressEditor } from '../book-progress-editor/book-progress-editor';
import { BookReviewsPanel } from '../book-reviews-panel/book-reviews-panel';

/** Ficha del libro; el progreso, las colecciones y las reseñas van en sus partes. */
@Component({
  selector: 'bv-book-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Spinner,
    ErrorBanner,
    ConfirmDialog,
    AutorNombrePipe,
    AddToCollection,
    BookProgressEditor,
    BookReviewsPanel,
  ],
  templateUrl: './book-detail.html',
  styleUrls: ['../book-info.scss', './book-detail.scss'],
})
export class BookDetail {
  private readonly books = inject(BookService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly bookId = input.required<number | string>();

  private readonly numericId = computed(() => Number(this.bookId()));

  protected readonly state = new AsyncState<ApiBook>();
  protected readonly actionError = signal<ApiError | null>(null);
  protected readonly deleting = signal(false);
  protected readonly confirmingDelete = signal(false);

  protected readonly percentage = computed(() => bookPercentage(this.state.data()));
  protected readonly coverUrl = computed(() => resolveCoverUrl(this.state.data()?.imagen_portada));
  protected readonly location = computed(() => {
    const book = this.state.data();
    return book ? locationLabel(book.ubicacion) : '';
  });

  constructor() {
    effect(() => {
      const id = this.numericId();
      if (!isNaN(id)) {
        void this.state.run(this.books.getById(id));
      }
    });
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
}
