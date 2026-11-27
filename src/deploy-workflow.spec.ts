import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(join(process.cwd(), '.github/workflows/deploy-firebase.yml'), 'utf8');
const step = (name: string) =>
  workflow.split(/\n(?= {6}- name: )/).find((block) => block.includes(`- name: ${name}\n`)) ?? '';

describe('workflow de publicación', () => {
  it('publica el conocimiento del chat aunque falle un aviso, con la identidad verificada', () => {
    expect(step('Verify AWS identity')).toContain('id: identity');
    expect(step('Invoke portfolio-cloud publish-chat-knowledge')).toContain(
      "if: ${{ !cancelled() && steps.identity.outcome == 'success' }}",
    );
  });

  it('no repite process-release desde el CLI y espera más que su timeout de 55 s', () => {
    const invoke = step('Invoke portfolio-cloud process-release');

    expect(invoke).toContain("AWS_MAX_ATTEMPTS: '1'");
    expect(invoke).toContain('--cli-read-timeout 70');
  });

  it.each(['process-release', 'publish-chat-knowledge'])(
    'conserva la respuesta de %s para diagnosticar un fallo',
    (name) => {
      expect(step(`Upload ${name} response`)).toContain(
        "if: ${{ !cancelled() && steps.identity.outcome == 'success' }}",
      );
    },
  );

  it('mantiene process-release condicionado al éxito de los pasos anteriores', () => {
    expect(step('Invoke portfolio-cloud process-release')).not.toMatch(/\n\s+if:/);
  });

  it('despliega solo con la CLI de Firebase fijada por lockfile', () => {
    const read = (file: string) =>
      JSON.parse(readFileSync(join(process.cwd(), 'tools/firebase-cli', file), 'utf8'));
    const version: string = read('package.json').devDependencies['firebase-tools'];

    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(read('package-lock.json').packages['node_modules/firebase-tools'].version).toBe(version);
    expect(step('Install pinned Firebase CLI')).toContain(
      'npm ci --prefix tools/firebase-cli --ignore-scripts',
    );
    expect(workflow).not.toContain('npx firebase');
    expect(workflow).not.toMatch(/firebase-tools@/);
  });

  it('no concede más que lectura y OIDC, ni deja el token en el checkout', () => {
    expect(workflow).toContain('permissions:\n  contents: read\n  id-token: write\n\n');
    expect(step('Checkout repository')).toContain('persist-credentials: false');
  });
});
