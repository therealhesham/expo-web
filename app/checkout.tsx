import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, fontFamily, pressedOpacity, radii, rowDir, textAlignStart } from '@/constants/theme';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CarIllustration } from '@/components/ui/CarIllustration';
import { PaymentBadge } from '@/components/ui/PaymentBadge';
import { formatSAR } from '@/data/cars';
import { ApiAuthError, fetchAddons, validateCoupon } from '@/lib/api';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/context/AuthContext';

const AGE_BANDS = ['١٨-٢٤ سنة', '٢٥-٣٥ سنة', '٣٦-٥٠ سنة', '+٥٠ سنة'];

export default function CheckoutScreen() {
  const router = useRouter();
  const {
    selectedCar,
    trip,
    extras,
    toggleExtra,
    addonsCatalog,
    setAddonsCatalog,
    contact,
    setContact,
    coupon,
    setCoupon,
    pricing,
  } = useBooking();
  const { user, token } = useAuth();
  const [agreed, setAgreed] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const displayTotal = coupon?.newTotalSar ?? pricing.total;

  useEffect(() => {
    fetchAddons()
      .then(setAddonsCatalog)
      .catch(() => setAddonsCatalog([]));
  }, []);

  // Prefill the name once from the logged-in account instead of leaving the
  // placeholder default from before login existed in this app.
  useEffect(() => {
    if (user?.name && !contact.fullName) setContact({ fullName: user.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function cycleAgeBand() {
    const i = AGE_BANDS.indexOf(contact.ageBand);
    setContact({ ageBand: AGE_BANDS[(i + 1) % AGE_BANDS.length] });
  }

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code || !token || couponLoading) return;
    const returnBranchId = trip.differentReturnBranch ? trip.returnBranchId : trip.branchId;
    if (!returnBranchId) {
      setCouponError('اختر الفرع أولاً من الصفحة الرئيسية.');
      return;
    }
    setCouponLoading(true);
    setCouponError(null);
    try {
      const result = await validateCoupon(token, {
        code,
        carModelId: Number(selectedCar.id),
        returnBranchId,
        pickupAt: trip.pickupAt,
        returnAt: trip.returnAt,
        addonIds: addonsCatalog.filter((a) => extras[a.slug]).map((a) => a.id),
        pickupMode: trip.pickupMode,
        deliveryBranchId: trip.pickupMode === 'delivery' ? trip.branchId : undefined,
        deliveryLat: trip.pickupMode === 'delivery' ? trip.deliveryLat : undefined,
        deliveryLng: trip.pickupMode === 'delivery' ? trip.deliveryLng : undefined,
      });
      setCoupon({ code: code.toUpperCase(), ...result });
      setCouponInput('');
    } catch (e) {
      setCouponError(e instanceof ApiAuthError ? e.message : 'تعذّر التحقق من الكود الآن.');
    } finally {
      setCouponLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <FlowHeader title="إتمام الحجز" step={2} totalSteps={3} trailing="٢ من ٣" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card padded style={styles.carRow}>
          <View style={[styles.carThumb, { backgroundColor: selectedCar.tint }]}>
            {selectedCar.image ? (
              <Image source={{ uri: selectedCar.image }} resizeMode="cover" style={StyleSheet.absoluteFill} />
            ) : (
              <CarIllustration bodyStyle={selectedCar.bodyStyle} size={70} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.carName}>
              {selectedCar.make} {selectedCar.model} {selectedCar.year}
            </Text>
            <Text style={styles.carSub}>أو مركبة مشابهة · {trip.days} أيام</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/fleet')}
            style={({ pressed }) => pressed && { opacity: pressedOpacity }}
          >
            <Text style={styles.changeLink}>غيّر السيارة</Text>
          </Pressable>
        </Card>

        <View style={styles.twoCol}>
          <View style={styles.tripBox}>
            <Text style={styles.tripLabel}>الاستلام</Text>
            <Text style={styles.tripValue}>
              {trip.branch.split(' — ')[0]}
              {'\n'}
              {trip.pickupDate} · {trip.pickupTime}
            </Text>
          </View>
          <View style={styles.tripBox}>
            <Text style={styles.tripLabel}>التسليم</Text>
            <Text style={styles.tripValue}>
              {(trip.differentReturnBranch && trip.returnBranch ? trip.returnBranch : trip.branch).split(' — ')[0]}
              {'\n'}
              {trip.returnDate} · {trip.returnTime}
            </Text>
          </View>
        </View>

        {addonsCatalog.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>إضافات وتأمين</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalText}>اختياري</Text>
              </View>
            </View>
            <Card>
              {addonsCatalog.map((addon, i) => (
                <ExtraRow
                  key={addon.slug}
                  title={addon.title}
                  price={`${formatSAR(addon.pricePerDay)} ر.س يومياً`}
                  selected={!!extras[addon.slug]}
                  onPress={() => toggleExtra(addon.slug)}
                  isLast={i === addonsCatalog.length - 1}
                />
              ))}
            </Card>
          </>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 18, marginBottom: 8 }]}>كود الخصم</Text>
        {coupon ? (
          <View style={styles.couponAppliedRow}>
            <Ionicons name="pricetag" size={16} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.couponAppliedCode}>{coupon.code}</Text>
              <Text style={styles.couponAppliedLabel}>{coupon.label}</Text>
            </View>
            <Pressable
              onPress={() => setCoupon(null)}
              style={({ pressed }) => pressed && { opacity: pressedOpacity }}
              hitSlop={8}
            >
              <Text style={styles.couponRemoveLink}>إزالة</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                value={couponInput}
                onChangeText={(v) => {
                  setCouponInput(v);
                  setCouponError(null);
                }}
                placeholder="أدخل كود الخصم"
                placeholderTextColor={colors.faint2}
                autoCapitalize="characters"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.couponApplyBtn,
                  (!couponInput.trim() || couponLoading) && styles.couponApplyBtnDisabled,
                  pressed && { opacity: pressedOpacity },
                ]}
                onPress={applyCoupon}
                disabled={!couponInput.trim() || couponLoading}
              >
                <Text style={styles.couponApplyText}>{couponLoading ? '...' : 'تطبيق'}</Text>
              </Pressable>
            </View>
            {couponError && <Text style={styles.couponErrorText}>{couponError}</Text>}
          </View>
        )}

        <View style={styles.tabbyBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tabbyTitle}>قسّمها على ٤ دفعات بدون فوائد</Text>
            <Text style={styles.tabbySub}>متوفر عبر تابي وتمارا — تختار عند الدفع</Text>
          </View>
          <PaymentBadge id="tabby" height={16} invert />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18, marginBottom: 8 }]}>بيانات التواصل</Text>
        <Card>
          <View style={styles.contactField}>
            <Text style={styles.tripLabel}>الاسم الكامل</Text>
            <TextInput
              style={styles.contactInput}
              value={contact.fullName}
              onChangeText={(v) => setContact({ fullName: v })}
              placeholder="اسمك الكامل"
              placeholderTextColor={colors.faint2}
            />
          </View>
          <View style={styles.contactRow}>
            <View style={[styles.contactField, styles.contactFieldBorder, { flex: 1 }]}>
              <Text style={styles.tripLabel}>رقم الجوال</Text>
              <Text style={[styles.contactValue, { textAlign: 'left' }]}>{user?.phone ?? contact.phone}</Text>
            </View>
            <Pressable style={[styles.contactField, { width: 118 }]} onPress={cycleAgeBand}>
              <Text style={styles.tripLabel}>الفئة العمرية</Text>
              <Text style={styles.contactValue}>{contact.ageBand}</Text>
            </Pressable>
          </View>
        </Card>

        <Pressable
          style={({ pressed }) => [styles.termsRow, pressed && { opacity: pressedOpacity }]}
          onPress={() => setAgreed((v) => !v)}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={12} color={colors.gold} />}
          </View>
          <Text style={styles.termsText}>
            أوافق على <Text style={styles.termsLink}>الشروط والأحكام</Text> وسياسة التأجير.
          </Text>
        </Pressable>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.footerTotalRow}>
          <Text style={styles.footerLabel}>المجموع النهائي · شامل الضريبة</Text>
          <Text style={styles.footerTotal}>
            {formatSAR(displayTotal)} <Text style={styles.footerUnit}>ر.س</Text>
          </Text>
        </View>
        <Button
          label="تأكيد البيانات والمتابعة"
          disabled={!agreed || !contact.fullName.trim()}
          onPress={() => router.push('/payment')}
        />
      </SafeAreaView>
    </View>
  );
}

