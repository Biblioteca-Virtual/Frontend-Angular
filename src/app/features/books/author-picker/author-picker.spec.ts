import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_ENDPOINTS } from '@core/api/api.config';
import { AuthorPicker } from './author-picker';

const borges = { id: 1, nombre: 'Jorge Luis', apellido: 'Borges' };
const cortazar = { id: 2, nombre: 'Julio', apellido: 'Cortázar' };

describe('AuthorPicker', () => {
  let fixture: ComponentFixture<AuthorPicker>;
  let http: HttpTestingController;
  let host: HTMLElement;

  const type = async (value: string): Promise<void> => {
    const input = host.querySelector('input')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  const clickAdd = async (): Promise<void> => {
    host.querySelector<HTMLButtonElement>('.vl-btn')!.click();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AuthorPicker);
    host = fixture.nativeElement;
    http.expectOne(API_ENDPOINTS.authors).flush({ data: [borges] });
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('elige un autor conocido sin crearlo, sin importar mayúsculas ni espacios', async () => {
    await type('  jorge   LUIS borges ');
    await clickAdd();

    expect(fixture.componentInstance.selected()).toEqual([borges]);
    expect(host.querySelector('input')!.value).toBe('');
  });

  it('no repite un autor ya elegido', async () => {
    fixture.componentInstance.selected.set([borges]);
    await type('Jorge Luis Borges');
    await clickAdd();

    expect(fixture.componentInstance.selected()).toEqual([borges]);
  });

  it('crea un autor nuevo y lo deja elegido', async () => {
    await type('Julio Cortázar');
    await clickAdd();

    const request = http.expectOne(API_ENDPOINTS.authors);
    expect(request.request.body).toEqual({ nombre_completo: 'Julio Cortázar' });
    request.flush({ data: cortazar });

    expect(fixture.componentInstance.selected()).toEqual([cortazar]);
  });

  it('no borra lo que se empezó a escribir mientras se creaba el autor', async () => {
    await type('Julio Cortázar');
    await clickAdd();
    const request = http.expectOne(API_ENDPOINTS.authors);

    await type('Otro');
    request.flush({ data: cortazar });
    await fixture.whenStable();

    expect(host.querySelector('input')!.value).toBe('Otro');
  });

  it('quita un autor elegido', async () => {
    fixture.componentInstance.selected.set([borges]);
    await fixture.whenStable();

    host.querySelector<HTMLButtonElement>('.author-chips button')!.click();

    expect(fixture.componentInstance.selected()).toEqual([]);
  });
});
