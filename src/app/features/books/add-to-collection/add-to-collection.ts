import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/api/api-error';
import { ApiCollection } from '@core/models';
import { CollectionService } from '@core/services/collection.service';
import { AsyncState } from '@core/state/async-state';

/**
 * Agrega el libro a una colección propia. `failed` avisa al padre del error (o de
 * `null` al reintentar), que lo muestra junto a los de las demás acciones.
 */
@Component({
  selector: 'bv-add-to-collection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './add-to-collection.html',
  styleUrls: ['../book-info.scss', './add-to-collection.scss'],
})
export class AddToCollection {
  private readonly collectionService = inject(CollectionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly bookId = input.required<number>();
  readonly failed = output<ApiError | null>();

  protected readonly collections = new AsyncState<ApiCollection[]>();
  protected readonly collectionId = signal<number | ''>('');
  protected readonly adding = signal(false);
  protected readonly addedTo = signal<ApiCollection | null>(null);

  constructor() {
    void this.collections.run(this.collectionService.list());
  }

  protected add(): void {
    const collectionId = this.collectionId();
    if (collectionId === '' || this.adding()) {
      return;
    }
    this.adding.set(true);
    this.addedTo.set(null);
    this.failed.emit(null);

    this.collectionService
      .addBook(collectionId, this.bookId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (collection) => {
          this.addedTo.set(collection);
          this.collectionId.set('');
          this.adding.set(false);
        },
        error: (error: ApiError) => {
          this.failed.emit(error);
          this.adding.set(false);
        },
      });
  }
}
