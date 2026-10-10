import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

interface ScenarioResult {
  deploy?: boolean;
  reason?: string;
  same?: boolean;
}

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
    const expected = createPublicationState(posts, 'revision-a');
    const response = (state) => async () => ({ ok: true, json: async () => state });
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
        `console.log(JSON.stringify(await getDeploymentDecision(expected, 'schedule', response(expected))));`,
      ).deploy,
    ).toBe(false);
  });

  it('publica cuando llega la fecha de otro post sin cambiar el commit', () => {
    expect(
      runScenario(`
      const published = createPublicationState([], 'revision-a');
      console.log(JSON.stringify(await getDeploymentDecision(expected, 'schedule', response(published))));
    `).deploy,
    ).toBe(true);
  });

  it('recupera un deploy fallido aunque los cambios de código no alteren el índice', () => {
    expect(
      runScenario(`
      const published = createPublicationState(posts, 'revision-before-failed-push');
      console.log(JSON.stringify(await getDeploymentDecision(expected, 'schedule', response(published))));
    `).deploy,
    ).toBe(true);
  });

  it.each(['push', 'workflow_dispatch'])(
    'mantiene el deploy forzado para %s sin consultar producción',
    (event) => {
      expect(
        runScenario(`
      console.log(JSON.stringify(await getDeploymentDecision(expected, '${event}', async () => { throw new Error('No debería consultar producción'); })));
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
      runScenario(
        `console.log(JSON.stringify(await getDeploymentDecision(expected, 'schedule', ${fetchSource})));`,
      ).deploy,
    ).toBe(true);
  });

  it('incluye la marca en el directorio servido por Firebase', () => {
    expect(
      runScenario(`
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const root = await fs.mkdtemp(path.join(process.cwd(), '.angular', 'publication-state-'));
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
