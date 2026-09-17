import React, { createContext, useContext, useMemo, useState } from 'react';

import { cars, type Car } from '@/data/cars';
import { type ApiAddon } from '@/lib/api';
import { daysBetween, formatArabicDate, formatArabicTime } from '@/lib/date-format';
import { fromRiyadhParts, toRiyadhParts } from '@/lib/riyadh-time';

export type PickupMode = 'branch' | 'delivery';
export type RentalPeriod = 'daily' | 'weekly' | 'monthly' | 'packages';

// Keyed by addon slug (e.g. "unlimited-km") instead of a fixed set of keys —
// the real add-on catalog comes from the backend and its slugs aren't known
// at compile time.
export type Extras = Record<string, boolean>;

export interface TripInfo {
  branch: string;
  // Real coordinates + rate for the picked branch (from /fleet/branches) —
  // needed to compute an honest delivery distance/fee on the map screen
  // instead of a flat guess.
  branchLat?: number;
  branchLng?: number;
  branchDeliveryFeePerKmSar?: number;
  // Numeric ids (from /fleet/branches) — the display strings above are for
  // showing on screen; booking creation needs the real Branch.id.
  branchId?: number;
  returnBranchId?: number;
  // Set only when the customer opts into a one-way return — undefined means
  // "same as pickup" everywhere downstream (checkout, confirmation, etc).
  differentReturnBranch: boolean;
  returnBranch?: string;
  returnBranchLat?: number;
  returnBranchLng?: number;
  // Source of truth (ISO) for the date/time picker sheet — pickupDate/
  // pickupTime/returnDate/returnTime/days below are Arabic display strings
  // derived from these whenever they change, kept so existing screens don't
  // need to reformat dates themselves.
  pickupAt: string;
  returnAt: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  days: number;
  pickupMode: PickupMode;
  deliveryAddress?: string;
  deliveryFee?: number;
  deliveryDistanceKm?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  period: RentalPeriod;
}

export interface ContactInfo {
  fullName: string;
  phone: string;
  ageBand: string;
}

export type IdKind = 'citizen' | 'resident' | 'visitor';

export interface KycInfo {
  idKind: IdKind;
  nationalIdNumber: string;
  passportNumber: string;
  licenseNumber: string;
  licenseExpiryIso: string; // yyyy-mm-dd, '' when not yet validated
  idImageUri: string | null;
  licenseImageUri: string | null;
}

const DEFAULT_VAT_RATE_PERCENT = 15;

// Set once /coupons/validate confirms a code — newTotalSar is the server's
// fully-computed final price (VAT included), used directly for display
// instead of re-deriving the discount client-side. The server re-validates
// and recomputes this from scratch at booking creation regardless.
export interface AppliedCoupon {
  code: string;
  discountAmountSar: number;
  newTotalSar: number;
  label: string;
}

interface BookingState {
  trip: TripInfo;
  setTrip: (t: Partial<TripInfo>) => void;
  setTripDates: (pickupAt: Date, returnAt: Date) => void;
  selectedCar: Car;
  setSelectedCar: (car: Car) => void;
  extras: Extras;
  toggleExtra: (slug: string) => void;
  addonsCatalog: ApiAddon[];
  setAddonsCatalog: (addons: ApiAddon[]) => void;
  contact: ContactInfo;
  setContact: (c: Partial<ContactInfo>) => void;
  kyc: KycInfo;
  setKyc: (k: Partial<KycInfo>) => void;
  paymentMethodId: string;
  setPaymentMethodId: (id: string) => void;
  coupon: AppliedCoupon | null;
  setCoupon: (c: AppliedCoupon | null) => void;
  bookingRef: string;
  pricing: {
    dailyRate: number;
    subtotal: number;
    extrasTotal: number;
    deliveryFee: number;
    vat: number;
    total: number;
  };
}

const BookingContext = createContext<BookingState | null>(null);

function buildDefaultTripDates(): Pick<
  TripInfo,
  'pickupAt' | 'returnAt' | 'pickupDate' | 'pickupTime' | 'returnDate' | 'returnTime' | 'days'
