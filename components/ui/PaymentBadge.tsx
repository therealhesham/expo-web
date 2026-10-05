import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { colors, fontFamily } from '@/constants/theme';
import { MADA_SVG, VISA_SVG, AMKAN_SVG, APPLE_PAY_SVG } from './payment-logos';

// Official brand marks (see payment-logos.ts) — mada/visa/amkan/apple pay are
// vector, tabby/tamara ship as PNG since no SVG was available for them. Each
// network keeps its own intrinsic aspect ratio so badges never look stretched.

export type PaymentMethodId = 'applepay' | 'tabby' | 'tamara' | 'mada' | 'visa' | 'amkan' | 'cash';

interface Props {
  id: PaymentMethodId;
  height?: number;
  invert?: boolean; // render light-on-dark, for use on the petrol/black surfaces
}

const ASPECT: Record<'mada' | 'visa' | 'amkan' | 'applepay' | 'tabby' | 'tamara', number> = {
  mada: 826 / 295,
  visa: 1000 / 324.68,
  amkan: 174.63 / 88.7,
  applepay: 100 / 40,
  tabby: 512 / 204,
  tamara: 3737 / 1212,
};

export function PaymentBadge({ id, height = 20, invert = false }: Props) {
  if (id === 'applepay') {
    const xml = APPLE_PAY_SVG.replace('{{FILL}}', invert ? colors.white : '#000000');
    return <SvgXml xml={xml} width={height * ASPECT.applepay} height={height} />;
  }
  if (id === 'cash') {
    return (
      <View style={[styles.pill, { height, backgroundColor: '#f1ece1', paddingHorizontal: height * 0.5 }]}>
        <Text style={[styles.pillText, { fontSize: height * 0.42, color: colors.goldTextDim }]}>نقداً</Text>
      </View>
    );
  }
  if (id === 'tabby' || id === 'tamara') {
    const source = id === 'tabby' ? require('@/assets/images/tabby.png') : require('@/assets/images/tamara.png');
    return <Image source={source} resizeMode="contain" style={{ height, width: height * ASPECT[id] }} />;
  }
  const xml = id === 'mada' ? MADA_SVG : id === 'visa' ? VISA_SVG : AMKAN_SVG;
  const logoHeight = height * 0.62;
  return (
    <View style={[styles.chip, { height, paddingHorizontal: height * 0.4 }]}>
      <SvgXml xml={xml} width={logoHeight * ASPECT[id]} height={logoHeight} />
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
  chip: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
