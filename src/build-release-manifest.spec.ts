import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('build-release-manifest', () => {
  it(
    'deberia generar un manifiesto consumible para deploy y automatizacion futura',
    () => {
    execFileSync('node', ['./scripts/build-content.mjs'], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    execFileSync('node', ['./scripts/build-release-manifest.mjs'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: {
        ...process.env,
        GITHUB_SHA: 'abc123',
        GITHUB_REF: 'refs/heads/main',
      },
    });

    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), '.generated', 'release-manifest.json'), 'utf8'),
    ) as {
      git: { sha: string; ref: string };
      deploy: { provider: string; publicDir: string };
      content: { posts: { slug: string }[]; projects: { slug: string }[] };
      seo: { rssPath: string };
    };

    expect(manifest.git.sha).toBe('abc123');
    expect(manifest.git.ref).toBe('refs/heads/main');
    expect(manifest.deploy.provider).toBe('firebase-hosting');
    expect(manifest.deploy.publicDir).toBe('dist/portfolio/browser');
    expect(manifest.seo.rssPath).toBe('/rss.xml');
    expect(manifest.content.posts.some((post) => post.slug === 'arquitectura-angular-real')).toBe(
      true,
    );
    expect(manifest.content.projects.length).toBeGreaterThan(0);
    },
    10000,
  );
});
