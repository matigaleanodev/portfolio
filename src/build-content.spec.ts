import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    const knowledgeRaw = readFileSync(
      join(process.cwd(), '.generated', 'chat', 'knowledge.json'),
      'utf8',
    );
    const knowledge = JSON.parse(knowledgeRaw) as {
      generatedAt: string;
      projects: { slug: string; highlights: string[]; searchText: string }[];
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
    cpSync(join(process.cwd(), 'scripts', 'build-content.mjs'), join(scriptsDir, 'build-content.mjs'));
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
