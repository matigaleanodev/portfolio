import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { createContentPipelineFixture } from './testing/content-pipeline-fixture';

describe('build-content · artículos sin imagen', () => {
  const slug = 'spec-sin-imagen';

  it('publica un artículo sin coverImage en todos los artifacts', () => {
    const fixture = createContentPipelineFixture();
    const read = (path: string) => readFileSync(join(fixture.root, path), 'utf8');
    const run = (...args: string[]) =>
      execFileSync('node', args, { cwd: fixture.root, stdio: 'pipe' });

    try {
      const folder = join(fixture.root, 'content', 'posts', slug);
      mkdirSync(folder, { recursive: true });
      writeFileSync(
        join(folder, 'index.md'),
        `---\ntitle: Sin imagen\nslug: ${slug}\nexcerpt: Resumen\ndate: '2026-01-02'\ntags: [angular]\ndraft: false\n---\nContenido\n`,
      );

      run('./scripts/build-content.mjs');
      run('./scripts/build-release-manifest.mjs');
      run('./scripts/build-chat-knowledge-payload.mjs');

      const index = JSON.parse(read('src/assets/blog/posts.json')) as Record<string, unknown>[];
      const entry = index.find((post) => post['slug'] === slug)!;
      const detail = JSON.parse(read(`src/assets/blog/posts/${slug}.json`)) as {
        seo: { ogImage: string };
      };

      expect(entry).toBeDefined();
      expect(entry).not.toHaveProperty('coverImage');
      expect(detail).not.toHaveProperty('coverImage');
      expect(detail.seo.ogImage).toBe(`https://media.matiasgaleano.dev/og/${slug}.png`);
      for (const artifact of [
        'public/rss.xml',
        'public/sitemap-blog.xml',
        '.generated/release-manifest.json',
        '.generated/chat/knowledge-payload.json',
      ]) {
        expect(read(artifact), artifact).toContain(slug);
      }
    } finally {
      fixture.dispose();
    }
  });
});
