import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { colors, fontFamily } from '@/constants/theme';

// Rendered inline by the root layout (app/_layout.tsx) before the Stack ever
// mounts — not a routed screen. expo-router's unstable_settings.initialRouteName
// only affects back-behavior for deep links, not which screen shows on a cold
// launch, so gating render here is the only way to guarantee this is first.
const AUTO_ADVANCE_MS = 2200;

export function OpeningScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <Pressable style={styles.screen} onPress={onDone}>
      <Image source={require('@/assets/images/opening-bg.png')} style={StyleSheet.absoluteFill} resizeMode="cover" />

      <View style={styles.content}>
        <Animated.Text entering={FadeInDown.delay(250).duration(650)} style={styles.brand}>
          روائس
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(650).duration(650)} style={styles.tagline}>
          راحة في كل كيلومتر
        </Animated.Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.petrolDeep,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 90,
  },
  brand: {
    fontSize: 36,
    fontFamily: fontFamily.black,
    color: colors.gold,
    letterSpacing: 1,
  },
  tagline: {
    marginTop: 8,
    fontSize: 13.5,
    fontFamily: fontFamily.medium,
    color: 'rgba(253,251,246,0.75)',
  },
});
