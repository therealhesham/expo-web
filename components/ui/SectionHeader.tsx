import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { colors, fontFamily, pressedOpacity, rowDir, textAlignStart } from '@/constants/theme';

interface Props {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({ title, actionLabel, onActionPress }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && (
        <Pressable onPress={onActionPress} hitSlop={8} style={({ pressed }) => pressed && { opacity: pressedOpacity }}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: rowDir,
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamily.black,
    color: colors.ink,
    textAlign: textAlignStart,
  },
  action: {
    fontSize: 12,
    fontFamily: fontFamily.extraBold,
    color: colors.goldText,
  },
});
