import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ApiError } from '@core/api/api-error';

/**
 * Banner de error para errores de la API.
 *
 * Acepta un `ApiError` ya normalizado y decide como mostrarlo: si el backend
 * mando varios errores de validacion (`errors: [...]`) los lista; si solo mando
 * el mensaje, muestra ese. Los errores de red (status 0, tipicamente CORS mal
 * configurado o backend caido) reciben un texto mas explicito.
 */
@Component({
  selector: 'bv-error-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error(); as apiError) {
      <div class="bv-alert bv-alert--error" role="alert">
        <strong>{{ heading() }}</strong>
        <p>{{ message() }}</p>

        @if (details().length > 0) {
          <ul>
            @for (detail of details(); track detail) {
              <li>{{ detail }}</li>
            }
          </ul>
        }
      </div>
    }
  `,
})
export class ErrorBanner {
  readonly error = input<ApiError | null>(null);
  readonly heading = input('No se pudo completar la operación');

  private readonly apiError = computed(() => this.error());

  readonly message = computed(() => this.apiError()?.displayMessage ?? '');

  /** Lista de errores de validacion, o vacia si el backend no la envio. */
  readonly details = computed(() => {
    const apiError = this.apiError();
    if (apiError === null || apiError.isValidation) {
      return [];
    }
    return apiError.details;
  });
}
