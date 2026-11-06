import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '@core/api/api-error';
import { ApiAuthor, BOOK_LOCATIONS } from '@core/models';
import { BookService } from '@core/services/book.service';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { FolderButton } from '@shared/components/folder-button/folder-button';
import { Spinner } from '@shared/components/spinner/spinner';
import { WindowCard } from '@shared/components/window-card/window-card';
import { AuthorPicker } from '../author-picker/author-picker';
import { readingPercentage } from '../book-display';
import { BookCoverPicker } from '../book-cover-picker/book-cover-picker';
import { BookCategories } from './book-categories';
import { emptyBookForm, toBookFormValue, toBookPayload } from './book-form.model';

/** Alta y edición de un libro. `bookId` es `undefined` en modo alta. */
@Component({
  selector: 'bv-book-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    Spinner,
    ErrorBanner,
    FolderButton,
    WindowCard,
    AuthorPicker,
    BookCoverPicker,
  ],
  templateUrl: './book-form.html',
  styleUrls: ['./book-form.scss', './inline-add.scss'],
})
export class BookForm {
  private readonly books = inject(BookService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly bookId = input<string | number | undefined>(undefined);

  protected readonly isEditing = computed(() => {
    const raw = this.bookId();
    return raw !== undefined && raw !== null && raw !== '';
  });

  protected readonly error = signal<ApiError | null>(null);
  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly uploadingCover = signal(false);
  protected readonly cover = signal('');
  protected readonly selectedAuthors = signal<ApiAuthor[]>([]);

  protected readonly categories = new BookCategories();
  protected readonly locations = BOOK_LOCATIONS;
  protected readonly form = emptyBookForm();

  constructor() {
    this.categories.load();
    effect(() => {
      const id = Number(this.bookId());
      if (this.isEditing() && !isNaN(id)) {
        untracked(() => this.load(id));
      }
    });
  }

  protected get percentage(): number {
    return readingPercentage(this.form.paginas_totales, this.form.paginas_leidas);
  }

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const payload = toBookPayload(this.form, {
      categoryId: this.categories.selected(),
      authors: this.selectedAuthors(),
      cover: this.cover(),
    });
    const request = this.isEditing()
      ? this.books.update(Number(this.bookId()), payload)
      : this.books.create(payload);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (book) => void this.router.navigate(['/libros', book.id]),
      error: (error: ApiError) => {
        this.error.set(error);
        this.submitting.set(false);
      },
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.books
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (book) => {
          Object.assign(this.form, toBookFormValue(book));
          this.selectedAuthors.set(book.autores ?? []);
          this.categories.selected.set((book.categoria?.id ?? 1).toString());
          this.cover.set(book.imagen_portada ?? '');
          this.loading.set(false);
        },
        error: (error: ApiError) => {
          this.error.set(error);
          this.loading.set(false);
        },
      });
  }
}
