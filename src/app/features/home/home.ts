/** Pantalla de inicio de la aplicación. */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Brand } from '@shared/components/brand/brand';
import { WindowCard } from '@shared/components/window-card/window-card';

/** Componente de la ruta raíz; todo su contenido está en home.html. */
@Component({
  selector: 'bv-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, WindowCard, Brand],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
