# روائس (Rawaes) — Mobile App

A React Native + Expo implementation of the **Rawaes Mobile App** design (car
rental, Saudi market, Arabic RTL) built with Expo Router, TypeScript, and a
shared design-token theme lifted from the Claude Design canvas
(`Rawaes Mobile App.dc.html`).

## Getting started

```bash
npm install
npx expo start
```

Then press `i` for the iOS simulator, `a` for Android, `w` for web, or scan
the QR code with Expo Go on your phone.

## What's implemented

The full primary booking journey from the design is wired together with
shared state (`context/BookingContext.tsx`) so choices carry through screens:

- **Home** (`app/(tabs)/index.tsx`) — hero search card with rental-period
  tabs, branch/delivery toggle, date fields, featured cars.
- **Fleet** (`app/(tabs)/fleet.tsx`) — full vehicle list with category
  filter chips and a sticky trip summary bar.
- **Car details** (`app/car/[id].tsx`) — specs grid, pricing breakdown
  (before/after VAT), Tabby installment banner.
- **Delivery location** (`app/delivery-location.tsx`) — modal map-style
  screen for the "deliver to me" flow (stylized placeholder map, see below).
- **ID & license verification** (`app/id-verification.tsx`) — national ID
  display, license fields, camera/gallery capture stand-ins.
- **Checkout** (`app/checkout.tsx`) — trip + car summary, extras/insurance
  toggles, contact info, terms acceptance, live total.
- **OTP** (`app/otp.tsx`) — 4-digit code entry with a working resend timer.
- **Payment** (`app/payment.tsx`) — Apple Pay, Tabby, mada, card, Amkan,
  pay-at-branch.
- **Booking confirmed** (`app/booking-confirmed.tsx`) — success screen.
- **Bookings** / **Account** tabs — populated preview screens (static
  content; not wired to a backend).

Pricing, the trip, and the selected car are computed live from
`context/BookingContext.tsx` — e.g. toggling an extra on Checkout changes the
total shown on Payment.

## About the placeholder assets

The Claude Design project's binary assets (`assets/logo.png`,
`assets/logo.svg`, `assets/cars/*.png|jpg`, `assets/pay-*.svg`,
`assets/hero-fleet-lineup.webp`) were **not** included in what got exported
into this session — only the markup referencing them came through. Rather
than ship broken image paths, this build uses:

- **`components/ui/Logo.tsx`** — a simple monogram badge instead of the real
  wordmark/logo.
- **`components/ui/CarIllustration.tsx`** — a flat vector car silhouette
  (react-native-svg) instead of real product photography.
- **`components/ui/PaymentBadge.tsx`** — colored text badges instead of the
  official mada / Visa / tabby / Amkan marks (recreating trademarked payment
  logos from memory isn't something to guess at — pull the real SVGs from
  each provider's brand kit).

To swap in the real assets: drop the files into `assets/images/` (a `cars/`
subfolder is referenced in a comment at the top of `data/cars.ts`), then
replace the components above with `<Image source={require(...)} />`. Each
file has a comment pointing at exactly what to change.

## Design notes

- **Colors, spacing, type** all live in `constants/theme.ts` — read from
  there rather than hardcoding hex values in screens.
- **Font**: Tajawal, loaded via `@expo-google-fonts/tajawal` in
  `app/_layout.tsx`.
- **RTL**: the app is Arabic-first. Rather than relying on React Native's
  global `I18nManager` RTL flip (which needs a native restart to take
  effect and can double-flip if mixed with manual mirroring), every screen
  lays itself out explicitly for RTL using `rowDir` / `textAlignStart` from
  `constants/theme.ts`. If you add English support later, that's the file
  to branch on locale.
- **Delivery-location map**: the design's "map" is itself a CSS illustration
  (gradient bands standing in for streets), not a real map — this build
  reproduces that illustration with plain Views rather than pulling in a
  maps SDK. Wire up `react-native-maps` (or Apple/Google Maps) there when
  you're ready for a real map.
- Dates/branch/contact info are realistic demo data, not live — there's no
  backend. Search, date pickers, and the branch switcher (`Alert.alert`) are
  the shallow parts; the checkout → OTP → payment flow and its running
  total are the parts wired for real.

## Project structure

```
app/                  Expo Router screens (file-based routing)
  (tabs)/              Bottom tab screens: home, fleet, bookings, account
  car/[id].tsx          Car detail (dynamic route)
  checkout.tsx, otp.tsx, payment.tsx, id-verification.tsx,
  delivery-location.tsx, booking-confirmed.tsx
components/ui/         Reusable UI primitives (Button, Chip, Card, CarCard, …)
context/                BookingContext (shared booking state)
constants/theme.ts      Design tokens (colors, spacing, radii, RTL helpers)
data/cars.ts            Mock fleet data
```

## Requirements

Built on Expo SDK 57 / React Native 0.86 / React 19. Node 22+ recommended
(matches the SDK's stated minimum).
