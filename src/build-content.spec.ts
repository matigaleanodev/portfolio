import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('build-content pipeline', () => {
  it('publica por fecha argentina en todos los artifacts y elimina detalles viejos', () => {
    const tempBaseDir = join(process.cwd(), '.tmp');
    mkdirSync(tempBaseDir, { recursive: true });
    const tempRoot = mkdtempSync(join(tempBaseDir, 'portfolio-publication-'));
    mkdirSync(join(tempRoot, 'scripts'));
    for (const script of ['build-content.mjs', 'build-release-manifest.mjs', 'publish-diagrams.mjs']) {
      cpSync(join(process.cwd(), 'scripts', script), join(tempRoot, 'scripts', script));
    }
    const diagramsDir = join(tempRoot, 'content', 'diagrams');
    mkdirSync(join(diagramsDir, 'rendered'), { recursive: true });
    writeFileSync(join(diagramsDir, 'LICENSE.txt'), 'Licencia de prueba');
    const diagramManifest: object[] = [];
    for (const [slug, date, draft] of [
      ['spec-published', '2026-10-09', false],
      ['spec-scheduled', '2026-10-10', false],
      ['spec-draft', '2026-10-09', true],
    ] as const) {
      const folder = join(tempRoot, 'content', 'posts', slug);
      mkdirSync(folder, { recursive: true });
      writeFileSync(join(folder, 'index.md'), `---\ntitle: ${slug}\nslug: ${slug}\nexcerpt: Resumen\ndate: '${date}'\ntags: [angular]\ncoverImage: /assets/cover.webp\ndraft: ${draft}\n---\nContenido ${slug}\n\n[Diagrama](/diagrams/${slug}.html)\n`);
      const artifact = `<html lang="es"><title>${slug}</title></html>`;
      const artifactSha256 = createHash('sha256').update(artifact).digest('hex');
      const preview = `${slug}.${artifactSha256.slice(0, 12)}.png`;
      writeFileSync(join(diagramsDir, `${slug}.architecture.json`), '{}');
      writeFileSync(join(diagramsDir, 'rendered', `${slug}.html`), artifact);
      writeFileSync(join(diagramsDir, 'rendered', preview), 'preview');
      diagramManifest.push({ slug, title: slug, type: 'architecture',
        source: `${slug}.architecture.json`, artifactSha256,
        specificationSha256: createHash('sha256').update('{}').digest('hex'), preview,
        previewSha256: createHash('sha256').update('preview').digest('hex'),
      });
    }
    writeFileSync(join(diagramsDir, 'manifest.json'), JSON.stringify(diagramManifest));
    const buildAt = (instant: string) => {
      execFileSync('node', ['--input-type=module', '-e',
        `import { runBuildContent } from './scripts/build-content.mjs'; await runBuildContent(new Date('${instant}'));`,
      ], { cwd: tempRoot, stdio: 'pipe' });
      execFileSync('node', ['./scripts/build-release-manifest.mjs'], { cwd: tempRoot, stdio: 'pipe' });
    };
    const artifacts = ['src/assets/blog/posts.json', 'public/rss.xml', 'public/sitemap-blog.xml',
      '.generated/chat/knowledge.json', '.generated/release-manifest.json'];
    try {
      buildAt('2026-10-10T02:59:59Z');
      for (const artifact of artifacts) {
        const raw = readFileSync(join(tempRoot, artifact), 'utf8');
        expect(raw).toContain('spec-published');
        expect(raw).not.toContain('spec-scheduled');
        expect(raw).not.toContain('spec-draft');
      }
      const detailPath = join(tempRoot, 'src/assets/blog/posts/spec-scheduled.json');
      const diagramPath = join(tempRoot, 'public/diagrams/spec-scheduled.html');
      const diagramIndex = join(tempRoot, 'public/diagrams/index.json');
      expect(existsSync(detailPath)).toBe(false);
      expect(existsSync(diagramPath)).toBe(false);
      expect(readFileSync(diagramIndex, 'utf8')).not.toContain('spec-scheduled');
      expect(readFileSync(diagramIndex, 'utf8')).not.toContain('spec-draft');
      buildAt('2026-10-10T03:00:00Z');
      for (const artifact of artifacts) {
        expect(readFileSync(join(tempRoot, artifact), 'utf8')).toContain('spec-scheduled');
      }
      expect(existsSync(detailPath)).toBe(true);
      expect(existsSync(diagramPath)).toBe(true);
      expect(readFileSync(diagramIndex, 'utf8')).toContain('spec-scheduled');
      buildAt('2026-10-10T02:59:59Z');
      expect(existsSync(detailPath)).toBe(false);
      expect(existsSync(diagramPath)).toBe(false);
      expect(readFileSync(diagramIndex, 'utf8')).not.toContain('spec-scheduled');
      writeFileSync(join(diagramsDir, 'spec-published.architecture.json'), 'modified');
      expect(() => buildAt('2026-10-10T02:59:59Z')).toThrow(/without Archify validation/);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
  it('debería preservar estructura técnica con IDs estables y sanitización', () => {
    const markdown =
      '## Repetido\n\n## Repetido\n\n### Detalle\n\n1. Paso\n   - Anidado\n\n| Campo | Valor |\n| --- | --- |\n| id | 1 |\n\n```typescript\nconst value = "hola";\n```\n\n<script>alert(1)</script>\n\n[Inseguro](javascript:alert(1))';
    const result = JSON.parse(
      execFileSync(
        'node',
        [
          '--input-type=module',
          '-e',
          `import { renderMarkdown } from './scripts/build-content.mjs'; console.log(JSON.stringify(renderMarkdown(${JSON.stringify(markdown)})));`,
        ],
        { encoding: 'utf8' },
      ),
    ) as { contentHtml: string; headings: { id: string; level: number }[] };
    expect(result.headings.map((heading) => heading.id)).toEqual([
      'section-repetido',
      'section-repetido-2',
      'section-detalle',
    ]);
    expect(result.headings.map((heading) => heading.level)).toEqual([2, 2, 3]);
    expect(result.contentHtml).toContain('<ol>');
    expect(result.contentHtml).toContain('<ul>');
    expect(result.contentHtml).toContain('class="table-scroll"');
    expect(result.contentHtml).toContain('<table>');
    expect(result.contentHtml).toContain('hljs-keyword');
    expect(result.contentHtml).not.toContain('<script');
    expect(result.contentHtml).not.toContain('javascript:');
  });
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
    const knowledgeRaw = readFileSync(
      join(process.cwd(), '.generated', 'chat', 'knowledge.json'),
      'utf8',
    );
    const knowledge = JSON.parse(knowledgeRaw) as {
      generatedAt: string;
      projects: { slug: string; highlights: string[]; searchText: string; links: { url: string }[] }[];
      posts: { slug: string; canonicalUrl: string; summary: string; searchText: string }[];
    };

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
    expect(knowledge.generatedAt).toBeTruthy();
    const diagramLinks = knowledge.projects.flatMap((project) => project.links)
      .filter((link) => link.url.includes('/diagrams/'));
    expect(diagramLinks).toHaveLength(3);
    for (const link of knowledge.projects.flatMap((project) => project.links)) {
      const url = new URL(link.url);
      expect(['https:', 'http:']).toContain(url.protocol);
      expect(url.username + url.password).toBe('');
    }
    expect(diagramLinks.every((link) => link.url.startsWith('https://matiasgaleano.dev/diagrams/'))).toBe(true);
    expect(knowledge.projects.some((project) => project.slug === 'foodly-notes')).toBe(true);
    expect(knowledge.projects.some((project) => project.slug === 'portfolio')).toBe(true);
    expect(
      knowledge.projects.some((project) =>
        project.highlights.includes('Proyecto destacado del portfolio.'),
      ),
    ).toBe(true);
    expect(
      knowledge.projects.some((project) =>
        project.highlights.includes('Static-first + automatización serverless'),
      ),
    ).toBe(true);
    expect(
      knowledge.projects.some((project) => project.searchText.includes('Repositorio Frontend')),
    ).toBe(true);
    expect(
      knowledge.posts.some(
        (post) =>
          post.slug === 'arquitectura-angular-real' &&
          post.canonicalUrl === 'https://matiasgaleano.dev/blog/arquitectura-angular-real',
      ),
    ).toBe(true);
    expect(knowledge.posts.some((post) => post.summary.length > 0)).toBe(true);
    expect(knowledge.posts.some((post) => post.searchText.includes('angular'))).toBe(true);
  });

  it('deberia fallar si un proyecto no define exactamente un primary CTA', () => {
    const slug = 'spec-invalid-project-primary';
    const tempBaseDir = join(process.cwd(), '.tmp');
    mkdirSync(tempBaseDir, { recursive: true });
    const tempRoot = mkdtempSync(join(tempBaseDir, 'portfolio-build-content-'));
    const scriptsDir = join(tempRoot, 'scripts');
    const contentDir = join(tempRoot, 'content');
    const projectDir = join(contentDir, 'projects', slug);
    const projectFile = join(projectDir, 'index.md');

    mkdirSync(scriptsDir, { recursive: true });
    cpSync(
      join(process.cwd(), 'scripts', 'build-content.mjs'),
      join(scriptsDir, 'build-content.mjs'),
    );
    cpSync(join(process.cwd(), 'scripts', 'publish-diagrams.mjs'), join(scriptsDir, 'publish-diagrams.mjs'));
    cpSync(join(process.cwd(), 'content'), contentDir, { recursive: true });
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(
      projectFile,
      `---
title: Invalid Project
slug: ${slug}
excerpt: Proyecto invalido para test.
productType: Plataforma
primarySignal: Backend
proof: Tiene prueba
role: Tiene rol
architecture: Tiene arquitectura
date: 2026-03-09
coverImage: /assets/project.webp
stack:
  - API
links:
  - label: Repo A
    url: https://example.com/a
    primary: false
  - label: Repo B
    url: https://example.com/b
    primary: false
featured: false
order: 999
---

Proyecto temporal para validacion.
`,
      'utf8',
    );

    try {
      expect(() =>
        execFileSync('node', ['./scripts/build-content.mjs'], {
          cwd: tempRoot,
          stdio: 'pipe',
        }),
      ).toThrow(/Expected exactly one primary project link/);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
