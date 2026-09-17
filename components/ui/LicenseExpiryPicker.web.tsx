import React from 'react';

import { colors, fontFamily } from '@/constants/theme';

interface Props {
  valueIso: string;
  onChange: (iso: string) => void;
}

// @react-native-community/datetimepicker has no web renderer — the browser's
// own <input type="date"> already gives a real calendar picker on web, so we
// use it directly instead of faking one with styled Views.
export function LicenseExpiryPicker({ valueIso, onChange }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <input
      type="date"
      value={valueIso}
      min={today}
      onChange={(e) => onChange(e.target.value)}
      style={{
        marginTop: 5,
        fontSize: 15,
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
