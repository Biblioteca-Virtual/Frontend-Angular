import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  model,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ApiError } from '@core/api/api-error';
import { ApiAuthor } from '@core/models';
import { CatalogService } from '@core/services/catalog.service';
import { AutorNombrePipe } from '@shared/pipes/autor-nombre.pipe';

const collapseSpaces = (text: string): string => text.replace(/\s+/g, ' ').trim();

const authorKey = (author: ApiAuthor): string =>
  `${author.nombre} ${author.apellido}`.trim().toLowerCase();

const withAuthor = (authors: ApiAuthor[], author: ApiAuthor): ApiAuthor[] =>
  authors.some((item) => item.id === author.id) ? authors : [...authors, author];

/**
 * Elige los autores de un libro: se sugieren los conocidos mientras se escribe y
 * se crean los nuevos. El backend también devuelve el existente si el nombre
 * coincide sin importar mayúsculas.
 *
 * `failed` avisa al padre del error, o de `null` al reintentar.
 */
@Component({
  selector: 'bv-author-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AutorNombrePipe],
  templateUrl: './author-picker.html',
  styleUrls: ['../book-form/inline-add.scss', './author-picker.scss'],
})
export class AuthorPicker {
  private readonly catalog = inject(CatalogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selected = model<ApiAuthor[]>([]);
  readonly failed = output<ApiError | null>();

  protected readonly known = signal<ApiAuthor[]>([]);
  protected readonly saving = signal(false);
  protected readonly text = signal('');

  constructor() {
    this.catalog
      .getAuthors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (authors) => this.known.set(authors), error: () => undefined });
  }

  protected add(): void {
    const name = collapseSpaces(this.text());
    if (!name || this.saving()) {
      return;
    }
    const key = name.toLowerCase();
    const existing = [...this.selected(), ...this.known()].find(
      (author) => authorKey(author) === key,
    );

    if (existing) {
      this.selected.set(withAuthor(this.selected(), existing));
      this.text.set('');
    } else {
      this.create(name);
    }
  }

  protected remove(id: number): void {
    this.selected.set(this.selected().filter((author) => author.id !== id));
  }

  private create(name: string): void {
    this.saving.set(true);
    this.failed.emit(null);

    this.catalog
      .createAuthor(name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (author) => {
          this.known.set(withAuthor(this.known(), author));
          this.selected.set(withAuthor(this.selected(), author));
          this.saving.set(false);
          // Solo se limpia si sigue igual: no se borra lo que se empezó a escribir después.
          if (collapseSpaces(this.text()) === name) {
            this.text.set('');
          }
        },
        error: (error: ApiError) => {
          this.failed.emit(error);
          this.saving.set(false);
        },
      });
  }
}
