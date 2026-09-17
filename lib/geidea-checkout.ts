import * as WebBrowser from 'expo-web-browser';

import { reconcileGeideaPayment, startGeideaPayment } from '@/lib/api';

// Shared by the initial checkout flow (payment.tsx) and the "أكمل الدفع" retry
// action on a pending booking (bookings.tsx) — same real Geidea hosted-page
// hop either way: open it, wait for the customer to close it, then ask our
// backend for the actual status instead of trusting the browser's return.
export async function payBookingWithGeidea(token: string, bookingRequestId: number): Promise<{ paid: boolean }> {
  const session = await startGeideaPayment(token, bookingRequestId);
  await WebBrowser.openBrowserAsync(session.redirectUrl);
  const status = await reconcileGeideaPayment(token, bookingRequestId).catch(() => null);
  return { paid: status?.paymentStatus === 'PAID' };
}
