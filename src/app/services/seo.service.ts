import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

interface SeoPayload {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
}

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
    this.updatePropertyTag('og:url', payload.canonicalUrl);
    this.updatePropertyTag('og:type', payload.type ?? 'website');

    if (payload.ogImage) {
      this.updateNameTag('twitter:image', payload.ogImage);
      this.updatePropertyTag('og:image', payload.ogImage);
    }

    this.updateCanonical(payload.canonicalUrl);
    this.syncArticleTags(payload);
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

  private updateCanonical(url: string): void {
    let canonical = this.document.head.querySelector<HTMLLinkElement>("link[rel='canonical']");

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
