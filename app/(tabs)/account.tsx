import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, fontFamily, pressedOpacity, radii, rowDir, textAlignStart } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { useAuth } from '@/context/AuthContext';

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const displayName = user?.name?.trim() || (user ? 'بلا اسم' : null);
  const initials = displayName?.[0] ?? 'ر';

  function goOrLogin(path: '/profile' | '/coupons' | '/notification-preferences') {
    router.push(user ? path : '/login');
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <Text style={styles.title}>حسابي</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {user ? (
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.phone}>{user.phone ?? user.email}</Text>
            </View>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.loginPrompt, pressed && { opacity: pressedOpacity }]}
            onPress={() => router.push('/login')}
          >
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={22} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>سجّل الدخول</Text>
              <Text style={styles.phone}>برقم جوالك عبر رمز تحقق واتساب</Text>
            </View>
            <Ionicons name="chevron-back" size={16} color={colors.goldLine} />
          </Pressable>
        )}

        <Text style={styles.sectionLabel}>الحجوزات والمحفظة</Text>
        <Card>
          <ListRow
            icon="calendar-outline"
            title="حجوزاتي"
            subtitle="عرض الحجوزات الحالية والسابقة"
            onPress={() => router.push('/(tabs)/bookings')}
          />
          <ListRow icon="card-outline" title="وسائل الدفع المحفوظة" subtitle="مدى، فيزا، تابي" />
          <ListRow icon="pricetag-outline" title="أكواد الخصم" onPress={() => goOrLogin('/coupons')} isLast />
        </Card>

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>الإعدادات</Text>
        <Card>
          <ListRow icon="person-outline" title="بياناتي الشخصية" onPress={() => goOrLogin('/profile')} />
          <ListRow icon="document-text-outline" title="الهوية والرخصة" subtitle="محدثة" />
          <ListRow icon="language-outline" title="اللغة" trailing="العربية" />
          <ListRow
            icon="notifications-outline"
            title="الإشعارات"
            onPress={() => goOrLogin('/notification-preferences')}
            isLast
          />
        </Card>

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>الدعم</Text>
        <Card>
          <ListRow icon="help-circle-outline" title="مركز المساعدة" />
          <ListRow icon="call-outline" title="تواصل معنا" />
          <ListRow icon="document-outline" title="الشروط والأحكام" isLast />
        </Card>

        {user && (
          <Card style={{ marginTop: 20 }}>
            <ListRow
              icon="log-out-outline"
              iconBg={colors.dangerBg}
              iconColor={colors.danger}
              title="تسجيل الخروج"
              danger
              isLast
              onPress={logout}
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  headerSafe: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 19, fontFamily: fontFamily.black, color: colors.ink, textAlign: textAlignStart, padding: 16 },
  content: { padding: 16, paddingBottom: 40 },
  profileRow: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
  },
  loginPrompt: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.petrol,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontFamily: fontFamily.extraBold, color: colors.gold },
  name: { fontSize: 15.5, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart },
  phone: { marginTop: 2, fontSize: 12, fontFamily: fontFamily.medium, color: colors.faint2, textAlign: textAlignStart },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fontFamily.black,
    letterSpacing: 1,
    color: colors.goldText,
    marginBottom: 8,
    textAlign: textAlignStart,
  },
});
