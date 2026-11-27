import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const workflow = readFileSync(join(process.cwd(), '.github/workflows/sync-dev.yml'), 'utf8');
const script = (workflow.split('run: |\n')[1] ?? '').replace(/^ {10}/gm, '');
const mainSha = 'abcdef012345'.padEnd(40, '0');
const branch = 'fix/sync-main-abcdef012345';

const fakeGh = `#!/usr/bin/env bash
echo "$*" >> "$GH_LOG"
case "$*" in
  "api repos/owner/site/git/ref/heads/main "*) echo "$MAIN_SHA" ;;
  "api repos/owner/site/compare/"*) echo "$PENDING" ;;
  "api repos/owner/site/git/ref/heads/fix/"*) [[ "$BRANCH_EXISTS" == true ]] ;;
  "api repos/owner/site/git/refs "*) ;;
  "pr list "*) echo "$OPEN_PR" ;;
  "pr create "*) echo "https://example.invalid/pull/9" ;;
  *) exit 99 ;;
esac
`;

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

function run(env: Record<string, string> = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'sync-dev-'));
  directories.push(directory);
  writeFileSync(join(directory, 'gh'), fakeGh);
  chmodSync(join(directory, 'gh'), 0o755);
  const log = join(directory, 'calls.log');
  writeFileSync(log, '');
  const result = spawnSync('bash', ['-c', script], {
    cwd: directory,
    encoding: 'utf8',
    env: {
      PATH: `${directory}:/usr/bin:/bin`,
      GH_LOG: log,
      GH_TOKEN: 'test-token',
      GH_REPO: 'owner/site',
      GITHUB_STEP_SUMMARY: join(directory, 'summary.md'),
      MAIN_SHA: mainSha,
      PENDING: '1',
      BRANCH_EXISTS: 'false',
      OPEN_PR: '',
      ...env,
    },
  });
  return { status: result.status, calls: readFileSync(log, 'utf8').trim().split('\n') };
}

describe('sincronización de main hacia dev', () => {
  it('no escribe en dev, no fuerza ni integra por su cuenta', () => {
    expect(workflow.match(/run: \|/g)).toHaveLength(1);
    expect(workflow).not.toMatch(/git push|--force|gh pr merge|--auto/);
    expect(workflow).toContain('permissions: {}');
  });

  it('abre una rama de sincronización y un pull request hacia dev', () => {
    const { status, calls } = run();

    expect(status).toBe(0);
    expect(calls).toContain(
      `api repos/owner/site/git/refs -f ref=refs/heads/${branch} -f sha=${mainSha}`,
    );
    expect(calls.some((call) => call.startsWith(`pr create --base dev --head ${branch} `))).toBe(
      true,
    );
  });

  it('no hace nada cuando dev ya contiene main', () => {
    const { status, calls } = run({ PENDING: '0' });

    expect(status).toBe(0);
    expect(calls).toHaveLength(2);
  });

  it('reutiliza la rama y el pull request abiertos al reintentar', () => {
    const { status, calls } = run({
      BRANCH_EXISTS: 'true',
      OPEN_PR: 'https://example.invalid/pull/9',
    });

    expect(status).toBe(0);
    expect(calls.some((call) => /git\/refs |^pr create /.test(call))).toBe(false);
  });

  it('falla sin llamar a GitHub cuando falta el token', () => {
    const { status, calls } = run({ GH_TOKEN: '' });

    expect(status).toBe(1);
    expect(calls).toEqual(['']);
  });
});
