import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider } from 'react-redux';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../src/store';
import { useAppDispatch, useAppSelector } from '../src/store/hooks';
import { restoreAuth } from '../src/store/slices/authSlice';
import { ThemeProvider } from '../src/context/ThemeContext';
import '../global.css';

const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';

function RootLayoutContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? '#111827' : '#FFFFFF';
  const spinnerColor = colorScheme === 'dark' ? '#48C9B0' : '#16A085';

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user has seen onboarding
        const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        setHasSeenOnboarding(onboardingCompleted === 'true');
        
        // Restore auth - don't wait for it to complete
        dispatch(restoreAuth()).catch(() => {
          // Ignore restore errors
          console.log('No saved auth data');
        });
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onOnboardingScreen = segments[1] === 'onboarding';

    // Show onboarding only if user hasn't seen it before
    if (!hasSeenOnboarding && !onOnboardingScreen && segments.length === 0) {
      router.replace('/(auth)/onboarding');
      return;
    }

    // Skip onboarding if already seen, go directly to login or tabs
    if (hasSeenOnboarding && segments.length === 0) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Normal auth flow (after onboarding is complete)
    if (!isAuthenticated && !inAuthGroup && segments.length > 0) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup && segments[1] !== 'onboarding') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isInitialized, hasSeenOnboarding]);

  if (!isInitialized) {
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
