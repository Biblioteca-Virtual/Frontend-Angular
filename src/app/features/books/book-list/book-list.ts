import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncState } from '@core/api/async-state';
import { ApiBook } from '@core/models';
import { BookService } from '@core/services/book.service';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { PageHeader } from '@shared/components/page-header/page-header';
import { Spinner } from '@shared/components/spinner/spinner';
import { AutorNombrePipe } from '@shared/pipes/autor-nombre.pipe';

@Component({
  selector: 'bv-book-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, Spinner, EmptyState, ErrorBanner, AutorNombrePipe],
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss',
})
export class BookList {
  private readonly books = inject(BookService);

  protected readonly state = new AsyncState<ApiBook[]>();

  /** Texto del buscador. El backend filtra por titulo, sin paginacion. */
  protected readonly search = signal('');

  constructor() {
    // Recarga cuando cambia el texto de busqueda. `search` se lee dentro del
    // efecto, asi que es una dependencia reactiva; el listado no lo es.
    effect(() => {
      const query = this.search();
      void this.state.run(this.books.list(query));
    });
  }

  protected onSearch(value: string): void {
    this.search.set(value);
  }

  protected trackBook(_index: number, book: ApiBook): number {
    return book.id;
  }
}
