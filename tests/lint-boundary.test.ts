import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const eslint = new ESLint({ cwd: projectRoot });

async function restrictedImportMessages(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });

  return result.messages.filter((message) => message.ruleId === 'no-restricted-imports');
}

describe('層境界のLint', () => {
  it('core の react import を拒否し、理由と ui 層への代替を示す', async () => {
    const messages = await restrictedImportMessages(
      "import { useState } from 'react';",
      'src/core/react-import.ts',
    );

    const output = messages.map((message) => message.message).join('\n');

    expect(messages).not.toHaveLength(0);
    expect(output).toContain('react');
    expect(output).toContain('Node');
    expect(output).toMatch(/ui\s*層へ移/);
  });

  it('core の react-native、expo-router、ui 層への import を拒否する', async () => {
    const messages = await restrictedImportMessages(
      [
        "import { View } from 'react-native';",
        "import { Link } from 'expo-router';",
        "import { useTheme } from '@/ui/theme/useTheme';",
      ].join('\n'),
      'src/core/framework-imports.ts',
    );
    const output = messages.map((message) => message.message).join('\n');

    expect(messages.length).toBeGreaterThanOrEqual(3);
    expect(output).toContain('react-native');
    expect(output).toContain('expo-router');
    expect(output).toContain('@/ui/theme/useTheme');
  });

  it('ui では React と Expo の import を core 向けルールで拒否しない', async () => {
    const messages = await restrictedImportMessages(
      [
        "import { useState } from 'react';",
        "import { View } from 'react-native';",
        "import { Link } from 'expo-router';",
        "import { useTheme } from '@/ui/theme/useTheme';",
      ].join('\n'),
      'src/ui/framework-imports.ts',
    );

    expect(messages).toHaveLength(0);
  });

  it('ui の app 層への import を拒否する', async () => {
    const messages = await restrictedImportMessages(
      "import Layout from '@/app/_layout';",
      'src/ui/app-import.ts',
    );
    const output = messages.map((message) => message.message).join('\n');

    expect(messages).not.toHaveLength(0);
    expect(output).toContain('@/app/_layout');
    expect(output).toMatch(/app\s*層へ依存できません/);
  });

  it('app では ui 層への import を拒否しない', async () => {
    const messages = await restrictedImportMessages(
      "import { useTheme } from '@/ui/theme/useTheme';",
      'src/app/ui-import.ts',
    );

    expect(messages).toHaveLength(0);
  });
});
