import React from 'react';

import { colors, fontFamily } from '@/constants/theme';
import { fromRiyadhParts, toRiyadhParts } from '@/lib/riyadh-time';

interface Props {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// Time selection moved to TimeChipPicker for a consistent custom look across
// platforms — this field only handles the date, where the browser's own
// <input type="date"> is already a real, perfectly fine native picker.
// The input's Y/M/D always represents the Riyadh calendar date, not the
// browser's own timezone — every branch is physically in Saudi Arabia.
export function DateTimeField({ value, onChange, minimumDate }: Props) {
  const parts = toRiyadhParts(value);
  const isoValue = `${parts.year}-${pad(parts.month + 1)}-${pad(parts.day)}`;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (!raw) return;
    const [y, m, d] = raw.split('-').map(Number);
    onChange(fromRiyadhParts(y, m - 1, d, parts.hour, parts.minute));
  }

  const min = minimumDate
    ? (() => {
        const mp = toRiyadhParts(minimumDate);
        return `${mp.year}-${pad(mp.month + 1)}-${pad(mp.day)}`;
      })()
    : undefined;

  return (
    <input
      type="date"
      value={isoValue}
      min={min}
      onChange={handleChange}
      style={{
        fontSize: 14,
        fontFamily: fontFamily.extraBold,
        color: colors.ink,
        border: 'none',
        outline: 'none',
        background: 'transparent',
        padding: 0,
        width: '100%',
      }}
    />
  );
}
