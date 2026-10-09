import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/api/api-error';
import { ApiReading } from '@core/models';
import { RouletteService } from '@core/services/roulette.service';
import { ErrorBanner } from '@shared/components/error-banner/error-banner';
import { PageHeader } from '@shared/components/page-header/page-header';
import { Spinner } from '@shared/components/spinner/spinner';

@Component({
  selector: 'bv-roulette-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, Spinner, ErrorBanner],
  templateUrl: './roulette-page.html',
  styleUrl: './roulette-page.scss',
})
export class RoulettePage {
  private readonly roulette = inject(RouletteService);

  protected readonly spinning = signal(false);
  protected readonly result = signal<ApiReading | null>(null);
  protected readonly error = signal<ApiError | null>(null);

  /**
   * Gira la ruleta.
   *
   * El backend elige un libro con copias libres y CREA el prestamo en el mismo
   * acto (responde 201 con un `Reading` completo, no con un libro), asi que este
   * resultado aparece ya en "Mis préstamos" sin pasos intermedios.
   *
   * Puede devolver 409 "No hay libros disponibles en este momento" si agota los
   * tres intentos internos sin encontrar copias libres.
   */
  protected spin(): void {
    if (this.spinning()) {
      return;
    }

    this.spinning.set(true);
    this.error.set(null);
    this.result.set(null);

    this.roulette
      .spin()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (reading) => {
          this.result.set(reading);
          this.spinning.set(false);
        },
        error: (error: ApiError) => {
          this.error.set(error);
          this.spinning.set(false);
        },
      });
  }
}
