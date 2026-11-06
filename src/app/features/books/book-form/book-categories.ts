import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiError } from '@core/api/api-error';
import { ApiCategory } from '@core/models';
import { CatalogService } from '@core/services/catalog.service';

/** Valor de la opción "+ Agregar categoría…" del desplegable. */
const NEW_CATEGORY = 'nueva';

function byName(a: ApiCategory, b: ApiCategory): number {
  return (a.nombre ?? '').localeCompare(b.nombre ?? '');
}

/**
 * Estado del desplegable de categorías y de su alta en línea.
 *
 * Las categorías son compartidas con todos los usuarios. Si no se pueden cargar
 * se ofrece solo "General". Usa `inject`, así que hay que crearla mientras se
 * construye el componente.
 */
export class BookCategories {
  private readonly catalog = inject(CatalogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly newOption = NEW_CATEGORY;
  readonly all = signal<ApiCategory[]>([]);
  readonly selected = signal('1');
  readonly adding = signal(false);
  readonly saving = signal(false);
  readonly newName = signal('');
  readonly error = signal<ApiError | null>(null);

  /** Categoría elegida antes de abrir el alta, para volver a ella si se cancela. */
  private previous = '1';

  load(): void {
    this.catalog
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.all.set(categories),
        error: () => this.all.set([{ id: 1, nombre: 'General' }]),
      });
  }

  change(value: string): void {
    if (value === NEW_CATEGORY) {
      this.previous = this.selected();
      this.adding.set(true);
      setTimeout(() => document.getElementById('nuevaCategoria')?.focus());
    } else {
      this.adding.set(false);
    }
    this.selected.set(value);
  }

  cancel(): void {
    this.selected.set(this.previous);
    this.newName.set('');
    this.adding.set(false);
  }

  add(): void {
    const nombre = this.newName().trim();
    if (!nombre || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);

    this.catalog
      .createCategory(nombre)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (category) => this.onCreated(category),
        error: (error: ApiError) => {
          this.error.set(error);
          this.saving.set(false);
        },
      });
  }

  private onCreated(category: ApiCategory): void {
    const others = this.all().filter((item) => item.id !== category.id);
    this.all.set([...others, category].sort(byName));
    this.selected.set(category.id.toString());
    this.newName.set('');
    this.adding.set(false);
    this.saving.set(false);
  }
}
