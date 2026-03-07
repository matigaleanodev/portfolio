import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('build-content pipeline', () => {
  it('deberia generar artifacts consistentes para blog y seo', () => {
    execFileSync('node', ['./scripts/build-content.mjs'], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    const blogIndex = readFileSync(
      join(process.cwd(), 'src', 'assets', 'blog', 'posts.json'),
      'utf8',
    );
    const blogPost = readFileSync(
      join(process.cwd(), 'src', 'assets', 'blog', 'posts', 'arquitectura-angular-real.json'),
      'utf8',
    );
    const rss = readFileSync(join(process.cwd(), 'public', 'rss.xml'), 'utf8');
    const sitemap = readFileSync(join(process.cwd(), 'public', 'sitemap-blog.xml'), 'utf8');

    expect(blogIndex).toContain('"slug": "arquitectura-angular-real"');
    expect(blogPost).toContain('"contentHtml"');
    expect(blogPost).toContain(
      '"canonicalUrl": "https://matiasgaleano.dev/blog/arquitectura-angular-real"',
    );
    expect(rss).toContain('<rss version="2.0">');
    expect(rss).toContain('<link>https://matiasgaleano.dev/blog/arquitectura-angular-real</link>');
    expect(sitemap).toContain('<loc>https://matiasgaleano.dev/blog</loc>');
    expect(sitemap).toContain(
      '<loc>https://matiasgaleano.dev/blog/arquitectura-angular-real</loc>',
    );
  });
});
