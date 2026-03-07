import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SeoService } from '../../services/seo.service';
import { HomePage } from './home.page';

@Component({ selector: 'app-hero', standalone: true, template: '' })
class HeroStubComponent {}

@Component({ selector: 'app-projects', standalone: true, template: '' })
class ProjectsStubComponent {}

@Component({ selector: 'app-contact', standalone: true, template: '' })
class ContactStubComponent {}

describe('HomePage', () => {
  const setPageSeoMock = vi.fn();

  beforeEach(async () => {
    setPageSeoMock.mockReset();

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        {
          provide: SeoService,
          useValue: {
            setPageSeo: setPageSeoMock,
          },
        },
      ],
    })
      .overrideComponent(HomePage, {
        set: {
          imports: [HeroStubComponent, ProjectsStubComponent, ContactStubComponent],
        },
      })
      .compileComponents();
  });

  it('deberia configurar el SEO de la landing al crearse', () => {
    const fixture = TestBed.createComponent(HomePage);

    expect(fixture.componentInstance).toBeTruthy();
    expect(setPageSeoMock).toHaveBeenCalledWith({
      title: 'Matias Galeano · Software Developer',
      description:
        'Portfolio de Matias Galeano, Software Developer especializado en Angular, Ionic y NestJS. Desarrollo de productos digitales con foco en claridad, mantenimiento y decisiones técnicas bien pensadas.',
      canonicalUrl: 'https://matiasgaleano.dev/',
      ogImage: 'https://matiasgaleano.dev/assets/icons/icon-512.webp',
      type: 'website',
    });
  });
});
