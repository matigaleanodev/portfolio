import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

interface ScenarioResult {
  deploy?: boolean;
  reason?: string;
  same?: boolean;
  error?: string;
  calls?: number;
  status?: number;
}

const currentSha = 'a'.repeat(40);
const newerSha = 'b'.repeat(40);

function runScenario(source: string): ScenarioResult {
  return JSON.parse(
    execFileSync(
      'node',
      [
        '--input-type=module',
        '-e',
        `
    import { createPublicationState, getDeploymentDecision, writePublicationState } from './scripts/publication-state.mjs';
    const posts = [{ slug: 'published', date: '2026-10-09' }];
    const expected = createPublicationState(posts, '${currentSha}');
    const response = (state) => async () => ({ ok: true, json: async () => state });
    const env = { GITHUB_REPOSITORY: 'owner/repo', GITHUB_TOKEN: 'token' };
    const ref = (sha) => ({ ok: true, json: async () => ({ ref: 'refs/heads/main', object: { type: 'commit', sha } }) });
    // GitHub informa la cabeza de main; el resto de los pedidos va a la marca publicada.
    const online = (production, head = '${currentSha}') => async (url, init) =>
      String(url).startsWith('https://api.github.com/') ? ref(head) : production(url, init);
    const decide = (event, fetchImpl) => getDeploymentDecision(expected, event, fetchImpl, env);
    ${source}
  `,
      ],
      { encoding: 'utf8' },
    ),
  ) as ScenarioResult;
}

describe('publicación condicional', () => {
  it('omite Firebase si el mismo código y los posts vigentes ya están publicados', () => {
    expect(
      runScenario(
        `console.log(JSON.stringify(await decide('schedule', online(response(expected)))));`,
      ).deploy,
    ).toBe(false);
  });

  it('publica cuando llega la fecha de otro post sin cambiar el commit', () => {
    expect(
      runScenario(`
      const published = createPublicationState([], expected.gitSha);
      console.log(JSON.stringify(await decide('schedule', online(response(published)))));
    `).deploy,
    ).toBe(true);
  });

  it('recupera un deploy fallido aunque los cambios de código no alteren el índice', () => {
    expect(
      runScenario(`
      const published = createPublicationState(posts, 'revision-before-failed-push');
      console.log(JSON.stringify(await decide('schedule', online(response(published)))));
    `).deploy,
    ).toBe(true);
  });

  it.each(['push', 'workflow_dispatch'])(
    'mantiene el deploy forzado para %s sin consultar producción',
    (event) => {
      expect(
        runScenario(`
      console.log(JSON.stringify(await decide('${event}', online(async () => { throw new Error('No debería consultar producción'); }))));
    `),
      ).toEqual({ deploy: true, reason: 'Push or manual deployment requested.' });
    },
  );

  it.each([
    `async () => ({ ok: false, status: 404 })`,
    `async () => ({ ok: false, status: 503 })`,
    `async () => { throw new Error('Timeout'); }`,
    `async () => ({ ok: true, json: async () => { throw new Error('HTML instead of JSON'); } })`,
    `response({ version: 1 })`,
    `response(null)`,
  ])('despliega si no puede confirmar el estado publicado: %s', (fetchSource) => {
    expect(
      runScenario(`console.log(JSON.stringify(await decide('schedule', online(${fetchSource}))));`)
        .deploy,
    ).toBe(true);
  });

  it.each(['push', 'workflow_dispatch', 'schedule'])(
    'rechaza %s de una revisión anterior a main, aunque haya una posterior publicada',
    (event) => {
      const result = runScenario(`
      const published = createPublicationState(posts, '${newerSha}');
      try {
        const decision = await decide('${event}', online(response(published), '${newerSha}'));
        console.log(JSON.stringify(decision));
      } catch (error) { console.log(JSON.stringify({ error: error.message })); }
    `);

      expect(result.deploy).toBeUndefined();
      expect(result.error).toContain('ya no es la cabeza de main');
    },
  );

  it.each([
    `async () => ({ ok: false, status: 503 })`,
    `async () => ({ ok: false, status: 404 })`,
    `async () => { throw new Error('Timeout'); }`,
    `async () => ({ ok: true, json: async () => ({ object: {} }) })`,
  ])('no publica si no puede confirmar la cabeza de main: %s', (fetchSource) => {
    const result = runScenario(`
      try {
        console.log(JSON.stringify(await getDeploymentDecision(expected, 'push', ${fetchSource}, env)));
      } catch (error) { console.log(JSON.stringify({ error: error.message })); }
    `);

    expect(result.deploy).toBeUndefined();
    expect(result.error).toContain('No se pudo confirmar la cabeza de main');
  });

  it('tolera una falla pasajera de GitHub sin dar por vigente la revisión', () => {
    const result = runScenario(`
      let calls = 0;
      const decision = await decide('push', async () => {
        calls += 1;
        return calls === 1 ? { ok: false, status: 502 } : ref(expected.gitSha);
      });
      console.log(JSON.stringify({ ...decision, calls }));
    `);

    expect(result).toMatchObject({ deploy: true, calls: 2 });
  });

  it.each([
    ['vigente', currentSha, 0],
    ['obsoleta', newerSha, 1],
  ])('el comando que protege cada efecto sale según la revisión %s', (_name, head, status) => {
    const result = runScenario(`
      const http = await import('node:http');
      const { spawn } = await import('node:child_process');
      let request;
      const server = http.createServer((incoming, outgoing) => {
        request = incoming;
        outgoing.setHeader('content-type', 'application/json');
        outgoing.end(JSON.stringify({ ref: 'refs/heads/main', object: { sha: '${head}' } }));
      });
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const child = spawn(process.execPath, ['scripts/current-revision.mjs'], {
        env: { ...process.env, ...env, GITHUB_SHA: expected.gitSha, GITHUB_API_URL: 'http://127.0.0.1:' + server.address().port },
        stdio: 'ignore',
      });
      const status = await new Promise((resolve) => child.on('close', resolve));
      server.close();
      console.log(JSON.stringify({
        status,
        same: request.url === '/repos/owner/repo/git/ref/heads/main' && request.headers.authorization === 'Bearer token',
      }));
    `);

    expect(result).toEqual({ status, same: true });
  });

  it('incluye la marca en el directorio servido por Firebase', () => {
    expect(
      runScenario(`
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const tempDir = path.join(process.cwd(), '.tmp');
      await fs.mkdir(tempDir, { recursive: true });
      const root = await fs.mkdtemp(path.join(tempDir, 'publication-state-'));
      try {
        await fs.mkdir(path.join(root, 'dist', 'portfolio', 'browser'), { recursive: true });
        await writePublicationState(expected, root);
        const raw = await fs.readFile(path.join(root, 'dist', 'portfolio', 'browser', 'publication-state.json'), 'utf8');
        console.log(JSON.stringify({ same: JSON.stringify(JSON.parse(raw)) === JSON.stringify(expected) }));
      } finally { await fs.rm(root, { recursive: true, force: true }); }
    `).same,
    ).toBe(true);
  });
});
