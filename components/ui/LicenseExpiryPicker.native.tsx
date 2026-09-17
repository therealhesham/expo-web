import React, { useState } from 'react';
import { Platform, Pressable, Text, StyleSheet } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { colors, fontFamily } from '@/constants/theme';

interface Props {
  valueIso: string;
  onChange: (iso: string) => void;
}

function formatDisplay(iso: string): string {
  if (!iso) return 'DD-MM-YY';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y.slice(2)}`;
}

export function LicenseExpiryPicker({ valueIso, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const dateValue = valueIso ? new Date(`${valueIso}T00:00:00`) : new Date();

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed' || !selected) return;
    const iso = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(
      selected.getDate()
    ).padStart(2, '0')}`;
    onChange(iso);
  }

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={[styles.value, !valueIso && styles.placeholder]}>{formatDisplay(valueIso)}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={new Date()}
          onChange={handleChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 5 },
  value: { fontSize: 15, fontFamily: fontFamily.extraBold, color: colors.ink },
  placeholder: { color: colors.faint2 },
});
