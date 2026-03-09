import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('build-chat-knowledge-payload', () => {
  it(
    'deberia generar un payload consumible por publish-chat-knowledge',
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

    execFileSync('node', ['./scripts/build-chat-knowledge-payload.mjs'], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    const payload = JSON.parse(
      readFileSync(join(process.cwd(), '.generated', 'chat', 'knowledge-payload.json'), 'utf8'),
    ) as {
      artifact: { generatedAt: string; posts: { slug: string }[]; projects: { slug: string }[] };
      release: { generatedAt: string; siteUrl: string };
      source: { repository: string; artifactPath: string };
    };

    expect(payload.source.repository).toBe('portfolio');
    expect(payload.source.artifactPath).toBe('.generated/chat/knowledge.json');
    expect(payload.release.siteUrl).toBe('https://matiasgaleano.dev');
    expect(payload.release.generatedAt).toBeTruthy();
    expect(payload.artifact.generatedAt).toBeTruthy();
    expect(payload.artifact.posts.some((post) => post.slug === 'arquitectura-angular-real')).toBe(
      true,
    );
    expect(payload.artifact.projects.some((project) => project.slug === 'foodly-notes')).toBe(
      true,
    );
    },
    10000,
  );
});
