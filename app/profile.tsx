import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, fontFamily, pressedOpacity, radii, rowDir, textAlignStart } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { updateProfile, ApiAuthError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email.endsWith('@phone.rawaes.app') ? '' : user?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSave() {
    if (!token || saving || !emailValid) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfile(token, {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
      });
      setUser(updated);
      Alert.alert('تم الحفظ', 'اتحدّثت بياناتك بنجاح.');
      router.back();
    } catch (e) {
      setError(e instanceof ApiAuthError ? e.message : 'تعذّر حفظ البيانات. حاول لاحقاً.');
    } finally {
      setSaving(false);
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
        <Text style={styles.title}>بياناتي الشخصية</Text>
        <Text style={styles.subtitle}>عدّل اسمك وبريدك الإلكتروني — رقم جوالك موثّق ولا يمكن تغييره من هنا.</Text>

        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>الاسم الكامل</Text>
          <TextInput
            style={styles.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="اسمك الكامل"
            placeholderTextColor={colors.faint2}
          />
        </View>

        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>البريد الإلكتروني</Text>
          <TextInput
            style={styles.fieldInput}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError(null);
            }}
            placeholder="example@email.com"
            placeholderTextColor={colors.faint2}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.fieldCard, styles.readOnlyCard]}>
          <Text style={styles.fieldLabel}>رقم الجوال</Text>
          <View style={styles.readOnlyRow}>
            <Text style={[styles.fieldInput, styles.readOnlyText]}>{user?.phone ?? '—'}</Text>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button label="حفظ التعديلات" onPress={handleSave} loading={saving} disabled={!emailValid} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  topSafe: { backgroundColor: colors.cream },
  backRow: { flexDirection: rowDir, alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6 },
  backText: { fontSize: 12.5, fontFamily: fontFamily.extraBold, color: colors.faint2 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 26, gap: 12 },
  title: { fontSize: 24, fontFamily: fontFamily.black, color: colors.ink, textAlign: textAlignStart },
  subtitle: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.brownText,
    lineHeight: 21,
    textAlign: textAlignStart,
  },
  fieldCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 13,
  },
  readOnlyCard: { backgroundColor: colors.sandLight },
  fieldLabel: { fontSize: 11, fontFamily: fontFamily.extraBold, color: colors.faint2, textAlign: textAlignStart },
  fieldInput: {
    marginTop: 5,
    fontSize: 15,
    fontFamily: fontFamily.extraBold,
    color: colors.ink,
    textAlign: textAlignStart,
    padding: 0,
  },
  readOnlyRow: { flexDirection: rowDir, alignItems: 'center', justifyContent: 'space-between' },
  readOnlyText: { marginTop: 5, opacity: 0.75 },
  errorText: { fontSize: 12, fontFamily: fontFamily.bold, color: colors.danger, textAlign: textAlignStart },
  footer: { padding: 16, gap: 10 },
});
