import { Signal, computed, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiError, toApiError } from '@core/api/api-error';

/**
 * Estado asincrono reutilizable para componentes con señales `loading` / `data` / `error`.
 *
 * Los servicios ya normalizan todos sus errores a `ApiError`, asi que aqui solo
 * hace falta guardar el valor, lanzar la excepcion o marcar el estado de carga.
 *
 * Se pref Signals a un simple `loading: boolean` porque en Angular 22 el
 * proyecto es zoneless (`zone.js` no esta instalado): la deteccion de cambios la
 * orquestan las señales, no `zone.js`.
 *
 *     protected readonly state = new AsyncState<ApiBook[]>();
 *
 *     constructor() {
 *       effect(() => void this.state.run(this.books.list(this.search())));
 *     }
 */
export class AsyncState<T> {
  private readonly _data = signal<T | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<ApiError | null>(null);

  readonly data: Signal<T | null> = this._data.asReadonly();
  readonly loading: Signal<boolean> = this._loading.asReadonly();
  readonly error: Signal<ApiError | null> = this._error.asReadonly();

  /** `true` mientras no haya llegado ninguna respuesta. */
  readonly isInitialLoading: Signal<boolean> = computed(
    () => this._loading() && this._data() === null,
  );

  /**
   * Ejecuta una peticion y actualiza el estado.
   *
   * @returns El valor recibido, o `null` si la peticion fallo. Permite encadenar
   *   navegacion (`if (await this.state.run(...)) { ... }`) sin consultar el
   *   estado a mano.
   */
  async run(request: Observable<T>): Promise<T | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const value = await firstValueFrom(request);
      this._data.set(value);
      return value;
    } catch (error) {
      this._error.set(error instanceof ApiError ? error : toApiError(error as never));
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /** Permite editar el dato en optimista, por ejemplo tras un POST exitoso. */
  setData(value: T): void {
    this._data.set(value);
  }

  reset(): void {
    this._data.set(null);
    this._error.set(null);
    this._loading.set(false);
  }
}
