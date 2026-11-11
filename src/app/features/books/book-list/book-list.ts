/** Pantalla principal de la biblioteca del usuario. */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiBook, ApiCollection } from '@core/models';
import { BookService } from '@core/services/book.service';
import { CollectionService } from '@core/services/collection.service';
import { AsyncState } from '@core/state/async-state';
import { FolderButton } from '@shared/components/folder-button/folder-button';
import { WindowCard } from '@shared/components/window-card/window-card';
import { BookFilters, categoryNames } from '../book-filters';
import { BookGrid } from '../book-grid/book-grid';
import { BookSearchPanel } from '../book-search-panel/book-search-panel';

/**
 * Biblioteca del usuario. Tiene dos vistas: `overview` (Biblioteca.svg), con el
 * buscador y las colecciones como carpetas, y `complete` (Toda biblioteca.svg),
 * con la grilla de libros.
 */
@Component({
  selector: 'bv-book-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FolderButton, WindowCard, BookGrid, BookSearchPanel],
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss',
})
export class BookList {
  private readonly books = inject(BookService);
  private readonly collectionService = inject(CollectionService);

  /** libros y colecciones cargados, filtros activos y vista elegida */
  protected readonly state = new AsyncState<ApiBook[]>();
  protected readonly collections = new AsyncState<ApiCollection[]>();
  protected readonly filters = new BookFilters();
  protected readonly viewMode = signal<'overview' | 'complete'>('overview');

  /** categorías disponibles y libros que pasan los filtros */
  protected readonly categories = computed(() => categoryNames(this.state.data() ?? []));
  protected readonly filteredBooks = computed(() => this.filters.apply(this.state.data() ?? []));

  /** al abrir la pantalla carga los libros y las colecciones */
  constructor() {
    void this.state.run(this.books.list());
    void this.collections.run(this.collectionService.list());
  }
}
