import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

interface SeoPayload {
  title: string;
  description: string;
  /** Se omite en las vistas que no deben indexarse. */
  canonicalUrl?: string;
  image?: SeoImage;
  noIndex?: boolean;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
}

const defaultImage: SeoImage = {
  url: 'https://matiasgaleano.dev/assets/icons/icon-512.webp',
  alt: 'Logo de Matias Galeano',
  width: 512,
  height: 512,
};

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  setPageSeo(payload: SeoPayload): void {
    this.title.setTitle(payload.title);

    this.updateNameTag('description', payload.description);
    this.updateNameTag('twitter:title', payload.title);
    this.updateNameTag('twitter:description', payload.description);

    this.updatePropertyTag('og:title', payload.title);
    this.updatePropertyTag('og:description', payload.description);
    this.updatePropertyTag('og:type', payload.type ?? 'website');
    this.updateNameTag('robots', payload.noIndex ? 'noindex, follow' : 'index, follow');
    this.updateImage(payload.image ?? defaultImage);
    this.updateCanonical(payload.canonicalUrl);
    this.syncArticleTags(payload);
  }

  private updateImage(image: SeoImage): void {
    this.updateNameTag('twitter:image', image.url);
    this.updateNameTag('twitter:image:alt', image.alt);
    this.updatePropertyTag('og:image', image.url);
    this.updatePropertyTag('og:image:alt', image.alt);
    this.syncDimension('og:image:width', image.width);
    this.syncDimension('og:image:height', image.height);
  }

  private syncDimension(property: string, value: number | undefined): void {
    if (value) {
      this.updatePropertyTag(property, String(value));
    } else {
      this.meta.removeTag(`property='${property}'`);
    }
  }

  private syncArticleTags(payload: SeoPayload): void {
    if (payload.type === 'article') {
      this.updatePropertyTag('article:published_time', payload.publishedTime ?? '');

      if (payload.modifiedTime) {
        this.updatePropertyTag('article:modified_time', payload.modifiedTime);
      } else {
        this.meta.removeTag("property='article:modified_time'");
      }

      return;
    }

    this.meta.removeTag("property='article:published_time'");
    this.meta.removeTag("property='article:modified_time'");
  }

  private updateCanonical(url: string | undefined): void {
    let canonical = this.document.head.querySelector<HTMLLinkElement>("link[rel='canonical']");

    if (!url) {
      canonical?.remove();
      this.meta.removeTag("property='og:url'");
      return;
    }

    this.updatePropertyTag('og:url', url);

    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', url);
  }

  private updateNameTag(name: string, content: string): void {
    this.meta.updateTag({
      name,
      content,
    });
  }

  private updatePropertyTag(property: string, content: string): void {
    this.meta.updateTag({
      property,
      content,
    });
  }
}
