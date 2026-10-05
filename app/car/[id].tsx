import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, fontFamily, pressedOpacity, radii, rowDir, shadow, textAlignStart } from '@/constants/theme';
import { CarIllustration } from '@/components/ui/CarIllustration';
import { Button } from '@/components/ui/Button';
import { PaymentBadge } from '@/components/ui/PaymentBadge';
import { formatSAR, type Car } from '@/data/cars';
import { fetchCarById, mapApiCarDetailToCar } from '@/lib/api';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/context/AuthContext';

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { trip, setSelectedCar } = useBooking();
  const { user } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCar(null);
    setError(null);
    fetchCarById(Number(id))
      .then((api) => {
        if (cancelled) return;
        const mapped = mapApiCarDetailToCar(api);
        setCar(mapped);
        setSelectedCar(mapped);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.errorText}>تعذّر تحميل بيانات السيارة</Text>
      </View>
    );
  }

  if (!car) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.petrol} />
      </View>
    );
  }

  // car.pricePerDay is the pre-tax rate (mirrors the DB's pricePerDayExclTax
  // field) — VAT is added on top, not backed out of it. Matches rentcar's
  // own lib/pricing.ts and BookingContext's pricing calc.
  const vatRate = (car.vatRatePercent ?? 15) / 100;
  const dailyBeforeTax = car.pricePerDay;
  // "شهري" only applies when this car actually has a monthly rate — otherwise
  // silently falls back to daily × days, same rule as BookingContext's pricing.
  const monthlyApplies = trip.period === 'monthly' && !!car.priceMonthly;
  const rentalBeforeTax = monthlyApplies
    ? car.priceMonthly!
    : Math.round(dailyBeforeTax * trip.days * 100) / 100;
  const vat = Math.round(rentalBeforeTax * vatRate * 100) / 100;
  const total = Math.round((rentalBeforeTax + vat) * 100) / 100;
  const monthlyTabby = Math.round((total / 4) * 100) / 100;
  const monthlyUnavailable = trip.period === 'monthly' && !car.priceMonthly;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.imageHeader}>
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.roundBtn, pressed && { opacity: pressedOpacity }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.ink} />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.roundBtn, pressed && { opacity: pressedOpacity }]}>
            <Ionicons name="heart-outline" size={18} color={colors.goldTextDim} />
          </Pressable>
        </View>
        <Animated.View
          entering={FadeIn.duration(320)}
          style={[styles.imageSlot, { backgroundColor: car.tint }]}
        >
          {car.image ? (
            <Image source={{ uri: car.image }} resizeMode="cover" style={StyleSheet.absoluteFill} />
          ) : (
            <CarIllustration bodyStyle={car.bodyStyle} size={220} />
          )}
        </Animated.View>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(320).delay(60)}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {car.make} {car.model} <Text style={styles.year}>{car.year}</Text>
              </Text>
              <View style={styles.similarRow}>
                <Text style={styles.similarText}>أو مركبة مشابهة من نفس الفئة</Text>
                <View style={styles.infoDot}>
                  <Text style={styles.infoDotText}>؟</Text>
                </View>
              </View>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{car.categoryLabel}</Text>
            </View>
          </View>

          <View style={styles.specsGrid}>
            <SpecCell value={String(car.seats)} label="مقاعد" />
            <SpecCell value={String(car.doors)} label="أبواب" />
            <SpecCell value={String(car.bags)} label="حقائب" />
            <SpecCell value="A/C" label="مكيفة" />
          </View>

          <View style={styles.pricingCard}>
            <Text style={styles.pricingLabel}>تفاصيل التسعير</Text>
            {monthlyApplies ? (
              <PriceLine label="السعر الشهري (قبل الضريبة)" value={formatSAR(car.priceMonthly!)} />
            ) : (
              <>
                <PriceLine label="السعر اليومي (قبل الضريبة)" value={formatSAR(dailyBeforeTax)} />
                <PriceLine label={`الإيجار (${trip.days} أيام)`} value={formatSAR(rentalBeforeTax)} />
              </>
            )}
            <PriceLine
              label={`ضريبة القيمة المضافة ${(car.vatRatePercent ?? 15).toLocaleString('ar-SA')}٪`}
              value={formatSAR(vat)}
              bottomBorder
            />
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>الإجمالي شامل الضريبة</Text>
              <Text style={styles.totalValue}>
                {formatSAR(total)} <Text style={styles.totalUnit}>ر.س</Text>
              </Text>
            </View>
            {monthlyUnavailable && (
              <Text style={styles.monthlyFallbackNote}>
                السعر الشهري غير متاح لهذه السيارة — تم اعتماد السعر اليومي.
              </Text>
            )}
          </View>

          <View style={styles.tabbyBanner}>
            <PaymentBadge id="tabby" height={16} />
            <Text style={styles.tabbyText}>قسّمها على ٤ دفعات بدون فوائد — {formatSAR(monthlyTabby)} ر.س شهرياً</Text>
          </View>
        </Animated.View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerLabel}>الإجمالي · {monthlyApplies ? 'شهر واحد' : `${trip.days} أيام`}</Text>
          <Text style={styles.footerTotal}>
            {formatSAR(total)} <Text style={styles.totalUnit}>ر.س</Text>
          </Text>
        </View>
        <Button
          label="متابعة الحجز"
          fullWidth={false}
          style={styles.footerBtn}
          onPress={() => router.push(user ? '/id-verification' : '/login')}
        />
      </SafeAreaView>
    </View>
  );
}

function SpecCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.specCell}>
      <Text style={styles.specValue}>{value}</Text>
      <Text style={styles.specLabel}>{label}</Text>
    </View>
  );
}

function PriceLine({ label, value, bottomBorder }: { label: string; value: string; bottomBorder?: boolean }) {
  return (
    <View style={[styles.priceLine, bottomBorder && styles.priceLineBorder]}>
      <Text style={styles.priceLineLabel}>{label}</Text>
      <Text style={styles.priceLineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  centered: { alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 13.5, fontFamily: fontFamily.bold, color: colors.faint3 },
  imageHeader: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  topBar: {
    flexDirection: rowDir,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  roundBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageSlot: { height: 190, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: rowDir, justifyContent: 'center', gap: 5, paddingBottom: 12 },
  dot: { width: 6, height: 3, borderRadius: 9, backgroundColor: colors.border },
  dotActive: { width: 18, backgroundColor: colors.petrol },
  content: { padding: 16, paddingBottom: 24 },
  titleRow: { flexDirection: rowDir, alignItems: 'flex-start', gap: 10 },
  name: { fontSize: 22, fontFamily: fontFamily.black, color: colors.ink, textAlign: textAlignStart },
  year: { fontSize: 16, fontFamily: fontFamily.regular, color: colors.faint2 },
  similarRow: { flexDirection: rowDir, alignItems: 'center', gap: 6, marginTop: 3 },
  similarText: { fontSize: 12, fontFamily: fontFamily.bold, color: colors.goldTextDim },
  infoDot: {
    width: 15,
    height: 15,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDotText: { fontSize: 9.5, fontFamily: fontFamily.black, color: colors.goldText },
  categoryBadge: {
    backgroundColor: '#f4f1ee',
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  categoryText: { fontSize: 11, fontFamily: fontFamily.extraBold, color: '#6d6459' },
  specsGrid: { flexDirection: rowDir, gap: 8, marginTop: 14 },
  specCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  specValue: { fontSize: 15, fontFamily: fontFamily.black, color: colors.ink },
  specLabel: { marginTop: 1, fontSize: 9.5, fontFamily: fontFamily.bold, color: colors.faint2 },
  pricingCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 14,
  },
  pricingLabel: {
    fontSize: 10,
    fontFamily: fontFamily.black,
    letterSpacing: 1,
    color: '#c4b89a',
    marginBottom: 8,
    textAlign: textAlignStart,
  },
  priceLine: { flexDirection: rowDir, justifyContent: 'space-between', paddingVertical: 5 },
  priceLineBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderFaint, marginBottom: 4 },
  priceLineLabel: { fontSize: 13, fontFamily: fontFamily.medium, color: colors.brownText },
  priceLineValue: { fontSize: 13, fontFamily: fontFamily.extraBold, color: colors.ink },
  totalLine: { flexDirection: rowDir, alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 6 },
  totalLabel: { fontSize: 13, fontFamily: fontFamily.black, color: colors.ink },
  totalValue: { fontSize: 20, fontFamily: fontFamily.black, color: colors.ink },
  totalUnit: { fontSize: 12, fontFamily: fontFamily.extraBold, color: colors.goldTextDim },
  monthlyFallbackNote: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: colors.faint2,
    textAlign: textAlignStart,
  },
  tabbyBanner: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 13,
  },
  tabbyText: { flex: 1, fontSize: 12, fontFamily: fontFamily.bold, color: colors.brownText, textAlign: textAlignStart },
  footer: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    ...shadow.floating,
  },
  footerLabel: { fontSize: 10, fontFamily: fontFamily.extraBold, letterSpacing: 0.5, color: colors.faint2 },
  footerTotal: { marginTop: 2, fontSize: 19, fontFamily: fontFamily.black, color: colors.ink },
  footerBtn: { minHeight: 52, paddingHorizontal: 26 },
});
