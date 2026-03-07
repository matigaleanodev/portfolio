import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { BlogPost } from '../../models/blog.model';
import { BlogContentService } from '../../services/blog-content.service';

@Component({
  selector: 'app-blog-post-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './blog-post.page.html',
  styleUrl: './blog-post.page.css',
})
export class BlogPostPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly blogContent = inject(BlogContentService);

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
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unexpected error loading blog post.';
          this.errorMessage.set(message);
        },
      });
  }
}
