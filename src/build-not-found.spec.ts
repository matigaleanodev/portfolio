import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const script = join(process.cwd(), 'scripts', 'build-not-found.mjs');
const valid =
  '<html><head><meta name="robots" content="noindex, follow"></head>' +
  '<body><h1>No encontramos esta página</h1></body></html>';

describe('build-not-found', () => {
  let root: string;
  const browser = () => join(root, 'dist', 'portfolio', 'browser');

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'portfolio-404-'));
    await mkdir(join(browser(), '404'), { recursive: true });
  });

  afterEach(() => rm(root, { recursive: true, force: true }));

  it('deberia dejar el HTML de la ruta 404 donde Hosting lo busca', async () => {
    await writeFile(join(browser(), '404', 'index.html'), valid);

    await run('node', [script], { cwd: root });

    await expect(readFile(join(browser(), '404.html'), 'utf8')).resolves.toBe(valid);
    await expect(access(join(browser(), '404'))).rejects.toThrow();
  });

  it.each([
    ['sin noindex', valid.replace('noindex, follow', 'index, follow')],
    ['sin el estado de error', valid.replace('No encontramos esta página', 'Cargando')],
    [
      'con canónica',
      valid.replace('</head>', '<link rel="canonical" href="https://matiasgaleano.dev/"></head>'),
    ],
  ])('deberia fallar con un HTML %s', async (_name, html) => {
    await writeFile(join(browser(), '404', 'index.html'), html);

    await expect(run('node', [script], { cwd: root })).rejects.toThrow(/404/);
  });

  it('deberia fallar si el build no genero la ruta', async () => {
    await expect(run('node', [script], { cwd: root })).rejects.toThrow();
  });
});
