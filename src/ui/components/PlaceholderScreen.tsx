import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/ui/theme/useTheme';

export interface PlaceholderScreenProps {
  readonly title: string;
  readonly message: string;
  readonly testID: string;
}

export function PlaceholderScreen({ title, message, testID }: PlaceholderScreenProps) {
  const { colors, spacing, typography } = useTheme();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.title.fontSize,
      fontWeight: typography.title.fontWeight,
      lineHeight: typography.title.lineHeight,
      marginBottom: spacing.sm,
    },
    body: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
  });

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body} testID="placeholder-body">
        {message}
      </Text>
    </View>
  );
}
