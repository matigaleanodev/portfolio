import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlogPostSummary } from '../../models/blog.model';
import { AnalyticsService } from '../../services/analytics.service';
import { BlogContentService } from '../../services/blog-content.service';

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

  readonly posts = signal<BlogPostSummary[]>([]);
  readonly errorMessage = signal('');

  readonly sortedPosts = computed(() =>
    [...this.posts()].sort((left, right) => right.date.localeCompare(left.date)),
  );

  constructor() {
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
          const message = error instanceof Error ? error.message : 'Unexpected error loading blog posts.';
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
