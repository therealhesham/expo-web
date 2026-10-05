import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { colors, fontFamily, pressedOpacity, rowDir, textAlignStart } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useAuth, ApiAuthError } from '@/context/AuthContext';

const CODE_LENGTH = 4;

export default function LoginOtpScreen() {
  const router = useRouter();
  const { phone: phoneParam } = useLocalSearchParams<{ phone: string }>();
  const phone = String(phoneParam ?? '');
  const { sendOtp, verifyOtp } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const maskedPhone = phone.length === 9 ? `+966 ${phone.slice(0, 2)} ••• ${phone.slice(-2)}` : phone;

  async function handleVerify(fullCode: string) {
    if (fullCode.length < CODE_LENGTH || loading) return;
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(phone, fullCode);
      router.replace('/(tabs)/account');
    } catch (e) {
      setError(e instanceof ApiAuthError ? e.message : 'تعذّر التحقق من الرمز. حاول لاحقاً.');
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError(null);
    try {
      await sendOtp(phone);
      setResendCooldown(45);
    } catch (e) {
      setError(e instanceof ApiAuthError ? e.message : 'تعذّر إعادة إرسال الرمز.');
      if (e instanceof ApiAuthError && e.retryAfterSec) setResendCooldown(e.retryAfterSec);
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
          <Text style={styles.backText}>تغيير الرقم</Text>
        </Pressable>
      </SafeAreaView>

      <View style={styles.body}>
        <View style={styles.shieldBadge}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.gold} />
        </View>
        <Text style={styles.title}>أدخل رمز التحقق</Text>
        <Text style={styles.subtitle}>
          أرسلنا رمزاً من {CODE_LENGTH} أرقام عبر واتساب إلى{'\n'}
          <Text style={styles.phone}>{maskedPhone}</Text>
        </Text>

        <Pressable style={styles.codeRow} onPress={() => inputRef.current?.focus()}>
          {Array.from({ length: CODE_LENGTH }).map((_, i) => {
            const filled = i < code.length;
            const isCursor = i === code.length;
            return (
              <View key={i} style={[styles.codeBox, (filled || isCursor) && styles.codeBoxActive, error && styles.codeBoxError]}>
                {filled ? (
                  <Text style={styles.codeDigit}>{code[i]}</Text>
                ) : isCursor ? (
                  <View style={styles.caret} />
                ) : null}
              </View>
            );
          })}
        </Pressable>
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(v) => {
            const next = v.replace(/\D/g, '').slice(0, CODE_LENGTH);
            setCode(next);
            setError(null);
            if (next.length === CODE_LENGTH) handleVerify(next);
          }}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          style={styles.hiddenInput}
          autoFocus
          textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : undefined}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.resendRow}>
          <Text style={styles.resendHint}>لم يصلك الرمز؟</Text>
          {resendCooldown > 0 ? (
            <Text style={styles.resendTimer}>إعادة الإرسال بعد {resendCooldown} ثانية</Text>
          ) : (
            <Pressable onPress={handleResend} style={({ pressed }) => pressed && { opacity: pressedOpacity }}>
              <Text style={styles.resendLink}>إعادة إرسال الرمز</Text>
            </Pressable>
          )}
        </View>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button label="تأكيد" loading={loading} disabled={code.length < CODE_LENGTH} onPress={() => handleVerify(code)} />
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
  subtitle: { marginTop: 8, fontSize: 13.5, fontFamily: fontFamily.medium, color: colors.brownText, lineHeight: 24, textAlign: textAlignStart },
  phone: { fontFamily: fontFamily.extraBold, color: colors.ink },
  codeRow: { flexDirection: 'row', gap: 11, marginTop: 26 },
  codeBox: {
    flex: 1,
    aspectRatio: 1 / 1.15,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: { borderColor: colors.petrol },
  codeBoxError: { borderColor: colors.danger },
  codeDigit: { fontSize: 26, fontFamily: fontFamily.black, color: colors.ink },
  caret: { width: 2, height: 24, backgroundColor: colors.petrol },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  errorText: { marginTop: 12, fontSize: 12.5, fontFamily: fontFamily.bold, color: colors.danger, textAlign: textAlignStart },
  resendRow: { flexDirection: rowDir, alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  resendHint: { fontSize: 12.5, fontFamily: fontFamily.bold, color: colors.faint2 },
  resendTimer: { fontSize: 12.5, fontFamily: fontFamily.extraBold, color: '#c9c1b3' },
  resendLink: { fontSize: 12.5, fontFamily: fontFamily.extraBold, color: colors.goldText },
  footer: { padding: 16, gap: 10 },
});
