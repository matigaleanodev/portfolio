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

  it.each([
    ['Deploy to Firebase Hosting', 'tools/firebase-cli/node_modules/.bin/firebase deploy'],
    ['Invoke portfolio-cloud process-release', 'aws lambda invoke'],
    ['Invoke portfolio-cloud publish-chat-knowledge', 'aws lambda invoke'],
  ])('confirma la revisión vigente justo antes del efecto: %s', (name, effect) => {
    const block = step(name);
    const lines = block.split('\n').map((line) => line.trim());
    const guard = lines.indexOf('node scripts/current-revision.mjs');

    expect(block).toContain('GITHUB_TOKEN: ${{ github.token }}');
    expect(guard).toBeGreaterThan(-1);
    expect(lines.findIndex((line) => line.startsWith(effect))).toBe(guard + 1);
    expect(block).not.toContain('continue-on-error');
  });

  it('confirma la revisión también en la decisión inicial', () => {
    expect(step('Check whether Firebase needs a deployment')).toContain(
      'GITHUB_TOKEN: ${{ github.token }}',
    );
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

  it('construye la 404 que publica Hosting', () => {
    expect(step('Build Angular app')).toContain('run: npm run build:app');
  });

  it('no concede más que lectura y OIDC, ni deja el token en el checkout', () => {
    expect(workflow).toContain('permissions:\n  contents: read\n  id-token: write\n\n');
    expect(step('Checkout repository')).toContain('persist-credentials: false');
  });
});
