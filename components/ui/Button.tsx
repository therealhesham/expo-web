import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontFamily, radii, rowDir } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'end',
  loading = false,
  disabled = false,
  style,
  fullWidth = true,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'dark' && styles.dark,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        fullWidth && { alignSelf: 'stretch' },
        isDisabled && styles.disabled,
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.ink : colors.white} />
        ) : (
          <>
            {icon && iconPosition === 'start' && (
              <Ionicons name={icon} size={18} color={iconColor(variant)} />
            )}
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                variant === 'secondary' && styles.labelSecondary,
                variant === 'ghost' && styles.labelGhost,
              ]}
            >
              {label}
            </Text>
            {icon && iconPosition === 'end' && (
              <Ionicons name={icon} size={18} color={iconColor(variant)} />
            )}
          </>
        )}
      </View>
    </Pressable>
  );
}

function iconColor(variant: Variant) {
  if (variant === 'secondary' || variant === 'ghost') return colors.ink;
  return colors.gold;
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  primary: {
    backgroundColor: colors.petrol,
    shadowColor: colors.petrol,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  dark: {
    backgroundColor: colors.black,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 15.5,
    color: colors.white,
  },
  labelSecondary: {
    color: colors.faint3,
  },
  labelGhost: {
    color: colors.ink,
  },
});
