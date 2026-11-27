import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RenderMode, ServerRoute } from '@angular/ssr';

interface PrerenderEntry {
  slug: string;
}

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'projects/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => loadSlugs('projects.json'),
  },
  {
    path: 'blog',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'blog/unsubscribe',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => loadSlugs('blog/posts.json'),
  },
  {
    path: '404',
    renderMode: RenderMode.Prerender,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];

async function loadSlugs(asset: string): Promise<Record<string, string>[]> {
  const raw = await readFile(join(process.cwd(), 'src', 'assets', asset), 'utf8');
  return (JSON.parse(raw) as PrerenderEntry[]).map(({ slug }) => ({ slug }));
}
