import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookFilters } from '../book-filters';

/**
 * Buscador de la biblioteca. Los filtros se aplican en vivo; `browse` lleva a la
 * grilla con los resultados. Elegir una categoría la muestra directamente.
 */
@Component({
  selector: 'bv-book-search-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './book-search-panel.html',
  styleUrls: ['../book-panel.scss', './book-search-panel.scss'],
})
export class BookSearchPanel {
  readonly filters = input.required<BookFilters>();
  readonly categories = input.required<string[]>();
  readonly browse = output<void>();

  protected readonly searchOpen = signal(false);
  protected readonly categoryOpen = signal(false);

  protected search(): void {
    this.categoryOpen.set(false);
    this.browse.emit();
  }

  protected toggleSearch(): void {
    this.searchOpen.update((open) => !open);
    if (this.searchOpen()) {
      // Espera al render del @if para llevar el foco al primer campo.
      setTimeout(() => document.getElementById('bookTitle')?.focus());
    }
  }

  protected selectCategory(category: string): void {
    if (this.filters().category() === category) {
      this.filters().category.set('');
    } else {
      this.filters().category.set(category);
      this.search();
    }
  }
}
