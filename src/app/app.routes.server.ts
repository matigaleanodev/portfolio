import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RenderMode, ServerRoute } from '@angular/ssr';

interface PrerenderPostEntry {
  slug: string;
}

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'blog',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const posts = await loadPostEntries();
      return posts.map((post) => ({ slug: post.slug }));
    },
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];

async function loadPostEntries(): Promise<PrerenderPostEntry[]> {
  const postsIndexPath = join(process.cwd(), 'src', 'assets', 'blog', 'posts.json');
  const raw = await readFile(postsIndexPath, 'utf8');
  return JSON.parse(raw) as PrerenderPostEntry[];
}
