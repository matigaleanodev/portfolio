import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlogPostSummary } from '../../models/blog.model';
import { AnalyticsService } from '../../services/analytics.service';
import { BlogContentService } from '../../services/blog-content.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-blog-list-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './blog-list.page.html',
  styleUrl: './blog-list.page.css',
})
export class BlogListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly blogContent = inject(BlogContentService);
  private readonly analytics = inject(AnalyticsService);
  private readonly seo = inject(SeoService);

  readonly posts = signal<BlogPostSummary[]>([]);
  readonly errorMessage = signal('');

  readonly sortedPosts = computed(() =>
    [...this.posts()].sort((left, right) => right.date.localeCompare(left.date)),
  );

  constructor() {
    this.seo.setPageSeo({
      title: 'Blog técnico en español | Matias Galeano',
      description:
        'Posts técnicos en español sobre Angular, NestJS, AWS, arquitectura y decisiones de producto escritos desde proyectos reales.',
      canonicalUrl: 'https://matiasgaleano.dev/blog',
      ogImage: 'https://matiasgaleano.dev/assets/icons/icon-512.webp',
      type: 'website',
    });

    this.blogContent
      .getPosts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (posts) => {
          this.posts.set(posts);
          this.analytics.trackEvent('view_blog_index', {
            post_count: posts.length,
          });
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unexpected error loading blog posts.';
          this.errorMessage.set(message);
        },
      });
  }

  trackPostClick(post: BlogPostSummary, position: number): void {
    this.analytics.trackEvent('click_blog_post_card', {
      post_slug: post.slug,
      post_title: post.title,
      position,
    });
  }
}
