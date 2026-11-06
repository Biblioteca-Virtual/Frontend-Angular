import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@core/api/api-error';
import { PendingSession } from '@core/models';
import { PendingLogin } from './pending-login';

const session = { email: 'ana@example.com' } as PendingSession;

describe('PendingLogin', () => {
  let flow: PendingLogin;
  let form: FormGroup;

  beforeEach(() => {
    flow = runInInjectionContext(TestBed.inject(EnvironmentInjector), () => new PendingLogin());
    form = new FormGroup({ email: new FormControl('ana@example.com', Validators.required) });
  });

  it('guarda la sesión pendiente al responder el backend', () => {
    flow.submit(form, () => of(session));

    expect(flow.session()).toBe(session);
    expect(flow.submitting()).toBe(false);
  });

  it('un formulario inválido marca los campos y no pide nada', () => {
    form.controls['email'].setValue('');
    const request = vi.fn(() => of(session));

    flow.submit(form, request);

    expect(request).not.toHaveBeenCalled();
    expect(form.touched).toBe(true);
  });

  it('muestra el error y permite reintentar', () => {
    const error = new ApiError(401, 'Credenciales inválidas');

    flow.submit(form, () => throwError(() => error));
    expect(flow.error()).toBe(error);
    expect(flow.submitting()).toBe(false);

    flow.submit(form, () => of(session));
    expect(flow.error()).toBeNull();
    expect(flow.session()).toBe(session);
  });

  it('con una sesión pendiente no vuelve a pedir hasta reiniciar', () => {
    const request = vi.fn(() => of(session));

    flow.submit(form, request);
    flow.submit(form, request);
    expect(request).toHaveBeenCalledTimes(1);

    flow.reset();
    flow.submit(form, request);
    expect(request).toHaveBeenCalledTimes(2);
  });
});
