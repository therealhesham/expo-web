import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { colors, fontFamily, pressedOpacity, radii, rowDir, textAlignStart } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { DeliveryMap } from '@/components/ui/DeliveryMap';
import { haversineKm } from '@/lib/geo';
import { useBooking } from '@/context/BookingContext';

// Riyadh center — last-resort fallback when no branch is selected yet and
// the device denies/lacks location, so the map still has somewhere to open.
const DEFAULT_CENTER = { latitude: 24.7136, longitude: 46.6753 };

export default function DeliveryLocationScreen() {
  const router = useRouter();
  const { trip, setTrip } = useBooking();

  const branchCoord =
    trip.branchLat != null && trip.branchLng != null
      ? { latitude: trip.branchLat, longitude: trip.branchLng }
      : null;

  const [center, setCenter] = useState(branchCoord ?? DEFAULT_CENTER);
  const [address, setAddress] = useState('حرّك الخريطة لتحديد موقع التوصيل');

  // Seed the map at the device's real location when permission is granted —
  // reverseGeocodeAsync/getCurrentPositionAsync aren't implemented on web.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      const pos = await Location.getCurrentPositionAsync({});
      if (!cancelled) setCenter({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    Location.reverseGeocodeAsync({ latitude: center.latitude, longitude: center.longitude })
      .then((results) => {
        if (cancelled) return;
        const r = results[0];
        const parts = [r?.district, r?.street, r?.city].filter(Boolean);
        setAddress(parts.length ? parts.join('، ') : 'موقع محدد على الخريطة');
      })
      .catch(() => {
        if (!cancelled) setAddress('تعذّر تحديد اسم العنوان — الموقع محفوظ على الخريطة');
      });
    return () => {
      cancelled = true;
    };
  }, [center.latitude, center.longitude]);

  // Honest distance: only computable once a real pickup branch (with real
  // coordinates from /fleet/branches) has been selected on the home screen.
  const distanceKm = branchCoord ? haversineKm(branchCoord, center) : null;
  const feePerKm = trip.branchDeliveryFeePerKmSar ?? 0;
  const fee = distanceKm != null ? Math.round(distanceKm * feePerKm * 100) / 100 : 0;

  function confirm() {
    setTrip({
      deliveryAddress: address,
      deliveryFee: fee,
      deliveryDistanceKm: distanceKm ?? undefined,
      deliveryLat: center.latitude,
      deliveryLng: center.longitude,
    });
    router.back();
  }

  return (
    <View style={styles.screen}>
      <DeliveryMap initialRegion={center} onCenterChange={setCenter} />

      <SafeAreaView edges={['top']} style={styles.searchWrap}>
        <Pressable
          style={({ pressed }) => [styles.roundBtn, pressed && { opacity: pressedOpacity }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.ink} />
        </Pressable>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={15} color={colors.faint2} />
          <Text style={styles.searchPlaceholder}>ابحث عن حيّ أو معلم…</Text>
        </View>
      </SafeAreaView>

      <View style={styles.pinWrap} pointerEvents="none">
        <View style={styles.pinLabel}>
          <Text style={styles.pinLabelText}>موقع التوصيل</Text>
        </View>
        <View style={styles.pinStem} />
        <View style={styles.pinDot} />
        <View style={styles.pinShadow} />
      </View>

      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetLabel}>تأكيد موقع التوصيل</Text>
        <Text style={styles.sheetAddress}>{address}</Text>

        <View style={styles.infoCard}>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>يبعد عن {trip.branch.split(' — ')[0]}</Text>
            <Text style={styles.infoValue}>
              {distanceKm != null ? `${distanceKm.toFixed(1)} كم` : 'اختر فرع الاستلام أولاً'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>رسوم التوصيل</Text>
            <Text style={styles.infoValue}>{fee.toFixed(2)} ر.س</Text>
          </View>
          <View style={styles.noteRow}>
            <Ionicons name="information-circle-outline" size={14} color={colors.goldText} />
            <Text style={styles.noteText}>الإرجاع في نفس الموقع — يمكن تغييره لاحقاً</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: pressedOpacity }]}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryBtnText}>تغيير</Text>
          </Pressable>
          <Button label="تأكيد الموقع" onPress={confirm} style={{ flex: 1 }} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#eae4d8' },
  searchWrap: { flexDirection: rowDir, alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8 },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  searchPlaceholder: { fontSize: 12.5, fontFamily: fontFamily.bold, color: colors.faint3 },
  pinWrap: { position: 'absolute', top: '38%', left: '50%', transform: [{ translateX: -60 }], alignItems: 'center', width: 120 },
  pinLabel: {
    backgroundColor: colors.petrol,
    borderRadius: 11,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  pinLabelText: { fontSize: 11.5, fontFamily: fontFamily.extraBold, color: colors.white },
  pinStem: { width: 2, height: 26, backgroundColor: colors.petrol },
  pinDot: { width: 14, height: 14, borderRadius: 99, backgroundColor: colors.gold, borderWidth: 3, borderColor: colors.petrol, marginTop: -3 },
  pinShadow: { width: 40, height: 9, borderRadius: 99, backgroundColor: 'rgba(0,55,73,0.14)', marginTop: 4 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 18,
    paddingTop: 12,
    shadowColor: '#0f3d47',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 10,
  },
  handle: { width: 44, height: 4, borderRadius: 99, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 14 },
  sheetLabel: { fontSize: 10.5, fontFamily: fontFamily.black, letterSpacing: 1, color: colors.goldText, textAlign: textAlignStart },
  sheetAddress: { marginTop: 7, fontSize: 15.5, fontFamily: fontFamily.extraBold, color: colors.ink, lineHeight: 24, textAlign: textAlignStart },
  infoCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  infoRow: { flexDirection: rowDir, alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderFaint },
  infoLabel: { fontSize: 12.5, fontFamily: fontFamily.bold, color: colors.brownText },
  infoValue: { fontSize: 13, fontFamily: fontFamily.black, color: colors.ink },
  noteRow: { flexDirection: rowDir, alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#fbf7ef' },
  noteText: { flex: 1, fontSize: 11.5, fontFamily: fontFamily.bold, color: colors.goldTextDim, textAlign: textAlignStart },
  actionsRow: { flexDirection: rowDir, gap: 10, marginTop: 14 },
  secondaryBtn: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontFamily: fontFamily.extraBold, color: colors.faint3 },
});
