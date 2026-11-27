import { readFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';

// Angular escribe la ruta `404` como `404/index.html`; Hosting solo usa `404.html` en la raíz.
const browser = join(process.cwd(), 'dist', 'portfolio', 'browser');
const source = join(browser, '404', 'index.html');
const html = await readFile(source, 'utf8');

const problems = [
  [!html.includes('No encontramos esta página'), 'no contiene el estado de error'],
  [!/<meta name="robots" content="noindex, follow"/.test(html), 'no declara noindex'],
  [/<link[^>]+rel="canonical"/.test(html), 'declara una canónica'],
]
  .filter(([failed]) => failed)
  .map(([, reason]) => reason);

if (problems.length > 0) {
  throw new Error(`El HTML de la ruta 404 ${problems.join(' y ')}.`);
}

await rename(source, join(browser, '404.html'));
await rm(join(browser, '404'), { recursive: true });
