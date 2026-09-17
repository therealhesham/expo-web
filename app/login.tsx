import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, fontFamily, pressedOpacity, radii, rowDir, textAlignStart } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useAuth, ApiAuthError } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const digits = phone.replace(/\D/g, '');
  const valid = /^5\d{8}$/.test(digits);

  async function handleSubmit() {
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    try {
      await sendOtp(digits);
      router.push({ pathname: '/login-otp', params: { phone: digits } });
    } catch (e) {
      setError(e instanceof ApiAuthError ? e.message : 'تعذّر إرسال رمز التحقق. حاول لاحقاً.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.topSafe}>
        <Pressable
          style={({ pressed }) => [styles.backRow, pressed && { opacity: pressedOpacity }]}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="chevron-forward" size={16} color={colors.faint2} />
          <Text style={styles.backText}>رجوع</Text>
        </Pressable>
      </SafeAreaView>

      <View style={styles.body}>
        <View style={styles.shieldBadge}>
          <Ionicons name="person-outline" size={24} color={colors.gold} />
        </View>
        <Text style={styles.title}>تسجيل الدخول</Text>
        <Text style={styles.subtitle}>أدخل رقم جوالك وسنرسل لك رمز تحقق عبر واتساب.</Text>

        <View style={[styles.phoneField, error && styles.phoneFieldError]}>
          <Text style={styles.countryCode}>+966</Text>
          <View style={styles.phoneDivider} />
          <TextInput
            value={phone}
            onChangeText={(v) => {
              setPhone(v.replace(/\D/g, '').slice(0, 9));
              setError(null);
            }}
            keyboardType="number-pad"
            maxLength={9}
            placeholder="5XXXXXXXX"
            placeholderTextColor={colors.faint2}
            style={styles.phoneInput}
            textAlign={textAlignStart}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button label="إرسال رمز التحقق" disabled={!valid} loading={loading} onPress={handleSubmit} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  topSafe: { backgroundColor: colors.cream },
  backRow: { flexDirection: rowDir, alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6 },
  backText: { fontSize: 12.5, fontFamily: fontFamily.extraBold, color: colors.faint2 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 26 },
  shieldBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: 18, fontSize: 26, fontFamily: fontFamily.black, color: colors.ink, textAlign: textAlignStart },
  subtitle: {
    marginTop: 8,
    fontSize: 13.5,
    fontFamily: fontFamily.medium,
    color: colors.brownText,
    lineHeight: 22,
    textAlign: textAlignStart,
  },
  phoneField: {
    flexDirection: rowDir,
    alignItems: 'center',
    marginTop: 26,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    height: 56,
  },
  phoneFieldError: { borderColor: colors.danger },
  countryCode: { fontSize: 15, fontFamily: fontFamily.extraBold, color: colors.ink },
  phoneDivider: { width: 1, height: 22, backgroundColor: colors.borderStrong, marginHorizontal: 12 },
  phoneInput: { flex: 1, fontSize: 15, fontFamily: fontFamily.extraBold, color: colors.ink, height: '100%' },
  errorText: { marginTop: 8, fontSize: 12, fontFamily: fontFamily.bold, color: colors.danger, textAlign: textAlignStart },
  footer: { padding: 16, gap: 10 },
});
