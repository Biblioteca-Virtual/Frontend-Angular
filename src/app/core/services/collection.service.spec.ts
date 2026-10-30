import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_ENDPOINTS } from '@core/api/api.config';
import { ApiError } from '@core/api/api-error';
import { ApiCollection } from '@core/models';
import { CollectionService } from './collection.service';

const collection: ApiCollection = {
  id: 3,
  usuario_id: 42,
  nombre: 'Para releer',
  fecha_creacion: 'Thu, 29 Oct 2026 15:09:54 GMT',
  cantidad_libros: 0,
  libros: [],
};

describe('CollectionService', () => {
  let service: CollectionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CollectionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('desenvuelve el listado', async () => {
    const result = firstValueFrom(service.list());

    http.expectOne(API_ENDPOINTS.collections).flush({ data: [collection] });

    expect(await result).toEqual([collection]);
  });

  it('renombra con PUT y el nombre en el cuerpo', async () => {
    const result = firstValueFrom(service.rename(3, 'Favoritos'));

    const request = http.expectOne(API_ENDPOINTS.collection(3));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ nombre: 'Favoritos' });
    request.flush({ data: { ...collection, nombre: 'Favoritos' } });

    expect((await result).nombre).toBe('Favoritos');
  });

  it('agrega y quita libros por su id', async () => {
    const added = firstValueFrom(service.addBook(3, 7));
    const addRequest = http.expectOne(API_ENDPOINTS.collectionBooks(3));
    expect(addRequest.request.method).toBe('POST');
    expect(addRequest.request.body).toEqual({ libro_id: 7 });
    addRequest.flush({ data: collection });
    await added;

    const removed = firstValueFrom(service.removeBook(3, 7));
    const removeRequest = http.expectOne(API_ENDPOINTS.collectionBook(3, 7));
    expect(removeRequest.request.method).toBe('DELETE');
    removeRequest.flush({ data: collection });
    await removed;
  });

  it('convierte un nombre repetido en ApiError', async () => {
    const result = firstValueFrom(service.create('Para releer'));

    http
      .expectOne(API_ENDPOINTS.collections)
      .flush(
        { error: 'Ya tenés una colección con ese nombre', errors: [] },
        { status: 409, statusText: 'Conflict' },
      );

    await expect(result).rejects.toBeInstanceOf(ApiError);
  });
});
