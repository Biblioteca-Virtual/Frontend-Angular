import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { ApiError } from '@core/api/api-error';
import { AsyncState } from '@core/api/async-state';
import { ApiBook, ApiCollection } from '@core/models';
import { BookService } from '@core/services/book.service';
import { CollectionService } from '@core/services/collection.service';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { FolderButton } from '@shared/components/folder-button/folder-button';
import { Spinner } from '@shared/components/spinner/spinner';
import { WindowCard } from '@shared/components/window-card/window-card';

/**
 * Listado de colecciones del usuario (Colecciones.svg) con el alta en el mismo
 * panel (Agregar colección.svg).
 */
@Component({
  selector: 'bv-collection-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, ErrorBanner, FolderButton, Spinner, WindowCard],
  templateUrl: './collection-list.html',
  styleUrl: '../collections.scss',
})
export class CollectionList {
  private readonly collections = inject(CollectionService);
  private readonly books = inject(BookService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = new AsyncState<ApiCollection[]>();
  protected readonly catalog = new AsyncState<ApiBook[]>();

  protected readonly creating = signal(false);
  protected readonly saving = signal(false);
  protected readonly actionError = signal<ApiError | null>(null);

  protected readonly nombre = signal('');
  /** Libro opcional para empezar la colección con algo; '' significa ninguno. */
  protected readonly libroId = signal<number | ''>('');

  constructor() {
    void this.state.run(this.collections.list());
  }

  protected startCreating(): void {
    this.creating.set(true);
    this.actionError.set(null);
    if (this.catalog.data() === null) {
      void this.catalog.run(this.books.list());
    }
  }

  protected cancelCreating(): void {
    this.creating.set(false);
    this.nombre.set('');
    this.libroId.set('');
    this.actionError.set(null);
  }

  /**
   * Crea la colección y, si se eligió un libro, lo agrega en una segunda
   * petición: el alta del backend solo recibe el nombre.
   */
  protected create(): void {
    const nombre = this.nombre().trim();
    if (!nombre || this.saving()) {
      return;
    }

    const libroId = this.libroId();
    this.saving.set(true);
    this.actionError.set(null);

    this.collections
      .create(nombre)
      .pipe(
        switchMap(
          (created): Observable<ApiCollection> =>
            libroId === '' ? of(created) : this.collections.addBook(created.id, libroId),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (created) => {
          this.state.setData([...(this.state.data() ?? []), created]);
          this.saving.set(false);
          this.cancelCreating();
        },
        error: (error: ApiError) => {
          this.actionError.set(error);
          this.saving.set(false);
          // Si falló solo el libro, la colección ya existe: se recarga la lista.
          void this.state.run(this.collections.list());
        },
      });
  }
}