function ExtraRow({
  title,
  price,
  selected,
  onPress,
  isLast,
}: {
  title: string;
  price: string;
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.extraRow, !isLast && styles.extraRowBorder, pressed && { opacity: pressedOpacity }]}
      onPress={onPress}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.extraTitle}>{title}</Text>
        <Text style={styles.extraPrice}>{price}</Text>
      </View>
      <View style={[styles.extraAction, selected && styles.extraActionSelected]}>
        {selected && <Ionicons name="checkmark" size={12} color={colors.gold} />}
        <Text style={[styles.extraActionText, selected && styles.extraActionTextSelected]}>
          {selected ? 'تم الإختيار' : 'إضافة'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 16, paddingBottom: 24 },
  carRow: { flexDirection: rowDir, alignItems: 'center', gap: 11 },
  carThumb: { width: 76, height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  carName: { fontSize: 14, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart },
  carSub: { marginTop: 1, fontSize: 11, fontFamily: fontFamily.medium, color: colors.faint2, textAlign: textAlignStart },
  changeLink: { fontSize: 11, fontFamily: fontFamily.extraBold, color: colors.goldText },
  twoCol: { flexDirection: rowDir, gap: 10, marginTop: 10 },
  tripBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 11,
  },
  tripLabel: { fontSize: 10, fontFamily: fontFamily.black, letterSpacing: 0.6, color: colors.faint2, textAlign: textAlignStart },
  tripValue: { marginTop: 4, fontSize: 12.5, fontFamily: fontFamily.extraBold, color: colors.ink, lineHeight: 18, textAlign: textAlignStart },
  sectionHeaderRow: { flexDirection: rowDir, alignItems: 'center', gap: 6, marginTop: 18, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontFamily: fontFamily.black, color: colors.ink, textAlign: textAlignStart },
  optionalBadge: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 8 },
  optionalText: { fontSize: 10.5, fontFamily: fontFamily.bold, color: colors.faint2 },
  extraRow: { flexDirection: rowDir, alignItems: 'center', gap: 10, padding: 13 },
  extraRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderFaint },
  extraTitle: { fontSize: 13, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart },
  extraPrice: { marginTop: 1, fontSize: 11, fontFamily: fontFamily.bold, color: colors.goldTextDim, textAlign: textAlignStart },
  extraAction: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  extraActionSelected: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  extraActionText: { fontSize: 11.5, fontFamily: fontFamily.extraBold, color: colors.faint3 },
  extraActionTextSelected: { color: colors.white },
  couponInputRow: { flexDirection: rowDir, gap: 10 },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 13.5,
    fontFamily: fontFamily.extraBold,
    color: colors.ink,
    textAlign: textAlignStart,
  },
  couponApplyBtn: {
    minWidth: 84,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.petrol,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  couponApplyBtnDisabled: { opacity: 0.5 },
  couponApplyText: { fontSize: 13, fontFamily: fontFamily.extraBold, color: colors.white },
  couponErrorText: { marginTop: 6, fontSize: 11.5, fontFamily: fontFamily.bold, color: colors.danger, textAlign: textAlignStart },
  couponAppliedRow: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.successBorder,
    backgroundColor: colors.successBg,
    borderRadius: radii.lg,
    padding: 12,
  },
  couponAppliedCode: { fontSize: 13.5, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart, letterSpacing: 0.5 },
  couponAppliedLabel: { marginTop: 1, fontSize: 11, fontFamily: fontFamily.bold, color: colors.success, textAlign: textAlignStart },
  couponRemoveLink: { fontSize: 11.5, fontFamily: fontFamily.extraBold, color: colors.danger },
  tabbyBanner: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    borderRadius: radii.lg,
    backgroundColor: colors.petrol,
    padding: 14,
  },
  tabbyTitle: { fontSize: 13, fontFamily: fontFamily.extraBold, color: colors.white, textAlign: textAlignStart },
  tabbySub: { marginTop: 2, fontSize: 11, fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.6)', textAlign: textAlignStart },
  contactField: { padding: 12 },
  contactFieldBorder: { borderLeftWidth: 1, borderLeftColor: colors.borderFaint },
  contactRow: { flexDirection: rowDir, borderTopWidth: 1, borderTopColor: colors.borderFaint },
  contactValue: { marginTop: 3, fontSize: 14, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart },
  contactInput: {
    marginTop: 3,
    fontSize: 14,
    fontFamily: fontFamily.extraBold,
    color: colors.ink,
    textAlign: textAlignStart,
    padding: 0,
  },
  termsRow: { flexDirection: rowDir, alignItems: 'flex-start', gap: 9, marginTop: 14, paddingHorizontal: 4 },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  termsText: { flex: 1, fontSize: 12, fontFamily: fontFamily.medium, color: colors.brownText, lineHeight: 19, textAlign: textAlignStart },
  termsLink: { fontFamily: fontFamily.extraBold, color: colors.goldText, textDecorationLine: 'underline' },
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
  },
  footerTotalRow: { flexDirection: rowDir, alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
  footerLabel: { fontSize: 11.5, fontFamily: fontFamily.bold, color: colors.faint2 },
  footerTotal: { fontSize: 17, fontFamily: fontFamily.black, color: colors.ink },
  footerUnit: { fontSize: 11, fontFamily: fontFamily.extraBold, color: colors.goldTextDim },
});
