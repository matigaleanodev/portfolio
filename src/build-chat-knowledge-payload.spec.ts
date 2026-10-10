import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createContentPipelineFixture } from './testing/content-pipeline-fixture';

describe('build-chat-knowledge-payload', () => {
  it(
    'deberia generar un payload consumible por publish-chat-knowledge',
    () => {
      const fixture = createContentPipelineFixture();
      try {
        execFileSync('node', ['./scripts/build-content.mjs'], {
          cwd: fixture.root,
          stdio: 'pipe',
        });

        execFileSync('node', ['./scripts/build-release-manifest.mjs'], {
          cwd: fixture.root,
          stdio: 'pipe',
          env: {
            ...process.env,
            GITHUB_SHA: 'abc123',
            GITHUB_REF: 'refs/heads/main',
          },
        });

        execFileSync('node', ['./scripts/build-chat-knowledge-payload.mjs'], {
          cwd: fixture.root,
          stdio: 'pipe',
        });

        const payload = JSON.parse(
          readFileSync(join(fixture.root, '.generated', 'chat', 'knowledge-payload.json'), 'utf8'),
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
        const knowledgePath = join(fixture.root, '.generated', 'chat', 'knowledge.json');
        const invalidKnowledge = JSON.parse(readFileSync(knowledgePath, 'utf8'));
        invalidKnowledge.projects[0].links = [{ label: 'Diagrama', url: '/diagrams/broken.html' }];
        writeFileSync(knowledgePath, JSON.stringify(invalidKnowledge));
        expect(() => execFileSync('node', ['./scripts/build-chat-knowledge-payload.mjs'], {
          cwd: fixture.root, stdio: 'pipe',
        })).toThrow();
      } finally {
        fixture.dispose();
      }
    },
    10000,
  );
});
