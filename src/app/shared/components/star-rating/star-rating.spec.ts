import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { StarRating } from './star-rating';

describe('StarRating', () => {
  let fixture: ComponentFixture<StarRating>;
  let host: HTMLElement;

  /** Cada estrella mide 20px: de 0 a 9 es la mitad izquierda. */
  const fire = (type: string, starIndex: number, clientX: number): void => {
    const star = host.querySelectorAll<HTMLElement>('.star')[starIndex];
    star.getBoundingClientRect = () => ({ left: 0, width: 20 }) as DOMRect;
    star.dispatchEvent(new MouseEvent(type, { clientX, bubbles: true }));
  };

  const fills = (): string[] =>
    Array.from(host.querySelectorAll<HTMLElement>('.star__fill')).map((fill) => fill.style.width);

  beforeEach(async () => {
    fixture = TestBed.createComponent(StarRating);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('dibuja media estrella en un valor con decimal', async () => {
    fixture.componentRef.setInput('value', 3.5);
    await fixture.whenStable();

    expect(fills()).toEqual(['100%', '100%', '100%', '50%', '0%']);
  });

  it('el clic en la mitad izquierda elige media estrella', () => {
    fire('click', 3, 5);

    expect(fixture.componentInstance.value()).toBe(3.5);
  });

  it('el clic en la mitad derecha elige la estrella entera', () => {
    fire('click', 3, 15);

    expect(fixture.componentInstance.value()).toBe(4);
  });

  it('pasar el mouse previsualiza sin cambiar el valor y al salir vuelve', async () => {
    fire('mousemove', 0, 5);
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBe(3);
    expect(fills()).toEqual(['50%', '0%', '0%', '0%', '0%']);

    host.querySelector('.stars')!.dispatchEvent(new MouseEvent('mouseleave'));
    await fixture.whenStable();

    expect(fills()).toEqual(['100%', '100%', '100%', '0%', '0%']);
  });

  it('las flechas cambian de a media estrella sin salirse del rango', () => {
    const stars = host.querySelector('.stars')!;
    const press = (key: string) => stars.dispatchEvent(new KeyboardEvent('keydown', { key }));

    press('ArrowRight');
    expect(fixture.componentInstance.value()).toBe(3.5);

    press('End');
    press('ArrowRight');
    expect(fixture.componentInstance.value()).toBe(5);

    press('Home');
    press('ArrowLeft');
    expect(fixture.componentInstance.value()).toBe(0.5);
  });

  it('en modo lectura ignora el mouse y no se puede enfocar', async () => {
    fixture.componentRef.setInput('readonly', true);
    await fixture.whenStable();

    fire('click', 0, 5);

    expect(fixture.componentInstance.value()).toBe(3);
    expect(host.querySelector('.stars')!.getAttribute('role')).toBe('img');
    expect(host.querySelector('.stars')!.hasAttribute('tabindex')).toBe(false);
  });
});
