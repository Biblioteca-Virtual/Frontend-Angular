/** Pantalla con el listado de colecciones del usuario. */
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { ApiError } from '@core/api/api-error';
import { AsyncState } from '@core/state/async-state';
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
 *
 * Al crear, el libro elegido es opcional ('' significa ninguno) y se agrega en
 * una segunda petición: el alta del backend solo recibe el nombre. Si falló solo
 * el libro, la colección ya existe, así que se recarga la lista.
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

  /** colecciones del usuario y libros para el selector del alta */
  protected readonly state = new AsyncState<ApiCollection[]>();
  protected readonly catalog = new AsyncState<ApiBook[]>();

  /** formulario de alta abierto, guardado en curso y error */
  protected readonly creating = signal(false);
  protected readonly saving = signal(false);
  protected readonly actionError = signal<ApiError | null>(null);

  /** nombre de la colección nueva y libro opcional para agregarle */
  protected readonly nombre = signal('');
  protected readonly libroId = signal<number | ''>('');

  /** al abrir la pantalla carga las colecciones */
  constructor() {
    void this.state.run(this.collections.list());
  }

  /** abre el alta; los libros se cargan solo la primera vez */
  protected startCreating(): void {
    this.creating.set(true);
    this.actionError.set(null);
    if (this.catalog.data() === null) {
      void this.catalog.run(this.books.list());
    }
  }

  /** cierra el alta y limpia sus campos */
  protected cancelCreating(): void {
    this.creating.set(false);
    this.nombre.set('');
    this.libroId.set('');
    this.actionError.set(null);
  }

  /** crea la colección y, si se eligió un libro, se lo agrega; ante un error recarga el listado */
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
          void this.state.run(this.collections.list());
        },
      });
  }
}
