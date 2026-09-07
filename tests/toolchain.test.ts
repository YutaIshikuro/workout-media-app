import { describe, expect, it } from 'vitest';

interface ToolchainFixture {
  name: string;
  runsInNode: boolean;
}

describe('テストツールチェーン', () => {
  it('TypeScript 構文を実行できる', () => {
    const fixture = {
      name: 'vitest',
      runsInNode: true,
    } satisfies ToolchainFixture;

    expect(fixture).toEqual({ name: 'vitest', runsInNode: true });
  });

  it('Node 環境で実行される', () => {
    expect(process.versions.node).toBeDefined();
    expect(globalThis).not.toHaveProperty('document');
  });
});
