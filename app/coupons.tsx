import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, fontFamily, pressedOpacity, radii, rowDir, textAlignStart } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { formatSAR } from '@/data/cars';
import { formatArabicDate, toArabicDigits } from '@/lib/date-format';
import { fetchMyCoupons, type ApiCouponRedemption } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CouponsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<ApiCouponRedemption[] | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchMyCoupons(token)
      .then(setCoupons)
      .catch(() => setCoupons([]));
  }, [token]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.topSafe}>
        <Pressable
          style={({ pressed }) => [styles.backRow, pressed && { opacity: pressedOpacity }]}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="chevron-forward" size={16} color={colors.faint2} />
          <Text style={styles.backText}>رجوع</Text>
        </Pressable>
        <Text style={styles.title}>أكواد الخصم</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>أدخل كود الخصم في صفحة إتمام الحجز قبل الدفع — هنا تظهر الأكواد اللي استخدمتها من قبل.</Text>

        {coupons === null ? (
          <ActivityIndicator color={colors.petrol} style={{ marginTop: 20 }} />
        ) : coupons.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="pricetag-outline" size={28} color={colors.faint2} />
            <Text style={styles.emptyText}>لسه ما استخدمتش أي كود خصم</Text>
          </View>
        ) : (
          coupons.map((c) => (
            <Card key={c.id} padded style={styles.couponCard}>
              <View style={styles.couponIcon}>
                <Ionicons name="pricetag" size={16} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.couponCode}>{c.code}</Text>
                <Text style={styles.couponDate}>
                  استُخدم في طلب #{toArabicDigits(String(c.bookingId))} · {formatArabicDate(new Date(c.redeemedAt))}
                </Text>
              </View>
              <Text style={styles.couponSavings}>وفّرت {formatSAR(c.discountAmountSar)} ر.س</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  topSafe: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  backRow: { flexDirection: rowDir, alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6 },
  backText: { fontSize: 12.5, fontFamily: fontFamily.extraBold, color: colors.faint2 },
  title: { fontSize: 19, fontFamily: fontFamily.black, color: colors.ink, textAlign: textAlignStart, padding: 16, paddingTop: 8 },
  content: { padding: 16, paddingBottom: 40 },
  hint: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.faint2,
    lineHeight: 19,
    textAlign: textAlignStart,
    marginBottom: 14,
  },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, fontFamily: fontFamily.bold, color: colors.faint2 },
  couponCard: { flexDirection: rowDir, alignItems: 'center', gap: 12, marginBottom: 10 },
  couponIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.petrol,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponCode: { fontSize: 14, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart, letterSpacing: 0.5 },
  couponDate: { marginTop: 2, fontSize: 11, fontFamily: fontFamily.medium, color: colors.faint2, textAlign: textAlignStart },
  couponSavings: { fontSize: 12, fontFamily: fontFamily.extraBold, color: colors.success },
});
