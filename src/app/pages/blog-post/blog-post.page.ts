import { DatePipe } from '@angular/common';
import { Component, DestroyRef, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { BlogPost } from '../../models/blog.model';
import { AnalyticsService } from '../../services/analytics.service';
import { BlogContentService } from '../../services/blog-content.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-blog-post-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './blog-post.page.html',
  styleUrl: './blog-post.page.css',
  encapsulation: ViewEncapsulation.None,
})
export class BlogPostPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly blogContent = inject(BlogContentService);
  private readonly analytics = inject(AnalyticsService);
  private readonly seo = inject(SeoService);

  readonly post = signal<BlogPost | null>(null);
  readonly errorMessage = signal('');

  readonly seoTitle = computed(() => this.post()?.seo.title ?? 'Blog | Matias Galeano');

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const slug = params.get('slug');

          if (!slug) {
            throw new Error('Missing blog post slug.');
          }

          this.errorMessage.set('');
          this.post.set(null);

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
}
