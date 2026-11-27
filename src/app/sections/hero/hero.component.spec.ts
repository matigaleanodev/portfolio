import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';

import { provideRouter } from '@angular/router';
import { HeroComponent } from './hero.component';

describe('HeroComponent', () => {
  let fixture: ComponentFixture<HeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroComponent);
  });

  it('debería crearse', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('debería renderizar el título principal', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h1')?.textContent).toContain('Matias Galeano');
  });

  it('presenta Banco Comafi antes del vínculo contractual con el texto aprobado', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');

    expect(text).toContain(
      'Actualmente trabajo en Banco Comafi, a través de Boreal IT, desarrollando soluciones para Fondos Comunes de Inversión.',
    );
    expect(text.match(/desarrollador full stack/gi)).toHaveLength(1);
  });
});
