import React, { useState } from 'react';
import { Platform, Pressable, Text, StyleSheet } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { colors, fontFamily } from '@/constants/theme';
import { formatArabicDate } from '@/lib/date-format';
import { fromRiyadhParts, toRiyadhParts } from '@/lib/riyadh-time';

interface Props {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
}

// The native OS calendar widget always reads/returns dates using the
// device's own timezone, with no way to make it speak Riyadh directly —
// so it's only ever shown a "shadow" Date whose device-local calendar
// fields are made to equal the intended Riyadh calendar fields. That way
// it displays and returns the right day regardless of the device's own
// timezone setting.
function toDeviceShadow(date: Date): Date {
  const p = toRiyadhParts(date);
  return new Date(p.year, p.month, p.day, p.hour, p.minute, 0, 0);
}

// Time selection moved to TimeChipPicker (a fully custom cross-platform
// strip) — Android's native time dialog can't be restyled, so this field
// only ever handles the date, where the native calendar (inline on iOS,
// Material dialog on Android) already looks native and fine either way.
export function DateTimeField({ value, onChange, minimumDate }: Props) {
  const [open, setOpen] = useState(false);
  const { hour, minute } = toRiyadhParts(value);

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed' || !selected) return;
    // `selected`'s device-local Y/M/D is what the user actually picked —
    // treat it as the intended Riyadh date, keeping the field's existing time.
    onChange(fromRiyadhParts(selected.getFullYear(), selected.getMonth(), selected.getDate(), hour, minute));
  }

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={styles.value}>{formatArabicDate(value)}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={toDeviceShadow(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimumDate ? toDeviceShadow(minimumDate) : undefined}
          onChange={handleChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: { paddingVertical: 2 },
  value: { fontSize: 14, fontFamily: fontFamily.extraBold, color: colors.ink },
});
