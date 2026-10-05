import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, fontFamily, pressedOpacity, radii, rowDir, textAlignStart } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { fetchNotificationPreferences, updateNotificationPreferences, type ApiNotificationPreferences } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [prefs, setPrefs] = useState<ApiNotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchNotificationPreferences(token)
      .then(setPrefs)
      .catch(() => setPrefs({ bookingUpdates: true, promotions: false }));
  }, [token]);

  async function toggle(key: keyof ApiNotificationPreferences) {
    if (!token || !prefs || saving) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(true);
    try {
      await updateNotificationPreferences(token, { [key]: next[key] });
    } catch {
      setPrefs(prefs);
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
        <Text style={styles.title}>الإشعارات</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>اختر القنوات اللي تحب تستقبل بيها إشعارات — التحديثات بتوصل عبر واتساب أو البريد حسب بياناتك.</Text>

        {prefs === null ? (
          <ActivityIndicator color={colors.petrol} style={{ marginTop: 20 }} />
        ) : (
          <Card>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>تحديثات الحجز</Text>
                <Text style={styles.rowSub}>تأكيد الحجز، حالة الدفع، تذكير الاستلام والتسليم</Text>
              </View>
              <Switch
                value={prefs.bookingUpdates}
                onValueChange={() => toggle('bookingUpdates')}
                trackColor={{ true: colors.petrol, false: colors.border }}
                thumbColor={colors.white}
              />
            </View>
            <View style={[styles.row, styles.rowLast]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>العروض والتخفيضات</Text>
                <Text style={styles.rowSub}>أكواد خصم وعروض موسمية</Text>
              </View>
              <Switch
                value={prefs.promotions}
                onValueChange={() => toggle('promotions')}
                trackColor={{ true: colors.petrol, false: colors.border }}
                thumbColor={colors.white}
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  topSafe: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  backRow: { flexDirection: rowDir, alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6 },
  backText: { fontSize: 12.5, fontFamily: fontFamily.extraBold, color: colors.faint2 },
  title: { fontSize: 19, fontFamily: fontFamily.black, color: colors.ink, textAlign: textAlignStart, padding: 16, paddingTop: 8 },
  content: { padding: 16, paddingBottom: 40 },
  hint: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.faint2,
    lineHeight: 19,
    textAlign: textAlignStart,
    marginBottom: 14,
  },
  row: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  rowLast: { borderBottomWidth: 0 },
  rowTitle: { fontSize: 13.5, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart },
  rowSub: { marginTop: 2, fontSize: 11, fontFamily: fontFamily.medium, color: colors.faint2, textAlign: textAlignStart },
});
