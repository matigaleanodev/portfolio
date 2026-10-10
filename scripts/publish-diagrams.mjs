import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Publica únicamente diagramas enlazados desde el contenido que pasó el filtro editorial.
export async function publishDiagrams(rootDir, projects, posts) {
  const sourceDir = path.join(rootDir, 'content', 'diagrams');
  const outputDir = path.join(rootDir, 'public', 'diagrams');
  const manifest = JSON.parse(await fs.readFile(path.join(sourceDir, 'manifest.json'), 'utf8')
    .catch((error) => {
      if (error.code === 'ENOENT') return '[]';
      throw error;
    }));
  const requested = new Set();
  for (const project of projects) {
    for (const link of project.links) {
      const match = /^\/diagrams\/([a-z0-9-]+)\.html(?:[?#].*)?$/.exec(link.url);
      if (match) requested.add(match[1]);
    }
  }
  for (const post of posts) {
    for (const match of post.contentHtml.matchAll(/href="\/diagrams\/([a-z0-9-]+)\.html(?:[?#][^"]*)?"/g)) {
      requested.add(match[1]);
    }
  }

  const selected = [];
  for (const slug of [...requested].sort()) {
    const entry = manifest.find((item) => item.slug === slug);
    if (!entry || !['architecture', 'workflow', 'lifecycle'].includes(entry.type)
      || entry.source !== `${slug}.${entry.type}.json`) {
      throw new Error(`Missing or invalid diagram manifest entry: ${slug}`);
    }
    const source = await fs.readFile(path.join(sourceDir, entry.source));
    const artifact = await fs.readFile(path.join(sourceDir, 'rendered', `${slug}.html`));
    for (const [bytes, expected] of [[source, entry.specificationSha256], [artifact, entry.artifactSha256]]) {
      if (createHash('sha256').update(bytes).digest('hex') !== expected) {
        throw new Error(`Diagram changed without Archify validation: ${slug}`);
      }
    }
    if (entry.preview !== `${slug}.${entry.artifactSha256.slice(0, 12)}.png`) {
      throw new Error(`Invalid diagram preview path: ${slug}`);
    }
    const preview = await fs.readFile(path.join(sourceDir, 'rendered', entry.preview));
    if (createHash('sha256').update(preview).digest('hex') !== entry.previewSha256) {
      throw new Error(`Diagram preview changed without generation: ${slug}`);
    }
    selected.push({ entry, artifact, preview });
  }

  await fs.mkdir(outputDir, { recursive: true });
  const previews = new Set(selected.map(({ entry }) => entry.preview));
  for (const filename of await fs.readdir(outputDir)) {
    if (/^[a-z0-9-]+\.html$/.test(filename) && !requested.has(filename.slice(0, -5))) {
      await fs.rm(path.join(outputDir, filename));
    }
    if (/^[a-z0-9-]+\.[a-f0-9]{12}\.png$/.test(filename) && !previews.has(filename)) {
      await fs.rm(path.join(outputDir, filename));
    }
  }
  for (const { entry, artifact, preview } of selected) {
    await fs.writeFile(path.join(outputDir, `${entry.slug}.html`), artifact);
    await fs.writeFile(path.join(outputDir, entry.preview), preview);
  }
  if (selected.length > 0) {
    await fs.copyFile(path.join(sourceDir, 'LICENSE.txt'), path.join(outputDir, 'LICENSE.txt'));
  }
  const published = selected.map(({ entry }) => ({
    slug: entry.slug, title: entry.title, type: entry.type, sha256: entry.artifactSha256,
    preview: entry.preview,
  }));
  await fs.writeFile(path.join(outputDir, 'index.json'), `${JSON.stringify(published, null, 2)}\n`);
  console.log(`Published ${published.length} static diagrams.`);
}
