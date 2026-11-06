import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ApiError } from '@core/api/api-error';
import { ApiBook } from '@core/models';
import { BookService } from '@core/services/book.service';
import { ProgressBar } from '@shared/components/progress-bar/progress-bar';
import { bookPercentage, readingPercentage } from '../book-display';

/**
 * Filas de páginas y progreso de la ficha del libro, editables en el lugar.
 *
 * `failed` avisa al padre del error (o de `null` al reintentar), que lo muestra
 * junto a los de las demás acciones de la ficha.
 */
@Component({
  selector: 'bv-book-progress-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ProgressBar],
  templateUrl: './book-progress-editor.html',
  styleUrls: ['../book-info.scss', './book-progress-editor.scss'],
})
export class BookProgressEditor {
  private readonly books = inject(BookService);
  private readonly destroyRef = inject(DestroyRef);

  readonly book = input.required<ApiBook>();

  readonly saved = output<ApiBook>();
  readonly failed = output<ApiError | null>();

  protected readonly editing = signal(false);
  protected readonly totalPages = signal(0);
  protected readonly readPages = signal(0);
  protected readonly saving = signal(false);

  protected readonly percentage = computed(() =>
    this.editing()
      ? readingPercentage(this.totalPages(), this.readPages())
      : bookPercentage(this.book()),
  );

  protected startEditing(): void {
    this.totalPages.set(this.book().paginas_totales || 0);
    this.readPages.set(this.book().paginas_leidas || 0);
    this.editing.set(true);
  }

  protected save(): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.failed.emit(null);

    this.books
      .updateProgress(this.book().id, {
        paginas_totales: Number(this.totalPages()) || 0,
        paginas_leidas: Number(this.readPages()) || 0,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.saved.emit(updated);
          this.editing.set(false);
          this.saving.set(false);
        },
        error: (error: ApiError) => {
          this.failed.emit(error);
          this.saving.set(false);
        },
      });
  }
}
