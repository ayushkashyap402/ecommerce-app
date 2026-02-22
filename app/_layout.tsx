import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider } from 'react-redux';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { store } from '../src/store';
import { useAppDispatch, useAppSelector } from '../src/store/hooks';
import { restoreAuth } from '../src/store/slices/authSlice';
import { ThemeProvider } from '../src/context/ThemeContext';
import '../global.css';

function RootLayoutContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? '#111827' : '#FFFFFF';
  const spinnerColor = colorScheme === 'dark' ? '#48C9B0' : '#16A085';

  useEffect(() => {
    const initAuth = async () => {
      // Restore auth
      await dispatch(restoreAuth());
      setIsInitialized(true);
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onOnboardingScreen = segments[1] === 'onboarding';

    // Always show onboarding first (splash screen included)
    if (!onOnboardingScreen && segments.length === 0) {
      router.replace('/(auth)/onboarding');
      return;
    }

    // Normal auth flow (after onboarding is complete)
    if (!isAuthenticated && !inAuthGroup && segments.length > 0) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup && segments[1] !== 'onboarding') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isInitialized]);

  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor }}>
        <ActivityIndicator size="large" color={spinnerColor} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)/onboarding" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/signup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="product/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </Provider>
  );
}
