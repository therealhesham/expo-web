import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, fontFamily, pressedOpacity, rowDir, textAlignStart } from '@/constants/theme';

interface Props {
  title: string;
  trailing?: string;
  step?: number; // 1-indexed, renders `totalSteps` segments with the first `step` filled
  totalSteps?: number;
  onBack?: () => void;
}

export function FlowHeader({ title, trailing, step, totalSteps = 4, onBack }: Props) {
  const router = useRouter();
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: pressedOpacity }]}
          onPress={onBack ?? (() => router.back())}
          hitSlop={10}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        {trailing && <Text style={styles.trailing}>{trailing}</Text>}
      </View>
      {step !== undefined && (
        <View style={styles.progressTrack}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.segment, i < step && styles.segmentFilled]} />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  backBtn: {
    width: 24,
    alignItems: 'center',
  },
  title: { flex: 1, fontSize: 17, fontFamily: fontFamily.black, color: colors.ink, textAlign: textAlignStart },
  trailing: { fontSize: 11, fontFamily: fontFamily.extraBold, color: colors.faint2 },
  progressTrack: {
    flexDirection: rowDir,
    gap: 5,
    paddingHorizontal: 16,
    paddingBottom: 11,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 9,
    backgroundColor: colors.borderSoft,
  },
  segmentFilled: {
    backgroundColor: colors.petrol,
  },
});
