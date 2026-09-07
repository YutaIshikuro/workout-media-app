import { describe, expect, it } from 'vitest';

import { contrastRatio, parseHexColor, relativeLuminance } from './contrast';

describe('コントラスト計算', () => {
  it('6桁の16進色を RGB に変換する', () => {
    expect(parseHexColor('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHexColor('#0b5ed7')).toEqual({ r: 11, g: 94, b: 215 });
    expect(parseHexColor('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it.each([
    '#fff',
    '#ffffffff',
    'ffffff',
    '#gggggg',
    'rgb(255,255,255)',
    '#ffffff#ffffff',
    ' #ffffff',
    '#ffffff ',
    '',
  ])('形式に合わない色 %j を RangeError として拒否する', (hex) => {
    expect(() => parseHexColor(hex)).toThrow(RangeError);
  });

  it('黒と白の相対輝度を WCAG の範囲で返す', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBe(1);
  });

  it('白黒のコントラスト比を 21 として計算し、引数順に依存しない', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBe(21);
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
  });
});
