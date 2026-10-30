import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiError } from '@core/api/api-error';
import {
  ApiAuthor,
  ApiBook,
  ApiCategory,
  BOOK_LOCATIONS,
  BookLocation,
  CreateBookRequest,
} from '@core/models';
import { BookService } from '@core/services/book.service';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { FolderButton } from '@shared/components/folder-button/folder-button';
import { Spinner } from '@shared/components/spinner/spinner';
import { WindowCard } from '@shared/components/window-card/window-card';
import { AutorNombrePipe } from '@shared/pipes/autor-nombre.pipe';

@Component({
  selector: 'bv-book-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    Spinner,
    ErrorBanner,
    FolderButton,
    WindowCard,
    AutorNombrePipe,
  ],
  templateUrl: './book-form.html',
  styleUrl: './book-form.scss',
})
export class BookForm implements OnInit {
  private readonly books = inject(BookService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Id del libro en edición; `undefined` en modo alta. */
  readonly bookId = input<string | number | undefined>(undefined);

  protected readonly error = signal<ApiError | null>(null);
  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly categories = signal<ApiCategory[]>([]);
  protected readonly uploadingCover = signal(false);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly addingCategory = signal(false);
  protected readonly savingCategory = signal(false);
  /** Todos los autores conocidos, para sugerirlos mientras se escribe. */
  protected readonly authors = signal<ApiAuthor[]>([]);
  protected readonly selectedAuthors = signal<ApiAuthor[]>([]);
  protected readonly savingAuthor = signal(false);
  protected authorInput = '';

  protected readonly locations = BOOK_LOCATIONS;
  /** Valor de la opción "+ Agregar categoría…" del desplegable. */
  protected readonly NEW_CATEGORY = 'nueva';
  protected newCategory = '';
  /** Categoría elegida antes de abrir "Agregar categoría", para volver si se cancela. */
  private previousCategory = '1';

  protected readonly form = {
    titulo: '',
    descripcion: '',
    categoria_id: '1',
    ubicacion: 'fisico' as BookLocation,
    url_lectura: '',
    paginas_totales: 0,
    paginas_leidas: 0,
    imagen_portada: '',
  };

  ngOnInit(): void {
    this.loadCategories();
    this.books
      .getAuthors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (authors) => this.authors.set(authors), error: () => undefined });

