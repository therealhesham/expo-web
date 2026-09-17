import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, RefreshControl, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, fontFamily, pressedOpacity, radii, rowDir, textAlignStart } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatSAR } from '@/data/cars';
import { formatArabicDate } from '@/lib/date-format';
import { fetchMyBookings, type ApiBooking, type ApiBookingStatus } from '@/lib/api';
import { payBookingWithGeidea } from '@/lib/geidea-checkout';
import { useAuth } from '@/context/AuthContext';

// History = the trip is over one way or another; everything else is still
// "in flight" and shown as upcoming/current, mirroring the same
// NON_BLOCKING_STATUSES the backend uses to free up a car for rebooking.
const HISTORY_STATUSES: ApiBookingStatus[] = ['RETURNED', 'COMPLETED', 'CANCELLED', 'REJECTED'];

// Stored uppercase from the PaymentMethodId sent at booking creation — a
// pending booking with one of these can retry through the same Geidea
// session flow. Cash/Tabby/Tamara/Amkan never went through a gateway, so
// there's nothing to retry.
const RETRYABLE_METHODS = ['VISA', 'MADA', 'APPLEPAY'];

const STATUS_LABEL: Record<ApiBookingStatus, string> = {
  NEW: 'طلب جديد',
  UNDER_REVIEW: 'قيد المراجعة',
  CONFIRMED: 'مؤكد',
  PICKED_UP: 'جارٍ التنفيذ',
  RETURNED: 'تم الإرجاع',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
  REJECTED: 'مرفوض',
};

const STATUS_COLOR: Record<ApiBookingStatus, { bg: string; fg: string }> = {
  NEW: { bg: '#f1ece1', fg: colors.goldTextDim },
  UNDER_REVIEW: { bg: '#f1ece1', fg: colors.goldTextDim },
  CONFIRMED: { bg: colors.successBg, fg: colors.success },
  PICKED_UP: { bg: '#e9f1f3', fg: colors.petrol },
  RETURNED: { bg: colors.sandLight, fg: colors.faint2 },
  COMPLETED: { bg: colors.successBg, fg: colors.success },
  CANCELLED: { bg: colors.dangerBg, fg: colors.danger },
  REJECTED: { bg: colors.dangerBg, fg: colors.danger },
};

