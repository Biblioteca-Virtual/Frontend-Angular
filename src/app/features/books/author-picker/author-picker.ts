/** Selector de autores del formulario de libros. */
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

/** Quita espacios repetidos y en los extremos. */
const collapseSpaces = (text: string): string => text.replace(/\s+/g, ' ').trim();

/** Clave para comparar autores: nombre completo en minúsculas. */
const authorKey = (author: ApiAuthor): string =>
  `${author.nombre} ${author.apellido}`.trim().toLowerCase();

/** Devuelve la lista con el autor agregado, sin repetirlo. */
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

  /** autores elegidos (enlace en dos sentidos con el formulario) y aviso de error */
  readonly selected = model<ApiAuthor[]>([]);
  readonly failed = output<ApiError | null>();

  /** autores ya cargados, guardado en curso y texto escrito */
  protected readonly known = signal<ApiAuthor[]>([]);
  protected readonly saving = signal(false);
  protected readonly text = signal('');

  /** al crearse carga los autores conocidos; si falla, solo no habrá sugerencias */
  constructor() {
    this.catalog
      .getAuthors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (authors) => this.known.set(authors), error: () => undefined });
  }

  /** agrega el autor escrito: usa uno conocido o lo crea en el backend */
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

  /** saca un autor de la lista elegida */
  protected remove(id: number): void {
    this.selected.set(this.selected().filter((author) => author.id !== id));
  }

  /** crea el autor nuevo y lo agrega a conocidos y elegidos */
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
