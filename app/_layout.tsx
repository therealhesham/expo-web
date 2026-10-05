import { useFonts } from 'expo-font';
import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  Tajawal_800ExtraBold,
  Tajawal_900Black,
} from '@expo-google-fonts/tajawal';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { colors } from '@/constants/theme';
import { BookingProvider } from '@/context/BookingContext';
import { AuthProvider } from '@/context/AuthContext';
import { OpeningScreen } from '@/components/ui/OpeningScreen';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
    Tajawal_800ExtraBold,
    Tajawal_900Black,
  });
  // Gates the Stack itself (not a route) — expo-router's initialRouteName only
  // affects back-behavior for deep links, it doesn't control what a cold
  // launch shows first, so this is the only reliable way to put a branded
  // moment before the tabs on every real app open.
  const [showOpening, setShowOpening] = useState(true);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (showOpening) {
    return <OpeningScreen onDone={() => setShowOpening(false)} />;
  }

  return (
    <AuthProvider>
      <BookingProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.cream },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="car/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="delivery-location" options={{ presentation: 'modal' }} />
          <Stack.Screen name="id-verification" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="booking-confirmed" options={{ gestureEnabled: false }} />
          <Stack.Screen name="login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="login-otp" />
          <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
          <Stack.Screen name="coupons" />
          <Stack.Screen name="notification-preferences" />
        </Stack>
      </BookingProvider>
    </AuthProvider>
  );
}
