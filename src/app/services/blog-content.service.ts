import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BlogPost, BlogPostSummary } from '../models/blog.model';

@Injectable({
  providedIn: 'root',
})
export class BlogContentService {
  private readonly http = inject(HttpClient);

  getPosts() {
    return this.http.get<BlogPostSummary[]>('/assets/blog/posts.json');
  }

  getPostBySlug(slug: string) {
    return this.http.get<BlogPost>(`/assets/blog/posts/${slug}.json`);
  }
}
