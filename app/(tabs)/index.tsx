import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, fontFamily, pressedOpacity, radii, rowDir, spacing, textAlignStart } from '@/constants/theme';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CarCard } from '@/components/ui/CarCard';
import { BranchPickerSheet } from '@/components/ui/BranchPickerSheet';
import { DateRangePickerSheet } from '@/components/ui/DateRangePickerSheet';
import { type Car } from '@/data/cars';
import {
  fetchFleet,
  fetchBranchesByCity,
  fetchBookingWidgetTabFlags,
  mapApiCarSummaryToCar,
  type ApiCityBranches,
  type ApiBranch,
  type ApiBookingWidgetTabFlags,
} from '@/lib/api';
import { computeAutoReturn, formatDaysAr } from '@/lib/date-format';
import { useBooking, type RentalPeriod } from '@/context/BookingContext';

const PERIOD_TABS: { key: RentalPeriod; label: string; flag: keyof ApiBookingWidgetTabFlags }[] = [
  { key: 'daily', label: 'يومي', flag: 'rentalDaily' },
  { key: 'weekly', label: 'أسبوعي', flag: 'rentalWeekly' },
  { key: 'monthly', label: 'شهري', flag: 'rentalMonthly' },
  { key: 'packages', label: 'الباقات الشهرية', flag: 'rentalMonthlyPackages' },
];

// All enabled until the admin-controlled flags load — avoids a flash of a
// half-empty widget on first render.
const ALL_TABS_ENABLED: ApiBookingWidgetTabFlags = {
  rentalDaily: true,
  rentalWeekly: true,
  rentalMonthly: true,
  rentalMonthlyPackages: true,
  modePickup: true,
  modeDelivery: true,
};

