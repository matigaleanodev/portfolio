import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { captureDiagramPreview } from './diagram-preview.mjs';

const [archifyCli, selectedSlug, repositoryRoot] = process.argv.slice(2);
if (!archifyCli) {
  throw new Error('Usage: node scripts/build-diagrams.mjs <archify-cli-path> [slug] [repository-root]');
}
if (repositoryRoot && !selectedSlug) throw new Error('A repository root requires a diagram slug.');

const root = process.cwd();
const repositoryRoots = JSON.parse(await fs.readFile(path.join(root, '.archify/repositories.json'), 'utf8')
  .catch((error) => {
    if (error.code === 'ENOENT') return '{}';
    throw error;
  }));
const sourceDir = path.join(root, 'content/diagrams');
const renderedDir = path.join(sourceDir, 'rendered');
const manifestPath = path.join(sourceDir, 'manifest.json');
const sources = (await fs.readdir(sourceDir))
  .filter((name) => /^[a-z0-9-]+\.(architecture|workflow|lifecycle)\.json$/.test(name))
  .sort();
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8').catch((error) => {
  if (error.code === 'ENOENT') return '[]';
  throw error;
}));
await fs.mkdir(renderedDir, { recursive: true });
let generated = 0;

for (const filename of sources) {
  const slug = filename.split('.')[0];
  if (selectedSlug && slug !== selectedSlug) continue;
  const input = path.join(sourceDir, filename);
  const source = await fs.readFile(input);
  const candidate = JSON.parse(source.toString());
  const evidenceDir = `.archify/checks/${slug}-${Date.now()}`;
  const args = [path.resolve(archifyCli), 'finalize', candidate.diagram_type, input,
    candidate.meta.output, '--quality', 'showcase', '--out-dir', evidenceDir, '--json'];
  if (candidate.meta.repository) {
    const sourceRoot = repositoryRoot ?? repositoryRoots[candidate.meta.repository.url] ?? root;
    args.push('--repo-root', path.resolve(sourceRoot));
  }
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  if (result.error) throw result.error;
  const receipt = JSON.parse(result.stdout);
  if (result.status !== 0 || !receipt.ok) {
    console.error(JSON.stringify({ slug, ...receipt }));
    process.exit(1);
  }

  const artifact = await fs.readFile(path.resolve(root, candidate.meta.output));
  const artifactSha256 = createHash('sha256').update(artifact).digest('hex');
  if (artifactSha256 !== receipt.artifact.sha256) throw new Error(`Artifact changed: ${slug}`);
  await fs.writeFile(path.join(renderedDir, `${slug}.html`), artifact);
  const preview = `${slug}.${artifactSha256.slice(0, 12)}.png`;
  const previewSha256 = await captureDiagramPreview(path.resolve(root, candidate.meta.output),
    path.join(renderedDir, preview));
  const fullReceipt = JSON.parse(await fs.readFile(receipt.evidence.receipt, 'utf8'));
  const entry = {
    slug, title: candidate.meta.title, type: candidate.diagram_type,
    source: filename, artifact: `rendered/${slug}.html`,
    specificationSha256: receipt.specification.sha256, artifactSha256, preview, previewSha256,
    validation: fullReceipt.stages.validate.receipt.validation,
    browserEvidence: receipt.gates['browser-check'], visualReview: receipt.visualReview,
    ...(candidate.meta.repository ? { repository: candidate.meta.repository } : {}),
  };
  const previous = manifest.findIndex((item) => item.slug === slug);
  if (previous >= 0) manifest[previous] = entry;
  else manifest.push(entry);
  manifest.sort((a, b) => a.slug.localeCompare(b.slug));
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  // Mantener las vistas previas editoriales alineadas con el HTML validado.
  const postsDir = path.join(root, 'content/posts');
  for (const post of await fs.readdir(postsDir, { withFileTypes: true })) {
    if (!post.isDirectory()) continue;
    const markdownPath = path.join(postsDir, post.name, 'index.md');
    const markdown = await fs.readFile(markdownPath, 'utf8');
    const updated = markdown.replace(
      new RegExp(`/diagrams/${slug}\\.[a-f0-9]{12}\\.png`, 'g'),
      `/diagrams/${preview}`,
    );
    if (updated !== markdown) await fs.writeFile(markdownPath, updated);
  }
  generated += 1;
  console.log(`${slug}: showcase 9/9; browser passed; ${artifact.length} bytes`);
}

if (generated === 0) throw new Error(`No diagram candidates found: ${selectedSlug ?? sourceDir}`);
