import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { Car } from '@/data/cars';

const API_PORT = 3210;

// The NestJS backend (server/) listens on the dev machine, not the device
// running the app. "localhost" only resolves correctly on web and the iOS
// simulator (they share the host network) — a physical device via Expo Go,
// or an Android emulator, means "localhost" instead points at the device
// itself. Expo Go already knows the dev machine's LAN IP (it's how it loaded
// the app bundle), exposed via Constants.expoConfig.hostUri — reuse that
// instead of asking for a manual override every time.
function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') return `http://localhost:${API_PORT}`;

  const hostUri = Constants.expoConfig?.hostUri;
  const lanHost = hostUri?.split(':')[0];
  if (lanHost) return `http://${lanHost}:${API_PORT}`;

  return `http://localhost:${API_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export interface ApiCategory {
  id: number;
  slug: string;
  title: string;
  titleEn: string | null;
  image: string;
}

export interface ApiCarSummary {
  id: number;
  fleetId: number;
  make: string;
  makeEn: string | null;
  model: string;
  modelEn: string | null;
  year: number;
  category: string;
  categoryLabel: string;
  seats: number;
  fuel: string;
  fuelLabel: string;
  transmission: string;
  transmissionLabel: string;
  image: string | null;
  pricePerDay: number | null;
  priceMonthly: number | null;
  vatRatePercent: number;
  branch: { id: number; name: string; slug: string };
  quantityAvailable: number;
}

export interface ApiAddon {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  info: string | null;
  pricePerDay: number;
  iconKey: string | null;
  exclusiveGroup: string | null;
}

export interface ApiBranch {
  id: number;
  slug: string;
  name: string;
  nameEn: string | null;
  address: string | null;
  addressEn: string | null;
  openingHours: unknown;
  lat: number | null;
  lng: number | null;
  mapUrl: string | null;
  deliveryFeePerKmSar: number;
}

export interface ApiCityBranches {
  id: number;
  slug: string;
  name: string;
  nameEn: string | null;
  branches: ApiBranch[];
}

export interface ApiCarDetail extends Omit<ApiCarSummary, 'fleetId' | 'branch' | 'quantityAvailable'> {
  engine: string;
  priceMonthly: number | null;
  vatRatePercent: number;
  availability: {
    branchId: number;
    branchName: string;
    quantity: number;
    pricePerDay: number | null;
    priceMonthly: number | null;
  }[];
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API ${path} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Auth errors carry an Arabic message straight from the backend (e.g. "رمز
// التحقق غير صحيح") that the OTP screens show as-is — unlike apiFetch above,
// this surfaces that message instead of a generic HTTP status string.
export class ApiAuthError extends Error {
  retryAfterSec?: number;
  constructor(message: string, retryAfterSec?: number) {
    super(message);
    this.retryAfterSec = retryAfterSec;
  }
}

async function authFetch<T>(path: string, body: unknown, token?: string, method: 'POST' | 'PATCH' = 'POST'): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data.message === 'string' ? data.message : `تعذّر إتمام الطلب (${res.status}).`;
    throw new ApiAuthError(message, data.retryAfterSec);
  }
  return data as T;
}

async function authGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data.message === 'string' ? data.message : `تعذّر إتمام الطلب (${res.status}).`;
    throw new ApiAuthError(message);
  }
  return data as T;
}

export interface ApiAuthUserKyc {
  idKind: 'citizen' | 'resident' | 'visitor' | null;
  nationalIdNumber: string | null;
  passportNumber: string | null;
  licenseNumber: string | null;
  licenseExpiryIso: string | null;
  idImageUri: string | null;
  licenseImageUri: string | null;
}

export interface ApiAuthUser {
  id: number;
  phone: string | null;
  name: string | null;
  email: string;
  kyc: ApiAuthUserKyc;
}

export function sendLoginOtp(phone: string) {
  return authFetch<{ ok: true }>('/auth/send-otp', { phone });
}

export function verifyLoginOtp(phone: string, otp: string) {
  return authFetch<{ token: string; user: ApiAuthUser }>('/auth/verify-otp', { phone, otp });
}

export async function fetchMe(token: string): Promise<ApiAuthUser> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('unauthorized');
  return res.json() as Promise<ApiAuthUser>;
}

export function updateProfile(token: string, data: { name?: string; email?: string }) {
  return authFetch<ApiAuthUser>('/auth/me', data, token, 'PATCH');
}

export interface ApiNotificationPreferences {
  bookingUpdates: boolean;
  promotions: boolean;
}

export function fetchNotificationPreferences(token: string) {
  return authGet<ApiNotificationPreferences>('/auth/notification-preferences', token);
}

export function updateNotificationPreferences(token: string, data: Partial<ApiNotificationPreferences>) {
  return authFetch<ApiNotificationPreferences>('/auth/notification-preferences', data, token, 'PATCH');
}

export interface CreateBookingKyc {
  idKind: 'citizen' | 'resident' | 'visitor';
  nationalIdNumber?: string;
  passportNumber?: string;
  licenseNumber: string;
  licenseExpiryIso: string;
  idImageUri: string;
  licenseImageUri: string;
}

export interface CreateBookingInput {
  carModelId: number;
  pickupBranchId?: number;
  returnBranchId: number;
  pickupMode: 'branch' | 'delivery';
  pickupAt: string;
  returnAt: string;
  addonIds?: number[];
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  // The branch servicing the delivery — the backend recomputes the fee from
  // this branch's real deliveryFeePerKmSar and distance, never from a
  // client-sent amount.
  deliveryBranchId?: number;
  fullName: string;
  ageBand: string;
  contactEmail?: string;
  kyc: CreateBookingKyc;
  paymentMethodId?: string;
  termsAccepted?: boolean;
  platform?: 'ios' | 'android';
  // Re-validated server-side against the same rules /coupons/validate uses —
  // never trusted as a discount amount from the client.
  couponCode?: string;
  // 'monthly' charges the car's flat monthly rate instead of daily × days —
  // see server/src/bookings/pricing.util.ts. Omitted/'daily' keeps per-day billing.
  rentalPeriodKind?: 'daily' | 'monthly';
}

export function createBooking(token: string, input: CreateBookingInput) {
  return authFetch<{ ok: true; bookingRequestId: number; totalAmountSar: number; discountAmountSar: number }>(
    '/bookings',
    input,
    token,
  );
}

export interface ValidateCouponInput {
  code: string;
  carModelId: number;
  returnBranchId: number;
  pickupAt: string;
  returnAt: string;
  addonIds?: number[];
  pickupMode: 'branch' | 'delivery';
  deliveryBranchId?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  rentalPeriodKind?: 'daily' | 'monthly';
}

export function validateCoupon(token: string, input: ValidateCouponInput) {
  return authFetch<{ valid: true; discountAmountSar: number; newTotalSar: number; label: string }>(
    '/coupons/validate',
    input,
    token,
  );
}

export interface ApiCouponRedemption {
  id: number;
  code: string;
  discountAmountSar: number;
  redeemedAt: string;
  bookingId: number;
  bookingPickupAt: string;
}

export function fetchMyCoupons(token: string) {
  return authGet<ApiCouponRedemption[]>('/coupons/mine', token);
}

export function startGeideaPayment(token: string, bookingRequestId: number) {
  return authFetch<{ redirectUrl: string }>('/payments/geidea/session', { bookingRequestId }, token);
}

export async function reconcileGeideaPayment(token: string, bookingRequestId: number): Promise<{ paymentStatus: string }> {
  const res = await fetch(`${API_BASE_URL}/payments/geidea/reconcile/${bookingRequestId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('reconcile failed');
  return res.json() as Promise<{ paymentStatus: string }>;
}

