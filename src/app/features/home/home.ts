import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WindowCard } from '@shared/components/window-card/window-card';

@Component({
  selector: 'bv-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, WindowCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
