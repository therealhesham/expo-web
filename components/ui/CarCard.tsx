import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, fontFamily, pressedOpacity, radii, rowDir, shadow, textAlignStart } from '@/constants/theme';
import { formatSAR, type Car } from '@/data/cars';
import { CarIllustration } from './CarIllustration';
import { Button } from './Button';

interface Props {
  car: Car;
  variant?: 'compact' | 'full';
  onPress?: () => void;
  onBookPress?: () => void;
}

// Small spring-scale nudge on press — makes tapping a card feel tactile
// instead of an instant, static navigation.
function useCardPressScale() {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = () => {
    scale.value = withSpring(0.96, { damping: 18, stiffness: 300 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 300 });
  };
  return { animatedStyle, onPressIn, onPressOut };
}

export function CarCard({ car, variant = 'compact', onPress, onBookPress }: Props) {
  const hasDiscount = !!car.discountPercent;
  const { animatedStyle, onPressIn, onPressOut } = useCardPressScale();

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed }) => pressed && { opacity: pressedOpacity }}
      >
        <Animated.View style={[styles.compactCard, shadow.soft, animatedStyle]}>
          <View style={[styles.compactImage, { backgroundColor: car.tint }]}>
            {car.image ? (
              <Image source={{ uri: car.image }} resizeMode="cover" style={StyleSheet.absoluteFill} />
            ) : (
              <CarIllustration bodyStyle={car.bodyStyle} size={110} />
            )}
          </View>
          <View style={styles.compactBody}>
            <Text style={styles.compactName} numberOfLines={1}>
              <Text style={{ fontFamily: fontFamily.extraBold }}>
                {car.make} {car.model}
              </Text>{' '}
              <Text style={styles.year}>{car.year}</Text>
            </Text>
            <Text style={styles.similar}>أو مركبة مشابهة</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceBig}>{formatSAR(car.pricePerDay)}</Text>
              <Text style={styles.priceUnit}>ر.س / يومياً</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => pressed && { opacity: pressedOpacity }}
    >
      <Animated.View style={[styles.fullCard, shadow.card, animatedStyle]}>
        <View style={styles.fullHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fullName} numberOfLines={1}>
              <Text style={{ fontFamily: fontFamily.extraBold }}>
                {car.make} {car.model}
              </Text>{' '}
              <Text style={styles.year}>{car.year}</Text>
            </Text>
            <Text style={styles.fullSub}>أو مركبة مشابهة · {car.fuelLabel} · {car.transmissionLabel}</Text>
          </View>
          {hasDiscount ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>خصم {car.discountPercent}٪</Text>
            </View>
          ) : (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{car.categoryLabel}</Text>
            </View>
          )}
        </View>

        <View style={[styles.fullImage, { backgroundColor: car.tint }]}>
          {car.image ? (
            <Image source={{ uri: car.image }} resizeMode="cover" style={StyleSheet.absoluteFill} />
          ) : (
            <CarIllustration bodyStyle={car.bodyStyle} size={160} />
          )}
        </View>

        <View style={styles.specsRow}>
          <Spec value={car.seats} label="مقاعد" />
          <View style={styles.specDivider} />
          <Spec value={car.doors} label="أبواب" />
          <View style={styles.specDivider} />
          <Spec value={car.bags} label="حقائب" />
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerPriceCol}>
            <Text style={styles.totalHint} numberOfLines={1}>
              الإجمالي ٤ أيام {formatSAR(car.pricePerDay * 4)} ر.س
            </Text>
            <View style={styles.priceRow}>
              {hasDiscount && (
                <Text style={styles.strike} numberOfLines={1}>{formatSAR(car.originalPricePerDay!)}</Text>
              )}
              <Text style={styles.priceBigLarge} numberOfLines={1}>{formatSAR(car.pricePerDay)}</Text>
              <Text style={styles.priceUnit} numberOfLines={1}>ر.س / يومياً</Text>
            </View>
          </View>
          <Button label="احجز الآن" onPress={onBookPress} fullWidth={false} style={styles.bookBtn} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

function Spec({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.specItem}>
      <Text style={styles.specValue}>{value}</Text>
      <Text style={styles.specLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // compact (home carousel)
  compactCard: {
    width: 212,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  compactImage: {
    height: 118,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactBody: {
    padding: 14,
  },
  compactName: {
    fontSize: 13.5,
    color: colors.ink,
    textAlign: textAlignStart,
  },
  year: {
    fontFamily: fontFamily.medium,
    color: colors.faint2,
  },
  similar: {
    marginTop: 3,
    fontSize: 10.5,
    fontFamily: fontFamily.medium,
    color: colors.faint2,
    textAlign: textAlignStart,
  },
  priceRow: {
    flexDirection: rowDir,
    alignItems: 'baseline',
    gap: 4,
    marginTop: 10,
  },
  priceBig: {
    fontSize: 21,
    fontFamily: fontFamily.black,
    color: colors.ink,
  },
  priceBigLarge: {
    fontSize: 24,
    fontFamily: fontFamily.black,
    color: colors.ink,
  },
  priceUnit: {
    fontSize: 11.5,
    fontFamily: fontFamily.extraBold,
    color: colors.goldTextDim,
  },
  strike: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#b8ada0',
    textDecorationLine: 'line-through',
  },

  // full (fleet list)
  fullCard: {
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fullHeader: {
    flexDirection: rowDir,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    padding: 14,
    paddingBottom: 6,
  },
  fullName: {
    fontSize: 15.5,
    color: colors.ink,
    textAlign: textAlignStart,
  },
  fullSub: {
    marginTop: 2,
    fontSize: 11.5,
    fontFamily: fontFamily.medium,
    color: colors.faint2,
    textAlign: textAlignStart,
  },
  discountBadge: {
    backgroundColor: colors.dangerBg,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  discountText: {
    fontSize: 10.5,
    fontFamily: fontFamily.extraBold,
    color: colors.danger,
  },
  categoryBadge: {
    backgroundColor: '#f4f1ee',
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  categoryText: {
    fontSize: 10.5,
    fontFamily: fontFamily.extraBold,
    color: '#6d6459',
  },
  fullImage: {
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specsRow: {
    flexDirection: rowDir,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginHorizontal: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderFaint,
    paddingVertical: 9,
  },
  specItem: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 4,
  },
  specValue: {
    fontSize: 12.5,
    fontFamily: fontFamily.extraBold,
    color: colors.ink,
  },
  specLabel: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    color: colors.faint2,
  },
  specDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.borderSoft,
  },
  footerRow: {
    flexDirection: rowDir,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    padding: 14,
  },
  footerPriceCol: {
    flex: 1,
  },
  totalHint: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: colors.faint2,
    textAlign: textAlignStart,
  },
  bookBtn: {
    minHeight: 46,
    paddingHorizontal: 20,
    flexShrink: 0,
  },
});