> {
  // Built against Riyadh's wall clock, not the device's — every branch is
  // physically in Saudi Arabia, so "tomorrow at 10am" always means Riyadh time.
  const nowInRiyadh = toRiyadhParts(new Date());
  const pickupAt = fromRiyadhParts(nowInRiyadh.year, nowInRiyadh.month, nowInRiyadh.day + 1, 10, 0);
  const returnAt = fromRiyadhParts(nowInRiyadh.year, nowInRiyadh.month, nowInRiyadh.day + 5, 10, 0);
  return {
    pickupAt: pickupAt.toISOString(),
    returnAt: returnAt.toISOString(),
    pickupDate: formatArabicDate(pickupAt),
    pickupTime: formatArabicTime(pickupAt),
    returnDate: formatArabicDate(returnAt),
    returnTime: formatArabicTime(returnAt),
    days: daysBetween(pickupAt, returnAt),
  };
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [trip, setTripState] = useState<TripInfo>({
    // No fake branch here — "فرع الملز" doesn't exist in the real fleet
    // data. The home screen fills this in with a real branch as soon as
    // /fleet/branches loads (see index.tsx).
    branch: '',
    differentReturnBranch: false,
    ...buildDefaultTripDates(),
    pickupMode: 'branch',
    period: 'daily',
  });
  const [selectedCar, setSelectedCar] = useState<Car>(cars[0]);
  const [extras, setExtras] = useState<Extras>({});
  const [addonsCatalog, setAddonsCatalog] = useState<ApiAddon[]>([]);
  const [contact, setContactState] = useState<ContactInfo>({
    fullName: '',
    phone: '',
    ageBand: '٢٥-٣٥ سنة',
  });
  const [kyc, setKycState] = useState<KycInfo>({
    idKind: 'citizen',
    nationalIdNumber: '',
    passportNumber: '',
    licenseNumber: '',
    licenseExpiryIso: '',
    idImageUri: null,
    licenseImageUri: null,
  });
  const [paymentMethodId, setPaymentMethodId] = useState<string>('tabby');
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

  const pricing = useMemo(() => {
    const dailyRate = selectedCar.pricePerDay;
    const subtotal = dailyRate * trip.days;
    const extrasTotal = addonsCatalog.reduce(
      (sum, addon) => (extras[addon.slug] ? sum + addon.pricePerDay * trip.days : sum),
      0
    );
    const deliveryFee = trip.pickupMode === 'delivery' ? trip.deliveryFee ?? 75 : 0;
    const preVat = subtotal + extrasTotal + deliveryFee;
    const vatRate = (selectedCar.vatRatePercent ?? DEFAULT_VAT_RATE_PERCENT) / 100;
    const vat = Math.round(preVat * vatRate * 100) / 100;
    const total = Math.round((preVat + vat) * 100) / 100;
    return { dailyRate, subtotal, extrasTotal, deliveryFee, vat, total };
  }, [selectedCar, trip, extras, addonsCatalog]);

  const value: BookingState = {
    trip,
    setTrip: (t) => setTripState((prev) => ({ ...prev, ...t })),
    setTripDates: (pickupAt, returnAt) =>
      setTripState((prev) => ({
        ...prev,
        pickupAt: pickupAt.toISOString(),
        returnAt: returnAt.toISOString(),
        pickupDate: formatArabicDate(pickupAt),
        pickupTime: formatArabicTime(pickupAt),
        returnDate: formatArabicDate(returnAt),
        returnTime: formatArabicTime(returnAt),
        days: daysBetween(pickupAt, returnAt),
      })),
    selectedCar,
    setSelectedCar,
    extras,
    toggleExtra: (slug) => setExtras((prev) => ({ ...prev, [slug]: !prev[slug] })),
    addonsCatalog,
    setAddonsCatalog,
    contact,
    setContact: (c) => setContactState((prev) => ({ ...prev, ...c })),
    kyc,
    setKyc: (k) => setKycState((prev) => ({ ...prev, ...k })),
    paymentMethodId,
    setPaymentMethodId,
    coupon,
    setCoupon,
    bookingRef: '١٠٤٨٢',
    pricing,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within a BookingProvider');
  return ctx;
}
