import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

import { colors, fontFamily } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'الصفحة غير موجودة' }} />
      <View style={styles.container}>
        <Text style={styles.title}>هذه الصفحة غير موجودة.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>العودة إلى الرئيسية</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.cream,
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamily.extraBold,
    color: colors.ink,
  },
  link: {
    marginTop: 16,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.goldText,
  },
});
