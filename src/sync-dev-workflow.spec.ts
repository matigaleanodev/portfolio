import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const workflow = readFileSync(join(process.cwd(), '.github/workflows/sync-dev.yml'), 'utf8');
const script = (workflow.split('run: |\n')[1] ?? '').replace(/^ {10}/gm, '');
const mainSha = 'abcdef012345'.padEnd(40, '0');
const branch = 'fix/sync-main-abcdef012345';
const url = 'https://example.invalid/pull/9';

// Cada línea de VIEWS es una lectura sucesiva: estado|mergeable|automerge|fallidos|aprobados.
const fakeGh = `#!/usr/bin/env bash
echo "$GH_TOKEN $*" >> "$GH_LOG"
case "$*" in
  "api repos/owner/site/git/ref/heads/main "*) echo "$MAIN_SHA" ;;
  "api repos/owner/site/compare/dev...fix/"*) echo "$BEHIND" ;;
  "api repos/owner/site/compare/dev..."*) echo "$PENDING" ;;
  "api repos/owner/site/git/ref/heads/fix/"*) [[ "$BRANCH_EXISTS" == true ]] ;;
  "api repos/owner/site/git/refs "*) ;;
  "pr list "*) echo "$OPEN_PR" ;;
  "pr create "*) echo "${url}" ;;
  "pr view "*)
    [[ "$VIEW_FAILS" != true ]] || exit 1
    count=$(($(cat "$VIEW_COUNT") + 1)); echo "$count" > "$VIEW_COUNT"
    line=$(sed -n "\${count}p" "$VIEWS"); [[ -n "$line" ]] || line=$(tail -n 1 "$VIEWS")
    echo "$line" ;;
  "pr merge "*) [[ "$AUTO_FAILS" != true ]] ;;
  "api -X PUT repos/owner/site/pulls/9/update-branch"*) [[ "$UPDATE_FAILS" != true ]] ;;
  "api graphql "*) echo "$THREADS" ;;
  *) exit 99 ;;
esac
`;

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

const merged = ['OPEN|MERGEABLE|false||0', 'OPEN|MERGEABLE|true||0', 'MERGED|UNKNOWN|false||2'];

function run(env: Record<string, string> = {}, views: string[] = merged) {
  const directory = mkdtempSync(join(tmpdir(), 'sync-dev-'));
  directories.push(directory);
  writeFileSync(join(directory, 'gh'), fakeGh);
  chmodSync(join(directory, 'gh'), 0o755);
  const log = join(directory, 'calls.log');
  const summary = join(directory, 'summary.md');
  writeFileSync(log, '');
  writeFileSync(summary, '');
  writeFileSync(join(directory, 'views'), `${views.join('\n')}\n`);
  writeFileSync(join(directory, 'count'), '0');
  const result = spawnSync('bash', ['-c', script], {
    cwd: directory,
    encoding: 'utf8',
    env: {
      PATH: `${directory}:/usr/bin:/bin`,
      GH_LOG: log,
      GH_TOKEN: 'sync-token',
      READ_TOKEN: 'read-token',
      GH_REPO: 'owner/site',
      GITHUB_STEP_SUMMARY: summary,
      SYNC_ATTEMPTS: '5',
      SYNC_INTERVAL: '0',
      MAIN_SHA: mainSha,
      PENDING: '1',
      BEHIND: '0',
      THREADS: '0',
      AUTO_FAILS: 'false',
      UPDATE_FAILS: 'false',
      VIEW_FAILS: 'false',
      BRANCH_EXISTS: 'false',
      OPEN_PR: '',
      VIEWS: join(directory, 'views'),
      VIEW_COUNT: join(directory, 'count'),
      ...env,
    },
  });
  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
    summary: readFileSync(summary, 'utf8'),
    calls: readFileSync(log, 'utf8').trim().split('\n'),
  };
}

const called = (calls: string[], text: string) => calls.filter((call) => call.includes(text));

