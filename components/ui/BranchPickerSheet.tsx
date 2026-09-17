import React, { useEffect } from 'react';
import { View, Text, Modal, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

import { colors, fontFamily, pressedOpacity, radii, rowDir, textAlignStart } from '@/constants/theme';
import { isBranchOpenNow } from '@/lib/branch-hours';
import type { ApiBranch, ApiCityBranches } from '@/lib/api';

interface Props {
  visible: boolean;
  cities: ApiCityBranches[];
  onSelect: (city: ApiCityBranches, branch: ApiBranch) => void;
  onClose: () => void;
}

const SHEET_MAX_HEIGHT = Math.round(Dimensions.get('window').height * 0.78);

// Each city is a stop marked with a filled gold dot; every branch beneath it
// carries a thin gold tick on its leading edge — the same "راحة في كل
// كيلومتر" idea already on the home screen, made literal: picking a branch
// reads like picking a stop along a route across the Kingdom, not scrolling
// a flat OS list.
export function BranchPickerSheet({ visible, cities, onSelect, onClose }: Props) {
  const translateY = useSharedValue(SHEET_MAX_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const [mounted, setMounted] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withSpring(0, { damping: 22, stiffness: 220 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else if (mounted) {
      translateY.value = withTiming(SHEET_MAX_HEIGHT, { duration: 180 });
      backdropOpacity.value = withTiming(0, { duration: 180 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  if (!mounted) return null;

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
              <Text style={styles.eyebrow}>موقع الاستلام</Text>
              <Text style={styles.title}>اختر فرعك على الخريطة</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: pressedOpacity }]}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={colors.faint3} />
            </Pressable>
          </View>

          <ScrollView
            style={{ maxHeight: SHEET_MAX_HEIGHT - 90 }}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {cities.length === 0 ? (
              <Text style={styles.emptyText}>لا توجد فروع متاحة حالياً.</Text>
            ) : (
              cities.map((city, cityIndex) => (
                <View key={city.id} style={cityIndex > 0 && styles.citySpacing}>
                  <View style={styles.cityHeaderRow}>
                    <View style={styles.cityDot} />
                    <Text style={styles.cityName}>{city.name}</Text>
                    <Text style={styles.cityCount}>
                      {city.branches.length} {city.branches.length === 1 ? 'فرع' : 'فروع'}
                    </Text>
                  </View>

                  <View style={styles.branchList}>
                    {city.branches.map((branch, i) => {
                      const open = isBranchOpenNow(branch.openingHours);
                      return (
                        <Pressable
                          key={branch.id}
                          style={({ pressed }) => [
                            styles.branchRow,
                            i === city.branches.length - 1 && styles.branchRowLast,
                            pressed && { opacity: pressedOpacity },
                          ]}
                          onPress={() => onSelect(city, branch)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.branchName}>{branch.name}</Text>
                            {branch.address ? (
                              <Text style={styles.branchAddress} numberOfLines={1}>
                                {branch.address}
                              </Text>
                            ) : null}
                          </View>
                          {open != null && (
                            <View style={[styles.statusPill, open ? styles.statusOpen : styles.statusClosed]}>
                              <View style={[styles.statusDot, { backgroundColor: open ? colors.success : colors.faint2 }]} />
                              <Text style={[styles.statusText, { color: open ? colors.success : colors.faint2 }]}>
                                {open ? 'مفتوح الآن' : 'مغلق الآن'}
                              </Text>
                            </View>
                          )}
                          <Ionicons name="chevron-back" size={14} color={colors.goldLine} />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
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
    paddingBottom: 22,
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
  body: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  citySpacing: { marginTop: 22 },
  cityHeaderRow: { flexDirection: rowDir, alignItems: 'center', gap: 8, marginBottom: 10 },
  cityDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: colors.gold },
  cityName: { fontSize: 13.5, fontFamily: fontFamily.extraBold, color: colors.ink },
  cityCount: { flex: 1, fontSize: 10.5, fontFamily: fontFamily.bold, color: colors.faint2, textAlign: 'left' },
  branchList: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  branchRow: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
    borderStartWidth: 3,
    borderStartColor: colors.goldLine,
  },
  branchRowLast: { borderBottomWidth: 0 },
  branchName: { fontSize: 13, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart },
  branchAddress: { marginTop: 1, fontSize: 10.5, fontFamily: fontFamily.medium, color: colors.faint2, textAlign: textAlignStart },
  statusPill: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusOpen: { backgroundColor: colors.successBg },
  statusClosed: { backgroundColor: colors.borderFaint },
  statusDot: { width: 5, height: 5, borderRadius: 99 },
  statusText: { fontSize: 9.5, fontFamily: fontFamily.extraBold },
  emptyText: { fontSize: 12.5, fontFamily: fontFamily.bold, color: colors.faint2, textAlign: 'center', paddingVertical: 20 },
});
