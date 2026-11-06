import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  model,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { resolveCoverUrl } from '@core/api/cover-url';
import { CoverService } from '@core/services/cover.service';

const UPLOAD_ERROR = 'Error al subir la imagen. Verifica que sea JPG, PNG, WEBP o SVG.';

/** Sube la portada del libro al almacenamiento del backend y la previsualiza. */
@Component({
  selector: 'bv-book-cover-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './book-cover-picker.html',
  styleUrl: './book-cover-picker.scss',
})
export class BookCoverPicker {
  private readonly covers = inject(CoverService);
  private readonly destroyRef = inject(DestroyRef);

  readonly path = model('');
  readonly uploading = model(false);

  protected readonly uploadError = signal<string | null>(null);
  protected readonly resolveCover = resolveCoverUrl;

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    this.uploading.set(true);
    this.uploadError.set(null);

    this.covers
      .upload(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.path.set(result.url);
          this.uploading.set(false);
        },
        error: () => {
          this.uploadError.set(UPLOAD_ERROR);
          this.uploading.set(false);
        },
      });
  }
}
