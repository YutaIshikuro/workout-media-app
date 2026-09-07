import { Tabs } from 'expo-router';

import { useTheme } from '@/ui/theme/useTheme';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarButtonTestID: 'tab-library', tabBarLabel: 'ライブラリ' }} />
      <Tabs.Screen name="inbox" options={{ tabBarButtonTestID: 'tab-inbox', tabBarLabel: '未分類' }} />
      <Tabs.Screen name="settings" options={{ tabBarButtonTestID: 'tab-settings', tabBarLabel: '設定' }} />
    </Tabs>
  );
}
