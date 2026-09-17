import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { colors, fontFamily, radii, rowDir, textAlignStart } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CarIllustration } from '@/components/ui/CarIllustration';
import { toArabicDigits } from '@/lib/date-format';
import { formatSAR } from '@/data/cars';
import { useBooking } from '@/context/BookingContext';

export default function BookingConfirmedScreen() {
  const router = useRouter();
  const { bookingId, paid } = useLocalSearchParams<{ bookingId: string; paid?: string }>();
  const { selectedCar, trip, pricing } = useBooking();
  // paid is only set for the Geidea flow — absent for cash/tabby/tamara,
  // which are legitimately "confirmed" without electronic capture yet.
  const paymentPending = paid === '0';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={[styles.checkBadge, paymentPending && styles.pendingBadge]}>
          <Ionicons name={paymentPending ? 'time-outline' : 'checkmark'} size={34} color={colors.gold} />
        </View>
        <Text style={styles.title}>{paymentPending ? 'حجزك قيد تأكيد الدفع' : 'تم تأكيد حجزك'}</Text>
        <Text style={styles.subtitle}>
          {paymentPending
            ? `رقم الطلب #${toArabicDigits(bookingId ?? '')} — لم نتأكد من اكتمال الدفع بعد. لو خصمت المبلغ فعلاً هيتأكد تلقائياً خلال دقائق.`
            : `رقم الطلب #${toArabicDigits(bookingId ?? '')} — سنرسل لك تفاصيل الحجز عبر رسالة نصية.`}
        </Text>

        <Card padded style={styles.card}>
          <View style={styles.carRow}>
            <View style={[styles.thumb, { backgroundColor: selectedCar.tint }]}>
              <CarIllustration bodyStyle={selectedCar.bodyStyle} size={64} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.carName}>
                {selectedCar.make} {selectedCar.model} {selectedCar.year}
              </Text>
              <Text style={styles.carSub}>{trip.branch}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.metaLabel}>الاستلام</Text>
            <Text style={styles.metaValue}>{trip.pickupDate} · {trip.pickupTime}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.metaLabel}>التسليم</Text>
            <Text style={styles.metaValue}>{trip.returnDate} · {trip.returnTime}</Text>
          </View>
          <View style={[styles.rowBetween, { marginTop: 6 }]}>
            <Text style={styles.metaLabel}>الإجمالي المدفوع</Text>
            <Text style={styles.totalValue}>
              {formatSAR(pricing.total)} <Text style={styles.totalUnit}>ر.س</Text>
            </Text>
          </View>
        </Card>
      </View>

      <View style={styles.footer}>
        <Button label="عرض تفاصيل الحجز" onPress={() => router.replace('/(tabs)/bookings')} />
        <Button
          label="الرجوع للرئيسية"
          variant="ghost"
          onPress={() => router.replace('/(tabs)')}
          style={{ marginTop: 8 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 48 },
  checkBadge: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: colors.petrol,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: { backgroundColor: colors.goldTextDim },
  title: { marginTop: 20, fontSize: 24, fontFamily: fontFamily.black, color: colors.ink },
  subtitle: {
    marginTop: 8,
    fontSize: 12.5,
    fontFamily: fontFamily.medium,
    color: colors.faint2,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  card: { width: '100%', marginTop: 28, borderRadius: radii.xl },
  carRow: { flexDirection: rowDir, alignItems: 'center', gap: 12 },
  thumb: { width: 78, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  carName: { fontSize: 14.5, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart },
  carSub: { marginTop: 2, fontSize: 11.5, fontFamily: fontFamily.medium, color: colors.faint2, textAlign: textAlignStart },
  divider: { height: 1, backgroundColor: colors.borderFaint, marginVertical: 12 },
  rowBetween: { flexDirection: rowDir, justifyContent: 'space-between', paddingVertical: 4 },
  metaLabel: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.faint2 },
  metaValue: { fontSize: 12.5, fontFamily: fontFamily.extraBold, color: colors.ink },
  totalValue: { fontSize: 15, fontFamily: fontFamily.black, color: colors.ink },
  totalUnit: { fontSize: 11, fontFamily: fontFamily.extraBold, color: colors.goldTextDim },
  footer: { padding: 20 },
});
