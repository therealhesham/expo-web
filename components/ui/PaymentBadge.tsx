import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontFamily } from '@/constants/theme';

// Stand-in for the payment network marks referenced by the design
// (assets/pay-*.svg) — those files weren't included in the design export.
// Real trademarked logos shouldn't be recreated pixel-for-pixel from memory
// anyway, so each method gets a simple, readable colored label instead.
// Swap in the official SVGs from each provider's brand kit before shipping.

export type PaymentMethodId = 'applepay' | 'tabby' | 'tamara' | 'mada' | 'visa' | 'amkan' | 'cash';

interface Props {
  id: PaymentMethodId;
  height?: number;
  invert?: boolean; // render light-on-dark, for use on the petrol/black surfaces
}

const BADGE_STYLE: Record<Exclude<PaymentMethodId, 'applepay' | 'cash'>, { bg: string; fg: string; label: string }> = {
  tabby: { bg: '#17152a', fg: '#ffffff', label: 'tabby' },
  tamara: { bg: '#2b2b2b', fg: '#ffffff', label: 'tamara' },
  mada: { bg: '#00a19a', fg: '#ffffff', label: 'mada' },
  visa: { bg: '#1a1f71', fg: '#ffffff', label: 'VISA' },
  amkan: { bg: '#5b3fd9', fg: '#ffffff', label: 'amkan' },
};

export function PaymentBadge({ id, height = 20, invert = false }: Props) {
  if (id === 'applepay') {
    const color = invert ? colors.white : colors.ink;
    return (
      <View style={styles.appleRow}>
        <Ionicons name="logo-apple" size={height} color={color} />
        <Text style={[styles.appleText, { fontSize: height * 0.72, color }]}>Pay</Text>
      </View>
    );
  }
  if (id === 'cash') {
    return (
      <View style={[styles.pill, { height, backgroundColor: '#f1ece1', paddingHorizontal: height * 0.5 }]}>
        <Text style={[styles.pillText, { fontSize: height * 0.42, color: colors.goldTextDim }]}>نقداً</Text>
      </View>
    );
  }
  const style = BADGE_STYLE[id];
  return (
    <View style={[styles.pill, { height, backgroundColor: style.bg, paddingHorizontal: height * 0.55 }]}>
      <Text style={[styles.pillText, { fontSize: height * 0.5, color: style.fg }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontFamily: fontFamily.extraBold,
    includeFontPadding: false,
  },
  appleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  appleText: {
    fontFamily: fontFamily.bold,
  },
});
