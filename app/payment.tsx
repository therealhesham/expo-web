import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, fontFamily, pressedOpacity, radii, rowDir, textAlignStart } from '@/constants/theme';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Button } from '@/components/ui/Button';
import { PaymentBadge, type PaymentMethodId } from '@/components/ui/PaymentBadge';
import { formatSAR } from '@/data/cars';
import { ApiAuthError, createBooking, fetchEnabledPaymentMethods } from '@/lib/api';
import { payBookingWithGeidea } from '@/lib/geidea-checkout';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/context/AuthContext';

// These three ride the real Geidea hosted checkout page (mada/Visa/Mastercard
// + Apple Pay via Safari's built-in support on that page — no native Apple
// Pay SDK/domain verification needed on our side). Tabby/Tamara/Amkan are
// separate providers with their own APIs, not part of this integration yet;
// Cash is settled at the branch and never touches a gateway.
const GEIDEA_METHODS: string[] = ['mada', 'visa', 'applepay'] satisfies PaymentMethodId[];

// Maps the backend's SiteSetting flag codes to this screen's method catalog.
// POINTS has no UI concept in this app yet, so it's intentionally omitted —
// an unmapped code is just skipped rather than crashing the screen.
const METHOD_CATALOG: Record<string, { id: PaymentMethodId; title: string; subtitle: string }> = {
  TABBY: { id: 'tabby', title: 'تابي — ٤ أقساط شهرية', subtitle: 'بدون فوائد' },
  TAMARA: { id: 'tamara', title: 'تمارا — ٤ أقساط شهرية', subtitle: 'بدون فوائد' },
  MADA: { id: 'mada', title: 'مدى', subtitle: 'الدفع ببطاقة مدى' },
  CARD: { id: 'visa', title: 'بطاقة ائتمانية', subtitle: 'فيزا، ماستركارد — بوابة الدفع الآمنة' },
  AMKAN: { id: 'amkan', title: 'إمكان', subtitle: 'خدمة إمكان للدفع' },
  CASH: { id: 'cash', title: 'عند الفرع', subtitle: 'يُستحق المبلغ عند الاستلام' },
};

