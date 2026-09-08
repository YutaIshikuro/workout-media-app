import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const smokeFlowPath = resolve(projectRoot, '.maestro/smoke.yaml');
const appConfigPath = resolve(projectRoot, 'app.json');
const tabsLayoutPath = resolve(projectRoot, 'src/app/(tabs)/_layout.tsx');
const libraryScreenPath = resolve(projectRoot, 'src/app/(tabs)/index.tsx');
const inboxScreenPath = resolve(projectRoot, 'src/app/(tabs)/inbox.tsx');
const settingsScreenPath = resolve(projectRoot, 'src/app/(tabs)/settings.tsx');
const placeholderScreenPath = resolve(projectRoot, 'src/ui/components/PlaceholderScreen.tsx');

type MaestroArgument = {
  readonly key: string | null;
  readonly value: string;
};

type MaestroCommand = {
  readonly name: string;
  readonly arguments: readonly MaestroArgument[];
};

type ExpectedCommand = readonly [name: string, id: string | undefined];

type ExpectedGroup = {
  readonly commands: readonly ExpectedCommand[];
  readonly unordered?: boolean;
};

const expectedGroups: readonly ExpectedGroup[] = [
  { commands: [['launchApp', undefined]] },
  {
    // design.md はタブが3つ揃うことだけを不変条件とし、確認順は契約に含めない。
    unordered: true,
    commands: [
      ['assertVisible', 'tab-library'],
      ['assertVisible', 'tab-inbox'],
      ['assertVisible', 'tab-settings'],
    ],
  },
  { commands: [['assertVisible', 'screen-library']] },
  { commands: [['assertVisible', 'placeholder-body']] },
  {
    commands: [
      ['tapOn', 'tab-inbox'],
      ['assertVisible', 'screen-inbox'],
    ],
  },
  {
    commands: [
      ['tapOn', 'tab-settings'],
      ['assertVisible', 'screen-settings'],
    ],
  },
];

function readSmokeFlow(): string {
  return readFileSync(smokeFlowPath, 'utf8');
}

function removeQuotes(value: string): string {
  return value.trim().replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, '$1$2');
}

function parseInlineArguments(value: string, lineNumber: number): readonly MaestroArgument[] {
  const match = value.match(/^\{\s*(.*?)\s*\}$/);
  if (!match) {
    throw new Error(`インライン引数の形式が不正です: ${lineNumber} 行目`);
  }

  if (match[1] === '') {
    return [];
  }

  return match[1].split(',').map((entry) => {
    const argument = entry.trim().match(/^([^:\s][^:]*?):\s*(.*)$/);
    if (!argument) {
      throw new Error(`インライン引数の形式が不正です: ${lineNumber} 行目`);
    }

    return { key: argument[1].trim(), value: removeQuotes(argument[2]) };
  });
}

function parseMaestroCommands(flow: string): readonly MaestroCommand[] {
  const lines = flow.split(/\r?\n/);
  const documentStart = lines.findIndex((line) => line.trim() === '---');
  if (documentStart === -1) {
    throw new Error('Maestro フローに --- がありません');
  }

  const commands: MaestroCommand[] = [];

  for (let index = documentStart + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const lineNumber = index + 1;

    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const command = line.match(/^\s*-\s+(.+?)\s*$/);
    if (command) {
      const declaration = command[1];
      const colon = declaration.indexOf(':');
      if (colon === -1) {
        commands.push({ name: declaration, arguments: [] });
        continue;
      }

      const name = declaration.slice(0, colon).trim();
      const value = declaration.slice(colon + 1).trim();
      if (name === '') {
        throw new Error(`Maestro コマンド名がありません: ${lineNumber} 行目`);
      }

      if (value === '') {
        commands.push({ name, arguments: [] });
      } else if (value.startsWith('{')) {
        commands.push({ name, arguments: parseInlineArguments(value, lineNumber) });
      } else {
        commands.push({ name, arguments: [{ key: null, value: removeQuotes(value) }] });
      }
      continue;
    }

    const argument = line.match(/^\s+([^:\s][^:]*?):\s*(.*)$/);
    if (argument) {
      const previousCommand = commands.at(-1);
      if (!previousCommand) {
        throw new Error(`Maestro 引数の親コマンドがありません: ${lineNumber} 行目`);
      }

      commands[commands.length - 1] = {
        ...previousCommand,
        arguments: [...previousCommand.arguments, { key: argument[1].trim(), value: removeQuotes(argument[2]) }],
      };
      continue;
    }

    throw new Error(`解釈できない Maestro フロー行です: ${lineNumber} 行目`);
  }

  return commands;
}

function projectCommand(command: MaestroCommand): ExpectedCommand {
  return [command.name, command.arguments.find((argument) => argument.key === 'id')?.value];
}

function normalizeGroup(commands: readonly ExpectedCommand[]): readonly ExpectedCommand[] {
  return [...commands].sort(([leftName, leftId], [rightName, rightId]) =>
    `${leftName}:${leftId ?? ''}`.localeCompare(`${rightName}:${rightId ?? ''}`),
  );
}

describe('Maestro スモークフロー', () => {
  it('アプリの bundle identifier を対象にし、ローカル実行場所を明記する', () => {
    const flow = readSmokeFlow();
    const appConfig = JSON.parse(readFileSync(appConfigPath, 'utf8')) as {
      expo: { ios: { bundleIdentifier: string } };
    };

    expect(flow).toContain(`appId: ${appConfig.expo.ios.bundleIdentifier}`);
    expect(flow).toMatch(/^#.*(?:Windows|WSL2)/m);
    expect(flow).toMatch(/^#.*CI/m);
    expect(flow).toMatch(/^#.*macOS/m);
    expect(flow).not.toContain('permissions');
  });

  it('design.md の6グループに対応するコマンド列である', () => {
    const commands = parseMaestroCommands(readSmokeFlow());
    let commandIndex = 0;

    for (const group of expectedGroups) {
      const actual = commands.slice(commandIndex, commandIndex + group.commands.length).map(projectCommand);
      expect(group.unordered ? normalizeGroup(actual) : actual).toEqual(
        group.unordered ? normalizeGroup(group.commands) : group.commands,
      );
      commandIndex += group.commands.length;
    }

    expect(commands.slice(commandIndex)).toHaveLength(0);
  });

  it('すべてのコマンド引数は id のみである', () => {
    const argumentsOtherThanId = parseMaestroCommands(readSmokeFlow()).flatMap((command) =>
      command.arguments.filter((argument) => argument.key !== 'id'),
    );

    expect(argumentsOtherThanId).toEqual([]);
  });

  it('フローの id はアプリ側の testID 定義に存在する', () => {
    const commands = parseMaestroCommands(readSmokeFlow());
    const flowIds = commands.flatMap((command) =>
      command.arguments.filter((argument) => argument.key === 'id').map((argument) => argument.value),
    );
    const sources = [tabsLayoutPath, libraryScreenPath, inboxScreenPath, settingsScreenPath, placeholderScreenPath].map((path) =>
      readFileSync(path, 'utf8'),
    );
    const testIdPattern = /\b(?:tabBarButtonTestID|testID)\s*[:=]\s*['"]([^'"]+)['"]/g;
    const definedIds = new Set(sources.flatMap((source) => [...source.matchAll(testIdPattern)].map((match) => match[1])));

    expect(flowIds).not.toHaveLength(0);
    expect(flowIds.filter((id) => !definedIds.has(id))).toEqual([]);
  });
});