export type ApiBookingStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'CONFIRMED'
  | 'PICKED_UP'
  | 'RETURNED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface ApiBooking {
  id: number;
  status: ApiBookingStatus;
  paymentStatus: string;
  paymentMethod: string | null;
  pickupAt: string;
  returnAt: string;
  numberOfDays: number;
  totalAmountSar: number | null;
  car: { id: number; make: string; model: string; year: number; image: string | null } | null;
  branchName: string | null;
  returnBranchName: string | null;
  pickupMode: string | null;
  deliveryAddress: string | null;
  createdAt: string;
}

export async function fetchMyBookings(token: string): Promise<ApiBooking[]> {
  const res = await fetch(`${API_BASE_URL}/bookings/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`API /bookings/mine failed with ${res.status}`);
  return res.json() as Promise<ApiBooking[]>;
}

export function fetchCategories() {
  return apiFetch<ApiCategory[]>('/fleet/categories');
}

export function fetchFleet(params?: { branchId?: number; categoryId?: number }) {
  const qs = new URLSearchParams();
  if (params?.branchId) qs.set('branchId', String(params.branchId));
  if (params?.categoryId) qs.set('categoryId', String(params.categoryId));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch<ApiCarSummary[]>(`/fleet${suffix}`);
}

export function fetchCarById(id: number, branchId?: number) {
  const suffix = branchId ? `?branchId=${branchId}` : '';
  return apiFetch<ApiCarDetail>(`/fleet/${id}${suffix}`);
}

export function fetchBranchesByCity() {
  return apiFetch<ApiCityBranches[]>('/fleet/branches');
}

export function fetchAddons() {
  return apiFetch<ApiAddon[]>('/addons');
}

export async function fetchEnabledPaymentMethods(): Promise<string[]> {
  const res = await apiFetch<{ enabled: string[] }>('/payment-methods');
  return res.enabled;
}

// Admin-controlled visibility for the home screen search widget's period
// tabs and pickup mode segment — see "إعدادات تطبيق الموبايل" in the
// rentcar-38ee... admin panel (MobileAppSetting, independent of the site).
export interface ApiBookingWidgetTabFlags {
  rentalDaily: boolean;
  rentalWeekly: boolean;
  rentalMonthly: boolean;
  rentalMonthlyPackages: boolean;
  modePickup: boolean;
  modeDelivery: boolean;
}

export function fetchBookingWidgetTabFlags() {
  return apiFetch<ApiBookingWidgetTabFlags>('/booking-widget-tabs');
}

// Uploads a locally-picked photo (from expo-image-picker) to the same
// DigitalOcean Spaces bucket rentcar's web app uses, via our /uploads/kyc
// proxy — returns the real public URL, not the local device URI.
export async function uploadKycImage(localUri: string, token: string): Promise<string> {
  const filename = localUri.split('/').pop()?.split('?')[0] ?? 'photo.jpg';
  const ext = filename.split('.').pop()?.toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  // Expo's global fetch (installed by default — see
  // node_modules/expo/src/winter/runtime.native.ts) only accepts real Blob
  // parts in FormData on every platform now; the old React Native
  // {uri,name,type} shorthand throws "Unsupported FormDataPart
  // implementation". Fetching the local file URI yields a real Blob on both
  // web (blob:/data: URLs from expo-image-picker) and native (file:// URIs).
  const rawBlob = await (await fetch(localUri)).blob();
  const blob = rawBlob.type === mime ? rawBlob : rawBlob.slice(0, rawBlob.size, mime);

  const formData = new FormData();
  formData.append('file', blob, filename);

  const res = await fetch(`${API_BASE_URL}/uploads/kyc`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = typeof body.message === 'string' ? body.message : `تعذّر رفع الصورة (${res.status}).`;
    throw new Error(message);
  }
  const data = (await res.json()) as { ok: boolean; url: string };
  return data.url;
}

// A rotating palette of the same near-white tints the original mock data
// used — real Fleet rows don't carry a UI accent color, so we assign one
// deterministically per car id to keep cards visually distinct but stable.
const TINT_PALETTE = ['#eef2ef', '#f0eee9', '#eef2f4', '#eef1f0', '#f1eee6', '#efeee9', '#eef0f1'];

function inferBodyStyle(categorySlug: string): Car['bodyStyle'] {
  if (categorySlug.includes('van') || categorySlug.includes('suv')) return 'van';
  if (categorySlug.includes('luxury') || categorySlug.includes('coupe')) return 'coupe';
  if (categorySlug.includes('economy') || categorySlug.includes('hatchback')) return 'hatchback';
  return 'sedan';
}

// The DB's CarModel table doesn't track doors/bags/AC — this app's cards
// show them as informational specs, so we fall back to typical sedan values
// rather than fabricate precision the source data doesn't have.
export function mapApiCarSummaryToCar(api: ApiCarSummary): Car {
  return {
    id: String(api.id),
    make: api.make,
    model: api.model,
    year: api.year,
    category: api.category,
    categoryLabel: api.categoryLabel,
    seats: api.seats,
    doors: 4,
    bags: 2,
    fuel: api.fuel,
    fuelLabel: api.fuelLabel,
    transmission: api.transmission,
    transmissionLabel: api.transmissionLabel,
    pricePerDay: api.pricePerDay ?? 0,
    priceMonthly: api.priceMonthly,
    hasAC: true,
    bodyStyle: inferBodyStyle(api.category),
    tint: TINT_PALETTE[api.id % TINT_PALETTE.length],
    image: api.image ?? undefined,
    vatRatePercent: api.vatRatePercent,
  };
}

export function mapApiCarDetailToCar(api: ApiCarDetail): Car {
  const cheapest = api.availability.find((a) => a.pricePerDay != null);
  const cheapestMonthly = api.availability.find((a) => a.priceMonthly != null);
  return {
    id: String(api.id),
    make: api.make,
    model: api.model,
    year: api.year,
    category: api.category,
    categoryLabel: api.categoryLabel,
    seats: api.seats,
    doors: 4,
    bags: 2,
    fuel: api.fuel,
    fuelLabel: api.fuelLabel,
    transmission: api.transmission,
    transmissionLabel: api.transmissionLabel,
    pricePerDay: api.pricePerDay ?? cheapest?.pricePerDay ?? 0,
    priceMonthly: api.priceMonthly ?? cheapestMonthly?.priceMonthly ?? null,
    hasAC: true,
    bodyStyle: inferBodyStyle(api.category),
    tint: TINT_PALETTE[api.id % TINT_PALETTE.length],
    image: api.image ?? undefined,
    vatRatePercent: api.vatRatePercent,
  };
}
