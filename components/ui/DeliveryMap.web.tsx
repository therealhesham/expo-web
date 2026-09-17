import React from 'react';
import { View, StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

interface Props {
  initialRegion: { latitude: number; longitude: number };
  onCenterChange: (coord: { latitude: number; longitude: number }) => void;
}

// react-native-maps has no web target — this app's web build keeps the
// original stylized placeholder instead of a real, pannable map. The pin
// stays fixed at the branch/default coordinate (onCenterChange never fires),
// so distance/fee on web reflect that fixed point rather than a fake pan.
export function DeliveryMap({}: Props) {
  return (
    <View style={styles.mapBg}>
      <View style={[styles.roadDiagonal, { top: 190 }]} />
      <View style={styles.roadVertical} />
      <View style={styles.block} />
    </View>
  );
}

const styles = StyleSheet.create({
  mapBg: { ...StyleSheet.absoluteFill, backgroundColor: '#e7e1d4', overflow: 'hidden' },
  roadDiagonal: {
    position: 'absolute',
    left: -40,
    right: -40,
    height: 46,
    backgroundColor: colors.cream,
    transform: [{ rotate: '-7deg' }],
  },
  roadVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 150,
    width: 30,
    backgroundColor: colors.cream,
  },
  block: {
    position: 'absolute',
    top: 430,
    right: 40,
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: 'rgba(219,184,120,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(219,184,120,0.5)',
  },
});
