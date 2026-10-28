import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/api/api-error';
import { ApiBook } from '@core/models';
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
  protected readonly result = signal<ApiBook | null>(null);
  protected readonly error = signal<ApiError | null>(null);

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
        next: (book) => {
          this.result.set(book);
          this.spinning.set(false);
        },
        error: (error: ApiError) => {
          this.error.set(error);
          this.spinning.set(false);
        },
      });
  }
}
