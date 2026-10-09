import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Componente raiz. Solo aloja el `<router-outlet>`: el chrome (barra de
 * navegacion) vive en `Shell`, que se carga de forma diferida y solo se usa en
 * las rutas autenticadas. Asi, login y registro se muestran sin navegacion.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
