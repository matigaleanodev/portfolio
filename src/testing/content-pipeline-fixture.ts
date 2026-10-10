import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';

// Aísla las pruebas que generan archivos para que no compitan sobre la salida del repo.
export function createContentPipelineFixture() {
  const base = join(process.cwd(), '.tmp');
  mkdirSync(base, { recursive: true });
  const root = mkdtempSync(join(base, 'content-pipeline-'));
  mkdirSync(join(root, 'scripts'));
  for (const script of ['build-content.mjs', 'publish-diagrams.mjs',
    'build-release-manifest.mjs', 'build-chat-knowledge-payload.mjs']) {
    cpSync(join(process.cwd(), 'scripts', script), join(root, 'scripts', script));
  }
  cpSync(join(process.cwd(), 'content'), join(root, 'content'), { recursive: true });
  return { root, dispose: () => rmSync(root, { recursive: true, force: true }) };
}
