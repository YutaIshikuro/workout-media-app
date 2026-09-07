import { useColorScheme } from 'react-native';

import { getThemeTokens, resolveColorScheme, type ThemeTokens } from '@/core/theme/tokens';

export function useTheme(): ThemeTokens {
  return getThemeTokens(resolveColorScheme(useColorScheme()));
}
