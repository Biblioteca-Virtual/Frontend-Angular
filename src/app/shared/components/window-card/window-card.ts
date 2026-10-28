import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'bv-window-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (routerLink()) {
      <a [routerLink]="routerLink()" class="window-card window-card--interactive" [style.max-width]="maxWidth()">
        <div class="window-card__header">
          <span class="window-card__title">{{ title() }}</span>
        </div>
        <div class="window-card__body">
          <img [src]="src()" [alt]="alt() || title()" class="window-card__image" loading="lazy" />
        </div>
      </a>
    } @else {
      <div class="window-card" [style.max-width]="maxWidth()">
        <div class="window-card__header">
          <span class="window-card__title">{{ title() }}</span>
        </div>
        <div class="window-card__body">
          <img [src]="src()" [alt]="alt() || title()" class="window-card__image" loading="lazy" />
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .window-card {
      display: flex;
      flex-direction: column;
      background: #fdfdfd;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.08);
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
      text-decoration: none;
      color: inherit;
      width: 100%;

      &--interactive {
        cursor: pointer;

        &:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22), 0 4px 10px rgba(0, 0, 0, 0.1);
        }
      }
    }

    .window-card__header {
      background-color: #dad8db;
      padding: 0.35rem 0.85rem;
      display: flex;
      align-items: center;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .window-card__title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: -0.01em;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    }

    .window-card__body {
      position: relative;
      background-color: #000;
      overflow: hidden;
      line-height: 0;
    }

    .window-card__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }

    .window-card--interactive:hover .window-card__image {
      transform: scale(1.03);
    }
  `,
})
export class WindowCard {
  readonly title = input.required<string>();
  readonly src = input.required<string>();
  readonly alt = input<string>('');
  readonly routerLink = input<string | any[] | null>(null);
  readonly maxWidth = input<string>('100%');
}
