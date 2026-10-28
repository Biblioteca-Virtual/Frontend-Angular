import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AsyncState } from '@core/api/async-state';
import { ApiBook } from '@core/models';
import { BookService } from '@core/services/book.service';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { FolderButton } from '@shared/components/folder-button/folder-button';
import { Spinner } from '@shared/components/spinner/spinner';
import { WindowCard } from '@shared/components/window-card/window-card';

@Component({
  selector: 'bv-book-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    Spinner,
    EmptyState,
    ErrorBanner,
    FolderButton,
    WindowCard,
  ],
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss',
})
export class BookList {
  private readonly books = inject(BookService);

  protected readonly state = new AsyncState<ApiBook[]>();

  /** Vista activa: 'overview' (Biblioteca.svg) o 'complete' (Toda biblioteca.svg) */
  protected readonly viewMode = signal<'overview' | 'complete'>('overview');

  /** Buscadores y filtros */
  protected readonly titleSearch = signal('');
  protected readonly authorSearch = signal('');
  protected readonly selectedCategory = signal<string>('');
  protected readonly isCategoryOpen = signal(false);

  /** Colección seleccionada para filtrar (o null para todas) */
  protected readonly selectedCollection = signal<string | null>(null);

  /** Categorías únicas extraídas de los libros cargados */
  protected readonly categories = computed(() => {
    const list = this.state.data() ?? [];
    const set = new Set<string>();
    for (const b of list) {
      if (b.categoria?.nombre) {
        set.add(b.categoria.nombre);
      }
    }
    return Array.from(set);
  });

  /** Libros filtrados por título, autor y categoría */
  protected readonly filteredBooks = computed(() => {
    const list = this.state.data() ?? [];
    const tSearch = this.titleSearch().trim().toLowerCase();
    const aSearch = this.authorSearch().trim().toLowerCase();
    const cat = this.selectedCategory().trim().toLowerCase();
    const col = this.selectedCollection();

    return list.filter((book) => {
      // Filtro por colección si hay una seleccionada
      if (col === 'Coleccion1' && book.id % 2 !== 0) return false;
      if (col === 'Coleccion 2' && book.id % 2 === 0) return false;

      // Filtro por título
      if (tSearch && !book.titulo.toLowerCase().includes(tSearch)) {
        return false;
      }
      // Filtro por autor
      if (aSearch) {
        const hasAuthor = (book.autores || []).some((a) =>
          `${a.nombre} ${a.apellido}`.toLowerCase().includes(aSearch),
        );
        if (!hasAuthor) return false;
      }
      // Filtro por categoría
      if (cat && book.categoria?.nombre?.toLowerCase() !== cat) {
        return false;
      }
      return true;
    });
  });

  constructor() {
    effect(() => {
      // Llamada inicial para cargar el catálogo completo
      void this.state.run(this.books.list());
    });
  }

  protected setViewMode(mode: 'overview' | 'complete'): void {
    this.viewMode.set(mode);
  }

  protected toggleCategoryDropdown(): void {
    this.isCategoryOpen.update((v) => !v);
  }

  protected selectCategory(category: string): void {
    if (this.selectedCategory() === category) {
      this.selectedCategory.set('');
    } else {
      this.selectedCategory.set(category);
    }
  }

  protected selectCollection(name: string): void {
    if (this.selectedCollection() === name) {
      this.selectedCollection.set(null);
    } else {
      this.selectedCollection.set(name);
      this.viewMode.set('complete');
    }
  }

  protected getCoverUrl(path: string | null | undefined): string | null {
    return this.books.getCoverUrl(path);
  }

  protected trackBook(_index: number, book: ApiBook): number {
    return book.id;
  }
}