export default function PaymentScreen() {
  const router = useRouter();
  const {
    selectedCar,
    trip,
    extras,
    addonsCatalog,
    contact,
    kyc,
    pricing,
    coupon,
    setCoupon,
    paymentMethodId,
    setPaymentMethodId,
  } = useBooking();
  const { user, token } = useAuth();
  const [enabledCodes, setEnabledCodes] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const displayTotal = coupon?.newTotalSar ?? pricing.total;
  const monthlyTabby = Math.round((displayTotal / 4) * 100) / 100;

  useEffect(() => {
    fetchEnabledPaymentMethods()
      .then(setEnabledCodes)
      .catch(() => setEnabledCodes([]));
  }, []);

  const methods = (enabledCodes ?? [])
    .map((code) => METHOD_CATALOG[code])
    .filter((m): m is NonNullable<typeof m> => !!m);
  const showApplePay = (enabledCodes ?? []).includes('APPLE_PAY');

  // The default selected method (set before this screen knew what's actually
  // enabled) might not be offered anymore — fall back to the first real option.
  useEffect(() => {
    if (methods.length === 0) return;
    if (!methods.some((m) => m.id === paymentMethodId)) {
      setPaymentMethodId(methods[0].id);
    }
  }, [methods, paymentMethodId]);

  const ctaLabel =
    paymentMethodId === 'tabby' || paymentMethodId === 'tamara' ? 'المتابعة عبر ٤ أقساط' : 'تأكيد الدفع';

  // This is the real "commit" moment — everything before it (car, dates, KYC,
  // contact) only lived in local app state until now. Requires login (gated
  // back at car/[id].tsx's "متابعة الحجز" button) since the booking is tied
  // to the authenticated account, not a guest form.
  async function confirmBooking(methodOverride?: PaymentMethodId) {
    if (!user || !token) {
      router.push('/login');
      return;
    }
    const returnBranchId = trip.differentReturnBranch ? trip.returnBranchId : trip.branchId;
    if (!returnBranchId) {
      Alert.alert('اختر فرع الإرجاع', 'ارجع لصفحة البحث واختر فرعاً قبل المتابعة.');
      return;
    }
    if (!kyc.licenseExpiryIso || !kyc.idImageUri || !kyc.licenseImageUri) {
      Alert.alert('بيانات الهوية ناقصة', 'ارجع لخطوة الهوية والرخصة وأكمل البيانات المطلوبة.');
      return;
    }

    const method = methodOverride ?? paymentMethodId;

    setSubmitting(true);
    try {
      const result = await createBooking(token, {
        carModelId: Number(selectedCar.id),
        pickupBranchId: trip.pickupMode === 'branch' ? trip.branchId : undefined,
        returnBranchId,
        pickupMode: trip.pickupMode,
        pickupAt: trip.pickupAt,
        returnAt: trip.returnAt,
        addonIds: addonsCatalog.filter((a) => extras[a.slug]).map((a) => a.id),
        deliveryAddress: trip.pickupMode === 'delivery' ? trip.deliveryAddress : undefined,
        deliveryLat: trip.pickupMode === 'delivery' ? trip.deliveryLat : undefined,
        deliveryLng: trip.pickupMode === 'delivery' ? trip.deliveryLng : undefined,
        deliveryBranchId: trip.pickupMode === 'delivery' ? trip.branchId : undefined,
        fullName: contact.fullName.trim(),
        ageBand: contact.ageBand,
        platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : undefined,
        kyc: {
          idKind: kyc.idKind,
          nationalIdNumber: kyc.nationalIdNumber || undefined,
          passportNumber: kyc.passportNumber || undefined,
          licenseNumber: kyc.licenseNumber,
          licenseExpiryIso: kyc.licenseExpiryIso,
          idImageUri: kyc.idImageUri,
          licenseImageUri: kyc.licenseImageUri,
        },
        paymentMethodId: method,
        termsAccepted: true,
        // Coupons don't apply to monthly bookings (server rejects it too) —
        // checkout.tsx already hides the coupon field in that case.
        couponCode: trip.period === 'monthly' ? undefined : coupon?.code,
        rentalPeriodKind: trip.period === 'monthly' ? 'monthly' : 'daily',
      });

      const bookingId = result.bookingRequestId;
      setCoupon(null);

      if (!GEIDEA_METHODS.includes(method)) {
        router.replace({ pathname: '/booking-confirmed', params: { bookingId: String(bookingId) } });
        return;
      }

      // Real gateway hop: open Geidea's hosted checkout page (card details
      // never pass through our servers), wait for the customer to close it
      // (either after completing payment or backing out), then ask our
      // backend to check the real status before showing the result.
      const { paid } = await payBookingWithGeidea(token, bookingId);
      router.replace({
        pathname: '/booking-confirmed',
        params: { bookingId: String(bookingId), paid: paid ? '1' : '0' },
      });
    } catch (e) {
      const message = e instanceof ApiAuthError ? e.message : 'تعذّر تأكيد الحجز الآن. حاول مرة أخرى.';
      Alert.alert('تعذّر إتمام الحجز', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <FlowHeader title="إتمام الدفع" trailing="٣ من ٣" step={3} totalSteps={3} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.dueCard}>
          <Text style={styles.dueLabel}>المستحق الآن</Text>
          <Text style={styles.dueAmount}>
            {formatSAR(displayTotal)} <Text style={styles.dueUnit}>ر.س</Text>
          </Text>
          <Text style={styles.dueNote}>
            {coupon
              ? `شامل الضريبة · بعد خصم ${coupon.code} (${coupon.label})`
              : 'شامل ضريبة القيمة المضافة · لن يُخصم أي مبلغ حتى تؤكد الدفع'}
          </Text>
        </View>

        {showApplePay && (
          <Pressable
            style={({ pressed }) => [styles.applePayBtn, pressed && { opacity: pressedOpacity }]}
            onPress={() => confirmBooking('applepay')}
            disabled={submitting}
          >
            <Text style={styles.applePayText}>ادفع عبر</Text>
            <PaymentBadge id="applepay" height={19} invert />
          </Pressable>
        )}

        <Text style={styles.orLabel}>أو اختر وسيلة أخرى</Text>
        <View style={{ gap: 9 }}>
          {methods.map((m) => {
            const selected = paymentMethodId === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setPaymentMethodId(m.id)}
                style={({ pressed }) => [
                  styles.methodRow,
                  selected && styles.methodRowSelected,
                  pressed && { opacity: pressedOpacity },
                ]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                {m.id === 'cash' ? (
                  <Ionicons name="storefront-outline" size={19} color={colors.goldTextDim} />
                ) : (
                  <PaymentBadge id={m.id} height={16} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>{m.title}</Text>
                  <Text style={styles.methodSub}>
                    {m.id === 'tabby' || m.id === 'tamara'
                      ? `${formatSAR(monthlyTabby)} ر.س شهرياً · ${m.subtitle}`
                      : m.subtitle}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button label={ctaLabel} onPress={() => confirmBooking()} loading={submitting} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 16, paddingBottom: 24 },
  dueCard: { borderRadius: radii.lg, backgroundColor: colors.petrol, padding: 16 },
  dueLabel: { fontSize: 10.5, fontFamily: fontFamily.black, letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)', textAlign: textAlignStart },
  dueAmount: { marginTop: 5, fontSize: 30, fontFamily: fontFamily.black, color: colors.white, textAlign: textAlignStart },
  dueUnit: { fontSize: 14, fontFamily: fontFamily.extraBold, color: colors.gold },
  dueNote: { marginTop: 5, fontSize: 11, fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.5)', textAlign: textAlignStart },
  applePayBtn: {
    flexDirection: rowDir,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    marginTop: 14,
    backgroundColor: colors.black,
    borderRadius: radii.lg,
  },
  applePayText: { fontSize: 15, fontFamily: fontFamily.extraBold, color: colors.white },
  orLabel: { marginTop: 18, marginBottom: 10, fontSize: 11, fontFamily: fontFamily.black, letterSpacing: 1, color: '#c4b89a', textAlign: textAlignStart },
  methodRow: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 13,
  },
  methodRowSelected: { borderWidth: 1.5, borderColor: colors.petrol },
  radio: {
    width: 19,
    height: 19,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderWidth: 5, borderColor: colors.petrol },
  radioDot: { display: 'none' },
  methodTitle: { fontSize: 13, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart },
  methodSub: { marginTop: 1, fontSize: 11, fontFamily: fontFamily.medium, color: colors.faint2, textAlign: textAlignStart },
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
  },
});
