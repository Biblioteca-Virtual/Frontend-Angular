/** Panel de búsqueda de la biblioteca. */
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
  /** filtros compartidos, categorías disponibles y aviso para abrir la grilla */
  readonly filters = input.required<BookFilters>();
  readonly categories = input.required<string[]>();
  readonly browse = output<void>();

  /** desplegables abiertos o cerrados */
  protected readonly searchOpen = signal(false);
  protected readonly categoryOpen = signal(false);

  /** cierra el desplegable de categorías y muestra la grilla con los resultados */
  protected search(): void {
    this.categoryOpen.set(false);
    this.browse.emit();
  }

  /** abre o cierra los campos de búsqueda y enfoca el primero */
  protected toggleSearch(): void {
    this.searchOpen.update((open) => !open);
    if (this.searchOpen()) {
      // Espera al render del @if para llevar el foco al primer campo.
      setTimeout(() => document.getElementById('bookTitle')?.focus());
    }
  }

  /** elige una categoría; tocar la misma de nuevo quita el filtro */
  protected selectCategory(category: string): void {
    if (this.filters().category() === category) {
      this.filters().category.set('');
    } else {
      this.filters().category.set(category);
      this.search();
    }
  }
}
