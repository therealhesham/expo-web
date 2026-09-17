import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

import { colors, fontFamily, pressedOpacity, radii, rowDir, textAlignStart } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { TimeChipPicker } from '@/components/ui/TimeChipPicker';
import { computeAutoReturn, daysBetween, formatArabicDate, formatArabicTime, formatDaysAr } from '@/lib/date-format';
import { type RentalPeriod } from '@/context/BookingContext';

interface Props {
  visible: boolean;
  pickupAt: Date;
  returnAt: Date;
  // 'weekly'/'monthly' lock the return moment to a fixed span from pickup,
  // matching rentcar's computeAutoDropoff — the customer only ever picks
  // the pickup moment, return follows automatically.
  period: RentalPeriod;
  onConfirm: (pickupAt: Date, returnAt: Date) => void;
  onClose: () => void;
}

function isFixedSpanPeriod(period: RentalPeriod): period is 'weekly' | 'monthly' {
  return period === 'weekly' || period === 'monthly';
}

const SHEET_HEIGHT = Math.round(Dimensions.get('window').height * 0.62);

// The two moments (استلام / تسليم) are joined by one dashed line with a
// live day-count pill at its center — pickup always precedes return, so the
// connector is real sequence information, not a decorative divider.
export function DateRangePickerSheet({ visible, pickupAt, returnAt, period, onConfirm, onClose }: Props) {
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);
  const [draftPickup, setDraftPickup] = useState(pickupAt);
  const [draftReturn, setDraftReturn] = useState(returnAt);
  const fixedSpan = isFixedSpanPeriod(period);

  useEffect(() => {
    if (visible) {
      setDraftPickup(pickupAt);
      setDraftReturn(returnAt);
      setMounted(true);
      translateY.value = withSpring(0, { damping: 22, stiffness: 220 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else if (mounted) {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 180 });
      backdropOpacity.value = withTiming(0, { duration: 180 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  if (!mounted) return null;

  function applyPickupChange(next: Date) {
    setDraftPickup(next);
    if (fixedSpan) {
      setDraftReturn(computeAutoReturn(next, period as 'weekly' | 'monthly'));
      return;
    }
    if (next.getTime() >= draftReturn.getTime()) {
      // Riyadh observes no DST, so a plain +24h is exact.
      setDraftReturn(new Date(next.getTime() + 86400000));
    }
  }

  // DateTimeField/TimeChipPicker already resolve their picks against Riyadh
  // wall-clock time and hand back a fully-formed instant — no local merging needed.
  function handlePickupDateChange(date: Date) {
    applyPickupChange(date);
  }

  function handleReturnDateChange(date: Date) {
    if (date.getTime() <= draftPickup.getTime()) {
      setDraftReturn(new Date(draftPickup.getTime() + 86400000));
      return;
    }
    setDraftReturn(date);
  }

  const days = daysBetween(draftPickup, draftReturn);

  return (
    <Modal transparent visible statusBarTranslucent onRequestClose={onClose} animationType="none">
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>مدة الإيجار</Text>
              <Text style={styles.title}>متى تحتاج السيارة؟</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: pressedOpacity }]}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={colors.faint3} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.momentCard}>
              <View style={styles.momentDot} />
              <View style={styles.momentContent}>
                <Text style={styles.momentLabel}>الاستلام</Text>
                <View style={styles.fieldsRow}>
                  <DateTimeField value={draftPickup} minimumDate={new Date()} onChange={handlePickupDateChange} />
                  <View style={styles.fieldDivider} />
                  <TimeChipPicker value={draftPickup} onChange={applyPickupChange} />
                </View>
              </View>
            </View>

            <View style={styles.connectorRow}>
              <View style={styles.connectorLine} />
              <View style={styles.durationPill}>
                <Text style={styles.durationText}>{formatDaysAr(days)}</Text>
              </View>
              <View style={styles.connectorLine} />
            </View>

            <View style={styles.momentCard}>
              <View style={[styles.momentDot, styles.momentDotEnd]} />
              <View style={styles.momentContent}>
                <View style={styles.returnLabelRow}>
                  <Text style={styles.momentLabel}>التسليم</Text>
                  {fixedSpan && (
                    <View style={styles.lockedPill}>
                      <Ionicons name="lock-closed" size={9} color={colors.goldText} />
                      <Text style={styles.lockedPillText}>يُحسب تلقائياً</Text>
                    </View>
                  )}
                </View>
                {fixedSpan ? (
                  <View style={styles.fieldsRow}>
                    <Text style={styles.lockedValue}>{formatArabicDate(draftReturn)}</Text>
                    <View style={styles.fieldDivider} />
                    <Text style={styles.lockedValue}>{formatArabicTime(draftReturn)}</Text>
                  </View>
                ) : (
                  <View style={styles.fieldsRow}>
                    <DateTimeField
                      value={draftReturn}
                      minimumDate={new Date(draftPickup.getTime() + 86400000)}
                      onChange={handleReturnDateChange}
                    />
                    <View style={styles.fieldDivider} />
                    <TimeChipPicker value={draftReturn} onChange={setDraftReturn} />
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Button label="تأكيد المواعيد" onPress={() => onConfirm(draftPickup, draftReturn)} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,20,28,0.45)' },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  handle: { width: 44, height: 4, borderRadius: 99, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 14 },
  header: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  eyebrow: { fontSize: 10, fontFamily: fontFamily.black, letterSpacing: 1, color: colors.goldText, textAlign: textAlignStart },
  title: { marginTop: 3, fontSize: 17, fontFamily: fontFamily.black, color: colors.ink, textAlign: textAlignStart },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 20, paddingTop: 18 },
  momentCard: {
    flexDirection: rowDir,
    alignItems: 'flex-start',
    gap: 12,
  },
  momentDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: colors.gold,
    marginTop: 4,
  },
  momentDotEnd: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.goldLine,
  },
  momentContent: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
  },
  momentLabel: { fontSize: 10.5, fontFamily: fontFamily.extraBold, color: colors.faint2, textAlign: textAlignStart },
  returnLabelRow: { flexDirection: rowDir, alignItems: 'center', justifyContent: 'space-between' },
  lockedPill: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(196,155,72,0.14)',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lockedPillText: { fontSize: 9.5, fontFamily: fontFamily.extraBold, color: colors.goldText },
  lockedValue: { fontSize: 14, fontFamily: fontFamily.extraBold, color: colors.ink, opacity: 0.75 },
  fieldsRow: { flexDirection: rowDir, alignItems: 'flex-start', marginTop: 6 },
  fieldDivider: { width: 1, height: 18, backgroundColor: colors.borderFaint, marginHorizontal: 14, marginTop: 3 },
  connectorRow: { flexDirection: 'column', alignItems: 'center', marginStart: 4, paddingVertical: 4 },
  connectorLine: { width: 1.5, height: 14, backgroundColor: colors.borderStrong, borderStyle: 'dashed' },
  durationPill: {
    backgroundColor: colors.petrol,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginVertical: 4,
  },
  durationText: { fontSize: 11.5, fontFamily: fontFamily.extraBold, color: colors.white },
  footer: { padding: 20, paddingTop: 18 },
});