export default function BookingsScreen() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<ApiBooking[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    return fetchMyBookings(token)
      .then(setBookings)
      .catch(() => setBookings([]));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (authLoading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <Text style={styles.title}>حجوزاتي</Text>
        </SafeAreaView>
        <ActivityIndicator color={colors.petrol} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <Text style={styles.title}>حجوزاتي</Text>
        </SafeAreaView>
        <View style={styles.loginPromptWrap}>
          <View style={styles.loginIcon}>
            <Ionicons name="calendar-outline" size={26} color={colors.gold} />
          </View>
          <Text style={styles.loginTitle}>سجّل الدخول لعرض حجوزاتك</Text>
          <Text style={styles.loginSub}>حجوزاتك الحالية والسابقة تظهر هنا بعد تسجيل الدخول برقم جوالك.</Text>
          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && { opacity: pressedOpacity }]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginBtnText}>سجّل الدخول</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const upcoming = (bookings ?? []).filter((b) => !HISTORY_STATUSES.includes(b.status));
  const history = (bookings ?? []).filter((b) => HISTORY_STATUSES.includes(b.status));

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <Text style={styles.title}>حجوزاتي</Text>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.petrol} />}
      >
        {bookings === null ? (
          <ActivityIndicator color={colors.petrol} style={{ marginTop: 20 }} />
        ) : bookings.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="car-outline" size={28} color={colors.faint2} />
            <Text style={styles.emptyText}>لا توجد حجوزات بعد</Text>
            <Pressable
              style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: pressedOpacity }]}
              onPress={() => router.push('/(tabs)/fleet')}
            >
              <Text style={styles.emptyBtnText}>تصفّح الأسطول</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>الحجوزات الحالية</Text>
                {upcoming.map((b) => (
                  <UpcomingCard key={b.id} booking={b} onPaymentUpdated={load} />
                ))}
              </>
            )}

            {history.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 22 }]}>حجوزات سابقة</Text>
                {history.map((b) => (
                  <PastCard key={b.id} booking={b} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function UpcomingCard({ booking, onPaymentUpdated }: { booking: ApiBooking; onPaymentUpdated: () => void }) {
  const router = useRouter();
  const { token } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const statusColor = STATUS_COLOR[booking.status];
  const pickupAt = new Date(booking.pickupAt);
  const returnAt = new Date(booking.returnAt);
  const canRetryPayment =
    booking.paymentStatus === 'PENDING' && !!booking.paymentMethod && RETRYABLE_METHODS.includes(booking.paymentMethod);

  async function retryPayment() {
    if (!token) return;
    setRetrying(true);
    try {
      const { paid } = await payBookingWithGeidea(token, booking.id);
      if (paid) {
        Alert.alert('تم الدفع', 'تم تأكيد دفع هذا الحجز بنجاح.');
      }
      onPaymentUpdated();
    } catch {
      Alert.alert('تعذّر إتمام الدفع', 'حاول مرة أخرى بعد قليل.');
    } finally {
      setRetrying(false);
    }
  }

  return (
    <Card style={styles.upcomingCard}>
      <View style={styles.upcomingHeader}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor.fg }]} />
          <Text style={[styles.statusText, { color: statusColor.fg }]}>{STATUS_LABEL[booking.status]}</Text>
        </View>
        <Text style={styles.refText}>طلب #{booking.id}</Text>
      </View>
      <View style={styles.upcomingBody}>
        <View style={styles.thumb}>
          {booking.car?.image ? (
            <Image source={{ uri: booking.car.image }} resizeMode="cover" style={StyleSheet.absoluteFill} />
          ) : (
            <Ionicons name="car-sport-outline" size={30} color={colors.goldLine} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.carName}>
            {booking.car ? `${booking.car.make} ${booking.car.model} ${booking.car.year}` : 'سيارة'}
          </Text>
          <Text style={styles.carSub}>
            {booking.branchName ?? booking.deliveryAddress ?? ''} · {formatArabicDate(pickupAt)} — {formatArabicDate(returnAt)}
          </Text>
        </View>
      </View>
      <View style={styles.upcomingFooter}>
        <Text style={styles.totalText}>
          الإجمالي {formatSAR(booking.totalAmountSar ?? 0)} <Text style={styles.totalUnit}>ر.س</Text>
        </Text>
        {booking.car && (
          <Text style={styles.contractLink} onPress={() => router.push(`/car/${booking.car!.id}`)}>
            عرض التفاصيل
          </Text>
        )}
      </View>
      {canRetryPayment && (
        <View style={styles.retryWrap}>
          <Button label="أكمل الدفع" onPress={retryPayment} loading={retrying} />
        </View>
      )}
    </Card>
  );
}

function PastCard({ booking }: { booking: ApiBooking }) {
  const statusColor = STATUS_COLOR[booking.status];
  const pickupAt = new Date(booking.pickupAt);
  const returnAt = new Date(booking.returnAt);

  return (
    <Card padded style={styles.pastCard}>
      <View style={styles.pastThumb}>
        {booking.car?.image ? (
          <Image source={{ uri: booking.car.image }} resizeMode="cover" style={StyleSheet.absoluteFill} />
        ) : (
          <Ionicons name="car-sport-outline" size={20} color={colors.goldLine} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.pastName}>{booking.car ? `${booking.car.make} ${booking.car.model}` : 'سيارة'}</Text>
        <Text style={styles.pastDate}>
          {formatArabicDate(pickupAt)} — {formatArabicDate(returnAt)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.pastTotal}>{formatSAR(booking.totalAmountSar ?? 0)} ر.س</Text>
        <Text style={[styles.pastStatus, { color: statusColor.fg }]}>{STATUS_LABEL[booking.status]}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  headerSafe: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 19, fontFamily: fontFamily.black, color: colors.ink, textAlign: textAlignStart, padding: 16 },
  content: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fontFamily.black,
    letterSpacing: 1,
    color: colors.goldText,
    marginBottom: 10,
    textAlign: textAlignStart,
  },
  loginPromptWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 6 },
  loginIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.petrol,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  loginTitle: { fontSize: 16, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: 'center' },
  loginSub: { fontSize: 12.5, fontFamily: fontFamily.medium, color: colors.faint2, textAlign: 'center', lineHeight: 20 },
  loginBtn: { marginTop: 14, backgroundColor: colors.petrol, borderRadius: radii.lg, paddingVertical: 13, paddingHorizontal: 26 },
  loginBtnText: { fontSize: 13.5, fontFamily: fontFamily.extraBold, color: colors.white },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, fontFamily: fontFamily.bold, color: colors.faint2 },
  emptyBtn: { marginTop: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 10, paddingHorizontal: 18 },
  emptyBtnText: { fontSize: 12.5, fontFamily: fontFamily.extraBold, color: colors.goldText },
  upcomingCard: { borderRadius: radii.xl, marginBottom: 12 },
  upcomingHeader: {
    flexDirection: rowDir,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusBadge: { flexDirection: rowDir, alignItems: 'center', gap: 6, borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 99 },
  statusText: { fontSize: 11.5, fontFamily: fontFamily.extraBold },
  refText: { fontSize: 11, fontFamily: fontFamily.bold, color: colors.faint2 },
  upcomingBody: { flexDirection: rowDir, alignItems: 'center', gap: 12, padding: 14 },
  thumb: {
    width: 84,
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sandLight,
    overflow: 'hidden',
  },
  carName: { fontSize: 15, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart },
  carSub: { marginTop: 3, fontSize: 11.5, fontFamily: fontFamily.medium, color: colors.faint2, textAlign: textAlignStart },
  upcomingFooter: {
    flexDirection: rowDir,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderFaint,
    padding: 14,
  },
  totalText: { fontSize: 14, fontFamily: fontFamily.extraBold, color: colors.ink },
  totalUnit: { fontSize: 11, color: colors.goldTextDim },
  contractLink: { fontSize: 12, fontFamily: fontFamily.extraBold, color: colors.goldText },
  retryWrap: { padding: 14, paddingTop: 0 },
  pastCard: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  pastThumb: {
    width: 60,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sandLight,
    overflow: 'hidden',
  },
  pastName: { fontSize: 13.5, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart },
  pastDate: { marginTop: 2, fontSize: 11, fontFamily: fontFamily.medium, color: colors.faint2, textAlign: textAlignStart },
  pastTotal: { fontSize: 13, fontFamily: fontFamily.extraBold, color: colors.ink },
  pastStatus: { marginTop: 2, fontSize: 10.5, fontFamily: fontFamily.bold, textAlign: textAlignStart },
});
