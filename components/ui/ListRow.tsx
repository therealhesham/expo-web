import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontFamily, pressedOpacity, rowDir, textAlignStart } from '@/constants/theme';

interface Props {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  trailing?: string;
  onPress?: () => void;
  isLast?: boolean;
  danger?: boolean;
}

export function ListRow({
  icon,
  iconBg = '#f1ece1',
  iconColor = colors.goldTextDim,
  title,
  subtitle,
  trailing,
  onPress,
  isLast = false,
  danger = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && onPress && { opacity: pressedOpacity }]}
    >
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, danger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {trailing && <Text style={styles.trailing}>{trailing}</Text>}
      {onPress && (
        <Ionicons name="chevron-back" size={14} color={colors.faint2} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13.5,
    fontFamily: fontFamily.bold,
    color: colors.ink,
    textAlign: textAlignStart,
  },
  dangerText: { color: colors.danger },
  subtitle: {
    marginTop: 1,
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: colors.faint2,
    textAlign: textAlignStart,
  },
  trailing: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.faint2,
  },
});
