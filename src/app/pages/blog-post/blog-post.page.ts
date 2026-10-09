import '../../locale';

import { DatePipe, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { BlogPost } from '../../models/blog.model';
import { AnalyticsService } from '../../services/analytics.service';
import { BlogContentService } from '../../services/blog-content.service';
import { SeoService } from '../../services/seo.service';
import { FragmentLinkDirective } from '../../ui/fragment-link.directive';
import { EditorialContentDirective } from '../../ui/editorial-content.directive';

type MermaidModule = typeof import('mermaid').default;

@Component({
  selector: 'app-blog-post-page',
  imports: [RouterLink, DatePipe, FragmentLinkDirective, EditorialContentDirective],
  templateUrl: './blog-post.page.html',
  styleUrl: './blog-post.page.css',
  encapsulation: ViewEncapsulation.None,
})
export class BlogPostPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly hostRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly blogContent = inject(BlogContentService);
  private readonly analytics = inject(AnalyticsService);
  private readonly seo = inject(SeoService);
  private mermaidModulePromise: Promise<MermaidModule> | null = null;

  readonly post = signal<BlogPost | null>(null);
  readonly errorMessage = signal('');
  readonly copyFeedback = signal('');
  readonly tableOfContents = computed(() => {
    const current = this.post();
    const headings = current?.headings ?? [];
    if (!current || current.readingTimeMinutes < 8 || headings.length < 4) return [];
    const sections: ((typeof headings)[number] & { children: typeof headings })[] = [];
    for (const heading of headings) {
      const parent = sections.at(-1);
      if (heading.level === 3 && parent) parent.children.push(heading);
      else sections.push({ ...heading, children: [] });
    }
    return sections;
  });

  readonly seoTitle = computed(() => this.post()?.seo.title ?? 'Blog | Matias Galeano');

  constructor() {
    this.setupEffects();

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const slug = params.get('slug');

          if (!slug) {
            throw new Error('Missing blog post slug.');
          }

          this.errorMessage.set('');
          this.post.set(null);
          this.copyFeedback.set('');

          return this.blogContent.getPostBySlug(slug);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (post) => {
          this.post.set(post);
          this.seo.setPageSeo({
            title: post.seo.title,
            description: post.seo.description,
            canonicalUrl: post.seo.canonicalUrl,
            ogImage: post.seo.ogImage.startsWith('http')
              ? post.seo.ogImage
              : `https://matiasgaleano.dev${post.seo.ogImage}`,
            ogImageAlt: post.seo.ogImageAlt ?? `Portada social del post ${post.title}`,
            type: 'article',
            publishedTime: `${post.date}T00:00:00.000Z`,
            modifiedTime: post.updatedAt ? `${post.updatedAt}T00:00:00.000Z` : undefined,
          });
          this.analytics.trackEvent('view_blog_post', {
            post_slug: post.slug,
            post_title: post.title,
            reading_time_minutes: post.readingTimeMinutes,
          });
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unexpected error loading blog post.';
          this.errorMessage.set(message);
        },
      });
  }

  private setupEffects() {
    effect(() => {
      const currentPost = this.post();

      if (!currentPost || !isPlatformBrowser(this.platformId)) {
        return;
      }

      this.scheduleDomTask(() => {
        this.prepareCodeBlocks();
        void this.renderMermaidBlocks(currentPost.slug);
      });
    });
  }

  private prepareCodeBlocks(): void {
    this.hostRef.nativeElement
      .querySelectorAll<HTMLElement>('.blog-post__content pre')
      .forEach((pre) => {
        const code = pre.querySelector('code');
        if (
          !code ||
          code.classList.contains('language-mermaid') ||
          pre.parentElement?.classList.contains('code-block')
        )
          return;
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block';
        const toolbar = document.createElement('div');
        toolbar.className = 'code-toolbar';
        const language = document.createElement('span');
        language.textContent = code.className.match(/language-([\w-]+)/)?.[1] ?? 'texto';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'code-copy';
        button.textContent = 'Copiar';
        button.setAttribute('aria-label', `Copiar código ${language.textContent}`);
        button.addEventListener('click', () => {
          void this.copyCode(code.textContent ?? '');
        });
        toolbar.append(language, button);
        pre.before(wrapper);
        wrapper.append(toolbar, pre);
        pre.tabIndex = 0;
        pre.setAttribute('aria-label', `Código ${language.textContent}`);
      });
  }

  private async copyCode(text: string): Promise<void> {
    this.copyFeedback.set('');
    try {
      await navigator.clipboard.writeText(text);
      this.copyFeedback.set('Código copiado.');
    } catch {
      this.copyFeedback.set(
        'No se pudo copiar. Podés seleccionar el código y copiarlo manualmente.',
      );
    }
  }

  private async renderMermaidBlocks(slug: string) {
    const contentElement = this.hostRef.nativeElement.querySelector(
      '.blog-post__content',
    ) as HTMLElement | null;

    if (!contentElement) {
      return;
    }

    const mermaidBlocks = Array.from(
      contentElement.querySelectorAll('pre > code.language-mermaid'),
    ) as HTMLElement[];

    if (mermaidBlocks.length === 0) {
      return;
    }

    const mermaid = await this.loadMermaid();

    for (const [index, block] of mermaidBlocks.entries()) {
      const source = block.textContent?.trim();
      const preElement = block.parentElement;

      if (!source || !preElement) {
        continue;
      }

      const container = document.createElement('div');
      container.className = 'mermaid-diagram';

      const { svg } = await mermaid.render(`${slug}-mermaid-${index + 1}`, source);
      container.innerHTML = svg;
      preElement.replaceWith(container);
    }
  }

  private async loadMermaid(): Promise<MermaidModule> {
    if (!this.mermaidModulePromise) {
      this.mermaidModulePromise = import('mermaid').then((module) => {
        const mermaid = module.default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'default',
        });

        return mermaid;
      });
    }

    return this.mermaidModulePromise;
  }

  private scheduleDomTask(task: () => void) {
    queueMicrotask(() => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => task());
        return;
      }

      task();
    });
  }
}
