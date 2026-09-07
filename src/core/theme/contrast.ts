export interface RgbColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function parseHexColor(hex: string): RgbColor {
  if (!HEX_COLOR_PATTERN.test(hex)) {
    throw new RangeError('色は #RRGGBB 形式で指定してください');
  }

  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

export function relativeLuminance(color: RgbColor): number {
  const toLinear = (channel: number): number => {
    const normalized = channel / 255;

    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b);
}

export function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(parseHexColor(first));
  const secondLuminance = relativeLuminance(parseHexColor(second));

  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}
