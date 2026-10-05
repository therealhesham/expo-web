import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors, fontFamily } from '@/constants/theme';

// Stand-in for assets/logo.svg + assets/logo.png (not included in the design
// export — see the README for how to drop the real brand mark in). A simple
// monogram badge in the brand colors reads well at the sizes the design uses
// the logo (~26px tall in headers, ~20-34px in notification rows).

interface Props {
  size?: number;
  withWordmark?: boolean;
  light?: boolean; // render for use on dark/petrol backgrounds
}

export function Logo({ size = 26, withWordmark = true, light = false }: Props) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderRadius: size * 0.32,
            backgroundColor: light ? colors.gold : colors.petrol,
          },
        ]}
      >
        <Text
          style={[
            styles.mark,
            { fontSize: size * 0.52, color: light ? colors.petrol : colors.gold },
          ]}
        >
          ر
        </Text>
      </View>
      {withWordmark && (
        <Text
          style={[
            styles.wordmark,
            { fontSize: size * 0.62, color: light ? colors.white : colors.ink },
          ]}
        >
          روائس
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    fontFamily: fontFamily.extraBold,
    includeFontPadding: false,
  },
  wordmark: {
    fontFamily: fontFamily.extraBold,
  },
});
