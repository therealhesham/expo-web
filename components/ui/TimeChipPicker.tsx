import React, { useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontFamily, pressedOpacity, radii, rowDir, textAlignStart } from '@/constants/theme';
import { formatArabicTime } from '@/lib/date-format';
import { fromRiyadhParts, toRiyadhParts } from '@/lib/riyadh-time';

interface Props {
  value: Date;
  onChange: (date: Date) => void;
  // Branch opening hours aren't threaded into this sheet yet — 07:00–23:00
  // comfortably covers every real branch's hours seen so far. Worth swapping
  // for the selected branch's real hours once that data is passed in.
  startHour?: number;
  endHour?: number;
  stepMinutes?: number;
}

const ROW_HEIGHT = 46;
const LIST_MAX_HEIGHT = ROW_HEIGHT * 5.5;

// Android's native TimePickerDialog can't be restyled at all (it's an OS
// dialog, not a React Native view), so this replaces it everywhere with a
// custom list. Earlier attempts rendered that list inline or as an absolute
// overlay right under the field — both fought for room inside an already
// cramped, stacked bottom sheet (pushed the card taller, or spilled off-
// screen and over the next card). A small sheet-over-sheet modal sidesteps
// that entirely: it gets its own full-width space, independent of whatever
// tiny column the trigger field happens to sit in.
export function TimeChipPicker({ value, onChange, startHour = 7, endHour = 23, stepMinutes = 30 }: Props) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // All slots and comparisons operate on Riyadh wall-clock time, not the
  // device's — every branch is physically in Saudi Arabia.
  const valueParts = toRiyadhParts(value);
  const slots: Date[] = [];
  for (let m = startHour * 60; m <= endHour * 60; m += stepMinutes) {
    slots.push(fromRiyadhParts(valueParts.year, valueParts.month, valueParts.day, Math.floor(m / 60), m % 60));
  }

  const selectedIndex = slots.findIndex((s) => {
    const p = toRiyadhParts(s);
    return p.hour === valueParts.hour && p.minute === valueParts.minute;
  });

  function handleOpen() {
    setOpen(true);
    requestAnimationFrame(() => {
      const index = selectedIndex >= 0 ? selectedIndex : 0;
      scrollRef.current?.scrollTo({ y: Math.max(0, index * ROW_HEIGHT - LIST_MAX_HEIGHT / 2), animated: false });
    });
  }

  return (
    <>
      <Pressable style={styles.field} onPress={handleOpen}>
        <Ionicons name="time-outline" size={14} color={colors.goldLine} />
        <Text style={styles.value}>{formatArabicTime(value)}</Text>
        <Ionicons name="chevron-down" size={12} color={colors.faint2} />
      </Pressable>

      <Modal transparent visible={open} animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>اختر الوقت</Text>
              <Pressable
                style={({ pressed }) => [styles.closeBtn, pressed && { opacity: pressedOpacity }]}
                onPress={() => setOpen(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={16} color={colors.faint3} />
              </Pressable>
            </View>

            <ScrollView ref={scrollRef} style={{ maxHeight: LIST_MAX_HEIGHT }} showsVerticalScrollIndicator={false}>
              {slots.map((slot, i) => {
                const selected = i === selectedIndex;
                return (
                  <Pressable
                    key={slot.getTime()}
                    style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && { opacity: pressedOpacity }]}
                    onPress={() => {
                      onChange(slot);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.rowText, selected && styles.rowTextSelected]}>{formatArabicTime(slot)}</Text>
                    {selected && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: rowDir, alignItems: 'center', gap: 5, paddingVertical: 2 },
  value: { fontSize: 14, fontFamily: fontFamily.extraBold, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,20,28,0.5)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 99, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 14 },
  header: {
    flexDirection: rowDir,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  title: { fontSize: 15.5, fontFamily: fontFamily.black, color: colors.ink, textAlign: textAlignStart },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: rowDir,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  rowSelected: { backgroundColor: colors.petrol, borderRadius: radii.md, borderBottomWidth: 0 },
  rowText: { fontSize: 14, fontFamily: fontFamily.extraBold, color: colors.ink },
  rowTextSelected: { color: colors.white },
});
