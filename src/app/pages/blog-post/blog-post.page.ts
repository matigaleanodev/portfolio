import '../../locale';

import { DatePipe, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  PLATFORM_ID,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArrowLeft, LucideAngularModule } from 'lucide-angular';
import { EMPTY, Subject, catchError, exhaustMap, finalize, startWith, switchMap } from 'rxjs';
import { BlogPost } from '../../models/blog.model';
import { AnalyticsService } from '../../services/analytics.service';
import { BlogContentService } from '../../services/blog-content.service';
import { SeoService } from '../../services/seo.service';
import { FragmentLinkDirective } from '../../ui/fragment-link.directive';
import { EditorialContentDirective } from '../../ui/editorial-content.directive';
import { copyCodeBlock } from '../../ui/code-copy';
import { NotFoundStateComponent } from '../../ui/not-found-state/not-found-state.component';

type MermaidModule = typeof import('mermaid').default;

@Component({
  selector: 'app-blog-post-page',
  imports: [
    RouterLink,
    DatePipe,
    FragmentLinkDirective,
    EditorialContentDirective,
    LucideAngularModule,
    NotFoundStateComponent,
  ],
  templateUrl: './blog-post.page.html',
  styleUrl: './blog-post.page.css',
  encapsulation: ViewEncapsulation.None,
})
export class BlogPostPage {
  protected readonly backIcon = ArrowLeft;

  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly hostRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly blogContent = inject(BlogContentService);
  private readonly analytics = inject(AnalyticsService);
  private readonly seo = inject(SeoService);
  private mermaidModulePromise: Promise<MermaidModule> | null = null;

  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly title = viewChild<ElementRef<HTMLElement>>('articleTitle');
  private readonly retry$ = new Subject<void>();

  readonly post = signal<BlogPost | null>(null);
  readonly loadError = signal<'not-found' | 'failed' | null>(null);
  readonly isRetrying = signal(false);
  /** Un artículo inexistente toma el foco si se llegó navegando o desde el reintento. */
  protected readonly notFoundTakesFocus = signal(false);
  private arrivedByNavigation = false;
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
    this.listenForCopy();

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const slug = params.get('slug') ?? '';
          this.loadError.set(null);
          this.isRetrying.set(false);
          this.post.set(null);
          this.arrivedByNavigation = this.router.navigated;
          // Al llegar navegando se empieza arriba; conservar el scroll anterior desplaza la carga.
          if (isPlatformBrowser(this.platformId) && this.router.navigated) {
            window.scrollTo({ top: 0, behavior: 'instant' });
          }

          // El error se atrapa por lectura: una ruta inexistente no corta la navegación siguiente.
          return this.retry$.pipe(
            startWith(undefined),
            exhaustMap(() => {
              const isRetry = this.loadError() !== null;
              this.isRetrying.set(isRetry);
              return this.blogContent.getPostBySlug(slug).pipe(
                catchError((error: unknown) => {
                  this.showError(error);
                  return EMPTY;
                }),
                finalize(() => this.isRetrying.set(false)),
              );
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((post) => this.showPost(post));
  }

  retry(): void {
    this.retry$.next();
  }

  private showPost(post: BlogPost): void {
    const recovered = this.loadError() !== null;
    this.loadError.set(null);
    this.post.set(post);
    this.seo.setPageSeo({
      title: post.seo.title,
      description: post.seo.description,
      canonicalUrl: post.seo.canonicalUrl,
      image: {
        url: post.seo.ogImage.startsWith('http')
          ? post.seo.ogImage
          : `https://matiasgaleano.dev${post.seo.ogImage}`,
        alt: post.seo.ogImageAlt ?? `Portada social del post ${post.title}`,
        width: 1200,
        height: 630,
      },
      type: 'article',
      publishedTime: `${post.date}T00:00:00.000Z`,
      modifiedTime: post.updatedAt ? `${post.updatedAt}T00:00:00.000Z` : undefined,
    });
    this.analytics.trackEvent('view_blog_post', {
      post_slug: post.slug,
      post_title: post.title,
      reading_time_minutes: post.readingTimeMinutes,
    });
    // El botón de reintento deja de mostrarse: el foco pasa al título.
    if (recovered) this.focusTitle();
  }

  private showError(error: unknown): void {
    // Hosting responde un slug ausente con 404 o con el HTML de la aplicación (200 ilegible).
    const status = (error as { status?: unknown } | null)?.status;
    const notFound = status === 404 || status === 200;
    this.notFoundTakesFocus.set(this.arrivedByNavigation || this.isRetrying());
    this.loadError.set(notFound ? 'not-found' : 'failed');
    this.seo.setPageSeo({
      title: `${notFound ? 'Artículo no encontrado' : 'No se pudo cargar el artículo'} | Matias Galeano`,
      description: 'Volvé al blog técnico de Matias Galeano para elegir otro artículo.',
      // Un slug ausente sale del índice; una falla transitoria conserva su indexación.
      ...(notFound
        ? { noIndex: true }
        : { canonicalUrl: 'https://matiasgaleano.dev/blog', type: 'website' }),
    });
  }

  private focusTitle(): void {
    afterNextRender(
      { write: () => this.title()?.nativeElement.focus() },
      { injector: this.injector },
    );
  }

  private listenForCopy(): void {
    const host = this.hostRef.nativeElement;
    const onClick = (event: Event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>('.code-copy');
      if (button) void copyCodeBlock(button);
    };
    host.addEventListener('click', onClick);
    this.destroyRef.onDestroy(() => host.removeEventListener('click', onClick));
  }

  private setupEffects() {
    effect(() => {
      const currentPost = this.post();

      if (!currentPost || !isPlatformBrowser(this.platformId)) {
        return;
      }

      this.scheduleDomTask(() => {
        void this.renderMermaidBlocks(currentPost.slug);
      });
    });
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