    const rawId = this.bookId();
    if (rawId !== undefined && rawId !== null && rawId !== '') {
      const id = Number(rawId);
      if (!isNaN(id)) {
        this.loading.set(true);
        this.books
          .getById(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (book) => {
              this.fill(book);
              this.loading.set(false);
            },
            error: (error: ApiError) => {
              this.error.set(error);
              this.loading.set(false);
            },
          });
      }
    }
  }

  protected isEditing(): boolean {
    const raw = this.bookId();
    return raw !== undefined && raw !== null && raw !== '';
  }

  protected get readingPercentage(): number {
    const totales = Number(this.form.paginas_totales) || 0;
    const leidas = Number(this.form.paginas_leidas) || 0;
    if (totales <= 0) {
      return 0;
    }
    const percent = Math.round((leidas / totales) * 100);
    return Math.min(100, Math.max(0, percent));
  }

  private loadCategories(): void {
    this.books
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cats) => {
          this.categories.set(cats);
          if (cats.length > 0 && (!this.form.categoria_id || this.form.categoria_id === '')) {
            this.form.categoria_id = cats[0].id.toString();
          }
        },
        error: () => {
          // Fallback silencioso con categoría general
          this.categories.set([{ id: 1, nombre: 'General' }]);
        },
      });
  }

  protected onCategoryChange(value: string): void {
    if (value === this.NEW_CATEGORY) {
      this.previousCategory = this.form.categoria_id;
      this.form.categoria_id = value;
      this.addingCategory.set(true);
      setTimeout(() => document.getElementById('nuevaCategoria')?.focus());
      return;
    }
    this.form.categoria_id = value;
    this.addingCategory.set(false);
  }

  protected cancelCategory(): void {
    this.form.categoria_id = this.previousCategory;
    this.newCategory = '';
    this.addingCategory.set(false);
  }

  /** Crea la categoría (compartida con todos) y la deja elegida. */
  protected addCategory(): void {
    const nombre = this.newCategory.trim();
    if (!nombre || this.savingCategory()) {
      return;
    }
    this.savingCategory.set(true);
    this.error.set(null);

    this.books
      .createCategory(nombre)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (category) => {
          const others = this.categories().filter((c) => c.id !== category.id);
          this.categories.set(
            [...others, category].sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? '')),
          );
          this.form.categoria_id = category.id.toString();
          this.newCategory = '';
          this.addingCategory.set(false);
          this.savingCategory.set(false);
        },
        error: (error: ApiError) => {
          this.error.set(error);
          this.savingCategory.set(false);
        },
      });
  }

  /**
   * Agrega el autor escrito. Si ya está en la lista se usa ese; si no, se crea
   * (el backend también devuelve el existente si coincide sin mayúsculas).
   */
  protected addAuthor(): void {
    const name = this.authorInput.replace(/\s+/g, ' ').trim();
    if (!name || this.savingAuthor()) {
      return;
    }
    const fullName = (author: ApiAuthor) => `${author.nombre} ${author.apellido}`.trim().toLowerCase();
    const key = name.toLowerCase();

    if (this.selectedAuthors().some((author) => fullName(author) === key)) {
      this.authorInput = '';
      return;
    }
    const known = this.authors().find((author) => fullName(author) === key);
    if (known) {
      this.selectAuthor(known);
      return;
    }

    this.savingAuthor.set(true);
    this.error.set(null);
    this.books
      .createAuthor(name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (author) => {
          if (!this.authors().some((item) => item.id === author.id)) {
            this.authors.set([...this.authors(), author]);
          }
          this.selectAuthor(author, name);
          this.savingAuthor.set(false);
        },
        error: (error: ApiError) => {
          this.error.set(error);
          this.savingAuthor.set(false);
        },
      });
  }

  protected removeAuthor(id: number): void {
    this.selectedAuthors.set(this.selectedAuthors().filter((author) => author.id !== id));
  }

  /**
   * @param typed lo que se había escrito al pedir el alta: solo se limpia el
   *   campo si sigue igual, para no borrar lo que se empezó a escribir después.
   */
  private selectAuthor(author: ApiAuthor, typed?: string): void {
    if (!this.selectedAuthors().some((item) => item.id === author.id)) {
      this.selectedAuthors.set([...this.selectedAuthors(), author]);
    }
    if (typed === undefined || this.authorInput.replace(/\s+/g, ' ').trim() === typed) {
      this.authorInput = '';
    }
  }

  protected onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (!inputElement.files || inputElement.files.length === 0) {
      return;
    }

    const file = inputElement.files[0];
    this.uploadingCover.set(true);
    this.uploadError.set(null);

    this.books
      .uploadCover(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.form.imagen_portada = res.url;
          this.uploadingCover.set(false);
        },
        error: () => {
          this.uploadError.set('Error al subir la imagen. Verifica que sea JPG, PNG, WEBP o SVG.');
          this.uploadingCover.set(false);
        },
      });
  }

  protected removeCover(): void {
    this.form.imagen_portada = '';
  }

  protected getCoverUrl(path: string): string | null {
    return this.books.getCoverUrl(path);
  }

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const payload: CreateBookRequest = {
      titulo: this.form.titulo.trim(),
      categoria_id: Number(this.form.categoria_id) || 1,
      autores: this.selectedAuthors().map((author) => author.id),
      descripcion: this.form.descripcion.trim() || null,
      paginas_totales: Number(this.form.paginas_totales) || 0,
      paginas_leidas: Number(this.form.paginas_leidas) || 0,
      imagen_portada: this.form.imagen_portada ? this.form.imagen_portada.trim() : null,
      ubicacion: this.form.ubicacion,
      url_lectura: this.form.ubicacion === 'web' ? this.form.url_lectura.trim() || null : null,
    };

    const rawId = this.bookId();
    const id = rawId !== undefined && rawId !== null && rawId !== '' ? Number(rawId) : undefined;
    const request: Observable<ApiBook> =
      id === undefined ? this.books.create(payload) : this.books.update(id, payload);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (book) => void this.router.navigate(['/libros', book.id]),
      error: (error: ApiError) => {
        this.error.set(error);
        this.submitting.set(false);
      },
    });
  }

  private fill(book: ApiBook): void {
    this.form.titulo = book.titulo;
    this.form.descripcion = book.descripcion ?? '';
    this.selectedAuthors.set(book.autores ?? []);
    this.form.ubicacion = book.ubicacion ?? 'fisico';
    this.form.url_lectura = book.url_lectura ?? '';
    this.form.categoria_id = (book.categoria?.id ?? 1).toString();
    this.form.paginas_totales = book.paginas_totales ?? 0;
    this.form.paginas_leidas = book.paginas_leidas ?? 0;
    this.form.imagen_portada = book.imagen_portada ?? '';
  }
}
