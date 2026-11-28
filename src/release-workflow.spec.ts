import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const workflow = readFileSync(join(process.cwd(), '.github/workflows/release.yml'), 'utf8');
const script = (workflow.split('run: |\n')[1] ?? '')
  .split('\n      - name: ')[0]!
  .replace(/^ {10}/gm, '');

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

function repository() {
  const root = mkdtempSync(join(tmpdir(), 'release-'));
  directories.push(root);
  const work = join(root, 'work');
  const origin = join(root, 'origin.git');
  const env = {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
    HOME: root,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
  };
  const git = (...args: string[]) => {
    const result = spawnSync('git', args, { cwd: work, encoding: 'utf8', env });
    if (result.status !== 0) throw new Error(result.stderr);
    return result.stdout.trim();
  };
  mkdirSync(work);
  spawnSync('git', ['init', '--bare', '-q', origin], { env });
  git('init', '-q', '-b', 'main');
  git('remote', 'add', 'origin', origin);

  const commit = (version: string, notes = true, marker = '') => {
    writeFileSync(join(work, 'package.json'), JSON.stringify({ version, marker }));
    if (notes) {
      mkdirSync(join(work, 'Docs/releases'), { recursive: true });
      writeFileSync(join(work, `Docs/releases/v${version}.es.md`), `# Portfolio v${version}\n`);
    }
    git('add', '-A');
    git('-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-qm', 'cambio');
    return git('rev-parse', 'HEAD');
  };

  const release = (sha: string, branch = 'dev') => {
    const githubEnv = join(root, 'github-env');
    writeFileSync(githubEnv, '');
    git('checkout', '-q', sha);
    const result = spawnSync('bash', ['-e', '-c', script], {
      cwd: work,
      encoding: 'utf8',
      env: { ...env, MERGE_SHA: sha, RELEASE_BRANCH: branch, GITHUB_ENV: githubEnv },
    });
    return { status: result.status, exported: readFileSync(githubEnv, 'utf8') };
  };

  const published = () => git('ls-remote', '--tags', 'origin');
  const tag = (name: string, sha: string) =>
    git(
      '-c',
      'user.name=t',
      '-c',
      'user.email=t@example.invalid',
      'tag',
      '-a',
      name,
      '-m',
      'x',
      sha,
    );

  return { commit, release, published, tag, git };
}

describe('workflow de release', () => {
  it('actúa con cualquier pull request propio integrado en main', () => {
    expect(workflow).toMatch(/pull_request:\n {4}types: \[closed\]\n {4}branches: \[main\]/);
    const condition = workflow.match(/\n {4}if: ([^\n]+)/)?.[1] ?? '';
    expect(condition).toContain('github.event.pull_request.merged == true');
    expect(condition).toContain('head.repo.full_name == github.repository');
    expect(condition).not.toContain('release/');
  });

  it('crea el tag anotado de una versión nueva promovida desde dev', () => {
    const repo = repository();
    repo.commit('1.0.0');
    const sha = repo.commit('1.1.0');

    const { status, exported } = repo.release(sha);

    expect(status).toBe(0);
    expect(exported).toContain('RELEASE_TAG=v1.1.0');
    expect(repo.published()).toContain(`${sha}\trefs/tags/v1.1.0^{}`);
    expect(repo.git('tag', '-l', '--format=%(contents)', 'v1.1.0')).toContain('# Portfolio v1.1.0');
  });

  it('no publica cuando la integración no cambia la versión', () => {
    const repo = repository();
    const released = repo.commit('1.0.0');
    repo.tag('v1.0.0', released);
    const sha = repo.commit('1.0.0', false, 'solo documentación');

    const { status, exported } = repo.release(sha, 'fix/docs');

    expect(status).toBe(0);
    expect(exported).toBe('');
    expect(repo.published()).toBe('');
  });

  it('falla cuando la versión nueva no tiene notas', () => {
    const repo = repository();
    repo.commit('1.0.0');
    const sha = repo.commit('1.1.0', false);

    expect(repo.release(sha).status).not.toBe(0);
    expect(repo.published()).toBe('');
  });

  it('publica con un pull request posterior una versión que quedó sin release', () => {
    const repo = repository();
    repo.commit('1.0.0');
    repo.release(repo.commit('1.1.0', false));
    const sha = repo.commit('1.1.0', true, 'agrega las notas');

    const { status, exported } = repo.release(sha, 'fix/notas');

    expect(status).toBe(0);
    expect(exported).toContain('RELEASE_TAG=v1.1.0');
    expect(repo.published()).toContain(`${sha}\trefs/tags/v1.1.0^{}`);
  });

  it('completa al reintentar una release pendiente que solo llegó a crear el tag', () => {
    const repo = repository();
    repo.commit('1.0.0');
    repo.release(repo.commit('1.1.0', false));
    const sha = repo.commit('1.1.0', true, 'agrega las notas');
    repo.release(sha, 'fix/notas');

    const { status, exported } = repo.release(sha, 'fix/notas');

    expect(status).toBe(0);
    expect(exported).toContain('RELEASE_TAG=v1.1.0');
  });

  it('no publica cuando la versión baja', () => {
    const repo = repository();
    repo.commit('1.10.0');
    const sha = repo.commit('1.9.0');

    const { status, exported } = repo.release(sha, 'fix/revert');

    expect(status).toBe(0);
    expect(exported).toBe('');
    expect(repo.published()).toBe('');
  });

  it('admite reintentar la misma revisión', () => {
    const repo = repository();
    repo.commit('1.0.0');
    const sha = repo.commit('1.1.0');
    repo.release(sha);

    const { status, exported } = repo.release(sha);

    expect(status).toBe(0);
    expect(exported).toContain('RELEASE_TAG=v1.1.0');
  });

  it('falla cuando el tag ya apunta a otra revisión', () => {
    const repo = repository();
    const first = repo.commit('1.0.0');
    const sha = repo.commit('1.1.0');
    repo.tag('v1.1.0', first);

    expect(repo.release(sha).status).not.toBe(0);
  });

  it('exige que una rama release/ coincida con la versión', () => {
    const repo = repository();
    repo.commit('1.0.0');
    const sha = repo.commit('1.1.0');

    expect(repo.release(sha, 'release/v1.2.0').status).not.toBe(0);
    expect(repo.published()).toBe('');
  });

  it('publica en GitHub solo cuando hay un tag nuevo', () => {
    const publish = workflow.split('- name: Publish GitHub release')[1] ?? '';

    expect(publish).toContain("if: env.RELEASE_TAG != ''");
    expect(publish).toContain('--verify-tag');
    expect(publish).toContain('--latest');
  });
});
