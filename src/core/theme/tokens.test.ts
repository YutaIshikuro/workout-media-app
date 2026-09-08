import { describe, expect, it } from 'vitest';

import { contrastRatio } from './contrast';
import { getThemeTokens, resolveColorScheme } from './tokens';

const colorKeys = [
  'accent',
  'background',
  'border',
  'onAccent',
  'surface',
  'textPrimary',
  'textSecondary',
];

const themeKeys = ['colors', 'radius', 'scheme', 'spacing', 'typography'];

describe('テーマトークン', () => {
  it('ライトとダークで同じ色トークンのキー集合を持つ', () => {
    const light = getThemeTokens('light');
    const dark = getThemeTokens('dark');

    expect(Object.keys(light.colors).sort()).toEqual(Object.keys(dark.colors).sort());
  });

  it.each(['light', 'dark'] as const)('%s 配色が仕様どおりの色トークンを持つ', (scheme) => {
    expect(Object.keys(getThemeTokens(scheme).colors).sort()).toEqual(colorKeys);
  });

  it.each(['light', 'dark'] as const)('%s 配色が仕様どおりのトークン構造を持つ', (scheme) => {
    const tokens = getThemeTokens(scheme);

    expect(Object.keys(tokens).sort()).toEqual(themeKeys);
    expect(tokens.scheme).toBe(scheme);
  });

  it.each(['light', 'dark'] as const)(
    '%s 配色で本文テキストと背景のコントラスト比が 4.5 以上である',
    (scheme) => {
      const { colors } = getThemeTokens(scheme);

      expect(contrastRatio(colors.textPrimary, colors.background)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('同じ外観値に対して同じトークン参照を返す', () => {
    expect(getThemeTokens('light')).toBe(getThemeTokens('light'));
    expect(getThemeTokens('dark')).toBe(getThemeTokens('dark'));
  });

  it('外観値が取得できない場合はライト配色へ正規化する', () => {
    expect(resolveColorScheme('dark')).toBe('dark');
    expect(resolveColorScheme('light')).toBe('light');
    expect(resolveColorScheme('unspecified')).toBe('light');
    expect(resolveColorScheme(null)).toBe('light');
    expect(resolveColorScheme(undefined)).toBe('light');
  });
});
