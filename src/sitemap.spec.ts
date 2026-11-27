import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('sitemap del sitio', () => {
  it('lista la portada y cada ficha de proyecto publicada', () => {
    const locations = [...read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => match[1],
    );
    const projects: { slug: string }[] = JSON.parse(read('src/assets/projects.json'));

    expect(locations).toEqual([
      'https://matiasgaleano.dev/',
      ...projects.map(({ slug }) => `https://matiasgaleano.dev/projects/${slug}`),
    ]);
  });
});
