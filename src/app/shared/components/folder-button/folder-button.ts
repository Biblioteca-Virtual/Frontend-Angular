import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'bv-folder-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgTemplateOutlet],
  template: `
    @if (routerLink()) {
      <a [routerLink]="routerLink()" class="folder-btn" [attr.aria-label]="label()">
        <ng-container *ngTemplateOutlet="folderContent"></ng-container>
      </a>
    } @else {
      <button
        [type]="type()"
        class="folder-btn"
        (click)="clicked.emit()"
        [disabled]="disabled()"
        [attr.aria-label]="label()"
      >
        <ng-container *ngTemplateOutlet="folderContent"></ng-container>
      </button>
    }

    <ng-template #folderContent>
      <div class="folder-icon" aria-hidden="true">
        <svg viewBox="0 0 74 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="folderTab" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#93c2ed" />
              <stop offset="100%" stop-color="#70a3d8" />
            </linearGradient>
            <linearGradient id="folderBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#8db8e8" />
              <stop offset="50%" stop-color="#6ba0da" />
              <stop offset="100%" stop-color="#4e88c7" />
            </linearGradient>
            <filter id="folderShadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#1e3a5f" flood-opacity="0.25" />
            </filter>
          </defs>
          <!-- Folder Back Tab -->
          <path
            d="M 4 8 C 4 4.5 6.5 2 10 2 L 26 2 C 28.5 2 31 3.5 32.5 5.5 L 36 10 L 64 10 C 67.5 10 70 12.5 70 16 L 70 24 L 4 24 Z"
            fill="url(#folderTab)"
          />
          <!-- Folder Front Body -->
          <rect
            x="3"
            y="12"
            width="68"
            height="44"
            rx="5"
            fill="url(#folderBody)"
            filter="url(#folderShadow)"
          />
          <!-- Subtle Top Lip Highlight -->
          <rect
            x="4"
            y="13"
            width="66"
            height="1.5"
            rx="0.75"
            fill="#ffffff"
            fill-opacity="0.5"
          />
        </svg>
      </div>
      <span class="folder-label vl-glass">{{ label() }}</span>
    </ng-template>
  `,
  styles: `
    :host {
      display: inline-block;
    }

    .folder-btn {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      background: none;
      border: none;
      padding: 0.35rem;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
      user-select: none;

      &:hover:not(:disabled) {
        transform: translateY(-3px) scale(1.05);

        .folder-label {
          color: #0b4f9c;
        }
      }

      &:active:not(:disabled) {
        transform: translateY(0) scale(0.98);
      }

      &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
    }

    .folder-icon {
      width: 68px;
      height: 54px;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    }

    .folder-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #1a1a1a;
      text-align: center;
      max-width: 110px;
      line-height: 1.2;
      transition: color 0.15s ease;
      word-break: break-word;
      // La píldora de vidrio (.vl-glass) mantiene el nombre legible sobre la foto.
      padding: 0.2rem 0.55rem;
      border-radius: 8px;
      box-shadow: none;
    }
  `,
})
export class FolderButton {
  readonly label = input.required<string>();
  readonly routerLink = input<string | any[] | null>(null);
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input<boolean>(false);
  readonly clicked = output<void>();
}
