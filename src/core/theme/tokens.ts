export type ColorSchemeName = 'light' | 'dark';

export interface ColorPalette {
  readonly background: string;
  readonly surface: string;
  readonly border: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly accent: string;
  readonly onAccent: string;
}

export interface SpacingScale {
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
}

export interface TextStyleToken {
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: '400' | '600' | '700';
}

export interface TypographyScale {
  readonly title: TextStyleToken;
  readonly body: TextStyleToken;
  readonly caption: TextStyleToken;
}

export interface RadiusScale {
  readonly sm: number;
  readonly md: number;
}

export interface ThemeTokens {
  readonly scheme: ColorSchemeName;
  readonly colors: ColorPalette;
  readonly spacing: SpacingScale;
  readonly typography: TypographyScale;
  readonly radius: RadiusScale;
}

const LIGHT_THEME: ThemeTokens = {
  scheme: 'light',
  colors: {
    background: '#ffffff',
    surface: '#f7f7f8',
    textPrimary: '#1c1c1e',
    textSecondary: '#636366',
    border: '#c7c7cc',
    accent: '#0b5ed7',
    onAccent: '#ffffff',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
    body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  },
  radius: {
    sm: 8,
    md: 12,
  },
};

const DARK_THEME: ThemeTokens = {
  scheme: 'dark',
  colors: {
    background: '#000000',
    surface: '#1c1c1e',
    textPrimary: '#f2f2f7',
    textSecondary: '#aeaeb2',
    border: '#38383a',
    accent: '#5e9eff',
    onAccent: '#000000',
  },
  spacing: LIGHT_THEME.spacing,
  typography: LIGHT_THEME.typography,
  radius: LIGHT_THEME.radius,
};

// React Native の useColorScheme は 'unspecified' を返すため、仕様どおりライトへ正規化する。
export function resolveColorScheme(
  scheme: ColorSchemeName | 'unspecified' | null | undefined,
): ColorSchemeName {
  return scheme === 'dark' ? 'dark' : 'light';
}

export function getThemeTokens(scheme: ColorSchemeName): ThemeTokens {
  return scheme === 'dark' ? DARK_THEME : LIGHT_THEME;
}
