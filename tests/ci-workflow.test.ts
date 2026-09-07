import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const workflowPath = resolve(projectRoot, '.github/workflows/ci.yml');
const packageJsonPath = resolve(projectRoot, 'package.json');

describe('CI ワークフロー', () => {
  it('既存の静的検査スクリプトを実行する', () => {
    const workflow = readFileSync(workflowPath, 'utf8');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts: Record<string, string>;
    };

    const scriptNames = ['lint', 'typecheck', 'test'];

    for (const scriptName of scriptNames) {
      expect(packageJson.scripts[scriptName]).toBeDefined();
      expect(workflow).toContain(`npm run ${scriptName}`);
    }

    expect(workflow.indexOf('npm run lint')).toBeLessThan(
      workflow.indexOf('npm run typecheck'),
    );
    expect(workflow.indexOf('npm run typecheck')).toBeLessThan(
      workflow.indexOf('npm run test'),
    );
  });
});