const TRUST_BADGES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'time-outline', label: 'دعم على مدار الساعة' },
  { icon: 'location-outline', label: 'فروع في أنحاء المملكة' },
  { icon: 'pricetag-outline', label: 'أسعار واضحة' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { trip, setTrip, setTripDates } = useBooking();
  const [featured, setFeatured] = useState<Car[] | null>(null);
  const [cities, setCities] = useState<ApiCityBranches[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'pickup' | 'return'>('pickup');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [tabFlags, setTabFlags] = useState<ApiBookingWidgetTabFlags>(ALL_TABS_ENABLED);

  useEffect(() => {
    let cancelled = false;
    fetchFleet()
      .then((rows) => {
        if (cancelled) return;
        setFeatured(rows.slice(0, 4).map(mapApiCarSummaryToCar));
      })
      .catch(() => {
        if (!cancelled) setFeatured([]);
      });
    fetchBranchesByCity()
      .then((loadedCities) => {
        if (cancelled) return;
        setCities(loadedCities);
        // Default to the first real branch instead of leaving the field
        // blank — only if the user hasn't already picked one themselves.
        const firstCity = loadedCities[0];
        const firstBranch = firstCity?.branches[0];
        if (firstCity && firstBranch && !trip.branch) {
          applyBranchSelection(firstCity, firstBranch);
        }
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      });
    fetchBookingWidgetTabFlags()
      .then((flags) => {
        if (!cancelled) setTabFlags(flags);
      })
      .catch(() => {
        // Keep ALL_TABS_ENABLED — fail open rather than hiding the widget.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePeriodTabs = PERIOD_TABS.filter((tab) => tabFlags[tab.flag]);
  const showModeSegment = tabFlags.modePickup && tabFlags.modeDelivery;

  // If the admin-selected period/mode isn't visible anymore, fall back to
  // whatever is actually enabled instead of leaving a hidden tab selected.
  useEffect(() => {
    if (!visiblePeriodTabs.some((tab) => tab.key === trip.period)) {
      const fallback = visiblePeriodTabs[0];
      if (fallback) setTrip({ period: fallback.key });
    }
    if (!tabFlags.modePickup && trip.pickupMode === 'branch') {
      setTrip({ pickupMode: 'delivery' });
      router.push('/delivery-location');
    } else if (!tabFlags.modeDelivery && trip.pickupMode === 'delivery') {
      setTrip({ pickupMode: 'branch' });
    }
  }, [tabFlags]);

  function applyBranchSelection(city: ApiCityBranches, branch: ApiBranch) {
    if (pickerTarget === 'return') {
      setTrip({
        returnBranch: `${branch.name} — ${city.name}`,
        returnBranchLat: branch.lat ?? undefined,
        returnBranchLng: branch.lng ?? undefined,
        returnBranchId: branch.id,
      });
      return;
    }
    setTrip({
      branch: `${branch.name} — ${city.name}`,
      branchLat: branch.lat ?? undefined,
      branchLng: branch.lng ?? undefined,
      branchDeliveryFeePerKmSar: branch.deliveryFeePerKmSar,
      branchId: branch.id,
    });
  }

  function pickBranch(target: 'pickup' | 'return' = 'pickup') {
    if (cities.length === 0) {
      Alert.alert('تعذّر تحميل الفروع', 'تأكد إن السيرفر شغّال وحاول مرة أخرى.');
      return;
    }
    setPickerTarget(target);
    setPickerVisible(true);
  }

  function selectPeriod(period: RentalPeriod) {
    // "الباقات الشهرية" (subscription packages) is a separate, much larger
    // feature (its own pricing model, not a fixed-span rental) — the tab
    // stays selectable but doesn't touch the dates, same as before.
    if (period === 'weekly' || period === 'monthly') {
      const pickupAt = new Date(trip.pickupAt);
      setTripDates(pickupAt, computeAutoReturn(pickupAt, period));
    }
    setTrip({ period });
  }

  function toggleDifferentReturnBranch() {
    if (trip.differentReturnBranch) {
      setTrip({ differentReturnBranch: false, returnBranch: undefined, returnBranchLat: undefined, returnBranchLng: undefined });
      return;
    }
    setTrip({ differentReturnBranch: true });
    pickBranch('return');
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Logo size={26} />
          <View style={styles.headerIcons}>
            <Pressable style={({ pressed }) => [styles.iconBtn, pressed && { opacity: pressedOpacity }]}>
              <Ionicons name="notifications-outline" size={18} color={colors.ink} />
              <View style={styles.badgeDot} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroBlock}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowLine} />
            <Text style={styles.eyebrow}>راحة في كل كيلومتر</Text>
          </View>
          <Text style={styles.heroTitle}>احجز رحلتك</Text>
          <Text style={styles.heroSubtitle}>استأجر سيارتك الآن واستمتع برحلة آمنة ومريحة</Text>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.tabsRow}>
            {visiblePeriodTabs.map((tab) => {
              const active = trip.period === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => selectPeriod(tab.key)}
                  style={({ pressed }) => [
                    styles.periodTab,
                    active && styles.periodTabActive,
                    pressed && { opacity: pressedOpacity },
                  ]}
                >
                  <Text style={[styles.periodTabText, active && styles.periodTabTextActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.cardBody}>
            {showModeSegment && (
              <View style={styles.segmentWrap}>
                <Pressable
                  style={({ pressed }) => [
                    styles.segment,
                    trip.pickupMode === 'branch' && styles.segmentActive,
                    pressed && { opacity: pressedOpacity },
                  ]}
                  onPress={() => setTrip({ pickupMode: 'branch' })}
                >
                  <Text style={[styles.segmentText, trip.pickupMode === 'branch' && styles.segmentTextActive]}>
                    استلام من فرع
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.segment,
                    trip.pickupMode === 'delivery' && styles.segmentActive,
                    pressed && { opacity: pressedOpacity },
                  ]}
                  onPress={() => {
                    setTrip({ pickupMode: 'delivery' });
                    router.push('/delivery-location');
                  }}
                >
                  <Text style={[styles.segmentText, trip.pickupMode === 'delivery' && styles.segmentTextActive]}>
                    توصيل لموقعي
                  </Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.locationRow, pressed && { opacity: pressedOpacity }]}
              onPress={() => (trip.pickupMode === 'delivery' ? router.push('/delivery-location') : pickBranch('pickup'))}
            >
              <Ionicons name="location-outline" size={18} color={colors.goldLine} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>موقع الاستلام</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>
                  {trip.pickupMode === 'delivery' && trip.deliveryAddress
                    ? trip.deliveryAddress
                    : trip.branch || 'جارٍ التحميل…'}
                </Text>
              </View>
              <Ionicons name="chevron-back" size={14} color={colors.goldLine} />
            </Pressable>

            {trip.differentReturnBranch && (
              <Pressable
                style={({ pressed }) => [styles.locationRow, pressed && { opacity: pressedOpacity }]}
                onPress={() => pickBranch('return')}
              >
                <Ionicons name="flag-outline" size={18} color={colors.goldLine} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>موقع التسليم</Text>
                  <Text style={styles.fieldValue} numberOfLines={1}>
                    {trip.returnBranch || 'اختر فرع التسليم…'}
                  </Text>
                </View>
                <Ionicons name="chevron-back" size={14} color={colors.goldLine} />
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [styles.dateRow, pressed && { opacity: pressedOpacity }]}
              onPress={() => setDatePickerVisible(true)}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.goldLine} />
              <View style={styles.dateBox}>
                <Text style={styles.fieldLabel}>الاستلام</Text>
                <Text style={styles.dateValue}>{trip.pickupDate}</Text>
                <Text style={styles.dateTime}>{trip.pickupTime}</Text>
              </View>
              <View style={styles.dateDivider} />
              <View style={styles.dateBox}>
                <Text style={styles.fieldLabel}>التسليم</Text>
                <Text style={styles.dateValue}>{trip.returnDate}</Text>
                <Text style={styles.dateTime}>{trip.returnTime}</Text>
              </View>
              <Ionicons name="chevron-back" size={14} color={colors.goldLine} />
            </Pressable>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{formatDaysAr(trip.days)} إيجار</Text>
              <Pressable
                style={({ pressed }) => [styles.returnBranchToggle, pressed && { opacity: pressedOpacity }]}
                onPress={toggleDifferentReturnBranch}
              >
                <Text style={styles.metaLink}>إرجاع في فرع مختلف</Text>
                <View style={[styles.checkbox, trip.differentReturnBranch && styles.checkboxChecked]}>
                  {trip.differentReturnBranch && <Ionicons name="checkmark" size={11} color={colors.white} />}
                </View>
              </Pressable>
            </View>

            <Button
              label="البحث عن سيارات"
              icon="search"
              onPress={() => router.push('/(tabs)/fleet')}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trustRow}
        >
          {TRUST_BADGES.map((badge) => (
            <View key={badge.label} style={styles.trustBadge}>
              <Ionicons name={badge.icon} size={13} color={colors.goldLine} />
              <Text style={styles.trustText}>{badge.label}</Text>
            </View>
          ))}
        </ScrollView>

        <SectionHeader
          title="سيارات مميزة"
          actionLabel="عرض الكل"
          onActionPress={() => router.push('/(tabs)/fleet')}
        />
        {featured === null ? (
          <ActivityIndicator color={colors.petrol} style={styles.featuredLoading} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredRow}
          >
            {featured.map((car) => (
              <CarCard key={car.id} car={car} variant="compact" onPress={() => router.push(`/car/${car.id}`)} />
            ))}
          </ScrollView>
        )}
      </ScrollView>

      <BranchPickerSheet
        visible={pickerVisible}
        cities={cities}
        onClose={() => setPickerVisible(false)}
        onSelect={(city, branch) => {
          applyBranchSelection(city, branch);
          setPickerVisible(false);
        }}
      />

      <DateRangePickerSheet
        visible={datePickerVisible}
        pickupAt={new Date(trip.pickupAt)}
        returnAt={new Date(trip.returnAt)}
        period={trip.period}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={(pickupAt, returnAt) => {
          setTripDates(pickupAt, returnAt);
          setDatePickerVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  headerSafe: { backgroundColor: colors.card },
  header: {
    flexDirection: rowDir,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerIcons: {
    flexDirection: rowDir,
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    left: 9,
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: colors.gold,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  scrollContent: { paddingBottom: 40 },
  heroBlock: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16 },
  eyebrowRow: { flexDirection: rowDir, alignItems: 'center', gap: 8, marginBottom: 6 },
  eyebrowLine: { width: 26, height: 1, backgroundColor: colors.goldLine },
  eyebrow: {
    fontSize: 10.5,
    fontFamily: fontFamily.black,
    letterSpacing: 1,
    color: colors.goldText,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: fontFamily.black,
    color: colors.ink,
    textAlign: textAlignStart,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.inkSoft,
    opacity: 0.72,
    textAlign: textAlignStart,
  },
  searchCard: {
    marginHorizontal: 16,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  tabsRow: {
    flexDirection: rowDir,
    gap: 6,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  periodTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodTabActive: {
    backgroundColor: colors.petrol,
    borderColor: colors.petrol,
  },
  periodTabText: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: colors.faint3,
  },
  periodTabTextActive: {
    color: colors.white,
    fontFamily: fontFamily.extraBold,
  },
  cardBody: { padding: 14, gap: 12 },
  segmentWrap: {
    flexDirection: rowDir,
    gap: 6,
    padding: 4,
    backgroundColor: colors.sandLight,
    borderRadius: 14,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.card,
    shadowColor: colors.inkSoft,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  segmentText: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: colors.faint3,
  },
  segmentTextActive: {
    color: colors.ink,
    fontFamily: fontFamily.extraBold,
  },
  locationRow: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontFamily: fontFamily.extraBold,
    color: colors.faint2,
    textAlign: textAlignStart,
  },
  fieldValue: {
    marginTop: 2,
    fontSize: 14,
    fontFamily: fontFamily.extraBold,
    color: colors.ink,
    textAlign: textAlignStart,
  },
  dateRow: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
  },
  dateBox: { flex: 1 },
  dateDivider: { width: 1, height: 30, backgroundColor: colors.borderFaint },
  dateValue: {
    marginTop: 3,
    fontSize: 14,
    fontFamily: fontFamily.extraBold,
    color: colors.ink,
    textAlign: textAlignStart,
  },
  dateTime: {
    marginTop: 2,
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: colors.goldText,
    textAlign: textAlignStart,
  },
  metaRow: {
    flexDirection: rowDir,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaText: { fontSize: 11.5, fontFamily: fontFamily.bold, color: colors.faint3 },
  metaLink: { fontSize: 11.5, fontFamily: fontFamily.extraBold, color: colors.goldText },
  returnBranchToggle: { flexDirection: rowDir, alignItems: 'center', gap: 7 },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  trustRow: {
    flexDirection: rowDir,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  trustBadge: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  trustText: { fontSize: 11.5, fontFamily: fontFamily.bold, color: colors.inkSoft },
  featuredRow: {
    flexDirection: rowDir,
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  featuredLoading: { marginVertical: 24 },
});
