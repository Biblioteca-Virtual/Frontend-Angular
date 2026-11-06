import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  signal,
} from '@angular/core';

const MIN_RATING = 0.5;
const MAX_RATING = 5;
const STEP = 0.5;
const STAR_PATH =
  'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z';

/** Valor que elige una tecla, o `null` si la tecla no cambia la calificación. */
function ratingForKey(key: string, current: number): number | null {
  const next: Record<string, number> = {
    ArrowRight: current + STEP,
    ArrowUp: current + STEP,
    ArrowLeft: current - STEP,
    ArrowDown: current - STEP,
    Home: MIN_RATING,
    End: MAX_RATING,
  };
  return key in next ? Math.min(MAX_RATING, Math.max(MIN_RATING, next[key])) : null;
}

/** La mitad izquierda de la estrella vale media estrella menos que la derecha. */
function ratingAt(event: MouseEvent, star: number): number {
  const { left, width } = (event.currentTarget as HTMLElement).getBoundingClientRect();
  return event.clientX - left < width / 2 ? star - STEP : star;
}

/**
 * Calificación con estrellas, admite medias estrellas.
 *
 * Por defecto se elige con el mouse: al pasar por la mitad izquierda de una
 * estrella se previsualiza media y por la derecha la estrella entera, y el clic
 * la confirma. También funciona con un toque y con las flechas del teclado.
 *
 * Con `readonly` solo muestra el valor. `preview` es el valor bajo el mouse,
 * todavía sin confirmar.
 */
@Component({
  selector: 'bv-star-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="stars"
      [class.stars--interactive]="!readonly()"
      [attr.role]="readonly() ? 'img' : 'slider'"
      [attr.aria-label]="readonly() ? 'Calificación: ' + value() + ' de 5' : 'Calificación'"
      [attr.tabindex]="readonly() ? null : 0"
      [attr.aria-valuemin]="readonly() ? null : minRating"
      [attr.aria-valuemax]="readonly() ? null : maxRating"
      [attr.aria-valuenow]="readonly() ? null : value()"
      (mouseleave)="preview.set(null)"
      (keydown)="onKeydown($event)"
    >
      @for (star of starNumbers; track star) {
        <span class="star" (mousemove)="onHover($event, star)" (click)="onSelect($event, star)">
          <svg class="star__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path [attr.d]="starPath" />
          </svg>
          <span class="star__fill" [style.width.%]="fillPercent(star)">
            <svg class="star__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path [attr.d]="starPath" />
            </svg>
          </span>
        </span>
      }
    </span>
    @if (!readonly()) {
      <span class="value" aria-hidden="true">{{ shown() }} / 5</span>
    }
  `,
  styleUrl: './star-rating.scss',
})
export class StarRating {
  readonly value = model(3);
  readonly readonly = input(false, { transform: booleanAttribute });

  protected readonly minRating = MIN_RATING;
  protected readonly maxRating = MAX_RATING;
  protected readonly starNumbers = [1, 2, 3, 4, 5];
  protected readonly starPath = STAR_PATH;

  protected readonly preview = signal<number | null>(null);
  protected readonly shown = computed(() => this.preview() ?? this.value());

  protected fillPercent(star: number): number {
    return Math.min(1, Math.max(0, this.shown() - (star - 1))) * 100;
  }

  protected onHover(event: MouseEvent, star: number): void {
    if (!this.readonly()) {
      this.preview.set(ratingAt(event, star));
    }
  }

  protected onSelect(event: MouseEvent, star: number): void {
    if (!this.readonly()) {
      this.value.set(ratingAt(event, star));
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const rating = this.readonly() ? null : ratingForKey(event.key, this.value());
    if (rating !== null) {
      event.preventDefault();
      this.value.set(rating);
    }
  }
}
