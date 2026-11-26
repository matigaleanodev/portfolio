import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { inject, Injectable, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { defer, from, of, tap } from 'rxjs';
import { BlogPost, BlogPostSummary } from '../models/blog.model';

@Injectable({
  providedIn: 'root',
})
export class BlogContentService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);

  getPosts() {
    return this.getContent<BlogPostSummary[]>(
      ['src', 'assets', 'blog', 'posts.json'],
      '/assets/blog/posts.json',
    );
  }

  getPostBySlug(slug: string) {
    const stateKey = makeStateKey<BlogPost | null>(`blog-post:${slug}`);
    const content$ = this.getContent<BlogPost>(
      ['src', 'assets', 'blog', 'posts', `${slug}.json`],
      `/assets/blog/posts/${slug}.json`,
    );

    if (isPlatformServer(this.platformId)) {
      return content$.pipe(tap((post) => this.transferState.set(stateKey, post)));
    }

    // El estado del prerender se usa una sola vez y emite en forma síncrona para conservar el DOM.
    return defer(() => {
      const transferred = this.transferState.get(stateKey, null);

      if (!transferred) {
        return content$;
      }

      this.transferState.remove(stateKey);
      return of(transferred);
    });
  }

  private getContent<T>(fileSegments: string[], assetUrl: string) {
    if (isPlatformServer(this.platformId)) {
      return defer(() => from(this.readContentFile<T>(fileSegments)));
    }

    return this.http.get<T>(assetUrl);
  }

  private async readContentFile<T>(fileSegments: string[]): Promise<T> {
    const [{ readFile }, { join }] = await Promise.all([loadNodeFs(), loadNodePath()]);
    const filePath = join(getProcessCwd(), ...fileSegments);
    const raw = await readFile(filePath, 'utf8');

    return JSON.parse(raw) as T;
  }
}

interface NodeFsModule {
  readFile(path: string, encoding: string): Promise<string>;
}

interface NodePathModule {
  join(...paths: string[]): string;
}

function loadNodeFs(): Promise<NodeFsModule> {
  return new Function('return import("node:fs/promises")')() as Promise<NodeFsModule>;
}

function loadNodePath(): Promise<NodePathModule> {
  return new Function('return import("node:path")')() as Promise<NodePathModule>;
}

function getProcessCwd(): string {
  const processRef = (globalThis as typeof globalThis & {
    process?: { cwd?: () => string };
  }).process;

  if (!processRef?.cwd) {
    throw new Error('Process cwd is not available in the current runtime.');
  }

  return processRef.cwd();
}
