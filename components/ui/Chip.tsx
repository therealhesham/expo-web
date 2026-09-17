import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontFamily, pressedOpacity, radii, rowDir } from '@/constants/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  variant?: 'default' | 'dark';
}

export function Chip({ label, active = false, onPress, icon, variant = 'default' }: Props) {
  const isDark = variant === 'dark' || active;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isDark ? styles.active : styles.inactive,
        pressed && { opacity: pressedOpacity },
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={13}
          color={isDark ? colors.gold : colors.faint3}
          style={{ marginStart: 2 }}
        />
      )}
      <Text style={[styles.label, isDark ? styles.labelActive : styles.labelInactive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: radii.pill,
  },
  active: {
    backgroundColor: colors.petrol,
  },
  inactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
  },
  labelActive: {
    color: colors.white,
  },
  labelInactive: {
    color: colors.faint3,
  },
});
