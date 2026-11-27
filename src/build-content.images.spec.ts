import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createContentPipelineFixture } from './testing/content-pipeline-fixture';

describe('imágenes de los artículos', () => {
  let fixture: ReturnType<typeof createContentPipelineFixture>;

  beforeAll(() => {
    fixture = createContentPipelineFixture();
    execFileSync(process.execPath, ['scripts/build-content.mjs'], { cwd: fixture.root });
  });
  afterAll(() => fixture.dispose());

  it('declara las dimensiones reales de cada vista previa de diagrama', () => {
    const post = JSON.parse(
      readFileSync(
        join(fixture.root, 'src/assets/blog/posts/arquitectura-angular-real.json'),
        'utf8',
      ),
    );
    const images: string[] = post.contentHtml.match(/<img [^>]+>/g) ?? [];

    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      const preview = readFileSync(join(fixture.root, 'public', /src="([^"]+)"/.exec(image)![1]));
      expect(image).toContain(`width="${preview.readUInt32BE(16)}"`);
      expect(image).toContain(`height="${preview.readUInt32BE(20)}"`);
    }
  });
});
