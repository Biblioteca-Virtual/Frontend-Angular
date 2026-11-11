/** Vista en grilla de todos los libros de la biblioteca. */
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/api/api-error';
import { resolveCoverUrl } from '@core/api/cover-url';
import { ApiBook } from '@core/models';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { ProgressBar } from '@shared/components/progress-bar/progress-bar';
import { Spinner } from '@shared/components/spinner/spinner';
import { BookFilters } from '../book-filters';

/** Grilla con toda la biblioteca (Toda biblioteca.svg). */
@Component({
  selector: 'bv-book-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyState, ErrorBanner, ProgressBar, Spinner],
  templateUrl: './book-grid.html',
  styleUrls: ['../book-panel.scss', './book-grid.scss'],
})
export class BookGrid {
  /** libros, filtros, estado de carga y error que manda la pantalla padre; back avisa al volver */
  readonly books = input.required<ApiBook[]>();
  readonly filters = input.required<BookFilters>();
  readonly loading = input(false);
  readonly error = input<ApiError | null>(null);
  readonly back = output<void>();

  /** función para armar la url de cada portada */
  protected readonly resolveCover = resolveCoverUrl;
}
