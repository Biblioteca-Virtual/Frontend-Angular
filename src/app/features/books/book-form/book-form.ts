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
import { ApiBook, ApiCategory } from '@core/models';
import { BookService } from '@core/services/book.service';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { FolderButton } from '@shared/components/folder-button/folder-button';
import { Spinner } from '@shared/components/spinner/spinner';
import { WindowCard } from '@shared/components/window-card/window-card';

@Component({
  selector: 'bv-book-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Spinner, ErrorBanner, FolderButton, WindowCard],
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

  protected readonly form = {
    titulo: '',
    isbn: '',
    descripcion: '',
    anio_publicacion: '',
    cantidad: 1,
    categoria_id: '1',
    paginas_totales: 0,
    paginas_leidas: 0,
    imagen_portada: '',
  };

  ngOnInit(): void {
    this.loadCategories();

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

    const payload = {
      titulo: this.form.titulo.trim(),
      categoria_id: Number(this.form.categoria_id) || 1,
      cantidad: Number(this.form.cantidad) || 1,
      isbn: this.form.isbn.trim() || null,
      descripcion: this.form.descripcion.trim() || null,
      anio_publicacion: this.parseYear(this.form.anio_publicacion),
      paginas_totales: Number(this.form.paginas_totales) || 0,
      paginas_leidas: Number(this.form.paginas_leidas) || 0,
      imagen_portada: this.form.imagen_portada ? this.form.imagen_portada.trim() : null,
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

  /** El backend rechaza `anio_publicacion` no positivo y distingue `null` de "". */
  private parseYear(value: string): number | null {
    const trimmed = value.trim();
    return trimmed === '' ? null : Number(trimmed);
  }

  private fill(book: ApiBook): void {
    this.form.titulo = book.titulo;
    this.form.isbn = book.isbn ?? '';
    this.form.descripcion = book.descripcion ?? '';
    this.form.anio_publicacion = book.anio_publicacion?.toString() ?? '';
    this.form.cantidad = book.cantidad;
    this.form.categoria_id = (book.categoria?.id ?? 1).toString();
    this.form.paginas_totales = book.paginas_totales ?? 0;
    this.form.paginas_leidas = book.paginas_leidas ?? 0;
    this.form.imagen_portada = book.imagen_portada ?? '';
  }
}