describe('sincronización de main hacia dev', () => {
  it('no escribe en dev, no fuerza y solo integra con el auto-merge nativo', () => {
    expect(workflow.match(/run: \|/g)).toHaveLength(1);
    expect(workflow).not.toMatch(/git push|--force|--admin|--squash|--rebase/);
    expect(workflow.match(/gh pr merge[^\n]*/g)).toEqual([
      expect.stringContaining('gh pr merge "$url" --auto --merge'),
    ]);
    expect(workflow).toContain('permissions: {}');
    expect(workflow).toContain('      actions: read\n');
  });

  it('se ejecuta solo con cada push a main y a pedido', () => {
    expect(workflow).toMatch(/on:\n {2}push:\n {4}branches:\n {6}- main\n {2}workflow_dispatch:/);
  });

  it('abre el pull request, activa el auto-merge y termina cuando queda integrado', () => {
    const { status, calls, summary } = run();

    expect(status).toBe(0);
    expect(calls).toContain(
      `sync-token api repos/owner/site/git/refs -f ref=refs/heads/${branch} -f sha=${mainSha}`,
    );
    expect(called(calls, `pr create --base dev --head ${branch} `)).toHaveLength(1);
    expect(called(calls, 'pr merge')).toEqual([`sync-token pr merge ${url} --auto --merge`]);
    expect(summary).toContain('dev quedó sincronizado');
  });

  it('lee el estado con el token del workflow', () => {
    const views = called(run().calls, ' pr view ');

    expect(views).toHaveLength(3);
    expect(views.every((call) => call.startsWith('read-token '))).toBe(true);
  });

  it('actualiza la rama cuando dev avanzó', () => {
    const { status, calls } = run({ BEHIND: '1' });

    expect(status).toBe(0);
    expect(called(calls, 'pulls/9/update-branch')[0]).toMatch(/^sync-token /);
  });

  it('se detiene e informa un conflicto sin activar el auto-merge', () => {
    const { status, calls, output } = run({}, ['OPEN|CONFLICTING|false||0']);

    expect(status).toBe(1);
    expect(output).toContain('::error::');
    expect(output).toContain('conflictos');
    expect(called(calls, 'pr merge')).toHaveLength(0);
    expect(called(calls, 'update-branch')).toHaveLength(0);
  });

  it('se detiene e informa el check obligatorio que falló', () => {
    const { status, output, summary } = run({}, ['OPEN|MERGEABLE|true|verify|1']);

    expect(status).toBe(1);
    expect(output).toContain('verify');
    expect(summary).toContain(url);
  });

  it('se detiene cuando quedan conversaciones sin resolver', () => {
    const { status, output } = run({ THREADS: '2' }, ['OPEN|MERGEABLE|true||2']);

    expect(status).toBe(1);
    expect(output).toContain('conversaciones sin resolver');
  });

  it('se detiene cuando no puede activar el auto-merge', () => {
    const { status, calls, output } = run({ AUTO_FAILS: 'true' }, ['OPEN|MERGEABLE|false||0']);

    expect(status).toBe(1);
    expect(called(calls, 'pr merge')).toHaveLength(3);
    expect(output).toContain('auto-merge');
  });

  it('se detiene cuando no puede actualizar la rama', () => {
    const { status, calls, output } = run({ BEHIND: '1', UPDATE_FAILS: 'true' }, [
      'OPEN|MERGEABLE|true||0',
    ]);

    expect(status).toBe(1);
    expect(called(calls, 'update-branch')).toHaveLength(3);
    expect(output).toContain('no se pudo actualizar la rama');
  });

  it('se detiene cuando no puede leer el estado', () => {
    const { status, calls, output } = run({ VIEW_FAILS: 'true', SYNC_ATTEMPTS: '20' });

    expect(status).toBe(1);
    expect(called(calls, ' pr view ')).toHaveLength(10);
    expect(output).toContain('no se pudo leer el estado');
  });

  it('falla si el pull request se cierra sin integrar', () => {
    const { status, output } = run({}, ['CLOSED|UNKNOWN|false||2']);

    expect(status).toBe(1);
    expect(output).toContain('cerró sin integrarse');
  });

  it('falla cuando vence el plazo sin integrar', () => {
    const { status, output } = run({}, ['OPEN|MERGEABLE|true||1']);

    expect(status).toBe(1);
    expect(output).toContain('no se integró a tiempo');
  });

  it('no hace nada cuando dev ya contiene main', () => {
    const { status, calls } = run({ PENDING: '0' });

    expect(status).toBe(0);
    expect(calls).toHaveLength(2);
  });

  it('reutiliza la rama y el pull request abiertos al reintentar', () => {
    const { status, calls } = run({ BRANCH_EXISTS: 'true', OPEN_PR: url });

    expect(status).toBe(0);
    expect(calls.some((call) => /git\/refs | pr create /.test(call))).toBe(false);
  });

  it('falla sin llamar a GitHub cuando falta el token', () => {
    const { status, calls } = run({ GH_TOKEN: '' });

    expect(status).toBe(1);
    expect(calls).toEqual(['']);
  });
});

const filter = workflow.match(/filter='\n([\s\S]*?)'\n/)?.[1] ?? '';
const hasJq = spawnSync('jq', ['--version']).status === 0;

// jq viene en el runner de CI; sin él no se puede ejecutar el filtro real.
describe.skipIf(!hasJq)('resumen de los checks obligatorios', () => {
  const check = (name: string, conclusion: string) => ({ name, conclusion });
  const rabbit = { context: 'CodeRabbit', state: 'SUCCESS' };
  const summarize = (...statusCheckRollup: object[]) =>
    spawnSync('jq', ['-r', filter], {
      encoding: 'utf8',
      input: JSON.stringify({
        state: 'OPEN',
        mergeable: 'MERGEABLE',
        autoMergeRequest: null,
        statusCheckRollup,
      }),
    }).stdout.trim();

  it('aprueba un check cuando todas sus ejecuciones pasaron', () => {
    const verify = check('verify', 'SUCCESS');

    expect(summarize(verify, verify, rabbit)).toBe('OPEN|MERGEABLE|false||2');
  });

  it('informa un fallo aunque otra ejecución del mismo check haya pasado', () => {
    expect(summarize(check('verify', 'FAILURE'), check('verify', 'SUCCESS'))).toBe(
      'OPEN|MERGEABLE|false|verify|0',
    );
  });

  it('espera mientras quede una ejecución sin terminar', () => {
    expect(summarize(check('verify', 'FAILURE'), check('verify', ''))).toBe(
      'OPEN|MERGEABLE|false||0',
    );
  });

  it('ignora los checks no obligatorios y acepta los omitidos', () => {
    expect(summarize(check('deploy', 'FAILURE'), check('CodeRabbit', 'SKIPPED'))).toBe(
      'OPEN|MERGEABLE|false||1',
    );
  });
});
