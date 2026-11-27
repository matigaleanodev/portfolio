import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import {
  inject,
  Injectable,
  makeStateKey,
  PendingTasks,
  PLATFORM_ID,
  TransferState,
} from '@angular/core';
import { defer, finalize, from, of, tap } from 'rxjs';
import { BlogPost, BlogPostSummary } from '../models/blog.model';

@Injectable({
  providedIn: 'root',
})
export class BlogContentService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private readonly pendingTasks = inject(PendingTasks);

  getPosts() {
    return this.getTransferable<BlogPostSummary[]>(
      'blog-posts',
      ['src', 'assets', 'blog', 'posts.json'],
      '/assets/blog/posts.json',
    );
  }

  getPostBySlug(slug: string) {
    return this.getTransferable<BlogPost>(
      `blog-post:${slug}`,
      ['src', 'assets', 'blog', 'posts', `${slug}.json`],
      `/assets/blog/posts/${slug}.json`,
    );
  }

  private getTransferable<T>(key: string, fileSegments: string[], assetUrl: string) {
    const stateKey = makeStateKey<T | null>(key);
    const content$ = this.getContent<T>(fileSegments, assetUrl);

    if (isPlatformServer(this.platformId)) {
      // El prerender espera esta tarea: sin ella serializa la vista antes de leer el archivo.
      return defer(() => {
        const finish = this.pendingTasks.add();
        return content$.pipe(
          tap((content) => this.transferState.set(stateKey, content)),
          finalize(finish),
        );
      });
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
  const processRef = (
    globalThis as typeof globalThis & {
      process?: { cwd?: () => string };
    }
  ).process;

  if (!processRef?.cwd) {
    throw new Error('Process cwd is not available in the current runtime.');
  }

  return processRef.cwd();
}
