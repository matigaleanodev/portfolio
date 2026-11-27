import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(join(process.cwd(), '.github/workflows/ci.yml'), 'utf8');

describe('workflow de validación', () => {
  it.each(['pull_request', 'push'])('corre en %s hacia dev y main', (event) => {
    expect(workflow).toContain(`  ${event}:\n    branches: [main, dev]\n`);
  });

  it('cancela las ejecuciones reemplazadas de la misma rama', () => {
    expect(workflow).toContain('cancel-in-progress: true');
  });

  it('no recibe credenciales ni publica', () => {
    expect(workflow).toContain('permissions:\n  contents: read\n\n');
    expect(workflow).not.toMatch(/secrets\.|id-token|github\.token|firebase deploy|aws /);
    expect(workflow.match(/actions\/checkout@/g)).toHaveLength(
      workflow.match(/persist-credentials: false/g)!.length,
    );
  });

  it('prueba el HTML prerenderizado y el navegador sobre un único build', () => {
    expect(workflow.match(/npm run build\n/g)).toHaveLength(1);
    expect(workflow).toContain('npm run test:e2e -- --project=html');
    expect(workflow).toContain('npm run test:e2e -- --project=chromium');
  });

  it('expone un único check que exige todos los demás', () => {
    expect(workflow).toContain('needs: [quality, build, browser]');
    expect(workflow).toContain('[[ "$RESULTS" == "success success success" ]]');
  });
});
