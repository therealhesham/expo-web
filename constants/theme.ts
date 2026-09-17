// Design tokens extracted from the Rawaes (روائس) Claude Design canvas
// ("Rawaes Mobile App.dc.html"). Keep these in sync with the source design
// if it changes — everything in the app should read colors/spacing from here
// rather than hardcoding hex values in screens.

export const colors = {
  // Brand
  petrol: '#003749', // primary brand color — headers, primary buttons, dark surfaces
  petrolDeep: '#002a38',
  gold: '#dbb878', // accent — icons on dark surfaces, highlights
  goldText: '#a8874f', // accent text (links, "view all", tab labels on gold)
  goldTextDim: '#8a7752',
  goldLine: '#c9a356',

  // Backgrounds
  cream: '#fdfbf6', // primary app background
  canvas: '#efece6', // outer / page background
  sand: '#f6f1e8', // secondary surface (tab bar, header bands)
  sandLight: '#f4efe6',
  card: '#ffffff',

  // Borders
  border: '#ebe4d3',
  borderStrong: '#ddd5c6',
  borderSoft: '#eee7db',
  borderFaint: '#f4eee3',

  // Text
  ink: '#003749', // primary text (same as brand petrol)
  inkSoft: '#0f3d47',
  body: '#3d4a50',
  muted: '#5d6c72',
  muted2: '#6f7e84',
  faint: '#8b9296',
  faint2: '#aaa08e',
  faint3: '#8a8175',
  brownText: '#6b5a3b',

  // Status
  success: '#1f9254',
  successBg: '#f4fbf6',
  successBorder: '#d9efe1',
  danger: '#c02626',
  dangerBg: '#fdecec',
  dangerStrong: '#8c1d1d',

  white: '#ffffff',
  black: '#000000',
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const fontFamily = {
  regular: 'Tajawal_400Regular',
  medium: 'Tajawal_500Medium',
  bold: 'Tajawal_700Bold',
  extraBold: 'Tajawal_800ExtraBold',
  black: 'Tajawal_900Black',
};

export const shadow = {
  card: {
    shadowColor: '#0f3d47',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  soft: {
    shadowColor: '#0f3d47',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
};

// The design is Arabic-first and reads right-to-left. Rather than relying on
// React Native's global I18nManager RTL flip (which needs a native restart
// to take effect and can double-flip if mixed with manual mirroring), every
// screen in this app lays itself out explicitly for RTL using these helpers.
// Flip this file's usage the day the app needs to support LTR locales too.
// Shared pressed-state opacity for Pressable components — keeps touch feedback
// consistent across the app instead of each screen picking its own value.
export const pressedOpacity = 0.6;

export const RTL = true;
export const rowDir = RTL ? ('row-reverse' as const) : ('row' as const);
export const textAlignStart = RTL ? ('right' as const) : ('left' as const);
export const textAlignEnd = RTL ? ('left' as const) : ('right' as const);
