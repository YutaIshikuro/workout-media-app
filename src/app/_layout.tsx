import { StatusBar } from 'react-native';

import { Stack } from 'expo-router';

import { useTheme } from '@/ui/theme/useTheme';

export default function RootLayout() {
  const { scheme } = useTheme();

  return (
    <>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
