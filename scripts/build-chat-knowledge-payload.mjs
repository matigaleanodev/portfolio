import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const rootDir = process.cwd();
const generatedDir = join(rootDir, '.generated');
const chatDir = join(generatedDir, 'chat');
const knowledgePath = join(chatDir, 'knowledge.json');
const releaseManifestPath = join(generatedDir, 'release-manifest.json');
const outputPath = join(chatDir, 'knowledge-payload.json');

const [knowledgeRaw, releaseManifestRaw] = await Promise.all([
  readFile(knowledgePath, 'utf8'),
  readFile(releaseManifestPath, 'utf8'),
]);

const knowledge = JSON.parse(knowledgeRaw);
const releaseManifest = JSON.parse(releaseManifestRaw);

if (!isNonEmptyString(knowledge?.generatedAt)) {
  throw new TypeError('Expected chat knowledge artifact with generatedAt.');
}

if (!isNonEmptyString(releaseManifest?.generatedAt) || !isNonEmptyString(releaseManifest?.siteUrl)) {
  throw new TypeError('Expected release manifest with generatedAt and siteUrl.');
}

const payload = {
  artifact: knowledge,
  release: {
    generatedAt: releaseManifest.generatedAt,
    siteUrl: releaseManifest.siteUrl,
  },
  source: {
    repository: 'portfolio',
    artifactPath: '.generated/chat/knowledge.json',
  },
};

await mkdir(chatDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log('Generated chat knowledge invoke payload.');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
