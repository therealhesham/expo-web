// Mirrors rentcar's lib/direct-booking.ts validation exactly (same regex,
// same digit-prefix rules) so a submission that passes here won't get
// rejected by the real backend for a rule this app invented differently.

export type IdKind = 'citizen' | 'resident' | 'visitor';

export function detectIdKindFromNationalId(digits: string): IdKind | null {
  if (!/^\d{10}$/.test(digits)) return null;
  if (digits.startsWith('1')) return 'citizen';
  if (digits.startsWith('2')) return 'resident';
  return null;
}

export function validateNationalId(digits: string): { valid: boolean; error?: string } {
  if (!/^\d{10}$/.test(digits)) {
    return { valid: false, error: 'رقم الهوية أو الإقامة يجب أن يكون ١٠ أرقام.' };
  }
  if (!digits.startsWith('1') && !digits.startsWith('2')) {
    return { valid: false, error: 'يبدأ بـ ١ للمواطن أو ٢ للمقيم.' };
  }
  return { valid: true };
}

export function validatePassport(value: string): { valid: boolean; error?: string } {
  const v = value.trim().toUpperCase();
  if (v.length < 6 || v.length > 24) {
    return { valid: false, error: 'رقم الجواز يجب أن يكون بين ٦ و٢٤ حرفاً.' };
  }
  if (!/^[A-Z0-9-]+$/.test(v)) {
    return { valid: false, error: 'أحرف إنجليزية وأرقام وشرطة فقط.' };
  }
  return { valid: true };
}

export function validateLicenseNumber(digits: string): { valid: boolean; error?: string } {
  if (!/^\d{10}$/.test(digits)) {
    return { valid: false, error: 'رقم رخصة القيادة يجب أن يكون ١٠ أرقام.' };
  }
  return { valid: true };
}
