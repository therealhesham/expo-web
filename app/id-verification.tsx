import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { colors, fontFamily, pressedOpacity, radii, rowDir, textAlignStart } from '@/constants/theme';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Button } from '@/components/ui/Button';
import {
  detectIdKindFromNationalId,
  validateLicenseNumber,
  validateNationalId,
  validatePassport,
} from '@/lib/kyc-validation';
import { uploadKycImage } from '@/lib/api';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/context/AuthContext';
import { LicenseExpiryPicker } from '@/components/ui/LicenseExpiryPicker';

const ID_KIND_LABEL: Record<'citizen' | 'resident', string> = {
  citizen: 'مواطن',
  resident: 'مقيم',
};

export default function IdVerificationScreen() {
  const router = useRouter();
  const { kyc, setKyc } = useBooking();
  const { user, token } = useAuth();
  const [segment, setSegment] = useState<'idCard' | 'visitor'>(kyc.idKind === 'visitor' ? 'visitor' : 'idCard');
  const [uploading, setUploading] = useState<{ id: boolean; license: boolean }>({ id: false, license: false });

  // A returning customer's KYC from a previous booking lives on their account
  // — prefill from it once instead of making them re-upload every time.
  useEffect(() => {
    if (!user?.kyc || kyc.nationalIdNumber || kyc.passportNumber || kyc.licenseNumber) return;
    const saved = user.kyc;
    if (!saved.licenseNumber && !saved.nationalIdNumber && !saved.passportNumber) return;
    setKyc({
      idKind: saved.idKind ?? 'citizen',
      nationalIdNumber: saved.nationalIdNumber ?? '',
      passportNumber: saved.passportNumber ?? '',
      licenseNumber: saved.licenseNumber ?? '',
      licenseExpiryIso: saved.licenseExpiryIso ?? '',
      idImageUri: saved.idImageUri,
      licenseImageUri: saved.licenseImageUri,
    });
    if (saved.idKind === 'visitor') setSegment('visitor');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  // Once the user types into the license field directly, stop overwriting it
  // from the national ID field — otherwise "licenseNumber || digits" looks
  // like a no-op auto-fill guard, but since licenseNumber becomes non-empty
  // after the ID's very first digit, every digit typed after that is
  // silently dropped by the `||`, freezing the license field at one digit.
  const [licenseEditedManually, setLicenseEditedManually] = useState(false);

  const idKind = segment === 'visitor' ? 'visitor' : detectIdKindFromNationalId(kyc.nationalIdNumber);

  const idValidation = useMemo(
    () => (segment === 'visitor' ? validatePassport(kyc.passportNumber) : validateNationalId(kyc.nationalIdNumber)),
    [segment, kyc.nationalIdNumber, kyc.passportNumber]
  );
  const licenseValidation = useMemo(() => validateLicenseNumber(kyc.licenseNumber), [kyc.licenseNumber]);
  const expiryValid = !!kyc.licenseExpiryIso;

  const idInputHasValue = segment === 'visitor' ? kyc.passportNumber.length > 0 : kyc.nationalIdNumber.length > 0;
  const readyToContinue =
    idValidation.valid &&
    licenseValidation.valid &&
    expiryValid &&
    !!kyc.idImageUri &&
    !!kyc.licenseImageUri;

  async function pickImage(source: 'camera' | 'library', target: 'id' | 'license') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await (source === 'camera'
      ? ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
      : ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 }));

    if (result.canceled || !result.assets[0] || !token) return;
    const localUri = result.assets[0].uri;

    setUploading((prev) => ({ ...prev, [target]: true }));
    try {
      const remoteUrl = await uploadKycImage(localUri, token);
      setKyc(target === 'id' ? { idImageUri: remoteUrl } : { licenseImageUri: remoteUrl });
    } catch {
      Alert.alert('تعذّر رفع الصورة', 'تأكد من اتصالك بالسيرفر وحاول مرة أخرى.');
    } finally {
      setUploading((prev) => ({ ...prev, [target]: false }));
    }
  }

  function onNationalIdChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setKyc({ nationalIdNumber: digits, ...(licenseEditedManually ? {} : { licenseNumber: digits }) });
  }

  function onLicenseNumberChange(text: string) {
    setLicenseEditedManually(true);
    setKyc({ licenseNumber: text.replace(/\D/g, '').slice(0, 10) });
  }

  function continueToCheckout() {
    setKyc({ idKind: segment === 'visitor' ? 'visitor' : idKind ?? 'citizen' });
    router.push('/checkout');
  }

  return (
    <View style={styles.screen}>
      <FlowHeader title="الهوية والرخصة" trailing="١ من ٣" step={1} totalSteps={3} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.segmentWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.segment,
              segment === 'idCard' && styles.segmentActive,
              pressed && { opacity: pressedOpacity },
            ]}
            onPress={() => setSegment('idCard')}
          >
            <Text style={[styles.segmentText, segment === 'idCard' && styles.segmentTextActive]}>مواطن / مقيم</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.segment,
              segment === 'visitor' && styles.segmentActive,
              pressed && { opacity: pressedOpacity },
            ]}
            onPress={() => setSegment('visitor')}
          >
            <Text style={[styles.segmentText, segment === 'visitor' && styles.segmentTextActive]}>زائر</Text>
          </Pressable>
        </View>

        {segment === 'idCard' ? (
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>الهوية الوطنية أو الإقامة</Text>
            <View style={styles.fieldValueRow}>
              <TextInput
                style={styles.fieldInput}
                value={kyc.nationalIdNumber}
                onChangeText={onNationalIdChange}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="١٠٨٤٧٣٦٢١٩"
                placeholderTextColor={colors.faint2}
              />
              {idValidation.valid && <Ionicons name="checkmark" size={17} color={colors.success} />}
            </View>
            <Text style={idValidation.valid ? styles.fieldHintGood : styles.fieldHint}>
              {idInputHasValue && !idValidation.valid
                ? idValidation.error
                : idKind
                  ? `تم التعرّف عليها كـ ${ID_KIND_LABEL[idKind as 'citizen' | 'resident']}`
                  : '١٠ أرقام · يبدأ بـ ١ للمواطن أو ٢ للمقيم'}
            </Text>
          </View>
        ) : (
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>رقم الجواز</Text>
            <View style={styles.fieldValueRow}>
              <TextInput
                style={styles.fieldInput}
                value={kyc.passportNumber}
                onChangeText={(t) => setKyc({ passportNumber: t.toUpperCase() })}
                autoCapitalize="characters"
                maxLength={24}
                placeholder="A12345678"
                placeholderTextColor={colors.faint2}
              />
              {idValidation.valid && <Ionicons name="checkmark" size={17} color={colors.success} />}
            </View>
            <Text style={idValidation.valid ? styles.fieldHintGood : styles.fieldHint}>
              {kyc.passportNumber.length > 0 && !idValidation.valid ? idValidation.error : '٦–٢٤ حرفاً/رقماً إنجليزياً'}
            </Text>
          </View>
        )}

        <View style={styles.twoCol}>
          <View style={[styles.fieldCard, { flex: 1.3 }]}>
            <Text style={styles.fieldLabel}>رقم رخصة القيادة</Text>
            <TextInput
              style={styles.fieldInputMed}
              value={kyc.licenseNumber}
              onChangeText={onLicenseNumberChange}
              keyboardType="number-pad"
              maxLength={10}
              placeholder="١٠٨٤٧٣٦٢١٩"
              placeholderTextColor={colors.faint2}
            />
            <Text style={licenseValidation.valid ? styles.fieldHintGood : styles.fieldHintGold}>
              {kyc.licenseNumber.length > 0 && !licenseValidation.valid
                ? licenseValidation.error
                : 'يُملأ تلقائياً من رقم الهوية'}
            </Text>
          </View>
          <View style={[styles.fieldCard, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>انتهاء الرخصة</Text>
            <LicenseExpiryPicker
              valueIso={kyc.licenseExpiryIso}
              onChange={(iso) => setKyc({ licenseExpiryIso: iso })}
            />
            <Text style={expiryValid ? styles.fieldHintGood : styles.fieldHint}>
              {expiryValid ? 'تاريخ صالح' : 'اختر تاريخاً'}
            </Text>
          </View>
        </View>

        <View style={kyc.idImageUri ? styles.uploadedCard : styles.dashedCard}>
          {kyc.idImageUri ? (
            <>
              <Image source={{ uri: kyc.idImageUri }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadedTitle}>صورة الهوية أو الجواز</Text>
                <Text style={styles.uploadedSub}>تم الرفع</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.changeBtn, pressed && { opacity: pressedOpacity }]}
                onPress={() => pickImage('library', 'id')}
                disabled={uploading.id}
              >
                {uploading.id ? (
                  <ActivityIndicator size="small" color={colors.success} />
                ) : (
                  <Text style={styles.changeBtnText}>تغيير</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.uploadedIcon}>
                {uploading.id ? (
                  <ActivityIndicator size="small" color={colors.gold} />
                ) : (
                  <Ionicons name="card" size={17} color={colors.gold} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadedTitle}>صورة الهوية أو الجواز</Text>
                <Text style={styles.dashedHint}>{uploading.id ? 'جاري الرفع…' : 'مطلوبة للمتابعة'}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.changeBtn, pressed && { opacity: pressedOpacity }]}
                onPress={() => pickImage('library', 'id')}
                disabled={uploading.id}
              >
                <Text style={styles.changeBtnText}>رفع</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.dashedCard}>
          <View style={styles.dashedHeader}>
            <Text style={styles.dashedTitle}>صورة رخصة القيادة</Text>
            {!kyc.licenseImageUri && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>إلزامية</Text>
              </View>
            )}
          </View>
          {kyc.licenseImageUri ? (
            <View style={styles.licensePreviewRow}>
              <Image source={{ uri: kyc.licenseImageUri }} style={styles.thumbWide} />
              <Text style={styles.dashedHint}>تم رفع صورة الرخصة بنجاح.</Text>
            </View>
          ) : (
            <Text style={styles.dashedHint}>
              {uploading.license ? 'جاري رفع الصورة…' : 'صوّر الرخصة داخل الإطار أو اختر صورة من الاستوديو.'}
            </Text>
          )}
          <View style={styles.dashedActions}>
            <Button
              label={kyc.licenseImageUri ? 'تم رفع الصورة' : 'التصوير بالكاميرا'}
              icon={kyc.licenseImageUri ? 'checkmark-circle' : 'camera-outline'}
              iconPosition="start"
              onPress={() => pickImage('camera', 'license')}
              disabled={uploading.license}
              loading={uploading.license}
              fullWidth={false}
              style={{ flex: 1, minHeight: 48 }}
            />
            <Pressable
              style={({ pressed }) => [styles.galleryBtn, pressed && { opacity: pressedOpacity }]}
              onPress={() => pickImage('library', 'license')}
              disabled={uploading.license}
            >
              <Text style={styles.galleryBtnText}>من الاستوديو</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.goldTextDim} />
          <Text style={styles.privacyText}>الصور تُخزَّن مشفّرة وتُستخدم لإجراءات التأجير فقط.</Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button label="متابعة" disabled={!readyToContinue} onPress={continueToCheckout} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 16, paddingBottom: 24, gap: 12 },
  segmentWrap: {
    flexDirection: rowDir,
    gap: 6,
    padding: 4,
    backgroundColor: colors.sandLight,
    borderRadius: 14,
  },
  segment: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.card },
  segmentText: { fontSize: 12.5, fontFamily: fontFamily.bold, color: colors.faint3 },
  segmentTextActive: { color: colors.ink, fontFamily: fontFamily.extraBold },
  fieldCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 13,
  },
  fieldLabel: { fontSize: 11, fontFamily: fontFamily.extraBold, color: colors.faint2, textAlign: textAlignStart },
  fieldValueRow: { flexDirection: rowDir, alignItems: 'center', gap: 8, marginTop: 5 },
  fieldInput: {
    flex: 1,
    fontSize: 17,
    fontFamily: fontFamily.extraBold,
    color: colors.ink,
    letterSpacing: 1,
    textAlign: textAlignStart,
    padding: 0,
  },
  fieldInputMed: {
    marginTop: 5,
    fontSize: 15,
    fontFamily: fontFamily.extraBold,
    color: colors.ink,
    textAlign: textAlignStart,
    padding: 0,
  },
  fieldHint: { marginTop: 6, fontSize: 10.5, fontFamily: fontFamily.medium, color: colors.faint2, textAlign: textAlignStart },
  fieldHintGood: { marginTop: 6, fontSize: 10.5, fontFamily: fontFamily.bold, color: colors.success, textAlign: textAlignStart },
  fieldHintGold: { marginTop: 6, fontSize: 10, fontFamily: fontFamily.bold, color: colors.goldText, textAlign: textAlignStart },
  twoCol: { flexDirection: rowDir, gap: 10 },
  uploadedCard: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: colors.successBorder,
    backgroundColor: colors.successBg,
    borderRadius: radii.lg,
    padding: 12,
  },
  thumb: { width: 44, height: 34, borderRadius: 8 },
  thumbWide: { width: 90, height: 56, borderRadius: 8, marginTop: 8 },
  licensePreviewRow: { gap: 4 },
  uploadedIcon: {
    width: 44,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.petrol,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedTitle: { fontSize: 13, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart },
  uploadedSub: { marginTop: 2, fontSize: 11, fontFamily: fontFamily.bold, color: colors.success, textAlign: textAlignStart },
  changeBtn: {
    borderWidth: 1,
    borderColor: colors.successBorder,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  changeBtnText: { fontSize: 11, fontFamily: fontFamily.extraBold, color: colors.success },
  dashedCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.gold,
    backgroundColor: '#fffdf7',
    borderRadius: radii.lg,
    padding: 14,
  },
  dashedHeader: { flexDirection: rowDir, alignItems: 'center', justifyContent: 'space-between' },
  dashedTitle: { fontSize: 13, fontFamily: fontFamily.extraBold, color: colors.ink },
  requiredBadge: { backgroundColor: colors.dangerBg, borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 9 },
  requiredText: { fontSize: 10, fontFamily: fontFamily.extraBold, color: colors.danger },
  dashedHint: { marginTop: 7, fontSize: 11.5, fontFamily: fontFamily.medium, color: colors.faint2, textAlign: textAlignStart },
  dashedActions: { flexDirection: rowDir, gap: 10, marginTop: 13 },
  galleryBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryBtnText: { fontSize: 13, fontFamily: fontFamily.extraBold, color: colors.faint3 },
  privacyRow: { flexDirection: rowDir, alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  privacyText: { flex: 1, fontSize: 11, fontFamily: fontFamily.bold, color: colors.goldTextDim, textAlign: textAlignStart },
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
  },
});
