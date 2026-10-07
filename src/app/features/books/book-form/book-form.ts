import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiError } from '@core/api/api-error';
import { ApiBook } from '@core/models';
import { BookService } from '@core/services/book.service';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { PageHeader } from '@shared/components/page-header/page-header';
import { Spinner } from '@shared/components/spinner/spinner';

/**
 * Alta y edicion de libros.
 *
 * La misma pantalla cubre los dos casos: en edicion `bookId` llega por la ruta
 * (`libros/:id/editar`) y el formulario se precarga con `GET /api/books/{id}`.
 *
 * LIMITACION DEL BACKEND: no existen endpoints de categorias ni de autores, asi
 * que no hay forma de listar los `categoria_id` y `autor_id` validos. Por eso el
 * formulario los pide como numeros; los valores reales viven en las tablas
 * `categorias` y `autores` de PostgreSQL. Un id inexistente devuelve 400 con
 * "categoria_id no existe". La solucion de fondo es que el backend exponga
 * `/api/categorias` y `/api/autores`.
 *
 * OJO con la actualizacion: `PUT /api/books/{id}` es parcial, y enviar
 * `autores` REEMPLAZA el conjunto completo. Este formulario solo actualiza los
 * campos de la cabecera y deja los autores intactos si no se tocan.
 */
@Component({
  selector: 'bv-book-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, PageHeader, Spinner, ErrorBanner],
  templateUrl: './book-form.html',
  styleUrl: './book-form.scss',
})
export class BookForm {
  private readonly books = inject(BookService);
  private readonly router = inject(Router);

  /** Id del libro en edicion; `undefined` en modo alta. */
  readonly bookId = input<number | undefined>(undefined);

  protected readonly error = signal<ApiError | null>(null);
  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);

  protected readonly form = {
    titulo: '',
    isbn: '',
    descripcion: '',
    anio_publicacion: '',
    cantidad: 1,
    categoria_id: '',
  };

  constructor() {
    const id = this.bookId();
    if (id === undefined) {
      return;
    }

    this.loading.set(true);
    this.books
      .getById(id)
      .pipe(takeUntilDestroyed())
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

  protected readonly isEditing = (): boolean => this.bookId() !== undefined;

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const payload = {
      titulo: this.form.titulo.trim(),
      categoria_id: Number(this.form.categoria_id),
      cantidad: Number(this.form.cantidad),
      // El backend convierte la cadena vacia en `null` para isbn y descripcion.
      isbn: this.form.isbn.trim() || null,
      descripcion: this.form.descripcion.trim() || null,
      anio_publicacion: this.parseYear(this.form.anio_publicacion),
    };

    const id = this.bookId();
    const request: Observable<ApiBook> =
      id === undefined ? this.books.create(payload) : this.books.update(id, payload);

    request.pipe(takeUntilDestroyed()).subscribe({
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
    // `categoria_id` no viene en el nivel superior del libro: esta anidado como
    // `categoria.id`.
    this.form.categoria_id = book.categoria.id.toString();
  }
}
