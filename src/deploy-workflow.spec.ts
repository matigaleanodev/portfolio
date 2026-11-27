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
});
